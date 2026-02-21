const {
	app,
	BrowserWindow,
	ipcMain,
	dialog,
	nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs").promises;
const axios = require("axios");
const puppeteer = require("puppeteer");

let mainWindow;
let settingsPath;

/**
 * Creates the main application window with custom configuration.
 * Sets up the window properties, icon, and web preferences for the Electron app.
 */
function createWindow() {
	// Create icon from PNG
	let icon;
	try {
		const iconPath = path.join(__dirname, "../assets/icon.png");
		icon = nativeImage.createFromPath(iconPath);
		if (icon.isEmpty()) {
			console.warn("Icon is empty, using default");
			icon = undefined;
		}
	} catch (error) {
		console.error("Failed to load icon:", error);
		icon = undefined;
	}

	mainWindow = new BrowserWindow({
		width: 820,
		height: 700,
		minWidth: 820,
		minHeight: 700,
		resizable: true,
		frame: false,
		icon: icon,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js"),
		},
		backgroundColor: "#0a0a0f",
		titleBarStyle: "hidden",
	});

	settingsPath = path.join(app.getPath("userData"), "settings.json");
	mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Window Controls
ipcMain.handle("window-minimize", () => mainWindow.minimize());
ipcMain.handle("window-maximize", () => {
	if (mainWindow.isMaximized()) {
		mainWindow.unmaximize();
		return false;
	} else {
		mainWindow.maximize();
		return true;
	}
});
ipcMain.handle("window-close", () => mainWindow.close());
ipcMain.handle("window-is-maximized", () => mainWindow.isMaximized());

// Settings Management
ipcMain.handle("load-settings", async () => {
	try {
		const data = await fs.readFile(settingsPath, "utf8");
		return JSON.parse(data);
	} catch {
		return {
			theme: "dark",
			ignoreRolls: "",
			startRoll: "001",
			endRoll: "140",
			rollNumberPattern: "___",
			maxSize: "0",
			checkDuplicates: true,
		};
	}
});

ipcMain.handle("save-settings", async (event, settings) => {
	try {
		await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
		return { success: true };
	} catch (error) {
		return { success: false, error: error.message };
	}
});

// Folder Selection
ipcMain.handle("select-folder", async () => {
	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ["openDirectory"],
	});
	return result.canceled ? null : result.filePaths[0];
});

// Helper: Extract Google Drive Folder ID from URL
/**
 * Extracts the folder ID from various Google Drive URL formats.
 * Supports different URL patterns including /folders/, /open?id=, and sharing links.
 * @param {string} url - The Google Drive folder URL to parse
 * @returns {string|null} The extracted folder ID or null if not found
 */
function extractFolderIdFromUrl(url) {
	// Handle formats like:
	// https://drive.google.com/drive/folders/1ABC...
	// https://drive.google.com/open?id=1ABC...
	// https://drive.google.com/drive/folders/1ABC?usp=sharing
	const folderMatch = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
	if (folderMatch) return folderMatch[1];

	const idMatch = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);
	if (idMatch) return idMatch[1];

	return null;
}

// Helper: Fetch files from public Google Drive folder using Puppeteer
/**
 * Fetches file information from a public Google Drive folder using browser automation.
 * Opens a visible browser window, injects a capture script, and waits for user interaction
 * to extract file names and sizes from the Drive interface.
 * @param {string} folderUrl - The public Google Drive folder URL
 * @param {string} filePattern - File extension pattern to filter (default: ".pdf")
 * @returns {Promise<Array>} Array of file objects with name, size, and id properties
 * @throws {Error} If folder URL is invalid or no files are captured
 */
