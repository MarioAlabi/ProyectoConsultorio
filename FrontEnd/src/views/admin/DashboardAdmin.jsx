import { useState, useEffect, useTransition, useMemo } from "react";
import { authClient } from "../../lib/auth-client";
import { ROLES } from "../../lib/constants/roles";

const ROLE_LABELS = {
  [ROLES.DOCTOR]: "Médico",
  [ROLES.ASSISTANT]: "Asistente / Recepción",
  [ROLES.ADMIN]: "Administrador",
};

const ROLE_BADGE = {
  [ROLES.DOCTOR]: "badge-brand",
  [ROLES.ASSISTANT]: "badge-info",
  [ROLES.ADMIN]: "badge-plum",
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

  const stats = useMemo(() => ({
    total:     usuarios.length,
    medicos:   usuarios.filter((u) => u.role === ROLES.DOCTOR).length,
    asistentes:usuarios.filter((u) => u.role === ROLES.ASSISTANT).length,
    activos:   usuarios.filter((u) => !u.banned).length,
    inactivos: usuarios.filter((u) => u.banned).length,
  }), [usuarios]);

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Panel de control</span>
          <h1 className="page-header__heading">Dashboard administrativo</h1>
          <p className="page-header__sub">
            Vista general del personal y del estado operativo del sistema.
          </p>
        </div>
        <div className="page-header__actions">
          <a href="/admin/usuarios" className="btn btn-primary">
            <i className="ri-user-add-line"></i>
            Nuevo empleado
          </a>
        </div>
      </header>

      {/* Stat cards */}
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
          label="Usuarios totales"
          value={stats.total}
          accent="brand"
          footnote="Personal registrado"
        />
        <StatCard
          icon="ri-stethoscope-line"
          label="Cuerpo médico"
          value={stats.medicos}
          accent="slate"
          footnote={`${stats.asistentes} asistentes · ${stats.medicos} médicos`}
        />
        <StatCard
          icon="ri-shield-check-line"
          label="Cuentas activas"
          value={stats.activos}
          accent="forest"
          footnote={stats.inactivos > 0 ? `${stats.inactivos} inhabilitadas` : "Todos habilitados"}
        />
        <StatCard
          icon="ri-pulse-line"
          label="Estado sistema"
          value="OK"
          accent="ochre"
          footnote="Operación normal"
        />
      </div>

      {/* Personal */}
      <section className="card-elevated" style={{ padding: 0 }}>
        <header
          style={{
            padding: "1.4rem 1.75rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 className="card-heading" style={{ marginBottom: 0 }}>Personal del sistema</h2>
            <p className="text-muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
              {isPending ? "Actualizando…" : `${usuarios.length} ${usuarios.length === 1 ? "registro" : "registros"}`}
            </p>
          </div>
          <a href="/admin/usuarios" className="btn btn-secondary btn-sm">
            Administrar <i className="ri-arrow-right-up-line"></i>
          </a>
        </header>

        {usuarios.length === 0 && !isPending ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--fg-muted)" }}>
            No hay usuarios registrados.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          aria-hidden="true"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "var(--brand-soft)",
                            color: "var(--brand)",
                            display: "grid",
                            placeItems: "center",
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            textTransform: "uppercase",
                          }}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--fg-primary)" }}>{user.name}</span>
                          <span style={{ fontSize: "0.78rem", color: "var(--fg-muted)" }}>
                            {user.dui || "Sin DUI registrado"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--fg-secondary)" }}>
                        {user.email}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ROLE_BADGE[user.role] || ""}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${!user.banned ? "badge-success" : "badge-danger"} badge-dot`}>
                        {!user.banned ? "Activo" : "Inhabilitado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

const StatCard = ({ icon, label, value, accent = "brand", footnote }) => (
  <div className={`stat-card stat-card--${accent}`}>
    <span className="stat-card__accent" />
    <div className="stat-card__label">
      {icon && <i className={icon} style={{ fontSize: "0.95rem" }}></i>}
      <span>{label}</span>
    </div>
    <div className="stat-card__value">{value}</div>
    {footnote && <div className="stat-card__meta">{footnote}</div>}
  </div>
);
