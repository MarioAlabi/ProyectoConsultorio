import { MONTH_NAMES } from "./calendarUtils";

const S = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" },
  title: { fontSize: "1.5rem", fontWeight: 800, color: "#1f2937", margin: 0 },
  controls: { display: "flex", alignItems: "center", gap: "0.5rem" },
  navGroup: { display: "inline-flex" },
  navBtn: (pos) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    border: "1px solid #e5e7eb", backgroundColor: "white", padding: "0.5rem 0.75rem",
    fontSize: "0.875rem", fontWeight: 600, color: "#1f2937", cursor: "pointer",
    borderRadius: pos === "left" ? "8px 0 0 8px" : pos === "right" ? "0 8px 8px 0" : "0",
    marginLeft: pos !== "left" ? "-1px" : "0",
  }),
  todayBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", padding: "0.5rem 0.75rem",
    fontSize: "0.875rem", fontWeight: 600, color: "#1f2937", cursor: "pointer", borderRadius: "8px",
  },
  viewBtn: (active) => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    border: "1px solid #e5e7eb", padding: "0.5rem 0.75rem",
    fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
    backgroundColor: active ? "#f0fdfa" : "white",
    color: active ? "#0d9488" : "#1f2937",
    borderColor: active ? "#0d9488" : "#e5e7eb",
  }),
};

export const CalendarHeader = ({ currentDate, view, onPrev, onNext, onToday, onViewChange }) => {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  let titleText = `${MONTH_NAMES[month]} ${year}`;
  if (view === "day") {
    titleText = `${currentDate.getDate()} ${MONTH_NAMES[month]} ${year}`;
  }

  return (
    <div style={S.header}>
      <h2 style={S.title}>{titleText}</h2>
      <div style={S.controls}>
        <div style={S.navGroup}>
          <button type="button" onClick={onPrev} style={S.navBtn("left")} aria-label="Anterior">
            <i className="ri-arrow-left-s-line" style={{ fontSize: "1.2rem" }}></i>
          </button>
          <button type="button" onClick={onNext} style={S.navBtn("right")} aria-label="Siguiente">
            <i className="ri-arrow-right-s-line" style={{ fontSize: "1.2rem" }}></i>
          </button>
        </div>
        <button type="button" onClick={onToday} style={S.todayBtn}>Hoy</button>
        <div style={S.navGroup}>
          <button type="button" onClick={() => onViewChange("month")} style={{ ...S.viewBtn(view === "month"), borderRadius: "8px 0 0 8px" }}>Mes</button>
          <button type="button" onClick={() => onViewChange("week")} style={{ ...S.viewBtn(view === "week"), marginLeft: "-1px" }}>Semana</button>
          <button type="button" onClick={() => onViewChange("day")} style={{ ...S.viewBtn(view === "day"), borderRadius: "0 8px 8px 0", marginLeft: "-1px" }}>Dia</button>
        </div>
      </div>
    </div>
  );
};
