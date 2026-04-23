import { useNavigate } from "react-router-dom";
import { usePatients } from "../../hooks/usePatients";
import { useWaitingRoom } from "../../hooks/usePreclinical";
import { useAppointments, useUpdateAppointmentStatus } from "../../hooks/useAppointments";
import { getStatusBadge } from "../../lib/utils";

const hoy = new Date().toISOString().split("T")[0];

export const DashboardRecepcion = () => {
  const navigate = useNavigate();
  const { data: patients = [], isLoading: loadingPats } = usePatients("");
  const { data: waitingList = [], isLoading: loadingWait } = useWaitingRoom();
  const { data: citasHoy = [], isLoading: loadingCitas } = useAppointments(hoy);
  const statusMutation = useUpdateAppointmentStatus();

  const nuevosHoy = patients.filter((p) => p.createdAt?.startsWith(hoy)).length;
  const pendientes = waitingList.filter((w) => w.status === "waiting").length;
  const citasProgramadas = citasHoy.filter((c) => c.status === "scheduled").length;
  const citasPresentes = citasHoy.filter((c) => c.status === "present").length;
  const ultimos5 = patients.slice(0, 5);

  // Pacientes ya en la cola clínica del doctor (pre-clínica tomada).
  // Se usa para decidir si "Llegó" ya tiene un siguiente paso o la recepción
  // debe todavía pasar al paciente a la toma de signos vitales.
  const patientsInClinicalQueue = new Set(
    waitingList
      .filter((w) => w.status === "waiting" || w.status === "in_consultation")
      .map((w) => w.patientId)
  );

  const loading = loadingPats || loadingWait || loadingCitas;

  const cambiarEstado = (id, nuevoEstado) => {
    statusMutation.mutate({ id, status: nuevoEstado });
  };

  /**
   * Envía al paciente de la cita hacia la toma de signos vitales (pre-clínica).
   * Se reusa el mismo state-shape que la tabla de "Últimos pacientes" para que
   * PreClinicaShared.jsx pueda pre-seleccionar al paciente sin búsqueda.
   */
  const irAPreclinica = (cita) => {
    if (!cita?.patientId) return;
    navigate("/reception/preclinica", {
      state: {
        paciente: {
          id: cita.patientId,
          fullName: cita.patientName,
          patientName: cita.patientName,
          fileNumber: cita.patientFileNumber || "",
        },
        redirectTo: "/reception",
      },
    });
  };

  const fechaLegible = new Date(hoy + "T12:00:00").toLocaleDateString("es-SV", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Recepción y admisión</span>
          <h1 className="page-header__heading">Panel de recepción</h1>
          <p className="page-header__sub">{fechaLegible}</p>
        </div>
        <div className="page-header__actions">
          <button onClick={() => navigate("/reception/preclinica")} className="btn btn-secondary">
            <i className="ri-heart-pulse-line"></i> Nueva pre-clínica
          </button>
          <button onClick={() => navigate("/reception/pacientes")} className="btn btn-primary">
            <i className="ri-user-add-line"></i> Nuevo paciente
          </button>
        </div>
      </header>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          icon="ri-group-line"
          label="Pacientes totales"
          value={loading ? "…" : patients.length}
          meta="Registrados en el sistema"
          accent="brand"
        />
        <StatCard
          icon="ri-user-add-line"
          label="Nuevos hoy"
          value={loading ? "…" : nuevosHoy}
          meta="Ingresos del día"
          accent="slate"
        />
        <StatCard
          icon="ri-calendar-check-line"
          label="Citas de hoy"
          value={loading ? "…" : citasHoy.length}
          meta={`${citasProgramadas} programadas · ${citasPresentes} presentes`}
          accent="plum"
        />
        <StatCard
          icon="ri-heart-pulse-line"
          label="Pre-clínica pendiente"
          value={loading ? "…" : pendientes}
          meta="En espera de consulta"
          accent="ochre"
        />
      </div>

      {/* Acciones rápidas */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 className="section-divider">Acciones rápidas</h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <QuickAction
            icon="ri-folder-3-line"
            title="Expedientes"
            description="Gestionar pacientes"
            onClick={() => navigate("/reception/pacientes")}
          />
          <QuickAction
            icon="ri-heart-pulse-line"
            title="Pre-clínica"
            description="Tomar signos vitales"
            onClick={() => navigate("/reception/preclinica", { state: { redirectTo: "/reception" } })}
          />
          <QuickAction
            icon="ri-calendar-line"
            title="Agenda"
            description="Ver calendario completo"
            onClick={() => navigate("/reception/agenda")}
          />
        </div>
      </section>

      {/* Citas de hoy */}
      <section className="card-elevated" style={{ padding: 0, marginBottom: "1.5rem" }}>
        <header
          style={{
            padding: "1.2rem 1.75rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <div>
            <h2 className="card-heading" style={{ marginBottom: 0 }}>Citas de hoy</h2>
            <p className="text-muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
              {loadingCitas ? "Cargando…" : `${citasHoy.length} ${citasHoy.length === 1 ? "cita" : "citas"} programadas`}
            </p>
          </div>
          <span className="badge badge-plum">{hoy}</span>
        </header>

        {loadingCitas ? (
          <p style={{ textAlign: "center", padding: "2.5rem", color: "var(--fg-muted)" }}>Cargando citas…</p>
        ) : citasHoy.length === 0 ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--fg-muted)" }}>
            <i className="ri-calendar-close-line" style={{ fontSize: "1.8rem", opacity: 0.5, display: "block", marginBottom: "0.4rem" }}></i>
            No hay citas programadas para hoy.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "90px" }}>Hora</th>
                  <th>Paciente</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {citasHoy.map((c) => {
                  const badge = getStatusBadge(c.status);
                  return (
                    <tr key={c.id} style={{ opacity: c.status === "cancelled" ? 0.5 : 1 }}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--fg-primary)" }}>{c.time}</td>
                      <td style={{ fontWeight: 500, color: "var(--fg-primary)" }}>{c.patientName || "Paciente"}</td>
                      <td style={{ fontSize: "0.88rem" }}>{c.reason || "No especificado"}</td>
                      <td>
                        <span
                          className="badge"
                          style={{ background: badge.bg, color: badge.color, border: "none" }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {c.status === "scheduled" && (
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                            <button onClick={() => cambiarEstado(c.id, "present")} className="btn btn-primary btn-sm">
                              <i className="ri-check-line"></i> Llegó
                            </button>
                            <button onClick={() => cambiarEstado(c.id, "cancelled")} className="btn btn-danger btn-sm">
                              Cancelar
                            </button>
                          </div>
                        )}
                        {c.status === "present" && (
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", alignItems: "center" }}>
                            {patientsInClinicalQueue.has(c.patientId) ? (
                              <span
                                className="badge badge-success"
                                title="El paciente ya está en la cola del doctor"
                              >
                                <i className="ri-user-received-line"></i> En sala de espera
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => irAPreclinica(c)}
                                className="btn btn-primary btn-sm"
                                title="Pasar a la toma de signos vitales para habilitar la atención del doctor"
                              >
                                <i className="ri-heart-pulse-line"></i> Tomar signos
                              </button>
                            )}
                          </div>
                        )}
                        {c.status === "done" && (
                          <span style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>Atendido</span>
                        )}
                        {c.status === "cancelled" && (
                          <span style={{ color: "var(--fg-subtle)", fontSize: "0.85rem", textDecoration: "line-through" }}>
                            Cancelada
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Últimos pacientes */}
      <section className="card-elevated" style={{ padding: 0 }}>
        <header
          style={{
            padding: "1.2rem 1.75rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 className="card-heading" style={{ marginBottom: 0 }}>
            Últimos pacientes registrados
          </h2>
          <button onClick={() => navigate("/reception/pacientes")} className="btn btn-ghost btn-sm">
            Ver todos <i className="ri-arrow-right-line"></i>
          </button>
        </header>

        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Expediente</th>
                <th>Tipo</th>
                <th style={{ textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ultimos5.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: "var(--fg-primary)" }}>{p.fullName}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--fg-muted)" }}>{p.fileNumber}</td>
                  <td>
                    <span className={`badge ${p.isMinor ? "badge-warning" : "badge-success"}`}>
                      {p.isMinor ? "Menor" : "Adulto"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => navigate("/reception/preclinica", { state: { paciente: p, redirectTo: "/reception" } })}
                      className="btn btn-ghost btn-sm"
                    >
                      <i className="ri-heart-pulse-line"></i> Tomar signos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && ultimos5.length === 0 && (
            <p style={{ textAlign: "center", padding: "2rem", color: "var(--fg-subtle)" }}>No hay pacientes registrados.</p>
          )}
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ icon, label, value, meta, accent = "brand" }) => (
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

const QuickAction = ({ icon, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "0.9rem",
      padding: "1rem 1.25rem",
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      color: "var(--fg-primary)",
      cursor: "pointer",
      transition: "all 200ms var(--ease-smooth)",
      textAlign: "left",
      minWidth: "220px",
      flex: "1 1 220px",
      font: "inherit",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = "var(--brand)";
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "var(--shadow-md)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = "var(--border-subtle)";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "none";
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: "var(--radius-md)",
        background: "var(--brand-soft)",
        color: "var(--brand)",
        display: "grid",
        placeItems: "center",
        fontSize: "1.15rem",
        flexShrink: 0,
      }}
    >
      <i className={icon}></i>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      <span style={{ fontWeight: 600, fontSize: "0.92rem", color: "var(--fg-primary)" }}>{title}</span>
      <span style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>{description}</span>
    </div>
  </button>
);
