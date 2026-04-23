import { useState } from "react";
import { formatDateTime, getStatusBadge } from "../../lib/utils";
import { getClinicalHistoryViewModel } from "./clinicalHistoryViewModel";

const S = {
  wrapper: { display: "flex", flexDirection: "column", gap: "1rem" },
  intro: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    padding: "0.9rem 1rem",
    background: "var(--brand-soft)",
    border: "1px solid var(--brand-soft)",
    borderRadius: "var(--radius-lg)",
    flexWrap: "wrap",
  },
  introTitle: {
    margin: 0,
    color: "var(--brand)",
    fontSize: "1rem",
    fontWeight: 700,
    fontFamily: "var(--font-display)",
    letterSpacing: "-0.01em",
  },
  introText: {
    margin: "0.25rem 0 0",
    color: "var(--fg-secondary)",
    fontSize: "0.9rem",
  },
  controlsWrap: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.5rem",
  },
  empty: {
    textAlign: "center",
    color: "var(--fg-muted)",
    padding: "2.5rem 1.25rem",
    background: "var(--bg-surface-alt)",
    border: "1px dashed var(--border-default)",
    borderRadius: "var(--radius-lg)",
  },
  emptyIcon: {
    width: "3.2rem",
    height: "3.2rem",
    borderRadius: "var(--radius-full)",
    margin: "0 auto 1rem",
    background: "var(--brand-tint)",
    color: "var(--brand)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.4rem",
    border: "1px solid var(--brand-soft)",
  },
  emptyTitle: {
    display: "block",
    marginBottom: "0.55rem",
    color: "var(--fg-primary)",
    fontSize: "1rem",
    fontWeight: 700,
  },
  emptyText: {
    margin: 0,
    color: "var(--fg-muted)",
    fontSize: "0.92rem",
    lineHeight: 1.5,
  },
  timeline: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    paddingLeft: "1.4rem",
  },
  line: {
    position: "absolute",
    top: "0.3rem",
    bottom: "0.3rem",
    left: "0.35rem",
    width: "2px",
    background: "var(--brand-soft)",
  },
  card: {
    position: "relative",
    background: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-sm)",
    overflow: "hidden",
  },
  summaryHeader: {
    padding: "1rem 1rem 1rem 1.15rem",
    cursor: "pointer",
    userSelect: "none",
    transition: "background-color var(--t-fast) var(--ease-smooth)",
  },
  dot: {
    position: "absolute",
    left: "-1.35rem",
    top: "1.2rem",
    width: "0.9rem",
    height: "0.9rem",
    borderRadius: "var(--radius-full)",
    background: "var(--brand)",
    border: "3px solid var(--brand-soft)",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.75rem",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: "0.5rem",
  },
  date: {
    color: "var(--brand)",
    fontSize: "0.95rem",
    fontWeight: 700,
    margin: 0,
    fontFamily: "var(--font-display)",
    letterSpacing: "-0.01em",
  },
  doctor: {
    color: "var(--fg-muted)",
    fontSize: "0.85rem",
    margin: "0.2rem 0 0",
  },
  reasonText: {
    margin: "0.5rem 0 0.25rem",
    color: "var(--fg-primary)",
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  diagnosisSummary: {
    margin: 0,
    color: "var(--fg-muted)",
    fontSize: "0.85rem",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  chevronWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: "0.5rem",
    color: "var(--fg-subtle)",
    fontSize: "1.2rem",
  },
  expandedBody: {
    padding: "0 1rem 1.25rem 1.15rem",
    borderTop: "1px dashed var(--border-subtle)",
    marginTop: "0.5rem",
    paddingTop: "1rem",
  },
  sectionLabel: {
    display: "block",
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "var(--fg-muted)",
    textTransform: "uppercase",
    marginBottom: "0.35rem",
    letterSpacing: "0.1em",
  },
  diagnosisFull: {
    margin: 0,
    padding: "0.9rem",
    background: "var(--accent-ochre-soft)",
    border: "1px solid var(--accent-ochre-soft)",
    borderRadius: "var(--radius-md)",
    color: "var(--accent-ochre)",
    lineHeight: 1.5,
    fontSize: "0.9rem",
  },
  coverageGrid: {
    marginTop: "1rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "0.85rem",
  },
  coverageCard: {
    margin: 0,
    padding: "0.8rem",
    background: "var(--accent-slate-soft)",
    border: "1px solid var(--accent-slate-soft)",
    borderRadius: "var(--radius-md)",
    color: "var(--accent-slate)",
    fontSize: "0.88rem",
    lineHeight: 1.5,
  },
  clinicalGrid: {
    marginTop: "1rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "0.85rem",
  },
  clinicalNote: {
    margin: 0,
    padding: "0.8rem",
    background: "var(--bg-surface-alt)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    color: "var(--fg-secondary)",
    fontSize: "0.88rem",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
  },
  medsWrap: {
    marginTop: "1rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "0.85rem",
  },
  medCard: {
    background: "var(--bg-surface-alt)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-md)",
    padding: "0.85rem",
  },
  medName: {
    margin: 0,
    color: "var(--fg-primary)",
    fontWeight: 700,
    fontSize: "0.95rem",
  },
  medMeta: {
    margin: "0.4rem 0 0",
    color: "var(--fg-secondary)",
    fontSize: "0.84rem",
    lineHeight: 1.5,
  },
  noMeds: {
    marginTop: "1rem",
    padding: "0.9rem",
    borderRadius: "var(--radius-md)",
    background: "var(--bg-surface-alt)",
    color: "var(--fg-muted)",
    border: "1px dashed var(--border-default)",
    fontSize: "0.9rem",
  },
  loading: {
    textAlign: "center",
    color: "var(--fg-muted)",
    padding: "2rem",
  },
  error: {
    textAlign: "center",
    color: "var(--accent-coral)",
    padding: "1.25rem",
    background: "var(--accent-coral-soft)",
    border: "1px solid var(--accent-coral)",
    borderRadius: "var(--radius-md)",
  },
};

