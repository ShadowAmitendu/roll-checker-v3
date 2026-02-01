/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
	appId: "com.rollnumberauditor.app",
	productName: "Roll Number Auditor",
	copyright: "Copyright © 2026 Shadow Amitendu",
	directories: {
		output: "dist",
		buildResources: "build",
	},
	files: ["src/**/*", "resources/**/*", "package.json"],
	win: {
		target: [
			{
				target: "nsis",
				arch: ["x64"],
			},
		],
		icon: "src/assets/icon.png",
		signingHashAlgorithms: ["sha256"],
		sign: undefined,
	},
	nsis: {
		oneClick: false,
		allowToChangeInstallationDirectory: true,
		allowElevation: true,
		createDesktopShortcut: true,
		createStartMenuShortcut: true,
		shortcutName: "Roll Number Auditor",
		artifactName: "${productName}-Setup-${version}.exe",
		perMachine: false /* Set to true if you want to install for all users by default */,
		deleteAppDataOnUninstall: false,
		runAfterFinish: true,
		displayLanguageSelector: false,
		multiLanguageInstaller: false,
		warningsAsErrors: false,
		guid: "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
		license: "LICENSE.txt",
		include: "resources/installer.nsh",

		/* Customizing Appearance */
		// installerIcon: "build/installer-icon.ico",
		// uninstallerIcon: "build/uninstaller-icon.ico",
		// installerHeaderIcon: "build/installer-header-icon.ico",
	},
	directories: {
		output: "dist",
		buildResources: "build",
	},
};
