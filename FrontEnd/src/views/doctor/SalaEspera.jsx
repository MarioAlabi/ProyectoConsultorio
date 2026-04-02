import { useNavigate } from "react-router-dom";
import { useMemo, useState, useRef } from "react";
import { useDoctorDashboard, useUpdatePreclinicalStatus } from "../../hooks/usePreclinical";
import { useBulkCancelAppointments, useUpdateAppointmentStatus } from "../../hooks/useAppointments";
import { Modal } from "../../components/Modal";
import { calcularEdad, getStatusBadge } from "../../lib/utils";
import "../../views/shared/Shared.css";

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
    if (!bp) return { label: "N/A", color: "#6b7280" };
    const [sys, dia] = bp.split("/").map(Number);
    if (sys < 120 && dia < 80) return { label: "Normal", color: "#16a34a" };
    if (sys < 140 && dia < 90) return { label: "Elevada", color: "#d97706" };
    return { label: "Alta", color: "#dc2626" };
  };

  // CA-07: Color del contador de pendientes segun umbral
  const getPendingColor = (count) => {
    if (count >= 5) return { bg: "#fef2f2", border: "#dc2626", text: "#991b1b", accent: "#dc2626" };
    if (count >= 3) return { bg: "#fffbeb", border: "#d97706", text: "#92400e", accent: "#d97706" };
    return { bg: "#fffbeb", border: "#f59e0b", text: "#92400e", accent: "#f59e0b" };
  };

  const pendingStyle = getPendingColor(counters.pending);

  // --- Estilos ---
  const S = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: "1.5rem 2rem" },
    container: { maxWidth: "1200px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" },
    dateNav: {
      display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "white",
      borderRadius: "10px", padding: "0.4rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      border: "1px solid #e5e7eb",
    },
    dateBtn: {
      background: "none", border: "none", cursor: "pointer", padding: "0.4rem 0.6rem",
      borderRadius: "6px", color: "#374151", fontSize: "1rem", display: "flex", alignItems: "center",
    },
    dateInput: {
      border: "none", background: "none", fontSize: "0.9rem", color: "#1f2937",
      fontWeight: 500, cursor: "pointer", padding: "0.3rem 0.5rem",
    },
    todayBtn: {
      backgroundColor: isToday ? "#f0fdfa" : "white", color: isToday ? "#0d9488" : "#6b7280",
      border: `1px solid ${isToday ? "#99f6e4" : "#e5e7eb"}`, borderRadius: "6px",
      padding: "0.35rem 0.8rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
    },
    statsGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      gap: "0.75rem", marginBottom: "1.5rem",
    },
    statCard: (borderColor, bgColor) => ({
      backgroundColor: bgColor || "white", borderRadius: "12px",
      borderLeft: `4px solid ${borderColor}`, padding: "1rem 1.25rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "box-shadow 0.15s ease",
    }),
    statClickable: { cursor: "pointer" },
    statLabel: { color: "#6b7280", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.25rem" },
    statValue: (color) => ({ fontSize: "1.75rem", fontWeight: 800, color: color || "#111827", lineHeight: 1.1 }),
    statSub: { color: "#9ca3af", fontSize: "0.75rem", marginTop: "0.2rem" },
    tabs: {
      display: "flex", gap: "0", marginBottom: "1rem", borderBottom: "2px solid #e5e7eb",
    },
    tab: (active) => ({
      padding: "0.7rem 1.5rem", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
      border: "none", background: "none",
      color: active ? "#0d9488" : "#6b7280",
      borderBottom: active ? "2px solid #0d9488" : "2px solid transparent",
      marginBottom: "-2px", transition: "color 0.15s, border-color 0.15s",
    }),
    card: {
      backgroundColor: "white", borderRadius: "12px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)", overflow: "hidden",
    },
    th: {
      color: "#6b7280", fontSize: "0.78rem", fontWeight: 600,
      textTransform: "uppercase", letterSpacing: "0.03em",
    },
    badge: (bg, color) => ({
      backgroundColor: bg, color: color, padding: "0.2rem 0.65rem",
      borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600,
      display: "inline-block",
    }),
    appointmentBadge: {
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      fontSize: "0.75rem", fontWeight: 600, borderRadius: "999px",
      padding: "0.15rem 0.55rem",
    },
    withCita: { backgroundColor: "#ede9fe", color: "#6d28d9" },
    walkIn: { backgroundColor: "#f0fdfa", color: "#0d9488" },
    actionBtn: (color) => ({
      background: "none", border: `1px solid ${color}30`, color: color,
      padding: "0.35rem 0.75rem", borderRadius: "6px", fontSize: "0.8rem",
      fontWeight: 600, cursor: "pointer", transition: "background-color 0.15s",
    }),
    emptyState: {
      padding: "3rem", textAlign: "center", color: "#9ca3af", fontSize: "0.95rem",
    },
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <h1 style={{ margin: 0, color: "#111827", fontSize: "1.6rem", fontWeight: 700 }}>
              Resumen de Actividad
            </h1>
            <p style={{ color: "#6b7280", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
              {dateDisplay}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Date navigation */}
            <div style={S.dateNav}>
              <button onClick={() => navigateDate(-1)} style={S.dateBtn} title="Dia anterior">
                <i className="ri-arrow-left-s-line" style={{ fontSize: "1.1rem" }}></i>
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={S.dateInput}
              />
              <button onClick={() => navigateDate(1)} style={S.dateBtn} title="Dia siguiente">
                <i className="ri-arrow-right-s-line" style={{ fontSize: "1.1rem" }}></i>
              </button>
            </div>
            <button onClick={goToday} style={S.todayBtn}>Hoy</button>

            <button
              onClick={() => setShowSummary(true)}
              style={{
                backgroundColor: "white", color: "#0d9488", border: "1px solid #e5e7eb",
                padding: "0.45rem 1rem", borderRadius: "8px", fontWeight: 600,
                fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem",
              }}
            >
              <i className="ri-bar-chart-2-line"></i> Resumen
            </button>
          </div>
        </div>

        {/* Counters Grid (CA-01) */}
        <div style={S.statsGrid}>
          {/* Pendientes - clickeable (CA-04) con alerta (CA-07) */}
          <div
            style={{ ...S.statCard(pendingStyle.border, pendingStyle.bg), ...S.statClickable }}
            onClick={scrollToList}
            title="Click para ir a la lista de espera"
          >
            <div style={S.statLabel}>
              <i className="ri-time-line" style={{ marginRight: "0.3rem" }}></i>Pendientes
            </div>
            <div style={S.statValue(pendingStyle.accent)}>{counters.pending}</div>
            {counters.pending >= 5 && (
              <div style={{ ...S.statSub, color: "#dc2626", fontWeight: 600 }}>
                <i className="ri-alert-line"></i> Alta carga
              </div>
            )}
            {counters.pending >= 3 && counters.pending < 5 && (
              <div style={{ ...S.statSub, color: "#d97706", fontWeight: 600 }}>
                <i className="ri-error-warning-line"></i> Carga moderada
              </div>
            )}
          </div>

          {/* En Consulta */}
          <div style={S.statCard("#0ea5e9", "#f0f9ff")}>
            <div style={S.statLabel}>
              <i className="ri-stethoscope-line" style={{ marginRight: "0.3rem" }}></i>En Consulta
            </div>
            <div style={S.statValue("#0369a1")}>{counters.inConsultation}</div>
          </div>

          {/* Atendidos */}
          <div style={S.statCard("#16a34a", "#f0fdf4")}>
            <div style={S.statLabel}>
              <i className="ri-check-double-line" style={{ marginRight: "0.3rem" }}></i>Atendidos
            </div>
            <div style={S.statValue("#15803d")}>{counters.done}</div>
          </div>

          {/* Carga Total (CA-05) */}
          <div style={S.statCard("#6b7280", "#f9fafb")}>
            <div style={S.statLabel}>
              <i className="ri-group-line" style={{ marginRight: "0.3rem" }}></i>Carga Total
            </div>
            <div style={S.statValue("#374151")}>{counters.dailyLoad}</div>
            <div style={S.statSub}>del dia</div>
          </div>

          {/* Con Cita */}
          <div style={S.statCard("#7c3aed")}>
            <div style={S.statLabel}>
              <i className="ri-calendar-check-line" style={{ marginRight: "0.3rem" }}></i>Con Cita
            </div>
            <div style={S.statValue("#6d28d9")}>{counters.withAppointment}</div>
          </div>

          {/* Sin Cita (Walk-in) */}
          <div style={S.statCard("#0d9488")}>
            <div style={S.statLabel}>
              <i className="ri-walk-line" style={{ marginRight: "0.3rem" }}></i>Sin Cita
            </div>
            <div style={S.statValue("#0f766e")}>{counters.withoutAppointment}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          <button style={S.tab(activeTab === "sala")} onClick={() => setActiveTab("sala")}>
            <i className="ri-user-heart-line" style={{ marginRight: "0.4rem" }}></i>
            Sala de Espera ({patientsInRoom.length})
          </button>
          <button style={S.tab(activeTab === "citas")} onClick={() => setActiveTab("citas")}>
            <i className="ri-calendar-line" style={{ marginRight: "0.4rem" }}></i>
            Citas del Dia ({appointmentsData.length})
          </button>
          <button style={S.tab(activeTab === "atendidos")} onClick={() => setActiveTab("atendidos")}>
            <i className="ri-check-double-line" style={{ marginRight: "0.4rem" }}></i>
            Atendidos ({patientsDone.length})
          </button>
        </div>

        {/* Tab: Sala de Espera */}
        {activeTab === "sala" && (
          <div ref={listRef} style={S.card}>
            <div style={{
              display: "grid", gridTemplateColumns: "2.5fr 1.2fr 1fr 0.8fr 1.2fr",
              padding: "0.8rem 1.25rem", backgroundColor: "#f9fafb",
              borderBottom: "2px solid #e5e7eb",
            }}>
              <span style={S.th}>Paciente</span>
              <span style={S.th}>Signos Vitales</span>
              <span style={S.th}>Tipo</span>
              <span style={S.th}>Estado</span>
              <span style={{ ...S.th, textAlign: "right" }}>Acciones</span>
            </div>

            {isLoading ? (
              <div style={S.emptyState}>Cargando...</div>
            ) : error ? (
              <div style={{ ...S.emptyState, color: "#dc2626" }}>Error al cargar datos.</div>
            ) : patientsInRoom.length === 0 ? (
              <div style={S.emptyState}>
                <i className="ri-rest-time-line" style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}></i>
                No hay pacientes en sala de espera.
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
                      display: "grid", gridTemplateColumns: "2.5fr 1.2fr 1fr 0.8fr 1.2fr",
                      padding: "0.85rem 1.25rem", alignItems: "center",
                      borderBottom: "1px solid #f3f4f6",
                      backgroundColor: item.status === "in_consultation" ? "#f0f9ff" : "white",
                    }}
                  >
                    {/* Paciente */}
                    <div>
                      <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>
                        {item.patientName || "Paciente"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.15rem" }}>
                        {edad > 0 ? `${edad} a.` : ""}{item.gender === "female" ? " F" : item.gender === "male" ? " M" : ""}
                        {item.fileNumber ? ` | ${item.fileNumber}` : ""}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "0.1rem" }}>
                        <i className="ri-chat-1-line" style={{ fontSize: "0.75rem", marginRight: "0.2rem" }}></i>
                        {item.motivo || "Sin motivo"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.1rem" }}>
                        <i className="ri-time-line" style={{ fontSize: "0.7rem", marginRight: "0.2rem" }}></i>
                        Ingreso: {formatTime(item.createdAt)} ({formatTimeAgo(item.createdAt)})
                      </div>
                    </div>

                    {/* Signos Vitales */}
                    <div style={{ fontSize: "0.8rem", lineHeight: 1.6 }}>
                      <div>
                        PA: <span style={{ color: bp.color, fontWeight: 600 }}>{item.bloodPressure || "N/A"}</span>
                      </div>
                      <div>T: {item.temperature ? `${item.temperature} C` : "N/A"}</div>
                      <div>FC: {item.heartRate || "N/A"} | SpO2: {item.oxygenSaturation ? `${item.oxygenSaturation}%` : "N/A"}</div>
                    </div>

                    {/* Tipo: con cita o walk-in */}
                    <div>
                      {item.hasAppointment ? (
                        <span style={{ ...S.appointmentBadge, ...S.withCita }}>
                          <i className="ri-calendar-check-line" style={{ fontSize: "0.75rem" }}></i>
                          {item.appointmentTime || "Cita"}
                        </span>
                      ) : (
                        <span style={{ ...S.appointmentBadge, ...S.walkIn }}>
                          <i className="ri-walk-line" style={{ fontSize: "0.75rem" }}></i>
                          Walk-in
                        </span>
                      )}
                    </div>

                    {/* Estado */}
                    <div>
                      <span style={S.badge(badge.bg, badge.color)}>{badge.label}</span>
                    </div>

                    {/* Acciones */}
                    <div style={{ textAlign: "right", display: "flex", gap: "0.4rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                      {item.status === "waiting" && (
                        <>
                          <button onClick={() => handleConsulta(item)} style={S.actionBtn("#0d9488")}>
                            <i className="ri-stethoscope-line" style={{ marginRight: "0.2rem" }}></i>Atender
                          </button>
                          <button onClick={() => handleCancel(item.id)} style={S.actionBtn("#dc2626")}>
                            Cancelar
                          </button>
                        </>
                      )}
                      {item.status === "in_consultation" && (
                        <button onClick={() => navigate(`/doctor/consulta/${item.id}`)} style={S.actionBtn("#0369a1")}>
                          <i className="ri-arrow-right-line" style={{ marginRight: "0.2rem" }}></i>Continuar
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
          <div style={S.card}>
            {/* Bulk cancel header */}
            {appointmentsData.filter((a) => a.status === "scheduled").length > 0 && (
              <div style={{
                display: "flex", justifyContent: "flex-end", padding: "0.75rem 1.25rem",
                borderBottom: "1px solid #f3f4f6", backgroundColor: "#fefce8",
              }}>
                <button
                  onClick={handleBulkCancel}
                  disabled={bulkCancelMutation.isPending}
                  style={{
                    ...S.actionBtn("#dc2626"),
                    display: "flex", alignItems: "center", gap: "0.3rem",
                  }}
                >
                  <i className="ri-delete-bin-line"></i>
                  {bulkCancelMutation.isPending ? "Cancelando..." : "Cancelar todas las programadas"}
                </button>
              </div>
            )}

            <div style={{
              display: "grid", gridTemplateColumns: "0.8fr 2fr 1.5fr 1fr 1.2fr",
              padding: "0.8rem 1.25rem", backgroundColor: "#f9fafb",
              borderBottom: "2px solid #e5e7eb",
            }}>
              <span style={S.th}>Hora</span>
              <span style={S.th}>Paciente</span>
              <span style={S.th}>Motivo</span>
              <span style={S.th}>Estado</span>
              <span style={{ ...S.th, textAlign: "right" }}>Acciones</span>
            </div>

            {isLoading ? (
              <div style={S.emptyState}>Cargando citas...</div>
            ) : appointmentsData.length === 0 ? (
              <div style={S.emptyState}>
                <i className="ri-calendar-close-line" style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}></i>
                No hay citas para esta fecha.
              </div>
            ) : (
              appointmentsData.map((cita) => {
                const badge = getStatusBadge(cita.status);
                return (
                  <div
                    key={cita.id}
                    style={{
                      display: "grid", gridTemplateColumns: "0.8fr 2fr 1.5fr 1fr 1.2fr",
                      padding: "0.85rem 1.25rem", alignItems: "center",
                      borderBottom: "1px solid #f3f4f6",
                      opacity: cita.status === "cancelled" ? 0.5 : 1,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>
                      {cita.time}
                    </div>
                    <div style={{ fontWeight: 500, color: "#374151" }}>
                      {cita.patientName || "Paciente"}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                      {cita.reason || "No especificado"}
                    </div>
                    <div>
                      <span style={S.badge(badge.bg, badge.color)}>{badge.label}</span>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                      {cita.status === "present" && (
                        <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.8rem" }}>
                          <i className="ri-user-received-line"></i> En sala
                        </span>
                      )}
                      {cita.status === "scheduled" && (
                        <button onClick={() => handleCancelAppointment(cita.id)} style={S.actionBtn("#dc2626")}>
                          Cancelar
                        </button>
                      )}
                      {cita.status === "done" && (
                        <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>Completada</span>
                      )}
                      {cita.status === "cancelled" && (
                        <span style={{ color: "#9ca3af", fontSize: "0.8rem", textDecoration: "line-through" }}>Cancelada</span>
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
          <div style={S.card}>
            <div style={{
              display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1.2fr",
              padding: "0.8rem 1.25rem", backgroundColor: "#f9fafb",
              borderBottom: "2px solid #e5e7eb",
            }}>
              <span style={S.th}>Paciente</span>
              <span style={S.th}>Motivo</span>
              <span style={S.th}>Tipo</span>
              <span style={{ ...S.th, textAlign: "right" }}>Acciones</span>
            </div>

            {isLoading ? (
              <div style={S.emptyState}>Cargando...</div>
            ) : patientsDone.length === 0 ? (
              <div style={S.emptyState}>
                <i className="ri-file-list-line" style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}></i>
                No hay pacientes atendidos aun.
              </div>
            ) : (
              patientsDone.map((item) => {
                const edad = calcularEdad(item.patientDob);
                return (
                  <div
                    key={item.id}
                    style={{
                      display: "grid", gridTemplateColumns: "2.5fr 1.5fr 1fr 1.2fr",
                      padding: "0.85rem 1.25rem", alignItems: "center",
                      borderBottom: "1px solid #f3f4f6",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: "#111827" }}>{item.patientName || "Paciente"}</div>
                      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                        {edad > 0 ? `${edad} a.` : ""}{item.fileNumber ? ` | ${item.fileNumber}` : ""}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>{item.motivo || "N/A"}</div>
                    <div>
                      {item.hasAppointment ? (
                        <span style={{ ...S.appointmentBadge, ...S.withCita }}>
                          <i className="ri-calendar-check-line" style={{ fontSize: "0.75rem" }}></i>Cita
                        </span>
                      ) : (
                        <span style={{ ...S.appointmentBadge, ...S.walkIn }}>
                          <i className="ri-walk-line" style={{ fontSize: "0.75rem" }}></i>Walk-in
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <button
                        onClick={() => navigate(`/doctor/consulta-detalle/${item.id}`)}
                        style={S.actionBtn("#0d9488")}
                      >
                        <i className="ri-eye-line" style={{ marginRight: "0.2rem" }}></i>Ver detalle
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal Resumen del Dia */}
      <Modal isOpen={showSummary} onClose={() => setShowSummary(false)} title="Resumen del Dia" size="sm">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ textAlign: "center", color: "#6b7280", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
            {dateDisplay}
          </div>

          <SummaryRow icon="ri-time-line" label="Pendientes" value={counters.pending} bgColor={pendingStyle.bg} textColor={pendingStyle.accent} />
          <SummaryRow icon="ri-stethoscope-line" label="En consulta" value={counters.inConsultation} bgColor="#f0f9ff" textColor="#0369a1" />
          <SummaryRow icon="ri-check-double-line" label="Atendidos" value={counters.done} bgColor="#f0fdf4" textColor="#16a34a" />
          <SummaryRow icon="ri-close-circle-line" label="Cancelados" value={counters.cancelled} bgColor="#fef2f2" textColor="#dc2626" />

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "0.75rem", marginTop: "0.25rem" }}>
            <SummaryRow icon="ri-group-line" label="Carga total del dia" value={counters.dailyLoad} bgColor="#f9fafb" textColor="#374151" />
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "0.75rem" }}>
            <SummaryRow icon="ri-calendar-check-line" label="Con cita" value={counters.withAppointment} bgColor="#f5f3ff" textColor="#6d28d9" />
            <div style={{ marginTop: "0.5rem" }}>
              <SummaryRow icon="ri-walk-line" label="Sin cita (Walk-in)" value={counters.withoutAppointment} bgColor="#f0fdfa" textColor="#0f766e" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const SummaryRow = ({ icon, label, value, bgColor, textColor }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.7rem 1rem", backgroundColor: bgColor, borderRadius: "8px",
  }}>
    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#374151", fontWeight: 500 }}>
      <i className={icon} style={{ color: textColor }}></i>
      {label}
    </span>
    <span style={{ fontWeight: 800, fontSize: "1.2rem", color: textColor }}>{value}</span>
  </div>
);
