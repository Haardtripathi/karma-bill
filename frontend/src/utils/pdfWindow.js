export const openPdfPlaceholder = () => {
  const popup = window.open("", "_blank");
  if (!popup) return null;

  try {
    popup.opener = null;
    popup.document.title = "Preparing PDF";
    popup.document.body.innerHTML = `
      <main style="font-family: system-ui, sans-serif; padding: 32px; color: #0f172a;">
        <h1 style="font-size: 20px; margin: 0 0 8px;">Preparing PDF</h1>
        <p style="margin: 0; color: #475569;">Your invoice PDF will open in a moment.</p>
      </main>
    `;
  } catch (error) {
    // Some browsers can restrict writing to a newly opened tab. Redirect still works.
  }

  return popup;
};

export const showPdfUrl = (popup, url) => {
  if (popup && !popup.closed) {
    popup.location.href = url;
    return;
  }

  window.location.assign(url);
};

export const closePdfPlaceholder = (popup) => {
  if (popup && !popup.closed) {
    popup.close();
  }
};

export const openPdfUrl = (url) => {
  const popup = window.open(url, "_blank");
  if (popup) {
    try {
      popup.opener = null;
    } catch (error) {
      // The PDF still opens even if the browser blocks opener changes.
    }
    return popup;
  }

  window.location.assign(url);
  return null;
};
