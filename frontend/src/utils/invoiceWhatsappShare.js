import { Capacitor, registerPlugin } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { invoicePdfUrl } from "../api/invoiceApi.js";
import { closeWhatsappPlaceholder, redirectWhatsappWindow } from "./whatsappWindow.js";

const WhatsAppShare = registerPlugin("WhatsAppShare");

const getWhatsappPhone = (whatsappUrl) => {
  try {
    const url = new URL(whatsappUrl);
    return url.pathname.replace(/\D/g, "");
  } catch (error) {
    return "";
  }
};

const getWhatsappText = (whatsappUrl) => {
  try {
    const url = new URL(whatsappUrl);
    return url.searchParams.get("text") || "";
  } catch (error) {
    return "";
  }
};

const sanitizeFilePart = (value) => {
  const safe = String(value || "")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe || "Invoice";
};

const getInvoiceFileName = (invoice) => {
  const code = sanitizeFilePart(invoice?.invoiceCode);
  return code === "Invoice" ? "Invoice.pdf" : `Invoice_${code}.pdf`;
};

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Failed to read invoice PDF"));
  reader.onloadend = () => {
    const result = String(reader.result || "");
    resolve(result.includes(",") ? result.split(",").pop() : result);
  };
  reader.readAsDataURL(blob);
});

const fetchInvoicePdfBlob = async (invoiceId) => {
  const pdfResponse = await fetch(invoicePdfUrl(invoiceId));
  if (!pdfResponse.ok) {
    throw new Error("Failed to fetch invoice PDF");
  }
  return pdfResponse.blob();
};

const shareNativeInvoicePdf = async ({ invoiceId, invoice, text, phone }) => {
  const blob = await fetchInvoicePdfBlob(invoiceId);
  const base64 = await blobToBase64(blob);
  const fileName = getInvoiceFileName(invoice);
  const savedFile = await Filesystem.writeFile({
    path: `whatsapp/${fileName}`,
    data: base64,
    directory: Directory.Cache,
    recursive: true
  });

  const canShare = await Share.canShare().catch(() => ({ value: true }));
  if (canShare?.value === false) {
    throw new Error("Sharing is not available on this device");
  }

  try {
    await WhatsAppShare.share({
      phone,
      text,
      fileUrl: savedFile.uri,
      mimeType: "application/pdf"
    });
    return;
  } catch (error) {
    console.warn("Direct WhatsApp share failed; falling back to Android share sheet", error);
  }

  await Share.share({
    title: fileName,
    text,
    files: [savedFile.uri],
    dialogTitle: "Share invoice"
  });
};

const shareWebInvoicePdf = async ({ invoiceId, invoice, text }) => {
  if (!navigator.share) return false;

  const blob = await fetchInvoicePdfBlob(invoiceId);
  const fileName = getInvoiceFileName(invoice);
  const file = new File([blob], fileName, { type: "application/pdf" });

  if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
    return false;
  }

  await navigator.share({
    title: fileName,
    text,
    files: [file]
  });
  return true;
};

export const shareInvoiceWhatsappResult = async ({ result, invoiceId, invoice, popup }) => {
  if (!(result?.mode === "link" && result?.whatsappUrl)) {
    closeWhatsappPlaceholder(popup);
    return { action: "sent" };
  }

  const text = getWhatsappText(result.whatsappUrl);
  const phone = getWhatsappPhone(result.whatsappUrl);

  if (Capacitor.isNativePlatform()) {
    closeWhatsappPlaceholder(popup);
    await shareNativeInvoicePdf({ invoiceId, invoice, text, phone });
    return { action: "shared" };
  }

  try {
    const shared = await shareWebInvoicePdf({ invoiceId, invoice, text });
    if (shared) {
      closeWhatsappPlaceholder(popup);
      return { action: "shared" };
    }
  } catch (error) {
    if (error?.name === "AbortError" || error?.message?.includes("AbortError")) {
      closeWhatsappPlaceholder(popup);
      return { action: "cancelled" };
    }
    console.error("Invoice PDF share failed", error);
  }

  redirectWhatsappWindow(popup, result.whatsappUrl);
  return { action: "opened" };
};
