export const openWhatsappPlaceholder = () => {
  const popup = window.open("", "_blank");
  if (!popup) return null;

  try {
    popup.opener = null;
    popup.document.title = "Opening WhatsApp";
    popup.document.body.innerHTML = `
      <main style="font-family: system-ui, sans-serif; padding: 32px; color: #0f172a;">
        <h1 style="font-size: 20px; margin: 0 0 8px;">Opening WhatsApp</h1>
        <p style="margin: 0; color: #475569;">Preparing your message, please wait…</p>
      </main>
    `;
  } catch (error) {
    // Some browsers restrict writing to a newly opened tab. Redirect still works.
  }

  return popup;
};

export const redirectWhatsappWindow = (popup, url) => {
  if (popup && !popup.closed) {
    popup.location.href = url;
    return;
  }
  // Fallback if popup was blocked or closed
  window.open(url, "_blank");
};

export const closeWhatsappPlaceholder = (popup) => {
  if (popup && !popup.closed) {
    popup.close();
  }
};
