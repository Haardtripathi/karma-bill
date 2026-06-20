import Input from "../common/Input.jsx";

export const defaultTimeParts = { hour: "12", minute: "00", period: "PM" };

const pad = (value) => String(value).padStart(2, "0");

const toTwentyFourHour = (timeValue = defaultTimeParts) => {
  const hour = Math.min(Math.max(Number(timeValue.hour || defaultTimeParts.hour), 1), 12);
  const minute = Math.min(Math.max(Number(timeValue.minute || defaultTimeParts.minute), 0), 59);
  const period = timeValue.period === "AM" ? "AM" : "PM";
  return { hour: pad((hour % 12) + (period === "PM" ? 12 : 0)), minute: pad(minute) };
};

const toTimeParts = (hour24Value, minuteValue) => {
  const hour24 = Math.min(Math.max(Number(hour24Value || 0), 0), 23);
  return {
    hour: String(hour24 % 12 || 12),
    minute: pad(Math.min(Math.max(Number(minuteValue || 0), 0), 59)),
    period: hour24 >= 12 ? "PM" : "AM"
  };
};

const formatTimeLabel = (timeValue) => {
  const normalized = { ...defaultTimeParts, ...timeValue };
  return pad(normalized.hour) + ":" + pad(normalized.minute) + " " + normalized.period;
};

export default function DateTimeFields({ dateLabel, dateValue, timeValue = defaultTimeParts, onDateChange, onTimeChange }) {
  const time24 = toTwentyFourHour(timeValue);
  const value = dateValue ? dateValue + "T" + time24.hour + ":" + time24.minute : "";

  const handleChange = (event) => {
    const nextValue = event.target.value || "";
    if (!nextValue) {
      onDateChange("");
      onTimeChange(defaultTimeParts);
      return;
    }

    const [datePart, timePart = ""] = nextValue.split("T");
    const [hourPart = "12", minutePart = "00"] = timePart.split(":");
    onDateChange(datePart || "");
    onTimeChange(toTimeParts(hourPart, minutePart));
  };

  return (
    <Input
      className="date-time-field"
      label={dateLabel}
      type="datetime-local"
      value={value}
      helperText={dateValue ? "Selected " + formatTimeLabel(timeValue) : ""}
      onChange={handleChange}
      inputProps={{ step: 60 }}
    />
  );
}
