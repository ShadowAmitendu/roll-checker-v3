/**
 * Preload script for Electron renderer process.
 * Safely exposes main process APIs to the renderer using contextBridge.
 * Provides secure communication between the main and renderer processes.
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
	// Window controls
	/**
	 * Minimizes the application window.
	 * @returns {Promise<void>}
	 */
	minimizeWindow: () => ipcRenderer.invoke("window-minimize"),

	/**
	 * Toggles the maximize/restore state of the application window.
	 * @returns {Promise<boolean>} True if maximized, false if restored
	 */
	maximizeWindow: () => ipcRenderer.invoke("window-maximize"),

	/**
	 * Closes the application window.
	 * @returns {Promise<void>}
	 */
	closeWindow: () => ipcRenderer.invoke("window-close"),

	/**
	 * Checks if the application window is currently maximized.
	 * @returns {Promise<boolean>} True if maximized, false otherwise
	 */
	isMaximized: () => ipcRenderer.invoke("window-is-maximized"),

	// Settings
	/**
	 * Loads user settings from persistent storage.
	 * @returns {Promise<Object>} User settings object
	 */
	loadSettings: () => ipcRenderer.invoke("load-settings"),

	/**
	 * Saves user settings to persistent storage.
	 * @param {Object} settings - Settings object to save
	 * @returns {Promise<Object>} Result object with success status
	 */
	saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

	// File operations
	/**
	 * Opens a folder selection dialog and returns the selected path.
	 * @returns {Promise<string|null>} Selected folder path or null if canceled
	 */
	selectFolder: () => ipcRenderer.invoke("select-folder"),

	/**
	 * Runs the roll number audit process with the given configuration.
	 * @param {Object} config - Audit configuration object
	 * @returns {Promise<Object>} Audit results
	 */
	auditRolls: (config) => ipcRenderer.invoke("audit-rolls", config),

	/**
	 * Saves an audit report to a file.
	 * @param {Object} data - Report data including folder path and content
	 * @returns {Promise<Object>} Save result with success status and path
	 */
	saveReport: (data) => ipcRenderer.invoke("save-report", data),
});
