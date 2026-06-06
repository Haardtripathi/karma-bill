import { FileSearch } from "lucide-react";

export default function EmptyState({ title = "No records found", action }) {
  return (
    <div className="empty-state">
      <FileSearch size={24} />
      <strong>{title}</strong>
      {action}
    </div>
  );
}
