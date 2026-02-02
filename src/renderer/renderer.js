// DOM Elements
const startRollInput = document.getElementById("startRoll");
const endRollInput = document.getElementById("endRoll");
const maxSizeInput = document.getElementById("maxSize");
const ignoreRollsInput = document.getElementById("ignoreRolls");
const checkDuplicatesCheckbox = document.getElementById("checkDuplicates");
const folderPathInput = document.getElementById("folderPath");
const browseBtn = document.getElementById("browseBtn");
const auditBtn = document.getElementById("auditBtn");
const copyBtn = document.getElementById("copyBtn");
const exportBtn = document.getElementById("exportBtn");
const resultBox = document.getElementById("resultBox");
const toastContainer = document.getElementById("toastContainer");

// Tab elements
const localFolderTab = document.getElementById("localFolderTab");
const publicFolderTab = document.getElementById("publicFolderTab");
const localFolderContent = document.getElementById("localFolderContent");
const publicFolderContent = document.getElementById("publicFolderContent");
const publicFolderUrl = document.getElementById("publicFolderUrl");
const filePattern = document.getElementById("filePattern");

// Layout elements
const leftPanel = document.querySelector(".left-panel");
const rightPanel = document.querySelector(".right-panel");
const resizeHandle = document.getElementById("resizeHandle");

// Title bar controls
const minimizeBtn = document.getElementById("minimizeBtn");
const maximizeBtn = document.getElementById("maximizeBtn");
const closeBtn = document.getElementById("closeBtn");
const themeBtn = document.getElementById("themeBtn");
const reloadBtn = document.getElementById("reloadBtn");
const settingsBtn = document.getElementById("settingsBtn");

// Settings dialog
const settingsOverlay = document.getElementById("settingsOverlay");
const closeSettingsBtn = document.getElementById("closeSettings");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const savedIgnoreRollsTextarea = document.getElementById("savedIgnoreRolls");
const rollNumberPatternInput = document.getElementById("rollNumberPattern");
const settingsCheckDuplicatesCheckbox = document.getElementById(
	"settingsCheckDuplicates",
);

// Confirm dialog
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmTitle = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const confirmOkBtn = document.getElementById("confirmOkBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");

let selectedFolderPath = null;
let currentReport = "";
let currentTheme = "dark";
let currentSourceType = "local"; // "local" or "public"

/**
 * Initializes the application by setting up the UI and loading saved settings.
 * Sets initial terminal text and applies user preferences.
 */
async function init() {
	// Set initial terminal text
	resultBox.textContent =
		'Ready to audit.\n\n1. Select a folder containing PDFs\n2. Configure your parameters\n3. Click "Run Audit"';

	const settings = await window.electron.loadSettings();
	applySettings(settings);
}

/**
 * Applies saved settings to the UI elements.
 * Updates form inputs, theme, and other UI state based on loaded settings.
 * @param {Object} settings - Settings object loaded from storage
 */
function applySettings(settings) {
	currentTheme = settings.theme || "dark";
	document.body.setAttribute("data-theme", currentTheme);
	updateThemeIcon();

	if (settings.startRoll) startRollInput.value = settings.startRoll;
	if (settings.endRoll) endRollInput.value = settings.endRoll;
	if (settings.rollNumberPattern)
		rollNumberPatternInput.value = settings.rollNumberPattern;
	if (settings.maxSizeMB) maxSizeInput.value = settings.maxSizeMB;
	if (settings.ignoreRolls) {
		ignoreRollsInput.value = settings.ignoreRolls;
		savedIgnoreRollsTextarea.value = settings.ignoreRolls;
	}
	if (settings.checkDuplicates !== undefined) {
		checkDuplicatesCheckbox.checked = settings.checkDuplicates;
		settingsCheckDuplicatesCheckbox.checked = settings.checkDuplicates;
	}
}

/**
 * Saves the current form settings to persistent storage.
 * Collects values from all input fields and saves them for future sessions.
 */
async function saveCurrentSettings() {
	const settings = {
		theme: currentTheme,
		ignoreRolls: savedIgnoreRollsTextarea.value,
		startRoll: startRollInput.value,
		endRoll: endRollInput.value,
		rollNumberPattern: rollNumberPatternInput.value || "___",
		maxSizeMB: maxSizeInput.value,
		checkDuplicates: settingsCheckDuplicatesCheckbox.checked,
	};

	await window.electron.saveSettings(settings);
}

