import { useState, useEffect, useTransition } from "react";
import { authClient } from "../../lib/auth-client";
import { ROLES } from "../../lib/constants/roles";

const ROLE_LABELS = {
  [ROLES.DOCTOR]: "Medico",
  [ROLES.ASSISTANT]: "Asistente / Recepcion",
  [ROLES.ADMIN]: "Administrador",
};

export const DashboardAdmin = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const { data, error } = await authClient.admin.listUsers({ query: { limit: 100 } });
      if (!error && data) setUsuarios(data.users);
    });
  }, []);

  const totalUsuarios = usuarios.length;
  const totalMedicos = usuarios.filter((u) => u.role === ROLES.DOCTOR).length;
  const totalActivos = usuarios.filter((u) => !u.banned).length;

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ color: "#1f2937", marginBottom: "0.5rem" }}>Dashboard Administrativo</h1>
      <p style={{ color: "#4b5563", marginBottom: "2rem" }}>Panel de control de la Clinica Esperanza de Vida.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
        <StatCard label="Usuarios Totales" value={totalUsuarios} color="#0d9488" />
        <StatCard label="Cuerpo Medico" value={totalMedicos} color="#0ea5e9" />
        <StatCard label="Cuentas Activas" value={totalActivos} color="#10b981" />
      </div>

      <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontSize: "1.25rem", color: "#0d9488", marginBottom: "1.5rem" }}>
          Personal del Sistema {isPending && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>(Actualizando...)</span>}
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontSize: "0.9rem" }}>
              <th style={{ padding: "1rem" }}>Nombre</th>
              <th style={{ padding: "1rem" }}>Rol</th>
              <th style={{ padding: "1rem" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "1rem", fontWeight: 500, color: "#1f2937" }}>{user.name}</td>
                <td style={{ padding: "1rem", color: "#6b7280" }}>{ROLE_LABELS[user.role] || user.role}</td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ backgroundColor: !user.banned ? "#dcfce7" : "#fee2e2", color: !user.banned ? "#166534" : "#991b1b", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 600 }}>
                    {!user.banned ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && !isPending && (
              <tr><td colSpan="3" style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>No hay usuarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "1rem", boxShadow: "0 2px 4px rgba(0,0,0,0.03)", borderLeft: `5px solid ${color}` }}>
    <div style={{ color: "#6b7280", fontSize: "0.875rem", fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#1f2937", marginTop: "0.25rem" }}>{value}</div>
  </div>
);
