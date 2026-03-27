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

  const loading = loadingPats || loadingWait || loadingCitas;

  const cambiarEstado = (id, nuevoEstado) => {
    statusMutation.mutate({ id, status: nuevoEstado });
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ color: "#1f2937", fontSize: "2rem", margin: 0 }}>Recepcion y Admision</h1>
        <p style={{ color: "#6b7280", marginTop: "0.5rem" }}>Panel de control de la Clinica Esperanza de Vida.</p>
      </header>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
        <StatCard title="Pacientes Totales" value={loading ? "..." : patients.length} sub="Registrados en el sistema" color="#0d9488" />
        <StatCard title="Nuevos Hoy" value={loading ? "..." : nuevosHoy} sub="Ingresos del dia" color="#0ea5e9" />
        <StatCard title="Citas Hoy" value={loading ? "..." : citasHoy.length} sub={`${citasProgramadas} programadas, ${citasPresentes} presentes`} color="#8b5cf6" />
        <StatCard title="Pendientes Pre-clinica" value={loading ? "..." : pendientes} sub="En espera para consulta" color="#f59e0b" />
      </div>

      {/* Acciones rapidas */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h3 style={{ color: "#374151", marginBottom: "1rem" }}>Acciones Rapidas</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <ActionBtn label="Gestionar Expedientes" icon="ri-folder-line" onClick={() => navigate("/reception/pacientes")} />
          <ActionBtn label="Ir a Pre-clinica" icon="ri-stethoscope-line" color="#0ea5e9" onClick={() => navigate("/reception/preclinica", { state: { redirectTo: "/reception" } })} />
          <ActionBtn label="Ver Agenda Completa" icon="ri-calendar-line" color="#8b5cf6" onClick={() => navigate("/reception/agenda")} />
        </div>
      </div>

      {/* Citas de Hoy */}
      <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.2rem" }}>
          <h3 style={{ color: "#8b5cf6", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <i className="ri-calendar-check-line"></i> Citas de Hoy
          </h3>
          <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{hoy}</span>
        </div>

        {loadingCitas ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>Cargando citas...</p>
        ) : citasHoy.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>No hay citas programadas para hoy.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "0.85rem" }}>
                  <th style={{ padding: "0.8rem 1rem" }}>Hora</th>
                  <th style={{ padding: "0.8rem 1rem" }}>Paciente</th>
                  <th style={{ padding: "0.8rem 1rem" }}>Motivo</th>
                  <th style={{ padding: "0.8rem 1rem" }}>Estado</th>
                  <th style={{ padding: "0.8rem 1rem", textAlign: "right" }}>Accion</th>
                </tr>
              </thead>
              <tbody>
                {citasHoy.map((c) => {
                  const badge = getStatusBadge(c.status);
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #f9fafb", opacity: c.status === "cancelled" ? 0.5 : 1 }}>
                      <td style={{ padding: "0.8rem 1rem", fontWeight: 700, color: "#1f2937", fontSize: "1rem" }}>{c.time}</td>
                      <td style={{ padding: "0.8rem 1rem", fontWeight: 500 }}>{c.patientName || "Paciente"}</td>
                      <td style={{ padding: "0.8rem 1rem", color: "#6b7280", fontSize: "0.9rem" }}>{c.reason || "No especificado"}</td>
                      <td style={{ padding: "0.8rem 1rem" }}>
                        <span style={{ backgroundColor: badge.bg, color: badge.color, padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600 }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "0.8rem 1rem", textAlign: "right" }}>
                        {c.status === "scheduled" && (
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button onClick={() => cambiarEstado(c.id, "present")} className="doc-btn" style={{ color: "#0d9488", fontWeight: 600 }}>
                              <i className="ri-check-line"></i> Llego
                            </button>
                            <button onClick={() => cambiarEstado(c.id, "cancelled")} className="doc-btn" style={{ color: "#ef4444" }}>
                              Cancelar
                            </button>
                          </div>
                        )}
                        {c.status === "present" && (
                          <span style={{ color: "#166534", fontWeight: 600, fontSize: "0.85rem" }}>
                            <i className="ri-user-received-line"></i> En recepcion
                          </span>
                        )}
                        {c.status === "done" && (
                          <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>Atendido</span>
                        )}
                        {c.status === "cancelled" && (
                          <span style={{ color: "#9ca3af", fontSize: "0.85rem", textDecoration: "line-through" }}>Cancelada</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ultimos pacientes */}
      <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <h3 style={{ color: "#0d9488", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <i className="ri-group-line"></i> Ultimos Pacientes Registrados
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontSize: "0.9rem" }}>
              <th style={{ padding: "1rem" }}>Paciente</th>
              <th style={{ padding: "1rem" }}>Expediente</th>
              <th style={{ padding: "1rem" }}>Tipo</th>
              <th style={{ padding: "1rem", textAlign: "right" }}>Accion</th>
            </tr>
          </thead>
          <tbody>
            {ultimos5.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                <td style={{ padding: "1rem", fontWeight: "500" }}>{p.fullName}</td>
                <td style={{ padding: "1rem", color: "#6b7280" }}>{p.fileNumber}</td>
                <td style={{ padding: "1rem" }}><span style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "1rem", backgroundColor: p.isMinor ? "#fef3c7" : "#dcfce7", color: p.isMinor ? "#92400e" : "#166534" }}>{p.isMinor ? "Menor" : "Adulto"}</span></td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  <button onClick={() => navigate("/reception/preclinica", { state: { paciente: p, redirectTo: "/reception" } })} style={{ background: "none", border: "none", color: "#0ea5e9", cursor: "pointer", fontWeight: "bold" }}>Tomar Signos</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && ultimos5.length === 0 && <p style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>No hay pacientes registrados.</p>}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, color }) => (
  <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", borderLeft: `4px solid ${color}` }}>
    <h3 style={{ color: "#6b7280", fontSize: "0.9rem", margin: "0 0 0.5rem 0", fontWeight: 500 }}>{title}</h3>
    <p style={{ fontSize: "2.2rem", fontWeight: 800, margin: 0, color: "#111827" }}>{value}</p>
    <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>{sub}</span>
  </div>
);

const ActionBtn = ({ label, icon, onClick, color = "#0d9488" }) => (
  <button onClick={onClick} style={{ backgroundColor: color, color: "white", border: "none", padding: "1rem 1.5rem", borderRadius: "0.8rem", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
    <i className={icon}></i> {label}
  </button>
);
