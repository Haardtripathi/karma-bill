import { ExternalLink, ImageOff, X } from "lucide-react";
import { useState } from "react";
import Button from "./Button.jsx";
import FileUpload from "./FileUpload.jsx";

export default function ImagePreview({ src, alt = "Uploaded image", compact = false, onReplace, onRemove }) {
  const [failed, setFailed] = useState(false);

  if (!src) return null;

  return (
    <div className={`image-preview ${compact ? "image-preview-compact" : ""}`.trim()}>
      <a className="image-preview-frame" href={src} target="_blank" rel="noreferrer" title="Open image">
        {failed ? (
          <span className="image-preview-fallback"><ImageOff size={18} /> Image</span>
        ) : (
          <img className="image-preview-thumb" src={src} alt={alt} onError={() => setFailed(true)} />
        )}
      </a>
      <div className="image-preview-actions">
        <a className="btn btn-secondary btn-sm" href={src} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open</a>
        {onReplace && <FileUpload label="Replace" compact onChange={onReplace} />}
        {onRemove && <Button variant="ghost" className="btn-sm" onClick={onRemove}><X size={15} /> Remove</Button>}
      </div>
    </div>
  );
}
