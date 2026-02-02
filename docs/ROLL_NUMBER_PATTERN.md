# Roll Number Pattern Feature

## Overview

The Roll Number Auditor now supports flexible roll number patterns, allowing you to define custom formats for how roll numbers appear in your PDF filenames.

## How to Use

### Setting Up a Pattern

1. Open the **Settings** dialog (click the gear icon in the title bar)
2. Find the **Roll Number Pattern** field
3. Enter your pattern using underscores (`_`) to indicate where the roll number appears

### Pattern Examples

| Pattern           | Example Filename      | Extracted Roll Number |
| ----------------- | --------------------- | --------------------- |
| `___`             | `123.pdf`             | `123`                 |
| `18842826___`     | `18842826001.pdf`     | `001`                 |
| `prefix___suffix` | `prefix123suffix.pdf` | `123`                 |
| `___-document`    | `045-document.pdf`    | `045`                 |
| `roll_____`       | `roll12345.pdf`       | `12345`               |

### Key Points

- **Underscores define length**: The number of underscores (`_`) determines how many digits the roll number should be
  - `___` = 3 digits
  - `____` = 4 digits
  - `_____` = 5 digits, etc.

- **Prefix/Suffix support**: You can add any text before or after the underscores
  - Before: `18842826___` means the filename starts with "18842826" followed by the roll number
  - After: `___-final` means the roll number comes first, followed by "-final"
  - Both: `prefix___suffix` means the roll number is in the middle

- **Default pattern**: If you leave it empty, the default is `___` (3 digits anywhere in the filename)

## Migration from Old System

The old system used a "Position" dropdown with options:

- **Start**: Roll number at the beginning → Now use pattern `___` (or more underscores)
- **Middle**: Roll number between underscores → Now use pattern `prefix___suffix`
- **End**: Roll number at the end → Now use pattern `prefix___`

The new pattern system is more flexible and allows you to specify exact prefixes and suffixes.

## Examples for Common Use Cases

### Case 1: Roll numbers with a fixed prefix

If your files are named like: `18842826001.pdf`, `18842826002.pdf`, etc.

- **Pattern**: `18842826___`
- **Start Roll**: `1`
- **End Roll**: `140`

### Case 2: Roll numbers at the start

If your files are named like: `001.pdf`, `002.pdf`, etc.

- **Pattern**: `___`
- **Start Roll**: `1`
- **End Roll**: `140`

### Case 3: Roll numbers with prefix and suffix

If your files are named like: `student-001-final.pdf`, `student-002-final.pdf`, etc.

- **Pattern**: `student-___-final`
- **Start Roll**: `1`
- **End Roll**: `140`

### Case 4: Variable length roll numbers

If your files use 5-digit roll numbers: `12345.pdf`, `12346.pdf`, etc.

- **Pattern**: `_____`
- **Start Roll**: `12345`
- **End Roll**: `12485`

## Notes

- The pattern is case-sensitive
- Special characters in the prefix/suffix are supported
- File extensions (like `.pdf`) are automatically ignored during pattern matching
