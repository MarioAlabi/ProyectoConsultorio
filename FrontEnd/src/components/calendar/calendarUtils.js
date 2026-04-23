/**
 * Obtiene los dias del mes para la grilla del calendario (incluye dias del mes anterior/siguiente).
 * Lunes = primer dia de la semana.
 */
export function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Lunes=0 ... Domingo=6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days = [];

  // Dias del mes anterior
  const prevMonth = new Date(year, month, 0);
  for (let i = startDow - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonth.getDate() - i),
      currentMonth: false,
    });
  }

  // Dias del mes actual
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), currentMonth: true });
  }

  // Dias del mes siguiente (completar hasta 42 = 6 filas)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), currentMonth: false });
  }

  return days;
}

/**
 * Obtiene los dias de la semana que contiene la fecha dada.
 * Lunes como primer dia.
 */
export function getWeekDays(date) {
  const d = new Date(date);
  let dow = d.getDay() - 1;
  if (dow < 0) dow = 6;
  const monday = new Date(d);
  monday.setDate(d.getDate() - dow);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  return days;
}

export function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSameDay(a, b) {
  return formatDateKey(a) === formatDateKey(b);
}

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const DAY_NAMES_SHORT = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
export const DAY_NAMES_LONG = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

export const STATUS_COLORS = {
  scheduled: "var(--accent-slate)",
  present: "var(--accent-forest)",
  done: "var(--fg-muted)",
  cancelled: "var(--accent-coral)",
};

/**
 * Agrupa citas por dateKey.
 */
export function groupByDate(appointments) {
  const map = {};
  for (const apt of appointments) {
    const key = typeof apt.date === "string" ? apt.date.split("T")[0] : formatDateKey(new Date(apt.date));
    if (!map[key]) map[key] = [];
    map[key].push(apt);
  }
  return map;
}

/**
 * Horas del dia para la vista de semana/dia (07:00 - 19:00 para consultorio).
 */
export function getWorkingHours() {
  const hours = [];
  for (let h = 7; h <= 18; h++) {
    hours.push(`${String(h).padStart(2, "0")}:00`);
    hours.push(`${String(h).padStart(2, "0")}:30`);
  }
  return hours;
}
