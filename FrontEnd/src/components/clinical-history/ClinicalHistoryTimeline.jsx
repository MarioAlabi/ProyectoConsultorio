import { formatDateTime, getStatusBadge } from "../../lib/utils";
import { getClinicalHistoryViewModel } from "./clinicalHistoryViewModel";

export const ClinicalHistoryTimeline = ({ history, isLoading, isError = false }) => {
  const viewModel = getClinicalHistoryViewModel(history);
  const items = viewModel.items;
  const formatMoney = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "No registrado";
    }

    return `$${Number(value).toFixed(2)}`;
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
    emptyText: {
      margin: 0,
      color: "#6b7280",
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
      backgroundColor: "#ccfbf1",
    },
    card: {
      position: "relative",
      backgroundColor: "#ffffff",
      borderRadius: "1rem",
      border: "1px solid #e5e7eb",
      boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
      padding: "1rem 1rem 1rem 1.15rem",
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
    header: {
      display: "flex",
      justifyContent: "space-between",
      gap: "0.75rem",
      flexWrap: "wrap",
      alignItems: "flex-start",
      marginBottom: "0.9rem",
    },
    date: { color: "#0f766e", fontSize: "0.9rem", fontWeight: 700, margin: 0 },
    doctor: { color: "#6b7280", fontSize: "0.88rem", margin: "0.3rem 0 0" },
    statusBadge: {
      padding: "0.25rem 0.65rem",
      borderRadius: "999px",
      fontSize: "0.78rem",
      fontWeight: 700,
      whiteSpace: "nowrap",
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
    diagnosis: {
      margin: 0,
      padding: "0.9rem",
      backgroundColor: "#fffbeb",
      border: "1px solid #fde68a",
      borderRadius: "0.8rem",
      color: "#92400e",
      lineHeight: 1.5,
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

  if (isLoading) {
    return <p style={S.loading}>Cargando historial clinico...</p>;
  }

  if (isError) {
    return (
      <div style={S.error}>
        No se pudo cargar el historial clinico en este momento. Intenta nuevamente.
      </div>
    );
  }

  return (
    <div style={S.wrapper}>
      <div style={S.intro}>
        <div>
          <h3 style={S.introTitle}>Historial Clinico</h3>
          <p style={S.introText}>Consultas previas registradas en los ultimos {viewModel.rangeYears} anos.</p>
        </div>
        <span style={S.badge}>Solo lectura</span>
      </div>

      {viewModel.isEmpty ? (
        <div style={S.empty}>
          <div style={S.emptyIcon}>
            <i className="ri-file-history-line" />
          </div>
          <strong style={S.emptyTitle}>Aun no hay historial clinico para este paciente.</strong>
          <p style={S.emptyText}>
            {viewModel.message ||
              "Cuando se registren consultas medicas previas, aqui podras ver sus diagnosticos, recetas y medico responsable."}
          </p>
        </div>
      ) : (
        <div style={S.timeline}>
          <div style={S.line} />
          {/* Este componente no expone acciones de edicion para historial previo. */}
          {items.map((item) => (
            <article key={item.consultationId} style={S.card}>
              {(() => {
                const statusBadge = getStatusBadge(item.status);
                return (
                  <>
                    <span style={S.dot} />

                    <div style={S.header}>
                      <div>
                        <p style={S.date}>{formatDateTime(item.consultationDate)}</p>
                        <p style={S.doctor}>Medico responsable: {item.doctorName || "No disponible"}</p>
                      </div>
                      {item.status ? (
                        <span style={{ ...S.statusBadge, backgroundColor: statusBadge.bg, color: statusBadge.color }}>
                          {statusBadge.label}
                        </span>
                      ) : null}
                    </div>

                    {item.reason ? (
                      <div style={{ marginBottom: "1rem" }}>
                        <span style={S.sectionLabel}>Motivo de consulta</span>
                        <p style={S.clinicalNote}>{item.reason}</p>
                      </div>
                    ) : null}

                    <div>
                      <span style={S.sectionLabel}>Diagnostico</span>
                      <p style={S.diagnosis}>{item.diagnosis || "No se registro diagnostico en esta consulta."}</p>
                    </div>

                    <div style={S.coverageGrid}>
                      <div>
                        <span style={S.sectionLabel}>Tipo de atencion</span>
                        <p style={S.coverageCard}>
                          {item.coverageType === "insurance" ? "Aseguradora" : "Particular"}
                        </p>
                      </div>
                      {item.coverageType === "insurance" ? (
                        <>
                          <div>
                            <span style={S.sectionLabel}>Aseguradora</span>
                            <p style={S.coverageCard}>{item.insurerName || "No disponible"}</p>
                          </div>
                          <div>
                            <span style={S.sectionLabel}>Monto cubierto</span>
                            <p style={S.coverageCard}>{formatMoney(item.agreedAmount)}</p>
                          </div>
                        </>
                      ) : null}
                    </div>

                    {(item.observations || item.anamnesis || item.physicalExam || item.labResults) ? (
                      <div style={S.clinicalGrid}>
                        {item.observations ? (
                          <div>
                            <span style={S.sectionLabel}>Notas medicas / tratamiento indicado</span>
                            <p style={S.clinicalNote}>{item.observations}</p>
                          </div>
                        ) : null}
                        {item.anamnesis ? (
                          <div>
                            <span style={S.sectionLabel}>Anamnesis</span>
                            <p style={S.clinicalNote}>{item.anamnesis}</p>
                          </div>
                        ) : null}
                        {item.physicalExam ? (
                          <div>
                            <span style={S.sectionLabel}>Examen fisico</span>
                            <p style={S.clinicalNote}>{item.physicalExam}</p>
                          </div>
                        ) : null}
                        {item.labResults ? (
                          <div>
                            <span style={S.sectionLabel}>Laboratorio</span>
                            <p style={S.clinicalNote}>{item.labResults}</p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div style={{ marginTop: "1rem" }}>
                      <span style={S.sectionLabel}>Medicamentos recetados</span>
                      {item.medications?.length ? (
                        <div style={S.medsWrap}>
                          {item.medications.map((medication) => (
                            <div key={medication.id} style={S.medCard}>
                              <p style={S.medName}>
                                {medication.name}
                                {medication.concentration ? ` ${medication.concentration}` : ""}
                                {medication.concentrationUnit ? ` ${medication.concentrationUnit}` : ""}
                              </p>
                              <p style={S.medMeta}>
                                Dosis: {medication.dose || "N/A"} {medication.doseUnit || ""}
                              </p>
                              <p style={S.medMeta}>
                                Via: {medication.route || "N/A"} | Frecuencia: {medication.frequency || "N/A"}
                              </p>
                              <p style={S.medMeta}>
                                Duracion: {medication.duration || "N/A"}
                              </p>
                              {medication.additionalInstructions ? (
                                <p style={S.medMeta}>Indicaciones: {medication.additionalInstructions}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={S.noMeds}>No se registraron medicamentos recetados en esta consulta.</div>
                      )}
                    </div>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
