import InputBase from "@mui/material/InputBase";
import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search" }) {
  return (
    <label className="search-bar">
      <Search size={18} />
      <InputBase
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputProps={{ "aria-label": placeholder }}
      />
      {value && (
        <button type="button" className="search-clear" aria-label="Clear search" onClick={() => onChange("")}>
          <X size={15} />
        </button>
      )}
    </label>
  );
}