// Tab Switching
/**
 * Switches between local folder and public folder audit modes.
 * Updates UI visibility and sets the current source type.
 * @param {string} tab - The tab to switch to ("local" or "public")
 */
function switchTab(tab) {
	currentSourceType = tab;

	if (tab === "local") {
		localFolderTab.classList.add("tab-button-active");
		publicFolderTab.classList.remove("tab-button-active");
		localFolderContent.classList.add("tab-content-active");
		publicFolderContent.classList.remove("tab-content-active");
	} else {
		publicFolderTab.classList.add("tab-button-active");
		localFolderTab.classList.remove("tab-button-active");
		publicFolderContent.classList.add("tab-content-active");
		localFolderContent.classList.remove("tab-content-active");
	}
}

localFolderTab.addEventListener("click", () => switchTab("local"));
publicFolderTab.addEventListener("click", () => switchTab("public"));

// Theme Toggle
/**
 * Toggles between dark and light themes.
 * Updates the document theme attribute and icon visibility.
 */
function toggleTheme() {
	currentTheme = currentTheme === "dark" ? "light" : "dark";
	document.body.setAttribute("data-theme", currentTheme);
	updateThemeIcon();
	saveCurrentSettings();
}

/**
 * Updates the theme toggle button icon based on current theme.
 * Shows sun icon for dark theme and moon icon for light theme.
 */
function updateThemeIcon() {
	const sunIcon = document.querySelector(".theme-icon-sun");
	const moonIcon = document.querySelector(".theme-icon-moon");

	if (currentTheme === "dark") {
		sunIcon.style.display = "block";
		moonIcon.style.display = "none";
	} else {
		sunIcon.style.display = "none";
		moonIcon.style.display = "block";
	}
}

// Resize Panels
let isResizing = false;
let startX = 0;
let startWidth = 0;

resizeHandle.addEventListener("mousedown", (e) => {
	isResizing = true;
	startX = e.clientX;
	startWidth = leftPanel.offsetWidth;

	resizeHandle.classList.add("resizing");
	document.body.classList.add("resizing");

	e.preventDefault();
});

document.addEventListener("mousemove", (e) => {
	if (!isResizing) return;

	const diff = e.clientX - startX;
	const newWidth = startWidth + diff;

	const minWidth = 300;
	const maxWidth = 600;
	const containerWidth = leftPanel.parentElement.offsetWidth;
	const minRightWidth = 400;
	const maxLeftWidth = containerWidth - minRightWidth - 8; // 8px for resize handle

	const clampedWidth = Math.max(
		minWidth,
		Math.min(newWidth, maxWidth, maxLeftWidth),
	);
	leftPanel.style.width = `${clampedWidth}px`;
});

document.addEventListener("mouseup", () => {
	if (isResizing) {
		isResizing = false;
		resizeHandle.classList.remove("resizing");
		document.body.classList.remove("resizing");
	}
});

// Window Controls
minimizeBtn.addEventListener("click", () => {
	window.electron.minimizeWindow();
});

maximizeBtn.addEventListener("click", async () => {
	await window.electron.maximizeWindow();
});

closeBtn.addEventListener("click", () => {
	window.electron.closeWindow();
});

themeBtn.addEventListener("click", toggleTheme);

// Settings Dialog
settingsBtn.addEventListener("click", () => {
	settingsOverlay.classList.add("active");
});

closeSettingsBtn.addEventListener("click", () => {
	settingsOverlay.classList.remove("active");
});

settingsOverlay.addEventListener("click", (e) => {
	if (e.target === settingsOverlay) {
		settingsOverlay.classList.remove("active");
	}
});

saveSettingsBtn.addEventListener("click", async () => {
	await saveCurrentSettings();
	ignoreRollsInput.value = savedIgnoreRollsTextarea.value;
	checkDuplicatesCheckbox.checked = settingsCheckDuplicatesCheckbox.checked;
	settingsOverlay.classList.remove("active");

	const originalText = saveSettingsBtn.textContent;
	saveSettingsBtn.textContent = "✓ Saved!";
	saveSettingsBtn.classList.add("copied");
	setTimeout(() => {
		saveSettingsBtn.textContent = originalText;
		saveSettingsBtn.classList.remove("copied");
	}, 2000);
});

