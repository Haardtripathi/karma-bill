import Input from "../common/Input.jsx";
import Select from "../common/Select.jsx";

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

export const defaultTimeParts = { hour: "12", minute: "00", period: "PM" };

export default function DateTimeFields({ labelPrefix, dateLabel, dateValue, timeValue = defaultTimeParts, onDateChange, onTimeChange }) {
  const updateTime = (patch) => onTimeChange({ ...defaultTimeParts, ...timeValue, ...patch });

  return (
    <>
      <Input label={dateLabel} type="date" value={dateValue || ""} onChange={(event) => onDateChange(event.target.value)} />
      <Select label={labelPrefix + " hour"} value={timeValue.hour || defaultTimeParts.hour} onChange={(event) => updateTime({ hour: event.target.value })}>
        {HOURS.map((hour) => <option key={hour} value={hour}>{hour.padStart(2, "0")}</option>)}
      </Select>
      <Select label={labelPrefix + " minute"} value={timeValue.minute || defaultTimeParts.minute} onChange={(event) => updateTime({ minute: event.target.value })}>
        {MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
      </Select>
      <Select label={labelPrefix + " AM/PM"} value={timeValue.period || defaultTimeParts.period} onChange={(event) => updateTime({ period: event.target.value })}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </Select>
    </>
  );
}
