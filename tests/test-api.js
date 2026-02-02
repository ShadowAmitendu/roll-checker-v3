// Test using Google's internal API for fetching all files
const axios = require("axios");
const https = require("https");

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

async function tryExportMethod() {
	const folderId = extractFolderIdFromUrl(folderUrl);
	console.log("Folder ID:", folderId);

	// Try the export method - this sometimes works for public folders
	// Google's export service can sometimes list all files
	const exportUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(name,id)&key=AIzaSyC1s_HM0CW8z0yf7Ap_7GzFbLVb9J7L0gk`;

	console.log("Trying export method...");

	try {
		const response = await axios.get(exportUrl, { timeout: 15000 });
		console.log("Export response:", response.data);
		return;
	} catch (e) {
		console.log("Export method failed:", e.response?.status, e.message);
	}
}

async function tryOpenListMethod() {
	const folderId = extractFolderIdFromUrl(folderUrl);

	// Try to use the openList endpoint which might return all items
	const openUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;

	console.log("\nTrying openList method...");

	// Fetch with special headers
	const response = await axios.get(openUrl, {
		timeout: 30000,
		headers: {
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			Accept:
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.5",
		},
	});

	const html = response.data;

	// Search for data keys and view tokens
	const keyMatch = html.match(/data-key="([^"]+)"/g);
	console.log("Found data keys:", keyMatch?.length || 0);

	// Look for __INITIAL_DATA__ or similar
	const initDataMatch = html.match(/__INITIAL_DATA__\s*=\s*'([^']+)'/);
	if (initDataMatch) {
		console.log("Found INITIAL_DATA");
	}

	// Look for AF_initDataCallback which contains the file data
	const afDataMatches = html.match(
		/AF_initDataCallback\(\{[^}]*data:([^}]+)\}/g,
	);
	console.log("AF_initDataCallback matches:", afDataMatches?.length || 0);

	// Look for the folder data structure
	const folderDataMatch = html.match(/\["[\w-]+",null,\[\[null,\[/);
	if (folderDataMatch) {
		console.log("Found folder data structure at index:", folderDataMatch.index);
	}

	// Find all occurrences of file IDs followed by names
	// Google Drive file IDs are typically 33 characters
	const fileIdPattern = /\["(1[a-zA-Z0-9_-]{32})"/g;
	const fileIds = [];
	let match;
	while ((match = fileIdPattern.exec(html)) !== null) {
		if (!fileIds.includes(match[1])) {
			fileIds.push(match[1]);
		}
	}
	console.log("Unique file IDs found:", fileIds.length);

	// Save a portion around file data for analysis
	const pdfIndices = [];
	let idx = html.indexOf(".pdf");
	while (idx !== -1 && pdfIndices.length < 200) {
		pdfIndices.push(idx);
		idx = html.indexOf(".pdf", idx + 1);
	}
	console.log("PDF occurrences in raw HTML:", pdfIndices.length);

	// Check the DECODED version
	const decoded = html.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

	let pdfCount = 0;
	idx = decoded.indexOf(".pdf");
	while (idx !== -1) {
		pdfCount++;
		idx = decoded.indexOf(".pdf", idx + 1);
	}
	console.log("PDF occurrences in decoded HTML:", pdfCount);
}

async function main() {
	await tryExportMethod();
	await tryOpenListMethod();
}

main().catch(console.error);
