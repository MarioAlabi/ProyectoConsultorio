import { useNavigate } from "react-router-dom";
import { useMemo, useState, useRef } from "react";
import { useDoctorDashboard, useUpdatePreclinicalStatus } from "../../hooks/usePreclinical";
import { useBulkCancelAppointments, useUpdateAppointmentStatus } from "../../hooks/useAppointments";
import { Modal } from "../../components/Modal";
import { calcularEdad, getStatusBadge } from "../../lib/utils";

const formatDateKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const created = new Date(dateStr);
  const now = new Date();
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  return `Hace ${diffHrs}h ${diffMin % 60}m`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit", hour12: true });
};

export const SalaEspera = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()));
  const [showSummary, setShowSummary] = useState(false);
  const [activeTab, setActiveTab] = useState("sala"); // "sala" | "citas" | "atendidos"
  const listRef = useRef(null);

  const isToday = selectedDate === formatDateKey(new Date());
  const { data: dashboard, isLoading, error } = useDoctorDashboard(selectedDate);
  const statusMutation = useUpdatePreclinicalStatus();
  const appointmentStatusMutation = useUpdateAppointmentStatus();
  const bulkCancelMutation = useBulkCancelAppointments();

  const counters = dashboard?.counters || {
    pending: 0, inConsultation: 0, done: 0, cancelled: 0,
    total: 0, dailyLoad: 0, withAppointment: 0, withoutAppointment: 0,
  };
  const patients = dashboard?.patients || [];
  const appointmentsData = dashboard?.appointments || [];

  const dateDisplay = new Date(selectedDate + "T12:00:00").toLocaleDateString("es-SV", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Ordenar pacientes: waiting primero, luego in_consultation, luego done, luego cancelled
  const sortedPatients = useMemo(() => {
    const order = { waiting: 0, in_consultation: 1, done: 2, cancelled: 3 };
    return [...patients].sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99));
  }, [patients]);

  // Separar pacientes en sala (waiting + in_consultation) y atendidos
  const patientsInRoom = sortedPatients.filter((p) => p.status === "waiting" || p.status === "in_consultation");
  const patientsDone = sortedPatients.filter((p) => p.status === "done");

  // --- Handlers ---
  const handleCancel = (id) => {
    if (!window.confirm("Cancelar este registro pre-clinico?")) return;
    statusMutation.mutate({ id, status: "cancelled" });
  };

  const handleConsulta = (item) => {
    statusMutation.mutate(
      { id: item.id, status: "in_consultation" },
      { onSuccess: () => navigate(`/doctor/consulta/${item.id}`) }
    );
  };

  const handleBulkCancel = () => {
    if (!window.confirm(`Cancelar TODAS las citas programadas del ${dateDisplay}?`)) return;
    bulkCancelMutation.mutate({ date: selectedDate });
  };

  const handleCancelAppointment = (id) => {
    if (!window.confirm("Cancelar esta cita?")) return;
    appointmentStatusMutation.mutate({ id, status: "cancelled" });
  };

  const navigateDate = (dir) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + dir);
    setSelectedDate(formatDateKey(d));
  };

  const goToday = () => setSelectedDate(formatDateKey(new Date()));

  const scrollToList = () => {
    listRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const evaluarPresion = (bp) => {
    if (!bp) return { label: "N/A", color: "var(--fg-muted)" };
    const [sys, dia] = bp.split("/").map(Number);
    if (sys < 120 && dia < 80) return { label: "Normal", color: "var(--accent-forest)" };
    if (sys < 140 && dia < 90) return { label: "Elevada", color: "var(--accent-ochre)" };
    return { label: "Alta", color: "var(--accent-coral)" };
  };


  const pendingAccent = counters.pending >= 5 ? "coral" : counters.pending >= 3 ? "ochre" : "ochre";
  const pendingBadge = counters.pending >= 5
    ? { label: "Alta carga", tone: "badge-danger", icon: "ri-alert-line" }
    : counters.pending >= 3
      ? { label: "Carga moderada", tone: "badge-warning", icon: "ri-error-warning-line" }
      : null;

  const S = {
    dateNav: {
      display: "flex", alignItems: "center", gap: "0.25rem",
      background: "var(--bg-surface)", borderRadius: "var(--radius-md)",
      padding: "0.2rem", border: "1px solid var(--border-subtle)",
    },
    dateIconBtn: {
      background: "none", border: "none", cursor: "pointer", padding: "0.4rem 0.55rem",
      borderRadius: "var(--radius-sm)", color: "var(--fg-secondary)",
      display: "flex", alignItems: "center",
    },
    dateInput: {
      border: "none", background: "transparent", fontSize: "0.85rem",
      color: "var(--fg-primary)", fontWeight: 500, cursor: "pointer",
      padding: "0.3rem 0.5rem", fontFamily: "var(--font-mono)",
    },
    tabs: {
      display: "flex", gap: "0", marginBottom: "1.25rem",
      borderBottom: "1px solid var(--border-subtle)",
    },
    tab: (active) => ({
      padding: "0.75rem 1.25rem", fontWeight: 600, fontSize: "0.88rem",
      cursor: "pointer", border: "none", background: "none",
      color: active ? "var(--brand)" : "var(--fg-muted)",
      borderBottom: active ? "2px solid var(--brand)" : "2px solid transparent",
      marginBottom: "-1px",
      display: "inline-flex", alignItems: "center", gap: "0.4rem",
      transition: "color 140ms, border-color 140ms",
    }),
    tableHead: {
      display: "grid", padding: "0.9rem 1.5rem",
      background: "var(--bg-surface-alt)",
      borderBottom: "1px solid var(--border-default)",
      fontSize: "0.72rem", fontWeight: 600,
      letterSpacing: "0.12em", textTransform: "uppercase",
      color: "var(--fg-muted)",
    },
    tableRow: (active, muted) => ({
      display: "grid", padding: "1rem 1.5rem", alignItems: "center",
      borderBottom: "1px solid var(--border-subtle)",
      background: active ? "var(--brand-tint)" : "transparent",
      opacity: muted ? 0.55 : 1,
      transition: "background-color 140ms",
    }),
    appointmentBadge: {
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      fontSize: "0.72rem", fontWeight: 600, borderRadius: "var(--radius-full)",
      padding: "0.18rem 0.6rem",
    },
    withCita: { background: "var(--accent-plum-soft)", color: "var(--accent-plum)" },
    walkIn:   { background: "var(--brand-soft)", color: "var(--brand)" },
    emptyState: {
      padding: "3.5rem 1rem", textAlign: "center",
      color: "var(--fg-muted)", fontSize: "0.95rem",
      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
    },
  };

  return (
    <div className="page">
        {/* Header */}
        <header className="page-header">
          <div className="page-header__title">
            <span className="page-header__eyebrow">Consulta del día</span>
            <h1 className="page-header__heading">Resumen de actividad</h1>
            <p className="page-header__sub">{dateDisplay}</p>
          </div>

          <div className="page-header__actions" style={{ alignItems: "center" }}>
            <div style={S.dateNav}>
              <button onClick={() => navigateDate(-1)} style={S.dateIconBtn} title="Día anterior">
                <i className="ri-arrow-left-s-line" style={{ fontSize: "1.1rem" }}></i>
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={S.dateInput}
              />
              <button onClick={() => navigateDate(1)} style={S.dateIconBtn} title="Día siguiente">
                <i className="ri-arrow-right-s-line" style={{ fontSize: "1.1rem" }}></i>
              </button>
            </div>
            <button
              onClick={goToday}
              className={`btn btn-sm ${isToday ? "btn-secondary" : "btn-ghost"}`}
            >
              Hoy
            </button>
            <button onClick={() => setShowSummary(true)} className="btn btn-secondary btn-sm">
              <i className="ri-bar-chart-2-line"></i> Resumen
            </button>
          </div>
        </header>

        {/* Counters Grid (CA-01) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "0.9rem",
            marginBottom: "1.75rem",
          }}
        >
          <button
            type="button"
            className={`stat-card stat-card--${pendingAccent}`}
            onClick={scrollToList}
            style={{ cursor: "pointer", textAlign: "left", border: "1px solid var(--border-subtle)", font: "inherit" }}
            title="Ir a la lista de espera"
          >
            <span className="stat-card__accent" />
            <div className="stat-card__label">
              <i className="ri-time-line"></i> Pendientes
            </div>
            <div className="stat-card__value">{counters.pending}</div>
            {pendingBadge && (
              <div style={{ marginTop: "0.5rem" }}>
                <span className={`badge ${pendingBadge.tone}`}>
                  <i className={pendingBadge.icon}></i> {pendingBadge.label}
                </span>
              </div>
            )}
          </button>

          <StatChip icon="ri-stethoscope-line" label="En consulta"      value={counters.inConsultation}      accent="slate"  />
          <StatChip icon="ri-check-double-line" label="Atendidos"       value={counters.done}                accent="forest" />
          <StatChip icon="ri-group-line"        label="Carga total"     value={counters.dailyLoad}           accent="brand"  meta="del día" />
          <StatChip icon="ri-calendar-check-line" label="Con cita"      value={counters.withAppointment}     accent="plum"   />
          <StatChip icon="ri-walk-line"          label="Walk-in"        value={counters.withoutAppointment}  accent="brand"  />
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          <button style={S.tab(activeTab === "sala")} onClick={() => setActiveTab("sala")}>
            <i className="ri-user-heart-line"></i>
            Sala de espera <span className="badge">{patientsInRoom.length}</span>
          </button>
          <button style={S.tab(activeTab === "citas")} onClick={() => setActiveTab("citas")}>
            <i className="ri-calendar-line"></i>
            Citas del día <span className="badge">{appointmentsData.length}</span>
          </button>
          <button style={S.tab(activeTab === "atendidos")} onClick={() => setActiveTab("atendidos")}>
            <i className="ri-check-double-line"></i>
            Atendidos <span className="badge">{patientsDone.length}</span>
          </button>
        </div>

        {/* Tab: Sala de Espera */}
        {activeTab === "sala" && (
          <div ref={listRef} className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ ...S.tableHead, gridTemplateColumns: "2.5fr 1.2fr 1fr 0.8fr 1.4fr" }}>
              <span>Paciente</span>
              <span>Signos vitales</span>
              <span>Tipo</span>
              <span>Estado</span>
              <span style={{ textAlign: "right" }}>Acciones</span>
            </div>

            {isLoading ? (
              <div style={S.emptyState}>Cargando…</div>
            ) : error ? (
              <div style={{ ...S.emptyState, color: "var(--accent-coral)" }}>Error al cargar datos.</div>
            ) : patientsInRoom.length === 0 ? (
              <div style={S.emptyState}>
                <i className="ri-rest-time-line" style={{ fontSize: "2rem", opacity: 0.6 }}></i>
                <span>No hay pacientes en sala de espera.</span>
              </div>
            ) : (
              patientsInRoom.map((item) => {
                const badge = getStatusBadge(item.status);
                const bp = evaluarPresion(item.bloodPressure);
                const edad = calcularEdad(item.patientDob);
                return (
                  <div
                    key={item.id}
                    style={{
                      ...S.tableRow(item.status === "in_consultation", false),
                      gridTemplateColumns: "2.5fr 1.2fr 1fr 0.8fr 1.4fr",
                    }}
                  >
                    {/* Paciente */}
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--fg-primary)", fontSize: "0.95rem" }}>
                        {item.patientName || "Paciente"}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)", marginTop: "0.2rem" }}>
                        {edad > 0 ? `${edad} años` : ""}
                        {item.gender === "female" ? " · F" : item.gender === "male" ? " · M" : ""}
                        {item.fileNumber ? ` · ${item.fileNumber}` : ""}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--fg-secondary)", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <i className="ri-chat-1-line" style={{ fontSize: "0.85rem", color: "var(--fg-muted)" }}></i>
                        {item.motivo || "Sin motivo"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "var(--fg-subtle)", marginTop: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <i className="ri-time-line" style={{ fontSize: "0.75rem" }}></i>
                        {formatTime(item.createdAt)} · {formatTimeAgo(item.createdAt)}
                      </div>
                    </div>

                    {/* Signos Vitales */}
                    <div style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "var(--fg-secondary)" }}>
                      <div>
                        <span style={{ color: "var(--fg-muted)" }}>PA:</span>{" "}
                        <span style={{ color: bp.color, fontWeight: 600 }}>{item.bloodPressure || "N/A"}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--fg-muted)" }}>T°:</span>{" "}
                        {item.temperature ? `${item.temperature} °C` : "N/A"}
                      </div>
                      <div>
                        <span style={{ color: "var(--fg-muted)" }}>FC:</span> {item.heartRate || "N/A"} ·{" "}
                        <span style={{ color: "var(--fg-muted)" }}>SpO₂:</span>{" "}
                        {item.oxygenSaturation ? `${item.oxygenSaturation}%` : "N/A"}
                      </div>
                    </div>

                    {/* Tipo */}
                    <div>
                      {item.hasAppointment ? (
                        <span style={{ ...S.appointmentBadge, ...S.withCita }}>
                          <i className="ri-calendar-check-line"></i>
                          {item.appointmentTime || "Cita"}
                        </span>
                      ) : (
                        <span style={{ ...S.appointmentBadge, ...S.walkIn }}>
                          <i className="ri-walk-line"></i> Walk-in
                        </span>
                      )}
                    </div>

                    {/* Estado */}
                    <div>
                      <span
                        className="badge"
                        style={{ background: badge.bg, color: badge.color, border: "none" }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Acciones */}
                    <div style={{ textAlign: "right", display: "flex", gap: "0.4rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {item.status === "waiting" && (
                        <>
                          <button onClick={() => handleConsulta(item)} className="btn btn-primary btn-sm">
                            <i className="ri-stethoscope-line"></i> Atender
                          </button>
                          <button onClick={() => handleCancel(item.id)} className="btn btn-danger btn-sm">
                            Cancelar
                          </button>
                        </>
                      )}
                      {item.status === "in_consultation" && (
                        <button onClick={() => navigate(`/doctor/consulta/${item.id}`)} className="btn btn-secondary btn-sm">
                          <i className="ri-arrow-right-line"></i> Continuar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Citas del Dia */}
        {activeTab === "citas" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {appointmentsData.filter((a) => a.status === "scheduled").length > 0 && (
              <div
                style={{
                  display: "flex", justifyContent: "flex-end",
                  padding: "0.8rem 1.5rem",
                  borderBottom: "1px solid var(--border-subtle)",
                  background: "var(--accent-ochre-soft)",
                }}
              >
                <button
                  onClick={handleBulkCancel}
                  disabled={bulkCancelMutation.isPending}
                  className="btn btn-danger btn-sm"
                >
                  <i className="ri-delete-bin-line"></i>
                  {bulkCancelMutation.isPending ? "Cancelando..." : "Cancelar todas las programadas"}
                </button>
              </div>
            )}

            <div style={{ ...S.tableHead, gridTemplateColumns: "0.8fr 2fr 1.5fr 1fr 1.2fr" }}>
              <span>Hora</span>
              <span>Paciente</span>
              <span>Motivo</span>
              <span>Estado</span>
              <span style={{ textAlign: "right" }}>Acciones</span>
            </div>

            {isLoading ? (
              <div style={S.emptyState}>Cargando citas…</div>
            ) : appointmentsData.length === 0 ? (
              <div style={S.emptyState}>
                <i className="ri-calendar-close-line" style={{ fontSize: "2rem", opacity: 0.6 }}></i>
                <span>No hay citas para esta fecha.</span>
              </div>
            ) : (
              appointmentsData.map((cita) => {
                const badge = getStatusBadge(cita.status);
                return (
                  <div
                    key={cita.id}
                    style={{
                      ...S.tableRow(false, cita.status === "cancelled"),
                      gridTemplateColumns: "0.8fr 2fr 1.5fr 1fr 1.2fr",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: "var(--fg-primary)",
                        fontSize: "0.95rem",
                      }}
                    >
                      {cita.time}
                    </div>
                    <div style={{ fontWeight: 500, color: "var(--fg-primary)" }}>
                      {cita.patientName || "Paciente"}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                      {cita.reason || "No especificado"}
                    </div>
                    <div>
                      <span
                        className="badge"
                        style={{ background: badge.bg, color: badge.color, border: "none" }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                      {cita.status === "present" && (
                        <span className="badge badge-success"><i className="ri-user-received-line"></i> En sala</span>
                      )}
                      {cita.status === "scheduled" && (
                        <button onClick={() => handleCancelAppointment(cita.id)} className="btn btn-danger btn-sm">
                          Cancelar
                        </button>
                      )}
                      {cita.status === "done" && (
                        <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>Completada</span>
                      )}
                      {cita.status === "cancelled" && (
                        <span style={{ color: "var(--fg-subtle)", fontSize: "0.8rem", textDecoration: "line-through" }}>
                          Cancelada
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab: Atendidos */}
        {activeTab === "atendidos" && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ ...S.tableHead, gridTemplateColumns: "2.5fr 1.5fr 1fr 1.2fr" }}>
              <span>Paciente</span>
              <span>Motivo</span>
              <span>Tipo</span>
              <span style={{ textAlign: "right" }}>Acciones</span>
            </div>

            {isLoading ? (
              <div style={S.emptyState}>Cargando…</div>
            ) : patientsDone.length === 0 ? (
              <div style={S.emptyState}>
                <i className="ri-file-list-line" style={{ fontSize: "2rem", opacity: 0.6 }}></i>
                <span>No hay pacientes atendidos aún.</span>
              </div>
            ) : (
              patientsDone.map((item) => {
                const edad = calcularEdad(item.patientDob);
                return (
                  <div
                    key={item.id}
                    style={{
                      ...S.tableRow(false, false),
                      gridTemplateColumns: "2.5fr 1.5fr 1fr 1.2fr",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--fg-primary)" }}>{item.patientName || "Paciente"}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>
                        {edad > 0 ? `${edad} años` : ""}{item.fileNumber ? ` · ${item.fileNumber}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>{item.motivo || "N/A"}</div>
                    <div>
                      {item.hasAppointment ? (
                        <span style={{ ...S.appointmentBadge, ...S.withCita }}>
                          <i className="ri-calendar-check-line"></i> Cita
                        </span>
                      ) : (
                        <span style={{ ...S.appointmentBadge, ...S.walkIn }}>
                          <i className="ri-walk-line"></i> Walk-in
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <button
                        onClick={() => navigate(`/doctor/consulta-detalle/${item.id}`)}
                        className="btn btn-secondary btn-sm"
                      >
                        <i className="ri-eye-line"></i> Ver detalle
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      {/* Modal Resumen del Día */}
      <Modal isOpen={showSummary} onClose={() => setShowSummary(false)} title="Resumen del día" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
          <div style={{ textAlign: "center", color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            {dateDisplay}
          </div>

          <SummaryRow icon="ri-time-line"          label="Pendientes"     value={counters.pending}            tone="ochre"  />
          <SummaryRow icon="ri-stethoscope-line"   label="En consulta"    value={counters.inConsultation}     tone="slate"  />
          <SummaryRow icon="ri-check-double-line"  label="Atendidos"      value={counters.done}               tone="forest" />
          <SummaryRow icon="ri-close-circle-line"  label="Cancelados"     value={counters.cancelled}          tone="coral"  />
          <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "0.65rem", marginTop: "0.25rem" }}>
            <SummaryRow icon="ri-group-line" label="Carga total del día" value={counters.dailyLoad} tone="brand" />
          </div>
          <SummaryRow icon="ri-calendar-check-line" label="Con cita"     value={counters.withAppointment}    tone="plum"   />
          <SummaryRow icon="ri-walk-line"          label="Walk-in"       value={counters.withoutAppointment} tone="brand"  />
        </div>
      </Modal>
    </div>
  );
};

/* ───────── Helpers visuales locales ───────── */

const StatChip = ({ icon, label, value, accent = "brand", meta }) => (
  <div className={`stat-card stat-card--${accent}`}>
    <span className="stat-card__accent" />
    <div className="stat-card__label">
      {icon && <i className={icon}></i>}
      <span>{label}</span>
    </div>
    <div className="stat-card__value">{value}</div>
    {meta && <div className="stat-card__meta">{meta}</div>}
  </div>
);

const TONE_BG = {
  brand:  "var(--brand-soft)",
  slate:  "var(--accent-slate-soft)",
  forest: "var(--accent-forest-soft)",
  ochre:  "var(--accent-ochre-soft)",
  coral:  "var(--accent-coral-soft)",
  plum:   "var(--accent-plum-soft)",
};
const TONE_FG = {
  brand:  "var(--brand)",
  slate:  "var(--accent-slate)",
  forest: "var(--accent-forest)",
  ochre:  "var(--accent-ochre)",
  coral:  "var(--accent-coral)",
  plum:   "var(--accent-plum)",
};

const SummaryRow = ({ icon, label, value, tone = "brand" }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.65rem 0.9rem",
      background: TONE_BG[tone],
      borderRadius: "var(--radius-md)",
    }}
  >
    <span style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "var(--fg-primary)", fontWeight: 500 }}>
      <i className={icon} style={{ color: TONE_FG[tone] }}></i>
      {label}
    </span>
    <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "1.25rem", color: TONE_FG[tone] }}>
      {value}
    </span>
  </div>
);