async function fetchPublicDriveFiles(folderUrl, filePattern = ".pdf") {
	const folderId = extractFolderIdFromUrl(folderUrl);
	if (!folderId) {
		throw new Error("Invalid Google Drive folder URL format");
	}

	console.log("Opening Drive folder in browser...");

	// Get Chrome executable path for the user's system
	const chromePaths = [
		"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
		"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
		process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
	];

	let executablePath = null;
	for (const chromePath of chromePaths) {
		try {
			await fs.access(chromePath);
			executablePath = chromePath;
			break;
		} catch (e) {
			// Path not found, try next
		}
	}

	// Use Puppeteer - VISIBLE browser for user to scroll
	const browser = await puppeteer.launch({
		headless: false,
		executablePath: executablePath,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--window-size=1200,900",
		],
		defaultViewport: null,
	});

	try {
		const page = await browser.newPage();

		// Navigate to the folder
		const fullUrl = `https://drive.google.com/drive/folders/${folderId}`;
		await page.goto(fullUrl, { waitUntil: "networkidle2", timeout: 60000 });

		// Wait for page to load
		await new Promise((r) => setTimeout(r, 3000));

		// Inject the capture script
		await page.addScriptTag({
			content: getInjectedScript(),
		});

		// Wait for user to click capture button
		await page.waitForFunction(
			() => window.filesCaptured === true,
			{ timeout: 300000 }, // 5 minute timeout
		);

		// Get the captured files
		const capturedFiles = await page.evaluate(() => window.capturedFiles);

		// Small delay before closing
		await new Promise((r) => setTimeout(r, 1000));

		const files = capturedFiles.map((f) => ({
			name: f.name,
			size: parseFileSize(f.size),
			id: "",
		}));

		console.log(`Captured ${files.length} files from Drive folder`);

		if (files.length === 0) {
			throw new Error(
				"No files captured. Make sure you scrolled to load all files before clicking Capture.",
			);
		}

		return filterFilesByPattern(files, filePattern);
	} finally {
		await browser.close();
	}
}

// Script to inject into Google Drive page
/**
 * Generates JavaScript code to be injected into the Google Drive page.
 * Creates a floating UI panel that displays file count and provides a capture button.
 * The injected script extracts file information from the DOM and communicates back to the main process.
 * @returns {string} JavaScript code as a string to be injected into the page
 */
function getInjectedScript() {
	return `
		(function() {

			const panel = document.createElement('div');
			panel.id = 'roll-auditor-panel';
			panel.style.cssText = "
				position:fixed;
				top:20px;
				right:20px;
				width:320px;
				padding:22px;
				border-radius:14px;
				z-index:999999;
				background:#111827;
				box-shadow:0 20px 60px rgba(0,0,0,0.35);
				font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
				color:#f9fafb;
				border:1px solid rgba(255,255,255,0.05);
				animation:fadeIn 0.25s ease-out;
			";

			panel.innerHTML = \`
				<style>
					@keyframes fadeIn {
						from { opacity:0; transform:translateY(-8px); }
						to { opacity:1; transform:translateY(0); }
					}

					#auditor-title {
						font-size:16px;
						font-weight:600;
						margin-bottom:6px;
						letter-spacing:0.2px;
					}

					#auditor-desc {
						font-size:13px;
						color:#9ca3af;
						line-height:1.5;
						margin-bottom:18px;
					}

					#auditor-count-box {
						background:#1f2937;
						padding:12px 14px;
						border-radius:10px;
						font-size:14px;
						margin-bottom:18px;
						display:flex;
						justify-content:space-between;
						align-items:center;
						border:1px solid rgba(255,255,255,0.05);
					}

					#detected-count {
						font-weight:700;
						font-size:16px;
						color:#60a5fa;
					}

					#auditor-btn {
						background:#2563eb;
						color:white;
						border:none;
						padding:12px;
						font-size:14px;
						font-weight:600;
						border-radius:10px;
						cursor:pointer;
						width:100%;
						transition:all 0.2s ease;
					}

					#auditor-btn:hover {
						background:#1d4ed8;
						transform:translateY(-1px);
					}

					#auditor-btn:active {
						transform:scale(0.98);
					}
				</style>

				<div id="auditor-title">Roll Number Auditor</div>

				<div id="auditor-desc">
					1. Scroll to load all files<br>
					2. Click capture when ready
				</div>

				<div id="auditor-count-box">
					<span>Files Detected</span>
					<span id="detected-count">0</span>
				</div>

				<button id="auditor-btn">Capture Files</button>
			\`;

			document.body.appendChild(panel);

			function extractFiles() {
				const files = [];
				const seenNames = new Set();
				const filePattern = /\\.(pdf|docx?|xlsx?|pptx?|txt|zip|rar|jpg|jpeg|png|gif)$/i;

				document.querySelectorAll('[data-tooltip]').forEach(function(el) {
					const name = el.getAttribute('data-tooltip');
					if (name && filePattern.test(name) && !seenNames.has(name.toLowerCase())) {
						seenNames.add(name.toLowerCase());
						files.push({ name: name, size: '0' });
					}
				});

				document.querySelectorAll('[aria-label]').forEach(function(el) {
					const label = el.getAttribute('aria-label');
					if (label && filePattern.test(label)) {
						const name = label.split(',')[0].trim();
						if (!seenNames.has(name.toLowerCase())) {
							seenNames.add(name.toLowerCase());
							const row = el.closest('[data-id]') || el.parentElement;
							const sizeMatch = row && row.textContent
								? row.textContent.match(/(\\d+(?:\\.\\d+)?\\s*(?:KB|MB|GB|bytes))/i)
								: null;
							files.push({ name: name, size: sizeMatch ? sizeMatch[1] : '0' });
						}
					}
				});

				document.querySelectorAll('[data-id]').forEach(function(row) {
					const text = row.textContent || '';
					const lines = text.split('\\n');
					lines.forEach(function(line) {
						const trimmed = line.trim();
						if (filePattern.test(trimmed) && trimmed.length > 3 && trimmed.length < 200 && !seenNames.has(trimmed.toLowerCase())) {
							seenNames.add(trimmed.toLowerCase());
							const sizeMatch = text.match(/(\\d+(?:\\.\\d+)?\\s*(?:KB|MB|GB|bytes))/i);
							files.push({ name: trimmed, size: sizeMatch ? sizeMatch[1] : '0' });
						}
					});
				});

				return files;
			}

			setInterval(function() {
				const countEl = document.getElementById('detected-count');
				if (countEl) {
					countEl.textContent = extractFiles().length;
				}
			}, 1000);

			window.filesCaptured = false;
			window.capturedFiles = [];

			document.getElementById('auditor-btn').addEventListener('click', function() {
				const files = extractFiles();
				window.capturedFiles = files;
				window.filesCaptured = true;

				const btn = document.getElementById('auditor-btn');
				btn.textContent = "Captured " + files.length + " Files";
				btn.style.background = "#16a34a";
			});

		})();
	`;
}

