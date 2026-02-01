// Quick script to generate a base64 data URI icon for Electron
const fs = require("fs");
const path = require("path");

// Read SVG
const svgPath = path.join(__dirname, "../src/assets/icon.svg");
const svgContent = fs.readFileSync(svgPath, "utf8");

// For now, we'll create a simple fallback using nativeImage
console.log("Icon conversion script ready.");
console.log("SVG icon exists at:", svgPath);

// On Windows, Electron prefers .ico files
// We'll create a simple HTML file to help convert SVG to PNG manually
const htmlConverter = `<!DOCTYPE html>
<html>
<head>
    <title>Icon Converter</title>
    <style>
        body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: system-ui;
            background: #f5f5f5;
        }
        canvas {
            border: 2px solid #333;
            margin: 20px;
        }
        button {
            padding: 12px 24px;
            font-size: 16px;
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
        }
        button:hover {
            background: #4f46e5;
        }
    </style>
</head>
<body>
    <h1>Icon Converter</h1>
    <canvas id="canvas" width="256" height="256"></canvas>
    <button onclick="downloadPNG()">Download as PNG</button>

    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const svgContent = \`${svgContent}\`;

        const img = new Image();
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        img.onload = function() {
            ctx.drawImage(img, 0, 0, 256, 256);
            URL.revokeObjectURL(url);
        };
        img.src = url;

        function downloadPNG() {
            canvas.toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'icon.png';
                a.click();
                URL.revokeObjectURL(url);
            });
        }
    </script>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "icon-converter.html"), htmlConverter);
console.log(
	"Created icon-converter.html - open this file in a browser to generate icon.png",
);
