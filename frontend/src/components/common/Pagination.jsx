import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "./Button.jsx";

export default function Pagination({ page = 1, pages = 1, onPage }) {
  if (pages <= 1) return null;
  return (
    <div className="pagination">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={17} /> Previous</Button>
      <span>Page <strong>{page}</strong> of <strong>{pages}</strong></span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={17} /></Button>
    </div>
  );
}
