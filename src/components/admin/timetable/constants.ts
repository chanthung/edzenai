export const WEEKDAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 7, label: "Sunday", short: "Sun" },
];

export const ROOM_TYPES = [
  { value: "classroom", label: "Classroom" },
  { value: "science_lab", label: "Science Lab" },
  { value: "computer_lab", label: "Computer Lab" },
  { value: "library", label: "Library" },
  { value: "art", label: "Art" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "auditorium", label: "Auditorium" },
  { value: "other", label: "Other" },
];

export const BREAK_TYPES = [
  { value: "short_break", label: "Short Break" },
  { value: "lunch", label: "Lunch" },
  { value: "assembly", label: "Assembly" },
  { value: "prayer", label: "Prayer" },
  { value: "other", label: "Other" },
];

export const DELIVERY_MODES = [
  { value: "theory", label: "Theory" },
  { value: "practical", label: "Practical" },
  { value: "lab", label: "Lab" },
  { value: "activity", label: "Activity" },
  { value: "online", label: "Online" },
];

export const REQUIREMENT_STATUS = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

export const PRIORITIES = [
  { value: 1, label: "High" },
  { value: 2, label: "Normal" },
  { value: 3, label: "Low" },
];

export const labelOf = (list: { value: string; label: string }[], v?: string | null) =>
  list.find((i) => i.value === v)?.label ?? "—";

export const weekdayLabel = (v?: number | null) =>
  WEEKDAYS.find((d) => d.value === v)?.label ?? "All working days";

/** "08:00:00" -> "08:00" */
export const toTimeInput = (t?: string | null) => (t ? t.slice(0, 5) : "");
/** "08:00" -> "08:00:00" */
export const toTimeValue = (t: string) => (t.length === 5 ? `${t}:00` : t);

export const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.slice(0, 5).split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};
