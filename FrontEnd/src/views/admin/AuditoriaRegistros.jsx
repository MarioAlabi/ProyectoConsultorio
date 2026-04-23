import { useState, useMemo } from "react";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { formatDateTime } from "../../lib/utils";

const TABLE_LABELS = {
  patients: "Paciente",
  preclinical_records: "Pre-clínica",
  medical_consultations: "Consulta Médica",
  prescribed_medications: "Medicamento",
  appointments: "Cita",
};

const ACTION_LABELS = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
  STATUS_CHANGE: "Cambio de Estado",
};

const ACTION_CLASS = {
  CREATE: "badge-success",
  UPDATE: "badge-info",
  DELETE: "badge-danger",
  STATUS_CHANGE: "badge-warning",
};

const ROLE_LABELS = {
  admin: "Administrador",
  doctor: "Médico",
  assistant: "Asistente",
};

export const AuditoriaRegistros = () => {
  const [filters, setFilters] = useState({
    tableName: "",
    action: "",
    search: "",
    from: "",
    to: "",
    page: 1,
    limit: 15,
  });

  const [expandedRow, setExpandedRow] = useState(null);
  const [searchInput, setSearchInput] = useState("");

  const { data: result, isLoading, isError, refetch, isFetching } = useAuditLogs(filters);
  const logs = result?.data || [];
  const pagination = result?.pagination || { page: 1, total: 0, totalPages: 0 };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange("search", searchInput);
  };

  const toggleExpand = (id) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Trazabilidad</span>
          <h1 className="page-header__heading">Auditoría de registros</h1>
          <p className="page-header__sub">
            Historial inmutable de cambios en expedientes médicos. Los registros no pueden ser editados ni eliminados.
          </p>
        </div>
        <div className="page-header__actions">
          <button onClick={() => refetch()} disabled={isFetching} className="btn btn-secondary">
            <i className={`ri-refresh-line${isFetching ? " ri-spin" : ""}`}></i>
            {isFetching ? "Actualizando…" : "Refrescar"}
          </button>
        </div>
      </header>

      {/* Filtros */}
      <div
        className="card"
        style={{
          padding: "1.2rem",
          marginBottom: "1.25rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
        }}
      >
        <div className="form-group" style={{ flex: "2 1 280px", minWidth: "260px" }}>
          <label className="form-label">Buscar</label>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              className="form-input"
              placeholder="Usuario o descripción…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Buscar
            </button>
          </form>
        </div>

        <div className="form-group" style={{ minWidth: "150px" }}>
          <label className="form-label">Entidad</label>
          <select
            className="form-input"
            value={filters.tableName}
            onChange={(e) => handleFilterChange("tableName", e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(TABLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ minWidth: "150px" }}>
          <label className="form-label">Acción</label>
          <select
            className="form-input"
            value={filters.action}
            onChange={(e) => handleFilterChange("action", e.target.value)}
          >
            <option value="">Todas</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ minWidth: "150px" }}>
          <label className="form-label">Desde</label>
          <input
            type="date"
            className="form-input"
            value={filters.from}
            onChange={(e) => handleFilterChange("from", e.target.value)}
          />
        </div>

        <div className="form-group" style={{ minWidth: "150px" }}>
          <label className="form-label">Hasta</label>
          <input
            type="date"
            className="form-input"
            value={filters.to}
            onChange={(e) => handleFilterChange("to", e.target.value)}
          />
        </div>

        {(filters.tableName || filters.action || filters.search || filters.from || filters.to) && (
          <button
            onClick={() => {
              setFilters({ tableName: "", action: "", search: "", from: "", to: "", page: 1, limit: 15 });
              setSearchInput("");
            }}
            className="btn btn-ghost btn-sm"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="text-muted" style={{ marginBottom: "0.8rem", fontSize: "0.85rem" }}>
        {pagination.total} registro{pagination.total !== 1 ? "s" : ""} encontrado{pagination.total !== 1 ? "s" : ""}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)" }}>
            Cargando registros de auditoría…
          </div>
        ) : isError ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--accent-coral)" }}>
            Error al cargar los registros. Intente de nuevo.
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)" }}>
            <i className="ri-inbox-line" style={{ fontSize: "1.8rem", opacity: 0.5, display: "block", marginBottom: "0.4rem" }}></i>
            No se encontraron registros de auditoría.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Descripción</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    expanded={expandedRow === log.id}
                    onToggle={() => toggleExpand(log.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.6rem",
            marginTop: "1.5rem",
          }}
        >
          <button
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page <= 1}
            className="btn btn-secondary btn-sm"
          >
            <i className="ri-arrow-left-s-line"></i> Anterior
          </button>
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            className="btn btn-secondary btn-sm"
          >
            Siguiente <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      )}
    </div>
  );
};