// Browse Folder
browseBtn.addEventListener("click", async () => {
	const path = await window.electron.selectFolder();
	if (path) {
		selectedFolderPath = path;
		folderPathInput.value = path;
		folderPathInput.classList.add("success");
	}
});

// Convert MB input to bytes
/**
 * Converts megabyte input value to bytes for file size comparison.
 * Returns 0 if no limit is set (empty or invalid input).
 * @returns {number} Size limit in bytes (1 MB = 1024 * 1024 bytes)
 */
function getMBAsBytes() {
	const mbValue = parseFloat(maxSizeInput.value);
	if (isNaN(mbValue) || mbValue <= 0) {
		return 0; // No limit
	}
	// Convert MB to bytes (1 MB = 1024 * 1024 bytes)
	return mbValue * 1024 * 1024;
}

/**
 * Converts bytes to megabytes for display purposes.
 * @param {number} bytes - Size in bytes
 * @returns {string} Size formatted as megabytes with 2 decimal places
 */
function bytesToMB(bytes) {
	return (bytes / (1024 * 1024)).toFixed(2);
}

// Audit
auditBtn.addEventListener("click", async () => {
	// Validate based on source type
	if (currentSourceType === "local") {
		if (!selectedFolderPath) {
			showNotification("Please select a folder first.", "error");
			return;
		}
	} else if (currentSourceType === "public") {
		if (!publicFolderUrl.value.trim()) {
			showNotification("Please enter a valid Drive folder URL.", "error");
			return;
		}
	}

	const startRoll = parseInt(startRollInput.value);
	const endRoll = parseInt(endRollInput.value);

	if (isNaN(startRoll) || isNaN(endRoll)) {
		showNotification("Start and End rolls must be valid numbers.", "error");
		return;
	}

	if (startRoll > endRoll) {
		showNotification(
			"Start roll must be less than or equal to end roll.",
			"error",
		);
		return;
	}

	const rollNumberPattern = rollNumberPatternInput.value || "___";
	const maxSize = getMBAsBytes(); // Convert MB to bytes
	const maxSizeMB = maxSizeInput.value || "0";
	const checkDuplicates = checkDuplicatesCheckbox.checked;

	const ignoreText = ignoreRollsInput.value.trim();
	const ignoreList = ignoreText
		? ignoreText
				.split(",")
				.map((s) => parseInt(s.trim()))
				.filter((n) => !isNaN(n))
		: [];

	auditBtn.disabled = true;
	auditBtn.classList.add("loading");
	auditBtn.innerHTML =
		'<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" opacity="0.3"/><path d="M8 2 A 6 6 0 0 1 14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Processing...';
	resultBox.textContent = "Running audit... Please wait.";
	copyBtn.style.display = "none";
	exportBtn.style.display = "none";

	const config = {
		sourceType: currentSourceType,
		startRoll,
		endRoll,
		rollNumberPattern,
		maxSize,
		ignoreList,
		checkDuplicates,
	};

	if (currentSourceType === "local") {
		config.folderPath = selectedFolderPath;
	} else {
		config.publicFolderUrl = publicFolderUrl.value.trim();
		config.filePattern = filePattern.value.trim() || ".pdf";
	}

	const result = await window.electron.auditRolls(config);

	if (result.success) {
		const report = formatReport(result, maxSizeMB, checkDuplicates);
		resultBox.textContent = report;
		currentReport = report;

		const reportPath = currentSourceType === "local" ? selectedFolderPath : "";
		await window.electron.saveReport({
			folderPath: reportPath,
			content: report,
			interactive: false,
		});

		copyBtn.style.display = "inline-flex";
		exportBtn.style.display = "inline-flex";
		showNotification("Audit completed successfully!", "success");
	} else {
		resultBox.textContent = `Error: ${result.error}`;
		currentReport = "";
		showNotification(`Error: ${result.error}`, "error");
	}

	auditBtn.disabled = false;
	auditBtn.classList.remove("loading");
	auditBtn.innerHTML =
		'<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 8M8 2L8 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Run Audit';
});

