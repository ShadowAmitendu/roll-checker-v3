# Roll Number Auditor v3.0 - ShadCN UI Edition 🎨

Modern, beautiful roll number auditor with ShadCN-inspired design system.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![UI](https://img.shields.io/badge/UI-ShadCN-black)

## 🆕 What's New in v3.0

### 🎨 ShadCN UI Design System
- **Professional components** - Card, Button, Input, Dialog, Checkbox
- **HSL color system** - Perfect theme consistency
- **Smooth animations** - Fade in, slide in, hover effects
- **Focus rings** - Accessibility-first design
- **Consistent spacing** - 4px, 8px, 16px, 24px grid

### 📏 Smart MB Input
- **Type numbers directly** - Just enter "5" for 5 MB
- **Automatic conversion** - Converts to bytes internally (1 MB = 1024 KB)
- **Unit indicator** - Shows "MB" suffix in input
- **No dropdowns** - Cleaner, faster input
- **Any size** - Not limited to preset values

### ✨ Enhanced UX
- **Better form labels** - With descriptions
- **Improved spacing** - More breathing room
- **Professional cards** - Elevated with shadows
- **Clean terminal** - Monospace font with proper styling
- **SVG icons** - Crisp at any resolution

## 📸 Screenshots

### Dark Theme (Default)
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Roll Number Auditor     [☀️] [⚙️] [-] [□] [×]           │
├──────────────────┬──────────────────────────────────────────┤
│ Configuration    │ Audit Report                             │
│ ╔══════════════╗ │ ╔══════════════════════════════════════╗ │
│ ║ Start: 001   ║ │ ║   AUDIT SUMMARY REPORT               ║ │
│ ║ End:   140   ║ │ ╚══════════════════════════════════════╝ │
│ ║ Position: Mid║ │                                          │
│ ║ Max Size: 5  ║ │ 📊 Total:  140                          │
│ ║         ↑MB  ║ │ ✅ Found:  135                          │
│ ╚══════════════╝ │ ❌ Missing: 5                           │
│                  │                                          │
│ [Browse Folder]  │ [Copy]                                   │
│ [Run Audit]      │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

## 🚀 Quick Start

```bash
# Install
npm install

# Run
npm start

# Build portable
npm run build:win-portable
```

## 📖 Features Guide

### MB Input - How It Works

**Old way (v2):**
- Dropdown with fixed options
- Limited to: 1 MB, 3 MB, 5 MB, 10 MB
- Can't set custom values

**New way (v3):**
```
Max File Size (MB)
┌──────────────────┐
│ 5            MB  │ ← Type any number
└──────────────────┘
   ↑             ↑
   Your input    Unit indicator
```

**Examples:**
- Type `1` → Checks for files > 1 MB
- Type `2.5` → Checks for files > 2.5 MB
- Type `10` → Checks for files > 10 MB
- Type `100` → Checks for files > 100 MB
- Leave empty → No limit

**Behind the scenes:**
```javascript
Input: 5
Converts to: 5 * 1024 * 1024 = 5,242,880 bytes
```

### ShadCN Components Used

#### Card
```
╔═══════════════════════════════╗
║ Configuration                 ║  ← Card Title
║ Set your audit parameters     ║  ← Card Description
╠═══════════════════════════════╣
║ [Form content here]           ║  ← Card Content
╚═══════════════════════════════╝
```

#### Button Variants
- **Primary** - Main actions (Run Audit)
- **Secondary** - Supporting actions (Browse)
- **Outline** - Tertiary actions (Copy)

#### Input States
- **Default** - Gray border
- **Focus** - Blue border + ring
- **Success** - Green border (after folder select)
- **Disabled** - Grayed out

### Theme System

Based on ShadCN's HSL token system:

**Dark Theme:**
- Background: `224 71% 4%` (Very dark blue)
- Foreground: `213 31% 91%` (Light blue-white)
- Primary: `210 40% 98%` (Nearly white)
- Border: `216 34% 17%` (Dark gray-blue)

**Light Theme:**
- Background: `0 0% 100%` (Pure white)
- Foreground: `222.2 47.4% 11.2%` (Dark gray)
- Primary: `222.2 47.4% 11.2%` (Dark gray)
- Border: `214.3 31.8% 91.4%` (Light gray)

## 🎨 Design Tokens

```css
--radius: 0.5rem          /* Border radius */
--background: 224 71% 4%  /* Main bg */
--foreground: 213 31% 91% /* Text color */
--primary: 210 40% 98%    /* Accent */
--border: 216 34% 17%     /* Borders */
--input: 216 34% 17%      /* Input bg */
--ring: 216 34% 17%       /* Focus ring */
```

## 📦 Components Reference

### Button
```html
<button class="button button-primary">Primary</button>
<button class="button button-secondary">Secondary</button>
<button class="button button-outline">Outline</button>
<button class="button button-lg">Large</button>
<button class="button button-sm">Small</button>
```

### Input
```html
<input class="input" type="text" placeholder="Text">
<input class="input" type="number" placeholder="Number">
<select class="select">...</select>
<textarea class="textarea">...</textarea>
```

### Checkbox
```html
<label class="checkbox-wrapper">
  <input type="checkbox" class="checkbox">
  <span class="checkbox-label">Label text</span>
</label>
```

### Card
```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
    <p class="card-description">Description</p>
  </div>
  <div class="card-content">
    Content here
  </div>
</div>
```

### Dialog
```html
<div class="dialog-overlay">
  <div class="dialog">
    <div class="dialog-header">...</div>
    <div class="dialog-body">...</div>
    <div class="dialog-footer">...</div>
  </div>
</div>
```

## 🆚 Comparison with v2.0

| Feature | v2.0 | v3.0 |
|---------|------|------|
| **UI Framework** | Custom CSS | ShadCN-inspired |
| **Size Input** | Dropdown (4 options) | Number input (any value) |
| **Color System** | RGB variables | HSL tokens |
| **Components** | Basic | Professional |
| **Focus States** | Simple border | Border + ring |
| **Animations** | Basic | Fade/slide |
| **Typography** | Standard | ShadCN scale |
| **Shadows** | Minimal | Layered |

## 🎯 Best Practices

### MB Input
✅ **Do:**
- Use whole numbers for common sizes (5, 10, 20)
- Use decimals for precise limits (2.5, 7.3)
- Leave empty for no limit

❌ **Don't:**
- Enter negative numbers
- Use non-numeric values
- Rely on old preset dropdowns

### Form Workflow
1. **Configure** - Set rolls and position
2. **Optional** - Set size limit (or leave empty)
3. **Optional** - Add ignore list
4. **Select** - Browse for folder
5. **Run** - Click "Run Audit"

## 🔧 Customization

### Change Theme Colors
Edit `styles.css`:
```css
:root {
  --primary: 210 40% 98%;  /* Change this */
}
```

### Modify Border Radius
```css
:root {
  --radius: 0.5rem;  /* 0 = square, 1rem = rounder */
}
```

### Add Custom Components
Follow ShadCN patterns:
1. Use HSL colors from tokens
2. Add focus rings on interactive elements
3. Use consistent spacing (8px, 16px, 24px)
4. Add transitions (0.15s standard)

## 📚 Resources

- **ShadCN UI**: https://ui.shadcn.com/
- **HSL Colors**: https://www.w3schools.com/colors/colors_hsl.asp
- **Inter Font**: https://rsms.me/inter/

## 🐛 Troubleshooting

### Build Issues
```bash
npm run build:win-portable
```

### MB Input Not Working
- Check you're entering valid numbers
- Decimals are allowed (2.5)
- Empty = no limit

### Theme Not Switching
- Check browser console for errors
- Settings should save automatically

## 📄 License

MIT - Use freely!

---

**Built with ❤️ using ShadCN design principles**
