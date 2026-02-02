// Test script to fetch ALL files from Google Drive folder
const axios = require("axios");

const folderUrl =
	"https://drive.google.com/drive/folders/1d6g26aSuGvoUVqIesRVv-RmVGqtc-36B?usp=sharing";

function extractFolderIdFromUrl(url) {
	const patterns = [/folders\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/];
	for (const pattern of patterns) {
		const match = url.match(pattern);
		if (match && match[1]) {
			return match[1];
		}
	}
	return null;
}

async function fetchAllFiles() {
	const folderId = extractFolderIdFromUrl(folderUrl);
	console.log("Folder ID:", folderId);

	const files = [];
	const seenNames = new Set();

	// Fetch the main folder page
	const url = `https://drive.google.com/drive/folders/${folderId}`;
	console.log("Fetching:", url);

	const response = await axios.get(url, {
		timeout: 30000,
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		},
	});

	const html = response.data;
	console.log("HTML length:", html.length);

	// Decode HTML entities
	let decodedHtml = html
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#39;/g, "'");

	// Save decoded HTML for analysis
	require("fs").writeFileSync("decoded-html.txt", decodedHtml);
	console.log("Saved decoded HTML to decoded-html.txt");

	// Pattern 1: Standard file name pattern
	const fileNamePattern =
		/\["([^"]+\.(pdf|docx?|xlsx?|pptx?|txt|zip|rar|jpg|jpeg|png|gif))"[,\]]/gi;
	let match;

	while ((match = fileNamePattern.exec(decodedHtml)) !== null) {
		const fileName = match[1].trim();
		if (seenNames.has(fileName.toLowerCase())) continue;
		if (
			fileName &&
			fileName.length < 300 &&
			!fileName.includes("/") &&
			!fileName.includes("\\")
		) {
			seenNames.add(fileName.toLowerCase());
			files.push(fileName);
		}
	}
	console.log("\nPattern 1 found:", files.length, "files");

	// Pattern 2: Alternative patterns
	const altPattern = /,"([^"]{3,200}\.(pdf|docx?|xlsx?|pptx?|txt|zip|rar))"/gi;
	while ((match = altPattern.exec(decodedHtml)) !== null) {
		const fileName = match[1].trim();
		if (seenNames.has(fileName.toLowerCase())) continue;
		if (fileName.startsWith("http") || fileName.includes("application/"))
			continue;
		if (fileName && fileName.length > 3 && fileName.length < 300) {
			seenNames.add(fileName.toLowerCase());
			files.push(fileName);
		}
	}
	console.log("After Pattern 2:", files.length, "files");

	// Pattern 3: Look for all PDF file patterns more aggressively
	const pdfPattern = /([0-9]{11}_[A-Za-z_]+\.pdf)/gi;
	while ((match = pdfPattern.exec(decodedHtml)) !== null) {
		const fileName = match[1].trim();
		if (seenNames.has(fileName.toLowerCase())) continue;
		seenNames.add(fileName.toLowerCase());
		files.push(fileName);
	}
	console.log("After Pattern 3 (roll-specific):", files.length, "files");

	// Pattern 4: Generic PDF pattern
	const genericPdfPattern = /"([^"]*\.pdf)"/gi;
	while ((match = genericPdfPattern.exec(decodedHtml)) !== null) {
		const fileName = match[1].trim();
		if (seenNames.has(fileName.toLowerCase())) continue;
		if (fileName.includes("/") || fileName.includes("\\")) continue;
		if (fileName.length > 300 || fileName.length < 5) continue;
		seenNames.add(fileName.toLowerCase());
		files.push(fileName);
	}
	console.log("After Pattern 4 (generic PDF):", files.length, "files");

	console.log("\n=== TOTAL UNIQUE FILES FOUND:", files.length, "===\n");

	// Show first 20 files
	console.log("First 20 files:");
	files.slice(0, 20).forEach((f, i) => console.log(`${i + 1}. ${f}`));

	console.log("\nLast 20 files:");
	files
		.slice(-20)
		.forEach((f, i) => console.log(`${files.length - 20 + i + 1}. ${f}`));

	// Count files with roll numbers
	const rollPattern = /(\d{11})/;
	const filesWithRolls = files.filter((f) => rollPattern.test(f));
	console.log("\nFiles with 11-digit roll numbers:", filesWithRolls.length);
}

fetchAllFiles().catch(console.error);
