import CircularProgress from "@mui/material/CircularProgress";

export default function Loader({ label = "Loading..." }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <CircularProgress size={22} thickness={4} />
      <span>{label}</span>
    </div>
  );
}
