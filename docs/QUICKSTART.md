# Quick Start - Public Folder Feature

## What's New?

You can now audit files directly from **Google Drive public folders** without needing API credentials or complex setup!

## Quick Setup (2 minutes)

### Step 1: Get Your Drive Folder Ready

```
1. Go to Google Drive
2. Create/open a folder with files (e.g., PDFs with roll numbers)
3. Click Share
4. Set to "Anyone with the link can view"
5. Copy the folder link
```

Example link:

```
https://drive.google.com/drive/folders/1ABC123XYZ...
```

### Step 2: Open Auditor & Switch Tab

```
1. Launch Roll Number Auditor
2. In Configuration section, click "Public Drive Folder" tab
3. Paste your Drive link
4. Leave File Pattern empty (or set to .pdf if needed)
```

### Step 3: Configure & Run

```
1. Set Start Roll: 001
2. Set End Roll: 140
3. Click "Run Audit"
4. Wait for results
```

That's it! 🎉

## Common URLs

These URL formats work automatically:

```
✅ https://drive.google.com/drive/folders/FOLDER_ID
✅ https://drive.google.com/open?id=FOLDER_ID
```

These won't work:

```
❌ Just the folder ID
❌ URLs with ?usp=sharing
```

## File Naming

Your files should have 11-digit numbers (roll numbers):

```
Examples:
✅ Roll_01201234567_Assignment.pdf
✅ StudentSubmission_01201234567.pdf
✅ 01201234567_Assignment.pdf
```

## File Pattern Examples

- Leave empty or `.pdf` for PDF files only
- `.docx` for Word documents
- `.xlsx` for Excel files
- Don't include the dot if you don't want to: `pdf` works the same as `.pdf`

## Troubleshooting

| Problem                 | Solution                                             |
| ----------------------- | ---------------------------------------------------- |
| "Invalid URL format"    | Make sure URL contains `/folders/ID` part            |
| "Could not fetch files" | Check Drive folder is shared with "Anyone with link" |
| No files found          | Verify file extensions match (check File Pattern)    |
| Missing submissions     | Check roll number format (needs 11 digits)           |

## Local Folder Still Works

Click the "Local Folder" tab to go back to auditing files from your computer. Everything works exactly as before!

## Need Help?

See `PUBLIC_FOLDER_FEATURE.md` for detailed documentation.
See `IMPLEMENTATION_NOTES.md` for technical details.

---

**Happy Auditing!** 🚀