const LogRow = ({ log, expanded, onToggle }) => {
  const actionClass = ACTION_CLASS[log.action] || "";

  const previousValues = useMemo(() => {
    if (!log.previousValues) return null;
    try { return JSON.parse(log.previousValues); } catch { return null; }
  }, [log.previousValues]);

  const newValues = useMemo(() => {
    if (!log.newValues) return null;
    try { return JSON.parse(log.newValues); } catch { return null; }
  }, [log.newValues]);

  return (
    <>
      <tr>
        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--fg-secondary)", whiteSpace: "nowrap" }}>
          {formatDateTime(log.createdAt)}
        </td>
        <td style={{ fontWeight: 500, color: "var(--fg-primary)" }}>{log.userName}</td>
        <td style={{ fontSize: "0.82rem", color: "var(--fg-muted)" }}>
          {ROLE_LABELS[log.userRole] || log.userRole}
        </td>
        <td>
          <span className={`badge ${actionClass}`}>{ACTION_LABELS[log.action] || log.action}</span>
        </td>
        <td>
          <span className="badge">{TABLE_LABELS[log.tableName] || log.tableName}</span>
        </td>
        <td style={{ maxWidth: "320px" }}>
          <span
            style={{
              color: "var(--fg-secondary)",
              fontSize: "0.85rem",
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={log.description}
          >
            {log.description}
          </span>
        </td>
        <td style={{ textAlign: "right" }}>
          {(previousValues || newValues) && (
            <button onClick={onToggle} className="btn btn-ghost btn-sm">
              {expanded ? "Ocultar" : "Ver"}
            </button>
          )}
        </td>
      </tr>
      {expanded && (previousValues || newValues) && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div
              style={{
                padding: "1.1rem 1.5rem",
                background: "var(--bg-surface-alt)",
                borderTop: "1px solid var(--border-subtle)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                {previousValues && (
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <h4
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--accent-coral)",
                        margin: "0 0 0.5rem",
                      }}
                    >
                      Valores anteriores
                    </h4>
                    <JsonDisplay data={previousValues} />
                  </div>
                )}
                {newValues && (
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <h4
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--accent-forest)",
                        margin: "0 0 0.5rem",
                      }}
                    >
                      Valores nuevos
                    </h4>
                    <JsonDisplay data={newValues} />
                  </div>
                )}
              </div>
              {log.ipAddress && (
                <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--fg-subtle)", fontFamily: "var(--font-mono)" }}>
                  IP: {log.ipAddress}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const FIELD_LABELS = {
  fullName: "Nombre completo",
  identityDocument: "DUI",
  dateOfBirth: "Fecha de nacimiento",
  yearOfBirth: "Fecha de nacimiento",
  gender: "Género",
  phone: "Teléfono",
  address: "Dirección",
  fileNumber: "No. Expediente",
  isMinor: "Menor de edad",
  responsibleName: "Responsable",
  personalHistory: "Antecedentes personales",
  familyHistory: "Antecedentes familiares",
  status: "Estado",
  motivo: "Motivo",
  bloodPressure: "Presión arterial",
  temperature: "Temperatura",
  weight: "Peso",
  height: "Talla",
  heartRate: "Frecuencia cardíaca",
  oxygenSaturation: "Saturación O₂",
  bmi: "IMC",
  diagnosis: "Diagnóstico",
  anamnesis: "Anamnesis",
  physicalExam: "Examen físico",
  observations: "Observaciones",
  patientId: "ID Paciente",
  date: "Fecha",
  time: "Hora",
  reason: "Motivo",
  medicationsCount: "Medicamentos recetados",
  count: "Cantidad",
};

const JsonDisplay = ({ data }) => {
  if (!data || typeof data !== "object") return null;

  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "0.75rem 1rem",
      }}
    >
      {Object.entries(data).map(([key, value]) => {
        if (value === null || value === undefined) return null;
        const label = FIELD_LABELS[key] || key;
        const displayValue =
          typeof value === "boolean"
            ? value ? "Sí" : "No"
            : typeof value === "object"
            ? JSON.stringify(value)
            : String(value);

        return (
          <div
            key={key}
            style={{
              display: "flex",
              gap: "0.5rem",
              padding: "0.3rem 0",
              borderBottom: "1px solid var(--border-subtle)",
              fontSize: "0.82rem",
            }}
          >
            <span style={{ color: "var(--fg-muted)", fontWeight: 500, minWidth: "140px", flexShrink: 0 }}>
              {label}:
            </span>
            <span style={{ color: "var(--fg-primary)", wordBreak: "break-word", fontFamily: "var(--font-mono)" }}>
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
};
