const axios = require("axios");

const folderId = "1d6g26aSuGvoUVqIesRVv-RmVGqtc-36B";

async function testParsing() {
	const url = `https://drive.google.com/drive/folders/${folderId}`;

	console.log("Fetching folder...");
	const response = await axios.get(url, {
		timeout: 20000,
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
		},
	});

	console.log("Response received, length:", response.data.length);

	// Decode HTML entities
	let html = response.data
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");

	const files = [];
	const seenNames = new Set();

	// Pattern to find file names
	const pattern = /\["([^"]+\.(pdf|docx?|xlsx?|pptx?|txt|zip))"[,\]]/gi;
	let match;

	while ((match = pattern.exec(html)) !== null) {
		const fileName = match[1].trim();
		if (
			!seenNames.has(fileName.toLowerCase()) &&
			fileName.length < 300 &&
			!fileName.includes("/")
		) {
			seenNames.add(fileName.toLowerCase());
			files.push(fileName);
		}
	}

	console.log("\nFound", files.length, "files");
	console.log("\nFirst 15 files:");
	files.slice(0, 15).forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}

testParsing().catch((e) => console.log("Error:", e.message));
