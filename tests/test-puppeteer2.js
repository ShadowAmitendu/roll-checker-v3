// Test using Puppeteer to scroll and load ALL files from Google Drive
const puppeteer = require("puppeteer");

const folderUrl =
	"https://drive.google.com/drive/folders/1d6g26aSuGvoUVqIesRVv-RmVGqtc-36B?usp=sharing";

async function fetchAllFilesWithPuppeteer() {
	console.log("Launching browser...");

	const browser = await puppeteer.launch({
		headless: "new",
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-web-security",
		],
	});

	try {
		const page = await browser.newPage();

		// Set viewport for proper rendering
		await page.setViewport({ width: 1920, height: 1080 });

		console.log("Navigating to folder...");
		await page.goto(folderUrl, { waitUntil: "networkidle0", timeout: 60000 });

		// Wait for the file list container
		console.log("Waiting for content to load...");
		await new Promise((r) => setTimeout(r, 5000));

		// Find the scrollable container and scroll within it
		console.log("Scrolling to load all files...");

		let previousCount = 0;
		let sameCountTimes = 0;
		const maxScrolls = 100;

		for (let i = 0; i < maxScrolls; i++) {
			// Get current file count by looking for .pdf in the page content
			const fileCount = await page.evaluate(() => {
				const html = document.body.innerHTML;
				const matches = html.match(/\d{11}_[^"<]+\.pdf/gi);
				return matches ? new Set(matches.map((m) => m.toLowerCase())).size : 0;
			});

			console.log(`Scroll ${i + 1}: Found ${fileCount} unique PDF files`);

			if (fileCount === previousCount) {
				sameCountTimes++;
				if (sameCountTimes >= 5) {
					console.log("No new files loaded, stopping scroll");
					break;
				}
			} else {
				sameCountTimes = 0;
			}
			previousCount = fileCount;

			// Try to scroll the main content area
			await page.evaluate(() => {
				// Find all scrollable elements
				const elements = document.querySelectorAll("*");
				for (const el of elements) {
					if (el.scrollHeight > el.clientHeight && el.clientHeight > 200) {
						el.scrollTop = el.scrollHeight;
					}
				}
				// Also scroll window
				window.scrollTo(0, document.body.scrollHeight);
			});

			// Wait for potential new content
			await new Promise((r) => setTimeout(r, 2000));
		}

		// Extract all file names that match our pattern
		console.log("\nExtracting file names from page HTML...");

		const files = await page.evaluate(() => {
			const html = document.body.innerHTML;
			const fileNames = new Set();

			// Match pattern: 11-digit number followed by underscore and name ending in .pdf
			const pattern = /(\d{11}_[^"<>\s]+\.pdf)/gi;
			let match;
			while ((match = pattern.exec(html)) !== null) {
				// Clean up the filename
				let name = match[1];
				// Remove any trailing "Shared" or other text
				name = name.replace(/Shared$/i, "").trim();
				if (name.length > 5 && name.length < 200) {
					fileNames.add(name);
				}
			}

			return Array.from(fileNames);
		});

		console.log(`\n=== TOTAL UNIQUE PDF FILES FOUND: ${files.length} ===\n`);

		// Sort files
		files.sort();

		// Show first 10
		console.log("First 10 files:");
		files.slice(0, 10).forEach((f, i) => console.log(`${i + 1}. ${f}`));

		// Show last 10
		console.log("\nLast 10 files:");
		files
			.slice(-10)
			.forEach((f, i) => console.log(`${files.length - 10 + i + 1}. ${f}`));

		// Extract roll numbers
		const rollNumbers = files
			.map((f) => {
				const match = f.match(/^(\d{11})/);
				return match ? match[1] : null;
			})
			.filter((r) => r);

		const uniqueRolls = [...new Set(rollNumbers)].sort();
		console.log(`\nUnique roll numbers: ${uniqueRolls.length}`);
		if (uniqueRolls.length > 0) {
			console.log(
				"Roll range:",
				uniqueRolls[0],
				"to",
				uniqueRolls[uniqueRolls.length - 1],
			);
		}

		return files;
	} finally {
		await browser.close();
	}
}

fetchAllFilesWithPuppeteer().catch(console.error);