// Copy Results
copyBtn.addEventListener("click", () => {
	const text = resultBox.textContent;
	navigator.clipboard.writeText(text).then(() => {
		const originalHTML = copyBtn.innerHTML;
		copyBtn.innerHTML =
			'<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 8L6 12L14 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Copied!';
		copyBtn.classList.add("copied");

		showNotification("Report copied to clipboard", "success");

		setTimeout(() => {
			copyBtn.innerHTML = originalHTML;
			copyBtn.classList.remove("copied");
		}, 2000);
	});
});

// Export Results
exportBtn.addEventListener("click", async () => {
	if (!currentReport) return;

	const result = await window.electron.saveReport({
		folderPath: selectedFolderPath || "",
		content: currentReport,
		interactive: true,
	});

	if (result.success) {
		showNotification("Report exported successfully", "success");
	} else {
		showNotification("Failed to export report", "error");
	}
});

// Custom Confirm Dialog
/**
 * Shows a custom confirmation dialog with OK/Cancel options.
 * Returns a promise that resolves to true for OK, false for Cancel.
 * @param {string} message - The message to display in the dialog
 * @param {string} title - The dialog title (default: "Confirm")
 * @returns {Promise<boolean>} User choice (true for OK, false for Cancel)
 */
function showConfirm(message, title = "Confirm") {
	return new Promise((resolve) => {
		confirmTitle.textContent = title;
		confirmMessage.textContent = message;
		confirmOverlay.classList.add("active");

		const handleOk = () => {
			confirmOverlay.classList.remove("active");
			cleanup();
			resolve(true);
		};

		const handleCancel = () => {
			confirmOverlay.classList.remove("active");
			cleanup();
			resolve(false);
		};

		const cleanup = () => {
			confirmOkBtn.removeEventListener("click", handleOk);
			confirmCancelBtn.removeEventListener("click", handleCancel);
			confirmOverlay.removeEventListener("click", handleOverlayClick);
		};

		const handleOverlayClick = (e) => {
			if (e.target === confirmOverlay) {
				handleCancel();
			}
		};

		confirmOkBtn.addEventListener("click", handleOk);
		confirmCancelBtn.addEventListener("click", handleCancel);
		confirmOverlay.addEventListener("click", handleOverlayClick);
	});
}

// Reload/Reset Form
reloadBtn.addEventListener("click", async () => {
	const confirmed = await showConfirm("Reset the form to default values?");
	if (confirmed) {
		startRollInput.value = "001";
		endRollInput.value = "140";
		maxSizeInput.value = "";
		ignoreRollsInput.value = "";
		publicFolderUrl.value = "";
		filePattern.value = "";
		selectedFolderPath = null;
		folderPathInput.value = "";
		folderPathInput.classList.remove("success");
		switchTab("local");
		resultBox.textContent =
			'Ready to audit.\n\n1. Select a folder containing PDFs\n2. Configure your parameters\n3. Click "Run Audit"';
		copyBtn.style.display = "none";
		exportBtn.style.display = "none";
		currentReport = "";
		showNotification("Form reset", "info");
	}
});

// Keyboard Shortcuts
document.addEventListener("keydown", (e) => {
	if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.altKey) {
		const activeElement = document.activeElement;
		if (
			activeElement.tagName !== "TEXTAREA" &&
			activeElement !== auditBtn &&
			selectedFolderPath
		) {
			e.preventDefault();
			auditBtn.click();
		}
	}
});

// Drag and Drop
folderPathInput.parentElement.addEventListener("dragover", (e) => {
	e.preventDefault();
	e.stopPropagation();
	folderPathInput.parentElement.classList.add("drag-over");
});

folderPathInput.parentElement.addEventListener("dragleave", (e) => {
	e.preventDefault();
	e.stopPropagation();
	folderPathInput.parentElement.classList.remove("drag-over");
});

folderPathInput.parentElement.addEventListener("drop", async (e) => {
	e.preventDefault();
	e.stopPropagation();
	folderPathInput.parentElement.classList.remove("drag-over");

	const files = Array.from(e.dataTransfer.files);
	if (files.length > 0 && files[0].type === "") {
		// It's likely a folder
		const path = files[0].path;
		selectedFolderPath = path;
		folderPathInput.value = path;
		folderPathInput.classList.add("success");
		showNotification("Folder selected", "success");
	}
});

