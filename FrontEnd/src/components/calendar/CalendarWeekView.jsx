import { getWeekDays, formatDateKey, isSameDay, DAY_NAMES_SHORT, STATUS_COLORS } from "./calendarUtils";

const today = new Date();

const HOURS = [];
for (let h = 7; h <= 18; h++) {
  HOURS.push(h);
}

const SLOT_H = 60; // px per hour

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

export const CalendarWeekView = ({ currentDate, appointments, selectedDate, onSelectDate }) => {
  const weekDays = getWeekDays(currentDate);

  // Group by date
  const byDate = {};
  for (const apt of appointments) {
    const key = typeof apt.date === "string" ? apt.date.split("T")[0] : formatDateKey(new Date(apt.date));
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(apt);
  }

  const startHour = 7;
  const totalHeight = HOURS.length * SLOT_H;

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden" }}>
      {/* Sticky day headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "64px repeat(7, 1fr)",
        position: "sticky", top: 0, zIndex: 10, backgroundColor: "white",
        borderBottom: "2px solid #e5e7eb",
      }}>
        <div style={{ padding: "0.75rem 0.25rem", borderRight: "1px solid #e5e7eb" }} />
        {weekDays.map((day, i) => {
          const isT = isSameDay(day, today);
          const isSel = selectedDate && isSameDay(day, selectedDate);
          return (
            <div
              key={i}
              onClick={() => onSelectDate(day)}
              role="button"
              tabIndex={0}
              style={{
                padding: "0.5rem 0.25rem", textAlign: "center", cursor: "pointer",
                backgroundColor: isT ? "#f0fdfa" : isSel ? "#f8fafc" : "white",
                borderRight: i < 6 ? "1px solid #f3f4f6" : "none",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 500 }}>{DAY_NAMES_SHORT[i]}</div>
              <div style={{
                fontSize: "1.15rem", fontWeight: 700,
                color: isT ? "#0d9488" : "#1f2937",
                width: "32px", height: "32px", lineHeight: "32px", margin: "2px auto",
                borderRadius: "50%",
                backgroundColor: isT ? "#0d9488" : "transparent",
                ...(isT ? { color: "white" } : {}),
              }}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div style={{ overflow: "auto", maxHeight: "640px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "64px repeat(7, 1fr)", position: "relative" }}>
          {/* Time labels column */}
          <div style={{ borderRight: "1px solid #e5e7eb" }}>
            {HOURS.map((h) => (
              <div key={h} style={{
                height: `${SLOT_H}px`, padding: "2px 6px 0 0", textAlign: "right",
                fontSize: "0.75rem", color: "#9ca3af", borderBottom: "1px solid #f3f4f6",
                boxSizing: "border-box",
              }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 7 day columns */}
          {weekDays.map((day, dayIdx) => {
            const key = formatDateKey(day);
            const dayCitas = byDate[key] || [];
            const isT = isSameDay(day, today);

            return (
              <div
                key={dayIdx}
                onClick={() => onSelectDate(day)}
                style={{
                  position: "relative", height: `${totalHeight}px`,
                  borderRight: dayIdx < 6 ? "1px solid #f3f4f6" : "none",
                  backgroundColor: isT ? "#fafffe" : "white",
                  cursor: "pointer",
                }}
              >
                {/* Hour grid lines */}
                {HOURS.map((h, idx) => (
                  <div key={h} style={{
                    position: "absolute", top: `${idx * SLOT_H}px`, left: 0, right: 0,
                    height: `${SLOT_H}px`, borderBottom: "1px solid #f3f4f6",
                    boxSizing: "border-box",
                  }}>
                    {/* Half-hour dashed line */}
                    <div style={{
                      position: "absolute", top: `${SLOT_H / 2}px`, left: 0, right: 0,
                      borderBottom: "1px dashed #f3f4f6",
                    }} />
                  </div>
                ))}

                {/* Citas */}
                {dayCitas.map((cita) => {
                  const mins = timeToMinutes(cita.time);
                  const topPx = ((mins - startHour * 60) / 60) * SLOT_H;
                  if (topPx < 0 || topPx >= totalHeight) return null;

                  return (
                    <div
                      key={cita.id}
                      onClick={(e) => { e.stopPropagation(); onSelectDate(day); }}
                      title={`${cita.time} - ${cita.patientName} - ${cita.reason || ""}`}
                      style={{
                        position: "absolute", top: `${topPx}px`, left: "2px", right: "2px",
                        height: `${SLOT_H * 0.45}px`, zIndex: 5,
                        backgroundColor: STATUS_COLORS[cita.status] || "#6b7280",
                        color: "white", borderRadius: "4px", padding: "3px 6px",
                        fontSize: "0.7rem", fontWeight: 600, overflow: "hidden",
                        cursor: "pointer", lineHeight: "1.3",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                      }}
                    >
                      <div style={{ display: "flex", gap: "4px", alignItems: "baseline" }}>
                        <span>{cita.time}</span>
                        <span style={{ fontWeight: 400, opacity: 0.9, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {cita.patientName?.split(" ").slice(0, 2).join(" ")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