export const ClinicalHistoryTimeline = ({ history, isLoading, isError = false }) => {
  const viewModel = getClinicalHistoryViewModel(history);
  const items = viewModel.items;

  const [expandedItems, setExpandedItems] = useState(new Set());

  const formatMoney = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "No registrado";
    }
    return `$${Number(value).toFixed(2)}`;
  };

  const toggleItem = (id) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allIds = items.map((item) => item.consultationId);
    setExpandedItems(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  if (isLoading) return <p style={S.loading}>Cargando historial clínico…</p>;
  if (isError) return <div style={S.error}>No se pudo cargar el historial clínico.</div>;

  return (
    <div style={S.wrapper}>
      <div style={S.intro}>
        <div>
          <h3 style={S.introTitle}>Historial clínico</h3>
          <p style={S.introText}>Consultas previas en los últimos {viewModel.rangeYears} años.</p>
        </div>
        <span className="badge badge-brand">Solo lectura</span>
      </div>

      {!viewModel.isEmpty && items.length > 1 && (
        <div style={S.controlsWrap}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={collapseAll}>
            Contraer todos
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={expandAll}>
            Expandir todos
          </button>
        </div>
      )}

      {viewModel.isEmpty ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}><i className="ri-file-history-line" /></div>
          <strong style={S.emptyTitle}>Aún no hay historial clínico.</strong>
          <p style={S.emptyText}>
            {viewModel.message || "Aquí podrás ver los diagnósticos y recetas de consultas previas."}
          </p>
        </div>
      ) : (
        <div style={S.timeline}>
          <div style={S.line} />
          {items.map((item) => {
            const isExpanded = expandedItems.has(item.consultationId);
            const statusBadge = getStatusBadge(item.status);

            return (
              <article key={item.consultationId} style={S.card}>
                <span style={S.dot} />

                <div
                  style={S.summaryHeader}
                  onClick={() => toggleItem(item.consultationId)}
                  title="Haz clic para expandir o contraer detalles"
                >
                  <div style={S.headerRow}>
                    <div>
                      <p style={S.date}>{formatDateTime(item.consultationDate)}</p>
                      <p style={S.doctor}>Médico: {item.doctorName}</p>
                    </div>
                    {item.status && (
                      <span
                        className="badge"
                        style={{ background: statusBadge.bg, color: statusBadge.color, border: "none" }}
                      >
                        {statusBadge.label}
                      </span>
                    )}
                  </div>

                  {item.reason && <p style={S.reasonText}>Motivo: {item.reason}</p>}

                  {!isExpanded && item.diagnosis && (
                    <p style={S.diagnosisSummary}>Dx: {item.diagnosis}</p>
                  )}

                  <div style={S.chevronWrap}>
                    <i className={isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
                  </div>
                </div>

                {isExpanded && (
                  <div style={S.expandedBody}>
                    <div style={{ marginBottom: "1rem" }}>
                      <span style={S.sectionLabel}>Diagnóstico</span>
                      <p style={S.diagnosisFull}>{item.diagnosis}</p>
                    </div>

                    <div style={S.coverageGrid}>
                      <div>
                        <span style={S.sectionLabel}>Atención</span>
                        <p style={S.coverageCard}>
                          {item.coverageType === "insurance" ? "Aseguradora" : "Particular"}
                        </p>
                      </div>
                      {item.coverageType === "insurance" && (
                        <>
                          <div>
                            <span style={S.sectionLabel}>Aseguradora</span>
                            <p style={S.coverageCard}>{item.insurerName || "N/D"}</p>
                          </div>
                          <div>
                            <span style={S.sectionLabel}>Monto cubierto</span>
                            <p style={S.coverageCard}>{formatMoney(item.agreedAmount)}</p>
                          </div>
                        </>
                      )}
                    </div>

                    {(item.observations || item.anamnesis || item.physicalExam || item.labResults) && (
                      <div style={S.clinicalGrid}>
                        {item.observations && (
                          <div>
                            <span style={S.sectionLabel}>Notas / Tratamiento</span>
                            <p style={S.clinicalNote}>{item.observations}</p>
                          </div>
                        )}
                        {item.anamnesis && (
                          <div>
                            <span style={S.sectionLabel}>Anamnesis</span>
                            <p style={S.clinicalNote}>{item.anamnesis}</p>
                          </div>
                        )}
                        {item.physicalExam && (
                          <div>
                            <span style={S.sectionLabel}>Examen físico</span>
                            <p style={S.clinicalNote}>{item.physicalExam}</p>
                          </div>
                        )}
                        {item.labResults && (
                          <div>
                            <span style={S.sectionLabel}>Laboratorio</span>
                            <p style={S.clinicalNote}>{item.labResults}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: "1rem" }}>
                      <span style={S.sectionLabel}>Medicamentos recetados</span>
                      {item.medications?.length ? (
                        <div style={S.medsWrap}>
                          {item.medications.map((med) => (
                            <div key={med.id} style={S.medCard}>
                              <p style={S.medName}>
                                {med.name} {med.concentration} {med.concentrationUnit}
                              </p>
                              <p style={S.medMeta}>
                                Dosis: {med.dose || "N/A"} {med.doseUnit || ""}
                              </p>
                              <p style={S.medMeta}>
                                Vía: {med.route} | Frecuencia: {med.frequency}
                              </p>
                              <p style={S.medMeta}>Duración: {med.duration}</p>
                              {med.additionalInstructions && (
                                <p style={S.medMeta}>Nota: {med.additionalInstructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={S.noMeds}>No se recetaron medicamentos.</div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
