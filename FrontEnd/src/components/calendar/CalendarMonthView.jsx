import { getMonthGrid, formatDateKey, isSameDay, DAY_NAMES_SHORT, STATUS_COLORS } from "./calendarUtils";

const today = new Date();

const daysHeader = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "1px",
  borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
  overflow: "hidden",
  border: "1px solid var(--border-subtle)",
  background: "var(--border-subtle)",
};

const dayHeaderCell = {
  background: "var(--bg-surface-alt)",
  padding: "0.6rem",
  textAlign: "center",
  fontSize: "0.72rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--fg-muted)",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "1px",
  borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
  overflow: "hidden",
  border: "1px solid var(--border-subtle)",
  borderTop: "none",
  background: "var(--border-subtle)",
};

const cell = (isCurrentMonth, isToday, isSelected) => ({
  background: isToday
    ? "var(--brand-soft)"
    : isCurrentMonth
      ? "var(--bg-surface)"
      : "var(--bg-surface-alt)",
  padding: "0.5rem",
  minHeight: "108px",
  cursor: "pointer",
  outline: isSelected ? "2px solid var(--brand)" : "none",
  outlineOffset: "-2px",
  transition: "background var(--t-fast)",
});

const dateNum = (isCurrentMonth, isToday) => ({
  textAlign: "right",
  fontSize: "0.85rem",
  fontWeight: isToday ? 700 : 500,
  fontFamily: "var(--font-mono)",
  color: isToday
    ? "var(--brand)"
    : isCurrentMonth
      ? "var(--fg-primary)"
      : "var(--fg-subtle)",
});

const eventDot = (status) => ({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 6px",
  borderRadius: "var(--radius-xs)",
  marginBottom: "2px",
  background: STATUS_COLORS[status] || "var(--fg-muted)",
  color: "#fff",
  fontSize: "0.7rem",
  fontWeight: 600,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  cursor: "pointer",
});

const moreLabel = {
  fontSize: "0.7rem",
  color: "var(--fg-muted)",
  fontWeight: 600,
  paddingLeft: "6px",
};

export const CalendarMonthView = ({ currentDate, appointments, selectedDate, onSelectDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthGrid(year, month);

  const byDate = {};
  for (const apt of appointments) {
    const key = typeof apt.date === "string" ? apt.date.split("T")[0] : formatDateKey(new Date(apt.date));
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(apt);
  }

  return (
    <div>
      <div style={daysHeader}>
        {DAY_NAMES_SHORT.map((name) => (
          <div key={name} style={dayHeaderCell}>{name}</div>
        ))}
      </div>

      <div style={grid}>
        {days.map((day, idx) => {
          const key = formatDateKey(day.date);
          const isToday = isSameDay(day.date, today);
          const isSelected = selectedDate && isSameDay(day.date, selectedDate);
          const dayCitas = byDate[key] || [];
          const visibleCitas = dayCitas.slice(0, 3);
          const remaining = dayCitas.length - 3;

          return (
            <div
              key={idx}
              style={cell(day.currentMonth, isToday, isSelected)}
              onClick={() => onSelectDate(day.date)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelectDate(day.date)}
            >
              <div style={dateNum(day.currentMonth, isToday)}>
                {day.date.getDate()}
              </div>
              <div style={{ marginTop: "4px" }}>
                {visibleCitas.map((cita) => (
                  <div
                    key={cita.id}
                    style={eventDot(cita.status)}
                    title={`${cita.time} - ${cita.patientName}`}
                  >
                    {cita.time} {cita.patientName?.split(" ")[0]}
                  </div>
                ))}
                {remaining > 0 && <div style={moreLabel}>+{remaining} más</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
