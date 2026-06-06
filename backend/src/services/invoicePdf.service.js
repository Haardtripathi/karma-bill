const invoiceTemplate = require("../templates/invoiceTemplate");
const { uploadRaw } = require("./cloudinary.service");
const fs = require("fs");

const chromeExecutableCandidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium"
].filter(Boolean);

const getChromeExecutablePath = () => chromeExecutableCandidates.find((candidate) => fs.existsSync(candidate));

const minimalPdf = (text) => {
  const safeText = String(text || "Invoice").replace(/[()\\]/g, " ");
  const body = `BT /F1 16 Tf 50 760 Td (${safeText}) Tj ET`;
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${body.length} >> stream
${body}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000259 00000 n 
0000000358 00000 n 
trailer << /Root 1 0 R /Size 6 >>
startxref
428
%%EOF`;
  return Buffer.from(pdf);
};

const generatePdfBuffer = async (invoice, company) => {
  const html = invoiceTemplate({ invoice, company });

  if (process.env.NODE_ENV === "test") {
    return minimalPdf(`${invoice.invoiceCode} ${invoice.customer?.name || ""}`);
  }

  let browser;
  try {
    const puppeteer = require("puppeteer");
    const executablePath = getChromeExecutablePath();
    browser = await puppeteer.launch({
      headless: "new",
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" } });
    return Buffer.from(pdf);
  } catch (error) {
    error.message = `PDF generation failed: ${error.message}`;
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

const generateAndUploadInvoicePdf = async (invoice, company) => {
  const buffer = await generatePdfBuffer(invoice, company);
  const filename = `${invoice.invoiceCode}.pdf`;
  const uploaded = await uploadRaw(buffer, "invoices", filename);
  return { buffer, ...uploaded };
};

module.exports = {
  generatePdfBuffer,
  generateAndUploadInvoicePdf
};
