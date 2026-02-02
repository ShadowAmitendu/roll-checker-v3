// Test using Puppeteer to scroll and load ALL files from Google Drive
const puppeteer = require("puppeteer");

const folderUrl =
	"https://drive.google.com/drive/folders/1d6g26aSuGvoUVqIesRVv-RmVGqtc-36B?usp=sharing";

async function fetchAllFilesWithPuppeteer() {
	console.log("Launching browser...");

	const browser = await puppeteer.launch({
		headless: "new",
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {
		const page = await browser.newPage();

		// Set viewport for proper rendering
		await page.setViewport({ width: 1920, height: 1080 });

		console.log("Navigating to folder...");
		await page.goto(folderUrl, { waitUntil: "networkidle2", timeout: 60000 });

		// Wait for the file list to load
		await page.waitForSelector("[data-id]", { timeout: 30000 }).catch(() => {
			console.log("Waiting for file list selector...");
		});

		// Give initial page time to render
		await new Promise((r) => setTimeout(r, 3000));

		// Scroll to load all files
		console.log("Scrolling to load all files...");

		let previousCount = 0;
		let sameCountTimes = 0;
		const maxScrolls = 50;

		for (let i = 0; i < maxScrolls; i++) {
			// Get current file count
			const fileCount = await page.evaluate(() => {
				const items = document.querySelectorAll("[data-id]");
				return items.length;
			});

			console.log(`Scroll ${i + 1}: Found ${fileCount} items`);

			if (fileCount === previousCount) {
				sameCountTimes++;
				if (sameCountTimes >= 3) {
					console.log("No new files loaded, stopping scroll");
					break;
				}
			} else {
				sameCountTimes = 0;
			}
			previousCount = fileCount;

			// Scroll down
			await page.evaluate(() => {
				const scrollContainer =
					document.querySelector('[role="main"]') || document.body;
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
				window.scrollTo(0, document.body.scrollHeight);
			});

			// Wait for new items to load
			await new Promise((r) => setTimeout(r, 1500));
		}

		// Now extract all file names
		console.log("\nExtracting file names...");

		const files = await page.evaluate(() => {
			const fileNames = [];

			// Try multiple selectors for file names
			// Selector 1: data-tooltip attributes
			document.querySelectorAll("[data-tooltip]").forEach((el) => {
				const name = el.getAttribute("data-tooltip");
				if (
					name &&
					(name.endsWith(".pdf") ||
						name.endsWith(".docx") ||
						name.endsWith(".doc"))
				) {
					fileNames.push(name);
				}
			});

			// Selector 2: aria-label on file items
			document.querySelectorAll("[aria-label]").forEach((el) => {
				const label = el.getAttribute("aria-label");
				if (label && (label.endsWith(".pdf") || label.endsWith(".docx"))) {
					fileNames.push(label);
				}
			});

			// Selector 3: Text content that looks like file names
			document.querySelectorAll("[data-id] div").forEach((el) => {
				const text = el.textContent?.trim();
				if (
					text &&
					text.includes(".pdf") &&
					!text.includes(" ") &&
					text.length < 200
				) {
					fileNames.push(text);
				}
			});

			// Remove duplicates
			return [...new Set(fileNames)];
		});

		console.log(`\n=== TOTAL FILES FOUND: ${files.length} ===\n`);

		// Show first 10
		console.log("First 10 files:");
		files.slice(0, 10).forEach((f, i) => console.log(`${i + 1}. ${f}`));

		// Show last 10
		console.log("\nLast 10 files:");
		files
			.slice(-10)
			.forEach((f, i) => console.log(`${files.length - 10 + i + 1}. ${f}`));

		// Extract roll numbers
		const rollPattern = /(\d{11})/;
		const filesWithRolls = files.filter((f) => rollPattern.test(f));
		console.log(`\nFiles with 11-digit roll numbers: ${filesWithRolls.length}`);

		// Get unique roll numbers
		const rollNumbers = filesWithRolls
			.map((f) => {
				const match = f.match(/(\d{11})/);
				return match ? match[1] : null;
			})
			.filter((r) => r);

		const uniqueRolls = [...new Set(rollNumbers)].sort();
		console.log(`Unique roll numbers: ${uniqueRolls.length}`);
		console.log(
			"Roll range:",
			uniqueRolls[0],
			"to",
			uniqueRolls[uniqueRolls.length - 1],
		);

		return files;
	} finally {
		await browser.close();
	}
}

fetchAllFilesWithPuppeteer().catch(console.error);
