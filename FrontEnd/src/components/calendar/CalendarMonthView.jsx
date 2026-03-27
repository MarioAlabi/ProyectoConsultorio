import { getMonthGrid, formatDateKey, isSameDay, DAY_NAMES_SHORT, STATUS_COLORS } from "./calendarUtils";

const today = new Date();

const S = {
  daysHeader: {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px",
    borderRadius: "12px 12px 0 0", overflow: "hidden", border: "1px solid #e5e7eb",
    backgroundColor: "#e5e7eb",
  },
  dayHeaderCell: {
    backgroundColor: "white", padding: "0.6rem", textAlign: "center",
    fontSize: "0.85rem", fontWeight: 600, color: "#6b7280",
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px",
    borderRadius: "0 0 12px 12px", overflow: "hidden",
    border: "1px solid #e5e7eb", borderTop: "none", backgroundColor: "#e5e7eb",
  },
  cell: (isCurrentMonth, isToday, isSelected) => ({
    backgroundColor: isToday ? "#f0fdfa" : isCurrentMonth ? "white" : "#f9fafb",
    padding: "0.5rem", minHeight: "100px", cursor: "pointer",
    outline: isSelected ? "2px solid #0d9488" : "none",
    outlineOffset: "-2px",
    transition: "background-color 0.15s",
  }),
  dateNum: (isCurrentMonth, isToday) => ({
    textAlign: "right", fontSize: "0.85rem",
    fontWeight: isToday ? 700 : 500,
    color: isToday ? "#0d9488" : isCurrentMonth ? "#374151" : "#9ca3af",
  }),
  eventDot: (status) => ({
    display: "flex", alignItems: "center", gap: "4px",
    padding: "2px 6px", borderRadius: "4px", marginBottom: "2px",
    backgroundColor: STATUS_COLORS[status] || "#6b7280",
    color: "white", fontSize: "0.7rem", fontWeight: 600,
    overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
    cursor: "pointer",
  }),
  moreLabel: {
    fontSize: "0.7rem", color: "#6b7280", fontWeight: 600, paddingLeft: "6px",
  },
};

export const CalendarMonthView = ({ currentDate, appointments, selectedDate, onSelectDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthGrid(year, month);

  // Agrupar citas por dateKey
  const byDate = {};
  for (const apt of appointments) {
    const key = typeof apt.date === "string" ? apt.date.split("T")[0] : formatDateKey(new Date(apt.date));
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(apt);
  }

  return (
    <div>
      {/* Header dias de la semana */}
      <div style={S.daysHeader}>
        {DAY_NAMES_SHORT.map((name) => (
          <div key={name} style={S.dayHeaderCell}>{name}</div>
        ))}
      </div>

      {/* Grilla */}
      <div style={S.grid}>
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
              style={S.cell(day.currentMonth, isToday, isSelected)}
              onClick={() => onSelectDate(day.date)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelectDate(day.date)}
            >
              <div style={S.dateNum(day.currentMonth, isToday)}>
                {day.date.getDate()}
              </div>
              <div style={{ marginTop: "4px" }}>
                {visibleCitas.map((cita) => (
                  <div key={cita.id} style={S.eventDot(cita.status)} title={`${cita.time} - ${cita.patientName}`}>
                    {cita.time} {cita.patientName?.split(" ")[0]}
                  </div>
                ))}
                {remaining > 0 && (
                  <div style={S.moreLabel}>+{remaining} mas</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
