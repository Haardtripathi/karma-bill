import { Capacitor, registerPlugin } from "@capacitor/core";
import { Directory, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { invoicePdfUrl } from "../api/invoiceApi.js";
import { closeWhatsappPlaceholder, redirectWhatsappWindow } from "./whatsappWindow.js";

const WhatsAppShare = registerPlugin("WhatsAppShare");
const DEFAULT_COUNTRY_CODE = "91";
const SHARE_ATTACHMENT_OPTIONS = new Set(["auto", "pdf", "image"]);

const getShareAttachmentMode = () => {
  const mode = String(import.meta.env.VITE_WHATSAPP_SHARE_ATTACHMENT || "auto").trim().toLowerCase();
  return SHARE_ATTACHMENT_OPTIONS.has(mode) ? mode : "auto";
};

const WHATSAPP_SHARE_ATTACHMENT = getShareAttachmentMode();

export const getWhatsappShareSuccessMessage = ({ attachmentType, copiedText } = {}) => {
  const label = String(attachmentType || "").toLowerCase().startsWith("image/") ? "image" : "PDF";
  return copiedText ? `Invoice ${label} shared; message copied` : `Invoice ${label} shared`;
};

const normalizeWhatsappPhoneDigits = (phone) => {
  let value = String(phone || "").trim();
  if (value.toLowerCase().startsWith("whatsapp:")) {
    value = value.replace(/^whatsapp:/i, "");
  }

  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `${DEFAULT_COUNTRY_CODE}${digits}`;
  if (digits.startsWith(DEFAULT_COUNTRY_CODE) && digits.length === 12) return digits;
  return digits.length > 10 ? digits : "";
};

const getWhatsappPhone = (whatsappUrl) => {
  try {
    const url = new URL(whatsappUrl);
    const pathPhone = url.hostname.toLowerCase() === "wa.me" ? url.pathname.replace(/\D/g, "") : "";
    const queryPhone = url.searchParams.get("phone") || "";
    return normalizeWhatsappPhoneDigits(pathPhone || queryPhone);
  } catch (error) {
    return "";
  }
};

const getInvoicePhone = (invoice) => normalizeWhatsappPhoneDigits(invoice?.customer?.phone);

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

const getInvoiceImageFileName = (invoice) => getInvoiceFileName(invoice).replace(/\.pdf$/i, ".png");

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error("Failed to read invoice attachment"));
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

const fetchInvoiceImageBlob = async (invoice) => {
  if (!invoice?.pdfImageUrl) return null;

  const imageResponse = await fetch(invoice.pdfImageUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch invoice image");
  }
  return imageResponse.blob();
};

const getPdfAttachment = async ({ invoiceId, invoice }) => {
  const pdfBlob = await fetchInvoicePdfBlob(invoiceId);
  return {
    blob: pdfBlob,
    fileName: getInvoiceFileName(invoice),
    mimeType: "application/pdf"
  };
};

const getImageAttachment = async (invoice) => {
  const imageBlob = await fetchInvoiceImageBlob(invoice);
  if (!imageBlob) {
    throw new Error("Invoice image attachment is unavailable");
  }

  return {
    blob: imageBlob,
    fileName: getInvoiceImageFileName(invoice),
    mimeType: imageBlob.type || "image/png"
  };
};

const getInvoiceAttachment = async ({ invoiceId, invoice }) => {
  if (WHATSAPP_SHARE_ATTACHMENT === "pdf") {
    return getPdfAttachment({ invoiceId, invoice });
  }

  if (WHATSAPP_SHARE_ATTACHMENT === "image") {
    return getImageAttachment(invoice);
  }

  try {
    return await getPdfAttachment({ invoiceId, invoice });
  } catch (error) {
    console.warn("Invoice PDF share failed; falling back to image", error);
  }

  return getImageAttachment(invoice);
};

const shareNativeInvoiceAttachment = async ({ invoiceId, invoice, text, phone }) => {
  const { blob, fileName, mimeType } = await getInvoiceAttachment({ invoiceId, invoice });
  const base64 = await blobToBase64(blob);
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
    const result = await WhatsAppShare.share({
      phone,
      text,
      fileUrl: savedFile.uri,
      mimeType
    });
    return {
      attachmentType: mimeType,
      copiedText: Boolean(result?.copiedText)
    };
  } catch (error) {
    console.warn("Direct WhatsApp share failed; falling back to Android share sheet", error);
  }

  await Share.share({
    title: fileName,
    text,
    files: [savedFile.uri],
    dialogTitle: "Share invoice"
  });
  return {
    attachmentType: mimeType,
    copiedText: false
  };
};

const shareWebInvoiceAttachment = async ({ invoiceId, invoice, text }) => {
  if (!navigator.share) return false;

  const { blob, fileName, mimeType } = await getInvoiceAttachment({ invoiceId, invoice });
  const file = new File([blob], fileName, { type: mimeType });

  if (!navigator.canShare || !navigator.canShare({ files: [file] })) {
    return false;
  }

  await navigator.share({
    title: fileName,
    text,
    files: [file]
  });
  return { attachmentType: mimeType };
};

export const shareInvoiceWhatsappResult = async ({ result, invoiceId, invoice, popup }) => {
  if (!(result?.mode === "link" && result?.whatsappUrl)) {
    closeWhatsappPlaceholder(popup);
    return { action: "sent" };
  }

  const text = getWhatsappText(result.whatsappUrl);
  const shareInvoice = result.invoice || invoice;
  const phone = getWhatsappPhone(result.whatsappUrl) || getInvoicePhone(shareInvoice) || getInvoicePhone(invoice);

  if (Capacitor.isNativePlatform()) {
    closeWhatsappPlaceholder(popup);
    const nativeResult = await shareNativeInvoiceAttachment({ invoiceId, invoice: shareInvoice, text, phone });
    return { action: "shared", ...nativeResult };
  }

  try {
    const shared = await shareWebInvoiceAttachment({ invoiceId, invoice: shareInvoice, text });
    if (shared) {
      closeWhatsappPlaceholder(popup);
      return { action: "shared", ...shared };
    }
  } catch (error) {
    if (error?.name === "AbortError" || error?.message?.includes("AbortError")) {
      closeWhatsappPlaceholder(popup);
      return { action: "cancelled" };
    }
    console.error("Invoice attachment share failed", error);
  }

  redirectWhatsappWindow(popup, result.whatsappUrl);
  return { action: "opened" };
};
