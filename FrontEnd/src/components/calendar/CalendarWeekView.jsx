import { getWeekDays, formatDateKey, isSameDay, DAY_NAMES_SHORT, STATUS_COLORS } from "./calendarUtils";

const today = new Date();

const HOURS = [];
for (let h = 7; h <= 18; h++) {
  HOURS.push(h);
}

const SLOT_H = 60;

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

export const CalendarWeekView = ({ currentDate, appointments, selectedDate, onSelectDate }) => {
  const weekDays = getWeekDays(currentDate);

  const byDate = {};
  for (const apt of appointments) {
    const key = typeof apt.date === "string" ? apt.date.split("T")[0] : formatDateKey(new Date(apt.date));
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(apt);
  }

  const startHour = 7;
  const totalHeight = HOURS.length * SLOT_H;

  return (
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        background: "var(--bg-surface)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "64px repeat(7, 1fr)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div style={{ padding: "0.75rem 0.25rem", borderRight: "1px solid var(--border-subtle)" }} />
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
                padding: "0.5rem 0.25rem",
                textAlign: "center",
                cursor: "pointer",
                background: isT
                  ? "var(--brand-soft)"
                  : isSel
                    ? "var(--bg-surface-alt)"
                    : "var(--bg-surface)",
                borderRight: i < 6 ? "1px solid var(--border-subtle)" : "none",
                transition: "background var(--t-fast)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--fg-muted)",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {DAY_NAMES_SHORT[i]}
              </div>
              <div
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-display)",
                  width: "32px",
                  height: "32px",
                  lineHeight: "32px",
                  margin: "2px auto",
                  borderRadius: "50%",
                  background: isT ? "var(--brand)" : "transparent",
                  color: isT ? "var(--fg-on-brand)" : "var(--fg-primary)",
                }}
              >
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ overflow: "auto", maxHeight: "640px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "64px repeat(7, 1fr)",
            position: "relative",
          }}
        >
          <div style={{ borderRight: "1px solid var(--border-subtle)" }}>
            {HOURS.map((h) => (
              <div
                key={h}
                style={{
                  height: `${SLOT_H}px`,
                  padding: "2px 6px 0 0",
                  textAlign: "right",
                  fontSize: "0.72rem",
                  color: "var(--fg-subtle)",
                  fontFamily: "var(--font-mono)",
                  borderBottom: "1px solid var(--border-subtle)",
                  boxSizing: "border-box",
                }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {weekDays.map((day, dayIdx) => {
            const key = formatDateKey(day);
            const dayCitas = byDate[key] || [];
            const isT = isSameDay(day, today);

            return (
              <div
                key={dayIdx}
                onClick={() => onSelectDate(day)}
                style={{
                  position: "relative",
                  height: `${totalHeight}px`,
                  borderRight: dayIdx < 6 ? "1px solid var(--border-subtle)" : "none",
                  background: isT ? "var(--brand-tint)" : "var(--bg-surface)",
                  cursor: "pointer",
                }}
              >
                {HOURS.map((h, idx) => (
                  <div
                    key={h}
                    style={{
                      position: "absolute",
                      top: `${idx * SLOT_H}px`,
                      left: 0,
                      right: 0,
                      height: `${SLOT_H}px`,
                      borderBottom: "1px solid var(--border-subtle)",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: `${SLOT_H / 2}px`,
                        left: 0,
                        right: 0,
                        borderBottom: "1px dashed var(--border-subtle)",
                      }}
                    />
                  </div>
                ))}

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
                        position: "absolute",
                        top: `${topPx}px`,
                        left: "3px",
                        right: "3px",
                        height: `${SLOT_H * 0.45}px`,
                        zIndex: 5,
                        background: STATUS_COLORS[cita.status] || "var(--fg-muted)",
                        color: "#fff",
                        borderRadius: "var(--radius-sm)",
                        padding: "3px 6px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        overflow: "hidden",
                        cursor: "pointer",
                        lineHeight: 1.3,
                        boxShadow: "var(--shadow-xs)",
                      }}
                    >
                      <div style={{ display: "flex", gap: "4px", alignItems: "baseline" }}>
                        <span style={{ fontFamily: "var(--font-mono)" }}>{cita.time}</span>
                        <span
                          style={{
                            fontWeight: 500,
                            opacity: 0.92,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
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
