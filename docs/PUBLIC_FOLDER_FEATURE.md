# Public Google Drive Folder Audit Feature

## Overview

The Roll Number Auditor now supports auditing files directly from **publicly shared Google Drive folders** without requiring API credentials. This feature is perfect for scenarios where you have a shared Drive folder with student submissions.

## Prerequisites

- A Google Drive folder shared with "Anyone with the link can view" permission
- The folder URL (e.g., `https://drive.google.com/drive/folders/1ABC...xyz`)

## How to Use

### 1. Set Up Your Google Drive Folder

1. Create or open a Google Drive folder containing your PDF files
2. Share the folder by clicking the "Share" button
3. Set permission to "Anyone with the link can view" (read-only)
4. Copy the folder URL - it should look like:
   ```
   https://drive.google.com/drive/folders/1ABC...xyz
   ```

### 2. Configure the Auditor

1. Open the Roll Number Auditor application
2. In the **Configuration** section, you'll see two tabs:
   - **Local Folder**: For auditing files on your computer
   - **Public Drive Folder**: For auditing files from a shared Drive folder

3. Click on the **Public Drive Folder** tab
4. Paste your Drive folder URL in the "Drive Folder URL" field
5. (Optional) Specify a file pattern if you want to filter by file type
   - Examples: `.pdf`, `.docx`, `.xlsx`
   - Leave empty to include all files

### 3. Configure Audit Parameters

Set your audit parameters as usual:

- **Start Roll**: Starting roll number (last 3 digits)
- **End Roll**: Ending roll number (last 3 digits)
- **Position in Filename**: Where the roll number appears (Start, Middle, or End)
- **Max File Size**: Maximum allowed file size in MB (0 for no limit)
- **Check for duplicates**: Enable to detect multiple files for the same roll number
- **Ignore Specific Rolls**: Comma-separated list of roll numbers to exclude

### 4. Run the Audit

Click the **Run Audit** button. The application will:

1. Fetch the file list from your public Drive folder
2. Extract roll numbers from filenames
3. Generate a comprehensive audit report
4. Display missing, found, and duplicate submissions

## Important Notes

### Security

- This feature only requires the **read-only** folder sharing link
- No credentials or API keys are needed
- Files are never downloaded - only metadata is analyzed
- The application only reads filename information

### Limitations

- The Drive folder must be shared with "Anyone with the link can view"
- File sizes from Drive may be approximate
- Very large folders (1000+ files) may take a moment to process
- The audit runs in real-time without caching

### File Naming Conventions

The application extracts roll numbers (11-digit sequences) from filenames based on your configured position:

**Position: Start**

- Format: `01223456789_StudentName.pdf`
- Roll number is at the beginning

**Position: Middle** (Default)

- Format: `StudentName_01223456789_Submission.pdf`
- Roll number is between underscores

**Position: End**

- Format: `StudentName_01223456789.pdf`
- Roll number is before the file extension

## Example Workflow

1. **Set up Drive folder**:
   - Create folder "CS101_Submissions"
   - Add PDFs with names like: `Roll_01201234567_CompAss.pdf`
   - Share with "Anyone with the link can view"

2. **Configure in Auditor**:
   - Switch to "Public Drive Folder" tab
   - Paste: `https://drive.google.com/drive/folders/1ABC...xyz`
   - Set Position: "Middle"
   - Set Start Roll: 001, End Roll: 140

3. **Run Audit**:
   - Click "Run Audit"
   - View results showing missing submissions, duplicates, etc.
   - Export report if needed

## Troubleshooting

### "Invalid Google Drive folder URL format"

- Make sure the URL follows: `https://drive.google.com/drive/folders/FOLDER_ID`
- Don't include extra parameters like `?usp=sharing`

### "Could not fetch files from Drive folder"

- Verify the folder is shared with "Anyone with the link can view"
- Check your internet connection
- The folder may have access restrictions

### No files found

- Ensure files exist in the Drive folder
- Check the file pattern matches your file extensions
- Verify the folder sharing settings

### Missing or incorrect roll numbers

- Verify your filename format matches the selected "Position"
- Ensure roll numbers are exactly 11 digits
- Check for spaces or special characters around the roll number

## Technical Details

- The feature uses the Google Drive API to fetch public folder metadata
- No authentication tokens are stored or transmitted
- All processing happens locally on your machine
- Network requests are made only to fetch file lists from Drive

## Future Enhancements

Potential improvements for this feature:

- Download file previews
- Filter by date modified
- Batch operations on Drive files
- Caching for faster subsequent audits
