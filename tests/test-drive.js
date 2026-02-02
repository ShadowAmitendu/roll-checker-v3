const axios = require("axios");

const folderId = "1d6g26aSuGvoUVqIesRVv-RmVGqtc-36B";

async function testFetch() {
	console.log("Testing folder ID:", folderId);

	// Test Method 1: embeddedfolderview
	console.log("\n--- Method 1: embeddedfolderview ---");
	try {
		const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
		console.log("URL:", embedUrl);
		const response = await axios.get(embedUrl, {
			timeout: 15000,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
		});
		console.log("Status:", response.status);
		console.log("Length:", response.data.length);

		// Save HTML for inspection
		require("fs").writeFileSync("embed-response.html", response.data);
		console.log("Saved to embed-response.html");

		// Look for file patterns
		const html = response.data;

		// Check for common indicators
		console.log('Contains "flip-entry":', html.includes("flip-entry"));
		console.log('Contains "data-id":', html.includes("data-id"));
		console.log('Contains ".pdf":', html.includes(".pdf"));
		console.log(
			'Contains "You need access":',
			html.includes("You need access"),
		);
	} catch (err) {
		console.log("Error:", err.message);
	}

	// Test Method 2: Regular folder page
	console.log("\n--- Method 2: Regular folder page ---");
	try {
		const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
		console.log("URL:", folderUrl);
		const response = await axios.get(folderUrl, {
			timeout: 15000,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			},
		});
		console.log("Status:", response.status);
		console.log("Length:", response.data.length);

		// Save HTML for inspection
		require("fs").writeFileSync("folder-response.html", response.data);
		console.log("Saved to folder-response.html");

		const html = response.data;
		console.log('Contains ".pdf":', html.includes(".pdf"));
		console.log(
			'Contains "You need access":',
			html.includes("You need access"),
		);

		// Try to find file names
		const pdfMatches = html.match(/[^"\/\\]+\.pdf/gi);
		if (pdfMatches) {
			console.log("PDF matches found:", [...new Set(pdfMatches)].slice(0, 10));
		}
	} catch (err) {
		console.log("Error:", err.message);
	}
}

testFetch();