// Toast Notification System
/**
 * Shows a toast notification with an icon and message.
 * Automatically removes the notification after 3 seconds.
 * @param {string} message - The notification message
 * @param {string} type - Notification type ("success", "error", "info") default: "info"
 */
function showNotification(message, type = "info") {
	const toast = document.createElement("div");
	toast.className = `toast ${type}`;

	const icons = {
		success:
			'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
		error:
			'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M15 9l-6 6m0-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
		info: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none"/><path d="M12 8v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
	};

	const titles = {
		success: "Success",
		error: "Error",
		info: "Info",
	};

	toast.innerHTML = `
		<div class="toast-icon">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				${icons[type] || icons.info}
			</svg>
		</div>
		<div class="toast-content">
			<div class="toast-title">${titles[type]}</div>
			<div class="toast-description">${message}</div>
		</div>
		<button class="toast-close" onclick="this.parentElement.remove()">
			<svg width="14" height="14" viewBox="0 0 16 16">
				<path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
			</svg>
		</button>
	`;

	toastContainer.appendChild(toast);

	setTimeout(() => {
		toast.remove();
	}, 3000);
}

// Format Report
/**
 * Formats audit results into a human-readable text report.
 * Includes summary statistics, missing rolls, duplicates, and size warnings.
 * @param {Object} result - Audit result object from main process
 * @param {string} maxSizeMB - Maximum file size limit in MB
 * @param {boolean} checkDuplicates - Whether duplicate checking was enabled
 * @returns {string} Formatted report text
 */
function formatReport(result, maxSizeMB, checkDuplicates) {
	let report = "AUDIT SUMMARY\n";
	report += "-".repeat(40) + "\n\n";

	report += `Total Expected:  ${result.totalExpected}\n`;
	report += `Found:           ${result.found}\n`;
	report += `Missing:         ${result.missing}\n`;

	if (checkDuplicates && result.duplicates > 0) {
		report += `Duplicates:      ${result.duplicates}\n`;
	}

	if (maxSizeMB !== "0" && result.foundLargeRolls.length > 0) {
		report += `Size Warnings:   ${result.foundLargeRolls.length} files exceed ${maxSizeMB} MB\n`;
	}

	if (result.ignoredCount > 0) {
		report += `Ignored:         ${result.ignoredCount}\n`;
	}

	report += "\n\nMISSING ROLLS\n";
	report += "-".repeat(40) + "\n";

	if (result.missingRolls.length > 0) {
		const rows = chunkArray(result.missingRolls, 10);
		rows.forEach((row) => {
			report += row.map((r) => r.toString().padStart(3, "0")).join("  ") + "\n";
		});
	} else {
		report += "All students have submitted files.\n";
	}

	if (checkDuplicates && result.duplicatesList.length > 0) {
		report += "\n\nDUPLICATE SUBMISSIONS\n";
		report += "-".repeat(40) + "\n";

		result.duplicatesList.forEach((dup) => {
			const rollStr = dup.roll.toString().padStart(3, "0");
			report += `\nRoll ${rollStr} (${dup.files.length} copies):\n`;
			dup.files.forEach((file, index) => {
				report += `  ${index + 1}. ${file}\n`;
			});
		});
	}

	if (result.foundLargeRolls.length > 0) {
		report += "\n\nFILES EXCEEDING SIZE LIMIT (${maxSizeMB} MB)\n";
		report += "-".repeat(40) + "\n";

		result.foundLargeRolls.forEach((item) => {
			const rollStr = item.roll.toString().padStart(3, "0");
			const sizeMB = bytesToMB(item.size);
			report += `Roll ${rollStr}: ${sizeMB} MB\n`;
		});
	}

	report += "\n" + "-".repeat(40) + "\n";
	report += `Generated: ${new Date().toLocaleString()}\n`;

	return report;
}

/**
 * Splits an array into smaller chunks of specified size.
 * Used for formatting roll numbers in columns for better readability.
 * @param {Array} array - The array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array} Array of chunked arrays
 */
function chunkArray(array, size) {
	const chunks = [];
	for (let i = 0; i < array.length; i += size) {
		chunks.push(array.slice(i, i + size));
	}
	return chunks;
}

// Initialize app
init();
