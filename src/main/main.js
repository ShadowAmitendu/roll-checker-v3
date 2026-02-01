const {
	app,
	BrowserWindow,
	ipcMain,
	dialog,
	nativeImage,
} = require("electron");
const path = require("path");
const fs = require("fs").promises;

let mainWindow;
let settingsPath;

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
			position: "Middle",
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

// Audit Processing
ipcMain.handle("audit-rolls", async (event, config) => {
	const {
		folderPath,
		startRoll,
		endRoll,
		position,
		maxSize,
		ignoreList,
		checkDuplicates,
	} = config;

	try {
		const files = await fs.readdir(folderPath);
		const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));

		const foundRolls = new Map();
		const foundLargeRolls = [];
		const duplicates = new Map();

		for (const filename of pdfFiles) {
			const rollNumber = extractRollNumber(filename, position);

			if (rollNumber && rollNumber.length === 11) {
				const suffix = parseInt(rollNumber.slice(-3));

				if (suffix >= startRoll && suffix <= endRoll) {
					const filePath = path.join(folderPath, filename);
					const stats = await fs.stat(filePath);
					const fileSize = stats.size;

					if (maxSize > 0 && fileSize > maxSize) {
						foundLargeRolls.push({ roll: suffix, size: fileSize, filename });
					} else {
						if (foundRolls.has(suffix)) {
							foundRolls.get(suffix).push(filename);
							if (!duplicates.has(suffix)) {
								duplicates.set(suffix, [...foundRolls.get(suffix)]);
							} else {
								duplicates.get(suffix).push(filename);
							}
						} else {
							foundRolls.set(suffix, [filename]);
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

function extractRollNumber(filename, position) {
	const matches = filename.match(/\d{11}/g);
	if (!matches || matches.length === 0) return null;

	if (position === "Start") {
		return filename.startsWith(matches[0]) ? matches[0] : null;
	} else if (position === "End") {
		const nameWithoutExt = filename.replace(".pdf", "");
		return nameWithoutExt.endsWith(matches[matches.length - 1])
			? matches[matches.length - 1]
			: null;
	} else {
		const underscoreMatch = filename.match(/_(\d{11})_/);
		return underscoreMatch ? underscoreMatch[1] : matches[0];
	}
}