// Helper to parse file size string to bytes
/**
 * Parses a human-readable file size string and converts it to bytes.
 * Supports various units (KB, MB, GB, bytes) and handles different formats.
 * @param {string} sizeStr - The file size string (e.g., "1.5 MB", "256 KB")
 * @returns {number} The size in bytes, or 0 if parsing fails
 */
function parseFileSize(sizeStr) {
	if (!sizeStr || sizeStr === "0") return 0;
	const match = sizeStr.match(/([\d.]+)\s*(KB|MB|GB|bytes?)/i);
	if (!match) return 0;
	const num = parseFloat(match[1]);
	const unit = match[2].toUpperCase();
	switch (unit) {
		case "KB":
			return Math.round(num * 1024);
		case "MB":
			return Math.round(num * 1024 * 1024);
		case "GB":
			return Math.round(num * 1024 * 1024 * 1024);
		default:
			return Math.round(num);
	}
}

// Helper function to filter files by pattern
/**
 * Filters an array of file objects based on file extension pattern.
 * @param {Array} files - Array of file objects with name property
 * @param {string} filePattern - File extension pattern (e.g., ".pdf", "pdf")
 * @returns {Array} Filtered array of files matching the pattern
 */
function filterFilesByPattern(files, filePattern) {
	if (!filePattern || filePattern === "") {
		return files;
	}
	const extension = filePattern.startsWith(".")
		? filePattern.toLowerCase()
		: `.${filePattern.toLowerCase()}`;
	return files.filter((f) => f.name.toLowerCase().endsWith(extension));
}

