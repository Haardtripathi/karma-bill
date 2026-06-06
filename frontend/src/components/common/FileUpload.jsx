import { Camera, Images } from "lucide-react";

export default function FileUpload({ label = "Upload image", onChange, className = "", compact = false }) {
  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (file) onChange(file);
    event.target.value = "";
  };

  return (
    <div className={`file-upload-group ${compact ? "file-upload-group-compact" : ""} ${className}`.trim()} aria-label={label}>
      <label className={`file-upload ${compact ? "file-upload-compact" : ""}`.trim()} title={compact ? "Upload from gallery" : label}>
        <Images size={18} />
        {!compact && <span>{label}</span>}
        <input type="file" accept="image/*" onChange={handleFile} />
      </label>
      <label className={`file-upload file-upload-camera ${compact ? "file-upload-compact" : ""}`.trim()} title={compact ? "Take a photo" : "Camera"}>
        <Camera size={18} />
        {!compact && <span>Camera</span>}
        <input type="file" accept="image/*" capture="environment" onChange={handleFile} />
      </label>
    </div>
  );
}
