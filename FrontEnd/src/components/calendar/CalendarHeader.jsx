import { MONTH_NAMES } from "./calendarUtils";

const segmentedGroup = {
  display: "inline-flex",
  borderRadius: "var(--radius-md)",
  overflow: "hidden",
  border: "1px solid var(--border-default)",
};

const navBtn = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "var(--bg-surface)",
  padding: "0.45rem 0.8rem",
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "var(--fg-secondary)",
  cursor: "pointer",
  transition: "background var(--t-fast), color var(--t-fast)",
};

const viewBtn = (active) => ({
  ...navBtn,
  padding: "0.45rem 1rem",
  background: active ? "var(--brand)" : "var(--bg-surface)",
  color: active ? "var(--fg-on-brand)" : "var(--fg-secondary)",
});

export const CalendarHeader = ({ currentDate, view, onPrev, onNext, onToday, onViewChange }) => {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  let titleText = `${MONTH_NAMES[month]} ${year}`;
  if (view === "day") {
    titleText = `${currentDate.getDate()} ${MONTH_NAMES[month]} ${year}`;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "1rem",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.5rem",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: "var(--fg-primary)",
          margin: 0,
          textTransform: "capitalize",
        }}
      >
        {titleText}
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <div style={segmentedGroup}>
          <button
            type="button"
            onClick={onPrev}
            style={navBtn}
            aria-label="Anterior"
          >
            <i className="ri-arrow-left-s-line" style={{ fontSize: "1.1rem" }}></i>
          </button>
          <button
            type="button"
            onClick={onNext}
            style={{ ...navBtn, borderLeft: "1px solid var(--border-default)" }}
            aria-label="Siguiente"
          >
            <i className="ri-arrow-right-s-line" style={{ fontSize: "1.1rem" }}></i>
          </button>
        </div>

        <button type="button" onClick={onToday} className="btn btn-secondary btn-sm">
          Hoy
        </button>

        <div style={segmentedGroup} role="group" aria-label="Vista del calendario">
          {[
            { k: "month", label: "Mes" },
            { k: "week", label: "Semana" },
            { k: "day", label: "Día" },
          ].map((opt, i) => {
            const active = view === opt.k;
            return (
              <button
                key={opt.k}
                type="button"
                onClick={() => onViewChange(opt.k)}
                aria-pressed={active}
                style={{
                  ...viewBtn(active),
                  borderLeft: i > 0 ? "1px solid var(--border-default)" : "none",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
