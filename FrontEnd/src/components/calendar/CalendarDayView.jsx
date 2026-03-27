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

const S = {
  container: { overflow: "auto", maxHeight: "700px", border: "1px solid #e5e7eb", borderRadius: "12px" },
  dayHeader: (isToday) => ({
    position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center",
    justifyContent: "center", padding: "1rem", backgroundColor: isToday ? "#f0fdfa" : "white",
    borderBottom: "1px solid #e5e7eb", gap: "0.5rem",
  }),
  dayTitle: (isToday) => ({
    fontSize: "1.1rem", fontWeight: 700, color: isToday ? "#0d9488" : "#1f2937",
  }),
  body: { display: "grid", gridTemplateColumns: "70px 1fr", gap: "0" },
  timeLabel: {
    padding: "4px 8px", textAlign: "right", fontSize: "0.8rem", color: "#9ca3af",
    height: `${SLOT_HEIGHT}px`, borderRight: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6",
    backgroundColor: "white",
  },
  cell: {
    position: "relative", height: `${SLOT_HEIGHT}px`, borderBottom: "1px solid #f3f4f6",
    backgroundColor: "white",
  },
  event: (status) => ({
    position: "absolute", left: "4px", right: "4px", zIndex: 5,
    backgroundColor: STATUS_COLORS[status] || "#6b7280",
    color: "white", borderRadius: "6px", padding: "6px 10px",
    fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "0.75rem",
  }),
};

export const CalendarDayView = ({ currentDate, appointments, onSelectCita }) => {
  const isToday = isSameDay(currentDate, today);
  const key = formatDateKey(currentDate);

  const dayCitas = appointments.filter((apt) => {
    const aKey = typeof apt.date === "string" ? apt.date.split("T")[0] : formatDateKey(new Date(apt.date));
    return aKey === key;
  });

  let dow = currentDate.getDay() - 1;
  if (dow < 0) dow = 6;
  const dayName = DAY_NAMES_LONG[dow];

  const startMinute = 7 * 60;

  return (
    <div style={S.container}>
      {/* Day header */}
      <div style={S.dayHeader(isToday)}>
        <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>{dayName}</span>
        <span style={S.dayTitle(isToday)}>{currentDate.getDate()}</span>
        <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        {isToday && <span style={{ backgroundColor: "#0d9488", color: "white", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600 }}>Hoy</span>}
      </div>

      {/* Time grid */}
      <div style={S.body}>
        {WORK_HOURS.map((slot, slotIdx) => {
          const slotMinute = slot.hour * 60 + slot.half;

          // Encontrar citas que empiezan en este slot
          const slotCitas = dayCitas.filter((c) => {
            const cMin = timeToMinutes(c.time);
            return cMin >= slotMinute && cMin < slotMinute + 30;
          });

          return (
            <div key={slotIdx} style={{ display: "contents" }}>
              <div style={S.timeLabel}>
                {slot.label && <span>{slot.label}</span>}
              </div>
              <div style={S.cell}>
                {slotCitas.map((cita) => {
                  const statusLabels = { scheduled: "Programada", present: "Presente", done: "Atendida", cancelled: "Cancelada" };
                  return (
                    <div
                      key={cita.id}
                      style={{ ...S.event(cita.status), top: "2px", height: `${SLOT_HEIGHT - 6}px` }}
                      title={`${cita.time} - ${cita.patientName}`}
                    >
                      <span>{cita.time}</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cita.patientName}
                      </span>
                      <span style={{ fontSize: "0.7rem", opacity: 0.85, backgroundColor: "rgba(255,255,255,0.2)", padding: "1px 6px", borderRadius: "4px" }}>
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
