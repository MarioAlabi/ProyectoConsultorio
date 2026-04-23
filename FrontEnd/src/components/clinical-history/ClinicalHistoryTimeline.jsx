import { useState } from "react";
import { formatDateTime, getStatusBadge } from "../../lib/utils";
import { getClinicalHistoryViewModel } from "./clinicalHistoryViewModel";

export const ClinicalHistoryTimeline = ({ history, isLoading, isError = false }) => {
  const viewModel = getClinicalHistoryViewModel(history);
  const items = viewModel.items;
  
  // Estado para guardar los IDs de las consultas expandidas
  const [expandedItems, setExpandedItems] = useState(new Set());

  const formatMoney = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "No registrado";
    }
    return `$${Number(value).toFixed(2)}`;
  };

  // Funciones para manejar el acordeón
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
    const allIds = items.map(item => item.consultationId);
    setExpandedItems(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  const S = {
    wrapper: { display: "flex", flexDirection: "column", gap: "1rem" },
    intro: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "1rem",
      padding: "0.9rem 1rem",
      backgroundColor: "#f0fdfa",
      border: "1px solid #ccfbf1",
      borderRadius: "0.9rem",
      marginBottom: "0.5rem",
      flexWrap: "wrap",
    },
    introTitle: { margin: 0, color: "#115e59", fontSize: "1rem", fontWeight: 700 },
    introText: { margin: "0.25rem 0 0", color: "#4b5563", fontSize: "0.9rem" },
    badge: {
      padding: "0.35rem 0.7rem",
      borderRadius: "999px",
      backgroundColor: "#ffffff",
      border: "1px solid #99f6e4",
      color: "#0f766e",
      fontSize: "0.78rem",
      fontWeight: 700,
    },
    controlsWrap: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "0.5rem",
      marginBottom: "0.5rem"
    },
    controlBtn: {
      padding: "0.35rem 0.75rem",
      fontSize: "0.82rem",
      backgroundColor: "#ffffff",
      color: "#475569",
      border: "1px solid #cbd5e1",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontWeight: 600,
      transition: "all 0.2s"
    },
    empty: {
      textAlign: "center",
      color: "#6b7280",
      padding: "2.5rem 1.25rem",
      backgroundColor: "#f8fafc",
      border: "1px dashed #cbd5e1",
      borderRadius: "1rem",
    },
    emptyIcon: {
      width: "3.2rem",
      height: "3.2rem",
      borderRadius: "999px",
      margin: "0 auto 1rem",
      backgroundColor: "#ecfeff",
      color: "#0f766e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "1.4rem",
      border: "1px solid #ccfbf1",
    },
    emptyTitle: {
      display: "block",
      marginBottom: "0.55rem",
      color: "#374151",
      fontSize: "1rem",
      fontWeight: 700,
    },
    emptyText: { margin: 0, color: "#6b7280", fontSize: "0.92rem", lineHeight: 1.5 },
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
      backgroundColor: "#ccfbf1",
    },
    card: {
      position: "relative",
      backgroundColor: "#ffffff",
      borderRadius: "1rem",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.03)",
      overflow: "hidden", // Para que no se desborde al contraer
    },
    // Cabecera clickeable (Resumen)
    summaryHeader: {
      padding: "1rem 1rem 1rem 1.15rem",
      cursor: "pointer",
      userSelect: "none",
      transition: "background-color 0.2s",
      // Un hover suave usando un truco en linea si no usas clases CSS
    },
    dot: {
      position: "absolute",
      left: "-1.35rem",
      top: "1.2rem",
      width: "0.9rem",
      height: "0.9rem",
      borderRadius: "999px",
      backgroundColor: "#0d9488",
      border: "3px solid #ccfbf1",
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
    date: { color: "#0f766e", fontSize: "0.95rem", fontWeight: 700, margin: 0 },
    doctor: { color: "#6b7280", fontSize: "0.85rem", margin: "0.2rem 0 0" },
    statusBadge: {
      padding: "0.25rem 0.65rem",
      borderRadius: "999px",
      fontSize: "0.75rem",
      fontWeight: 700,
      whiteSpace: "nowrap",
    },
    reasonText: {
      margin: "0.5rem 0 0.25rem",
      color: "#1f2937",
      fontSize: "0.9rem",
      fontWeight: 600,
    },
    diagnosisSummary: {
      margin: 0,
      color: "#6b7280",
      fontSize: "0.85rem",
      display: "-webkit-box",
      WebkitLineClamp: 2, // Limita el diagnostico a 2 lineas en la vista resumen
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
      color: "#cbd5e1",
      fontSize: "1.2rem",
    },
    // Cuerpo expandido
    expandedBody: {
      padding: "0 1rem 1.25rem 1.15rem",
      borderTop: "1px dashed #e5e7eb",
      marginTop: "0.5rem",
      paddingTop: "1rem",
    },
    sectionLabel: {
      display: "block",
      fontSize: "0.78rem",
      fontWeight: 700,
      color: "#6b7280",
      textTransform: "uppercase",
      marginBottom: "0.35rem",
      letterSpacing: "0.04em",
    },
    diagnosisFull: {
      margin: 0,
      padding: "0.9rem",
      backgroundColor: "#fffbeb",
      border: "1px solid #fde68a",
      borderRadius: "0.8rem",
      color: "#92400e",
      lineHeight: 1.5,
      fontSize: "0.9rem"
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
      backgroundColor: "#f0f9ff",
      border: "1px solid #bae6fd",
      borderRadius: "0.8rem",
      color: "#0f172a",
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
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "0.8rem",
      color: "#374151",
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
      backgroundColor: "#f8fafc",
      border: "1px solid #e5e7eb",
      borderRadius: "0.8rem",
      padding: "0.85rem",
    },
    medName: { margin: 0, color: "#1f2937", fontWeight: 700, fontSize: "0.95rem" },
    medMeta: { margin: "0.4rem 0 0", color: "#4b5563", fontSize: "0.84rem", lineHeight: 1.5 },
    noMeds: {
      marginTop: "1rem",
      padding: "0.9rem",
      borderRadius: "0.8rem",
      backgroundColor: "#f9fafb",
      color: "#6b7280",
      border: "1px dashed #d1d5db",
      fontSize: "0.9rem",
    },
    loading: { textAlign: "center", color: "#6b7280", padding: "2rem" },
    error: {
      textAlign: "center",
      color: "#991b1b",
      padding: "1.25rem",
      backgroundColor: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: "0.9rem",
    },
  };

  if (isLoading) return <p style={S.loading}>Cargando historial clínico...</p>;
  if (isError) return <div style={S.error}>No se pudo cargar el historial clínico.</div>;

  return (
    <div style={S.wrapper}>
      <div style={S.intro}>
        <div>
          <h3 style={S.introTitle}>Historial Clínico</h3>
          <p style={S.introText}>Consultas previas en los últimos {viewModel.rangeYears} años.</p>
        </div>
        <span style={S.badge}>Solo lectura</span>
      </div>

      {!viewModel.isEmpty && items.length > 1 && (
        <div style={S.controlsWrap}>
          <button style={S.controlBtn} onClick={collapseAll}>Contraer todos</button>
          <button style={S.controlBtn} onClick={expandAll}>Expandir todos</button>
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
                
                {/* VISTA RESUMEN (Clickeable) */}
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
                      <span style={{ ...S.statusBadge, backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                        {statusBadge.label}
                      </span>
                    )}
                  </div>
                  
                  {item.reason && <p style={S.reasonText}>Motivo: {item.reason}</p>}
                  
                  {/* Diagnóstico truncado (Solo si no está expandido) */}
                  {!isExpanded && item.diagnosis && (
                    <p style={S.diagnosisSummary}>Dx: {item.diagnosis}</p>
                  )}

                  <div style={S.chevronWrap}>
                    <i className={isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
                  </div>
                </div>

                {/* VISTA COMPLETA (Solo se renderiza si isExpanded es true) */}
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
                            <span style={S.sectionLabel}>Examen Físico</span>
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