require("dotenv").config({ path: ".env" });
const { cloudinary } = require("./src/config/cloudinary");

async function run() {
  const minimalPdf = `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n4 0 obj << /Length 45 >> stream\nBT /F1 16 Tf 50 760 Td (Test PDF to PNG) Tj ET\nendstream endobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000259 00000 n \n0000000358 00000 n \ntrailer << /Root 1 0 R /Size 6 >>\nstartxref\n428\n%%EOF`;
  const buffer = Buffer.from(minimalPdf);
  
  try {
    const stream = cloudinary.uploader.upload_stream({
      folder: "karma-automobiles/test",
      resource_type: "image",
      format: "png",
      public_id: "test_invoice"
    }, (error, result) => {
      if (error) console.error("Error:", error);
      else console.log("Success URL:", result.secure_url);
    });
    const { Readable } = require("stream");
    Readable.from(buffer).pipe(stream);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
