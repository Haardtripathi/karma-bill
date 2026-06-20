import { useMemo, useState } from "react";
import Popover from "@mui/material/Popover";
import Divider from "@mui/material/Divider";
import { CalendarDays, RotateCcw } from "lucide-react";
import Button from "./Button.jsx";
import Input from "./Input.jsx";
import { toInputDate } from "../../utils/date.js";

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
const startOfYear = (date) => new Date(date.getFullYear(), 0, 1);

const getFinancialYearStart = (date) => {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return new Date(year, 3, 1);
};

const formatShortDate = (value) => {
  if (!value) return "";
  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const makeQuickRanges = () => {
  const today = new Date();
  const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  return [
    { key: "today", label: "Today", startDate: toInputDate(today), endDate: toInputDate(today) },
    { key: "yesterday", label: "Yesterday", startDate: toInputDate(addDays(today, -1)), endDate: toInputDate(addDays(today, -1)) },
    { key: "this-month", label: "Current month", startDate: toInputDate(startOfMonth(today)), endDate: toInputDate(today) },
    { key: "last-month", label: "Last month", startDate: toInputDate(startOfMonth(previousMonthDate)), endDate: toInputDate(endOfMonth(previousMonthDate)) },
    { key: "last-7", label: "Last 7 days", startDate: toInputDate(addDays(today, -6)), endDate: toInputDate(today) },
    { key: "last-30", label: "Last 30 days", startDate: toInputDate(addDays(today, -29)), endDate: toInputDate(today) },
    { key: "this-year", label: "Current year", startDate: toInputDate(startOfYear(today)), endDate: toInputDate(today) },
    { key: "fy", label: "This financial year", startDate: toInputDate(getFinancialYearStart(today)), endDate: toInputDate(today) },
    { key: "all", label: "All time", startDate: "", endDate: "" }
  ];
};

export const getDateRangeLabel = (startDate, endDate) => {
  if (!startDate && !endDate) return "All time";
  if (startDate && endDate && startDate === endDate) return formatShortDate(startDate);
  if (startDate && endDate) return formatShortDate(startDate) + " - " + formatShortDate(endDate);
  if (startDate) return "From " + formatShortDate(startDate);
  return "Until " + formatShortDate(endDate);
};

export default function DateRangeFilter({ startDate = "", endDate = "", onChange, label = "Date range", compact = false }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const open = Boolean(anchorEl);
  const quickRanges = useMemo(makeQuickRanges, []);
  const activeLabel = getDateRangeLabel(startDate, endDate);

  const openPicker = (event) => {
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setAnchorEl(event.currentTarget);
  };

  const closePicker = () => setAnchorEl(null);

  const applyRange = (nextStartDate = draftStartDate, nextEndDate = draftEndDate) => {
    onChange({ startDate: nextStartDate || "", endDate: nextEndDate || "" });
    closePicker();
  };

  const clearRange = () => {
    setDraftStartDate("");
    setDraftEndDate("");
    onChange({ startDate: "", endDate: "" });
    closePicker();
  };

  return (
    <div className={compact ? "date-range-filter date-range-filter-compact" : "date-range-filter"}>
      <Button variant="secondary" className="date-range-trigger" onClick={openPicker}>
        <CalendarDays size={16} />
        <span>{label}</span>
        <strong>{activeLabel}</strong>
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={closePicker}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { className: "date-range-popover" } }}
      >
        <div className="date-range-panel">
          <div className="date-range-panel-head">
            <div>
              <h3>{label}</h3>
              <p>{activeLabel}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearRange}><RotateCcw size={14} /> Reset</Button>
          </div>
          <div className="quick-filter-grid">
            {quickRanges.map((range) => (
              <button
                key={range.key}
                type="button"
                className={range.startDate === startDate && range.endDate === endDate ? "quick-filter active" : "quick-filter"}
                onClick={() => {
                  setDraftStartDate(range.startDate);
                  setDraftEndDate(range.endDate);
                  applyRange(range.startDate, range.endDate);
                }}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Divider />
          <div className="custom-range-grid">
            <Input label="Start date" type="date" value={draftStartDate} onChange={(event) => setDraftStartDate(event.target.value)} />
            <Input label="End date" type="date" value={draftEndDate} onChange={(event) => setDraftEndDate(event.target.value)} />
          </div>
          <div className="date-range-actions">
            <Button variant="secondary" onClick={closePicker}>Cancel</Button>
            <Button onClick={() => applyRange()}>Apply range</Button>
          </div>
        </div>
      </Popover>
    </div>
  );
}
