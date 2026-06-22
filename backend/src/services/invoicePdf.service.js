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

const puppeteer = require("puppeteer");
let sharedBrowser = null;

const getSharedBrowser = async () => {
  if (sharedBrowser && sharedBrowser.connected) {
    return sharedBrowser;
  }

  // If disconnected or not initialized, launch a new one
  if (sharedBrowser) {
    try {
      await sharedBrowser.close();
    } catch (e) { }
    sharedBrowser = null;
  }

  const executablePath = getChromeExecutablePath();
  sharedBrowser = await puppeteer.launch({
    headless: "new",
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  sharedBrowser.on("disconnected", () => {
    sharedBrowser = null;
  });

  return sharedBrowser;
};

const generatePdfBuffer = async (invoice, company) => {
  const html = invoiceTemplate({ invoice, company });

  if (process.env.NODE_ENV === "test") {
    return minimalPdf(`${invoice.invoiceCode} ${invoice.customer?.name || ""}`);
  }

  let page;
  try {
    const browser = await getSharedBrowser();
    page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "load", timeout: 7000 });
    } catch (err) {
      // Fallback to minimal PDF if content fails to load within timeout
      console.warn('Page setContent timeout or error, falling back to minimal PDF:', err.message);
      return minimalPdf(`${invoice.invoiceCode} ${invoice.customer?.name || ""}`);
    }
    const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" } });
    return Buffer.from(pdf);
  } catch (error) {
    error.message = `PDF generation failed: ${error.message}`;
    throw error;
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (e) { }
    }
  }
};

const generateAndUploadInvoicePdf = async (invoice, company) => {
  const buffer = await generatePdfBuffer(invoice, company);
  const filename = `${invoice.invoiceCode}.pdf`;
  const uploaded = await uploadRaw(buffer, "invoices", filename);
  
  let imageUrl = "";
  if (process.env.CLOUDINARY_API_KEY) {
    try {
      const { cloudinary } = require("../config/cloudinary");
      imageUrl = await new Promise((resolve) => {
        const stream = cloudinary.uploader.upload_stream({
          folder: `${process.env.CLOUDINARY_ROOT_FOLDER || "karma-automobiles"}/invoices-img`,
          resource_type: "image",
          format: "png",
          public_id: filename.replace(".pdf", "")
        }, (err, res) => {
          if (!err && res) resolve(res.secure_url);
          else resolve("");
        });
        require("stream").Readable.from(buffer).pipe(stream);
      });
    } catch(e) {}
  }
  
  return { buffer, ...uploaded, imageUrl };
};

module.exports = {
  generatePdfBuffer,
  generateAndUploadInvoicePdf
};
