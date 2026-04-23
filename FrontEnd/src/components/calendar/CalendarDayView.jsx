import { formatDateKey, isSameDay, DAY_NAMES_LONG, MONTH_NAMES, STATUS_COLORS } from "./calendarUtils";

const today = new Date();

const WORK_HOURS = [];
for (let h = 7; h <= 18; h++) {
  WORK_HOURS.push({ label: `${String(h).padStart(2, "0")}:00`, hour: h, half: 0 });
  WORK_HOURS.push({ label: "", hour: h, half: 30 });
}

const SLOT_HEIGHT = 48;

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

const containerStyle = {
  overflow: "auto",
  maxHeight: "700px",
  border: "1px solid var(--border-subtle)",
  borderRadius: "var(--radius-lg)",
  background: "var(--bg-surface)",
};

const dayHeader = (isToday) => ({
  position: "sticky",
  top: 0,
  zIndex: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  background: isToday ? "var(--brand-soft)" : "var(--bg-surface)",
  borderBottom: "1px solid var(--border-default)",
  gap: "0.6rem",
});

const dayTitle = (isToday) => ({
  fontSize: "1.2rem",
  fontWeight: 700,
  fontFamily: "var(--font-display)",
  letterSpacing: "-0.02em",
  color: isToday ? "var(--brand)" : "var(--fg-primary)",
});

const bodyStyle = { display: "grid", gridTemplateColumns: "74px 1fr", gap: 0 };

const timeLabel = {
  padding: "4px 10px",
  textAlign: "right",
  fontSize: "0.72rem",
  color: "var(--fg-subtle)",
  fontFamily: "var(--font-mono)",
  height: `${SLOT_HEIGHT}px`,
  borderRight: "1px solid var(--border-subtle)",
  borderBottom: "1px solid var(--border-subtle)",
  background: "var(--bg-surface)",
  boxSizing: "border-box",
};

const cellStyle = {
  position: "relative",
  height: `${SLOT_HEIGHT}px`,
  borderBottom: "1px solid var(--border-subtle)",
  background: "var(--bg-surface)",
};

const eventStyle = (status) => ({
  position: "absolute",
  left: "6px",
  right: "6px",
  zIndex: 5,
  background: STATUS_COLORS[status] || "var(--fg-muted)",
  color: "#fff",
  borderRadius: "var(--radius-sm)",
  padding: "6px 10px",
  fontSize: "0.85rem",
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "var(--shadow-sm)",
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
});

export const CalendarDayView = ({ currentDate, appointments }) => {
  const isToday = isSameDay(currentDate, today);
  const key = formatDateKey(currentDate);

  const dayCitas = appointments.filter((apt) => {
    const aKey = typeof apt.date === "string" ? apt.date.split("T")[0] : formatDateKey(new Date(apt.date));
    return aKey === key;
  });

  let dow = currentDate.getDay() - 1;
  if (dow < 0) dow = 6;
  const dayName = DAY_NAMES_LONG[dow];

  return (
    <div style={containerStyle}>
      <div style={dayHeader(isToday)}>
        <span style={{ color: "var(--fg-muted)", fontSize: "0.9rem", textTransform: "capitalize" }}>
          {dayName}
        </span>
        <span style={dayTitle(isToday)}>{currentDate.getDate()}</span>
        <span style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        {isToday && <span className="badge badge-brand">Hoy</span>}
      </div>

      <div style={bodyStyle}>
        {WORK_HOURS.map((slot, slotIdx) => {
          const slotMinute = slot.hour * 60 + slot.half;
          const slotCitas = dayCitas.filter((c) => {
            const cMin = timeToMinutes(c.time);
            return cMin >= slotMinute && cMin < slotMinute + 30;
          });

          return (
            <div key={slotIdx} style={{ display: "contents" }}>
              <div style={timeLabel}>
                {slot.label && <span>{slot.label}</span>}
              </div>
              <div style={cellStyle}>
                {slotCitas.map((cita) => {
                  const statusLabels = {
                    scheduled: "Programada",
                    present: "Presente",
                    done: "Atendida",
                    cancelled: "Cancelada",
                  };
                  return (
                    <div
                      key={cita.id}
                      style={{ ...eventStyle(cita.status), top: "2px", height: `${SLOT_HEIGHT - 6}px` }}
                      title={`${cita.time} - ${cita.patientName}`}
                    >
                      <span style={{ fontFamily: "var(--font-mono)" }}>{cita.time}</span>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cita.patientName}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          opacity: 0.92,
                          background: "rgba(255,255,255,0.22)",
                          padding: "1px 8px",
                          borderRadius: "var(--radius-full)",
                          fontWeight: 500,
                        }}
                      >
                        {statusLabels[cita.status] || cita.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