// Audit Processing
ipcMain.handle("audit-rolls", async (event, config) => {
	const {
		sourceType,
		folderPath,
		publicFolderUrl,
		filePattern,
		startRoll,
		endRoll,
		rollNumberPattern,
		maxSize,
		ignoreList,
		checkDuplicates,
	} = config;

	try {
		let files = [];

		// Get files based on source type
		if (sourceType === "local") {
			// Local folder processing
			const allFiles = await fs.readdir(folderPath);
			files = allFiles.map((f) => ({ name: f, size: 0 }));

			// Get actual file sizes
			for (let i = 0; i < files.length; i++) {
				try {
					const stats = await fs.stat(path.join(folderPath, files[i].name));
					files[i].size = stats.size;
				} catch (e) {
					// Ignore stat errors
				}
			}
		} else if (sourceType === "public") {
			// Public Drive folder processing
			files = await fetchPublicDriveFiles(publicFolderUrl, filePattern);
		} else {
			throw new Error("Invalid source type");
		}

		// Filter files by extension
		let pdfFiles;
		if (sourceType === "local") {
			pdfFiles = files.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
		} else {
			// For public folders, files are already filtered
			pdfFiles = files;
		}

		const foundRolls = new Map();
		const foundLargeRolls = [];
		const duplicates = new Map();

		for (const file of pdfFiles) {
			const rollNumber = extractRollNumber(file.name, rollNumberPattern);

			if (rollNumber) {
				const rollInt = parseInt(rollNumber);

				if (rollInt >= startRoll && rollInt <= endRoll) {
					const fileSize = file.size;

					if (maxSize > 0 && fileSize > maxSize) {
						foundLargeRolls.push({
							roll: rollInt,
							size: fileSize,
							filename: file.name,
						});
					} else {
						if (foundRolls.has(rollInt)) {
							foundRolls.get(rollInt).push(file.name);
							if (!duplicates.has(rollInt)) {
								duplicates.set(rollInt, [...foundRolls.get(rollInt)]);
							} else {
								duplicates.get(rollInt).push(file.name);
							}
						} else {
							foundRolls.set(rollInt, [file.name]);
						}
					}
				}
			}
		}

		const uniqueRolls = new Set(foundRolls.keys());
		const allRolls = new Set();
		for (let i = startRoll; i <= endRoll; i++) allRolls.add(i);

		const ignoredSet = new Set(ignoreList);
		const allFound = new Set([
			...uniqueRolls,
			...foundLargeRolls.map((f) => f.roll),
		]);

		const missingRolls = Array.from(allRolls)
			.filter((r) => !allFound.has(r) && !ignoredSet.has(r))
			.sort((a, b) => a - b);

		const foundOkList = Array.from(uniqueRolls)
			.filter((r) => !ignoredSet.has(r))
			.sort((a, b) => a - b);

		const duplicatesList = Array.from(duplicates.entries())
			.map(([roll, files]) => ({ roll, files }))
			.sort((a, b) => a.roll - b.roll);

		return {
			success: true,
			totalExpected: allRolls.size,
			found: foundOkList.length + foundLargeRolls.length,
			missing: missingRolls.length,
			duplicates: duplicatesList.length,
			missingRolls,
			foundOkList,
			foundLargeRolls: foundLargeRolls.sort((a, b) => a.roll - b.roll),
			duplicatesList,
			ignoredCount: ignoredSet.size,
		};
	} catch (error) {
		return { success: false, error: error.message };
	}
});

ipcMain.handle(
	"save-report",
	async (event, { folderPath, content, interactive = false }) => {
		try {
			let reportPath;

			if (interactive) {
				// Show save dialog for export
				const result = await dialog.showSaveDialog(mainWindow, {
					title: "Export Audit Report",
					defaultPath: path.join(
						folderPath || app.getPath("documents"),
						"Audit_Report.txt",
					),
					filters: [
						{ name: "Text Files", extensions: ["txt"] },
						{ name: "All Files", extensions: ["*"] },
					],
				});

				if (result.canceled) {
					return { success: false, canceled: true };
				}

				reportPath = result.filePath;
			} else {
				// Auto-save in folder
				reportPath = path.join(folderPath, "Audit_Report.txt");
			}

			await fs.writeFile(reportPath, content, "utf8");
			return { success: true, path: reportPath };
		} catch (error) {
			return { success: false, error: error.message };
		}
	},
);

/**
 * Extracts a roll number from a filename based on a pattern configuration.
 * The pattern uses underscores to indicate where the roll number should be.
 * @param {string} filename - The filename to extract roll number from
 * @param {string} pattern - Pattern with underscores representing roll number position (e.g., "18842826___" or "___-suffix")
 * @returns {string|null} The extracted roll number or null if not found
 */
function extractRollNumber(filename, pattern) {
	if (!pattern || !pattern.includes("_")) {
		// Fallback: try to find any digits
		const matches = filename.match(/\d+/g);
		return matches ? matches[0] : null;
	}

	// Count underscores to determine roll number length
	const rollLength = (pattern.match(/_/g) || []).length;

	// Find where underscores start in the pattern
	const underscoreStart = pattern.indexOf("_");
	const underscoreEnd = pattern.lastIndexOf("_") + 1;

	// Get prefix and suffix from pattern
	const prefix = pattern.substring(0, underscoreStart);
	const suffix = pattern.substring(underscoreEnd);

	// Remove file extension from filename for matching
	const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

	// Build regex pattern
	let regexPattern = "";
	if (prefix) {
		regexPattern += prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}
	regexPattern += `(\\d{${rollLength}})`;
	if (suffix) {
		regexPattern += suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	}

	const regex = new RegExp(regexPattern);
	const match = nameWithoutExt.match(regex);

	return match ? match[1] : null;
}
