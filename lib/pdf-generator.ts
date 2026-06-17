import 'server-only';
import puppeteer from 'puppeteer-core';
import chrome from '@sparticuz/chromium';

/**
 * Generates a PDF from an HTML string.
 * @param htmlContent The HTML content to render.
 * @returns A Buffer containing the generated PDF.
 */
export async function generatePdf(htmlContent: string): Promise<Buffer> {
  const executablePath = await chrome.executablePath().catch(() => "");
  if (!executablePath) {
    throw new Error("Chromium executable not found");
  }

  const browser = await puppeteer.launch({
    args: chrome.args,
    executablePath,
    headless: chrome.headless,
  });

  try {
    const page = await browser.newPage();
    // Use a wide viewport so layout (padding/borders) matches print
    await page.setViewport({ width: 1200, height: 1680, deviceScaleFactor: 2 });
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    // ensure print background and zero margins (we control gutter inside HTML)
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
