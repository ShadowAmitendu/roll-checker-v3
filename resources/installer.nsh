; Custom NSIS installer script for Roll Number Auditor
; This file customizes the installer appearance and behavior

!macro customHeader
  !system "echo 'Building Roll Number Auditor Installer...'"
!macroend

!macro preInit
  ; This runs before the installer starts
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  SetRegView 32
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$INSTDIR"
!macroend

!macro customInstall
  ; Custom installation steps
  DetailPrint "Installing Roll Number Auditor..."

  ; Create uninstaller registry entries
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_GUID}" \
                   "DisplayName" "${PRODUCT_NAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_GUID}" \
                   "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_GUID}" \
                   "Publisher" "Roll Number Auditor"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_GUID}" \
                   "DisplayIcon" "$INSTDIR\${PRODUCT_FILENAME}.exe"
!macroend

!macro customUnInstall
  ; Custom uninstallation steps
  DetailPrint "Removing Roll Number Auditor..."

  ; Remove registry entries
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_GUID}"
!macroend

; Custom installer page text
!macro customWelcomePage
  !define MUI_WELCOMEPAGE_TITLE "Welcome to Roll Number Auditor Setup"
  !define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of Roll Number Auditor.$\r$\n$\r$\nClick Next to continue."
!macroend

!macro customFinishPage
  !define MUI_FINISHPAGE_TITLE "Installation Complete"
  !define MUI_FINISHPAGE_TEXT "Roll Number Auditor has been successfully installed.$\r$\n$\r$\nClick Finish to exit the installer."
  !define MUI_FINISHPAGE_RUN "$INSTDIR\${PRODUCT_FILENAME}.exe"
  !define MUI_FINISHPAGE_RUN_TEXT "Launch Roll Number Auditor"
!macroend
