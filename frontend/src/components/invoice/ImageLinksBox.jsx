export default function ImageLinksBox({ lineItems = [] }) {
  const images = lineItems.filter((item) => item.imageUrl);
  if (!images.length) return null;
  return (
    <div className="image-links-box">
      <strong>Image Links</strong>
      {images.map((item, index) => (
        <a key={`${item.imageUrl}-${index}`} href={item.imageUrl} target="_blank" rel="noreferrer">
          {item.itemName || `Image ${index + 1}`}: View Image
        </a>
      ))}
    </div>
  );
}
