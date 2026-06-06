import { ExternalLink, ImageOff, X } from "lucide-react";
import { useState } from "react";
import Button from "./Button.jsx";
import FileUpload from "./FileUpload.jsx";

export default function ImagePreview({ src, alt = "Uploaded image", compact = false, onReplace, onRemove }) {
  const [failed, setFailed] = useState(false);

  if (!src) return null;

  if (compact) {
    return (
      <div className="image-preview-compact-row">
        <a className="image-preview-thumb-link" href={src} target="_blank" rel="noreferrer" title="Open image">
          {failed ? (
            <ImageOff size={16} className="text-muted" />
          ) : (
            <img className="image-preview-thumb-small" src={src} alt={alt} onError={() => setFailed(true)} />
          )}
        </a>
        <div className="image-preview-actions-compact">
          {onReplace && <FileUpload compact onChange={onReplace} />}
          {onRemove && (
            <Button variant="ghost" className="btn-icon btn-sm text-danger" onClick={onRemove} title="Remove image">
              <X size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  }

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
