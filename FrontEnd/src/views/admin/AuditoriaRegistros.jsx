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

const ACTION_COLORS = {
  CREATE: { bg: "#dcfce7", color: "#166534" },
  UPDATE: { bg: "#dbeafe", color: "#1e40af" },
  DELETE: { bg: "#fee2e2", color: "#991b1b" },
  STATUS_CHANGE: { bg: "#fef3c7", color: "#92400e" },
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
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h1 style={{ color: "#1f2937", margin: 0 }}>
          Auditoría de Registros
        </h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          style={{
            ...S.searchBtn,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            opacity: isFetching ? 0.6 : 1,
            cursor: isFetching ? "default" : "pointer",
          }}
        >
          <i className={`ri-refresh-line${isFetching ? " ri-spin" : ""}`} style={{ fontSize: "1rem" }} />
          {isFetching ? "Actualizando..." : "Refrescar"}
        </button>
      </div>
      <p style={{ color: "#4b5563", marginBottom: "2rem" }}>
        Historial de cambios en expedientes médicos. Los registros no pueden ser
        editados ni eliminados.
      </p>

      {/* Filtros */}
      <div
        style={{
          backgroundColor: "white",
          padding: "1.5rem",
          borderRadius: "1rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={S.filterLabel}>Buscar</label>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Usuario o descripción..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={S.input}
            />
            <button type="submit" style={S.searchBtn}>
              Buscar
            </button>
          </form>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={S.filterLabel}>Entidad</label>
          <select
            value={filters.tableName}
            onChange={(e) => handleFilterChange("tableName", e.target.value)}
            style={S.select}
          >
            <option value="">Todas</option>
            {Object.entries(TABLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={S.filterLabel}>Acción</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange("action", e.target.value)}
            style={S.select}
          >
            <option value="">Todas</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={S.filterLabel}>Desde</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => handleFilterChange("from", e.target.value)}
            style={S.input}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={S.filterLabel}>Hasta</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => handleFilterChange("to", e.target.value)}
            style={S.input}
          />
        </div>

        {(filters.tableName || filters.action || filters.search || filters.from || filters.to) && (
          <button
            onClick={() => {
              setFilters({ tableName: "", action: "", search: "", from: "", to: "", page: 1, limit: 15 });
              setSearchInput("");
            }}
            style={S.clearBtn}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador */}
      <div style={{ marginBottom: "1rem", color: "#6b7280", fontSize: "0.875rem" }}>
        {pagination.total} registro{pagination.total !== 1 ? "s" : ""} encontrado{pagination.total !== 1 ? "s" : ""}
      </div>

      {/* Tabla */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
            Cargando registros de auditoría...
          </div>
        ) : isError ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
            Error al cargar los registros. Intente de nuevo.
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
            No se encontraron registros de auditoría.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontSize: "0.85rem" }}>
                <th style={S.th}>Fecha y Hora</th>
                <th style={S.th}>Usuario</th>
                <th style={S.th}>Rol</th>
                <th style={S.th}>Acción</th>
                <th style={S.th}>Entidad</th>
                <th style={S.th}>Descripción</th>
                <th style={S.th}>Detalle</th>
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
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "0.5rem",
            marginTop: "1.5rem",
          }}
        >
          <button
            onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page <= 1}
            style={{
              ...S.pageBtn,
              opacity: pagination.page <= 1 ? 0.4 : 1,
              cursor: pagination.page <= 1 ? "default" : "pointer",
            }}
          >
            Anterior
          </button>
          <span style={{ color: "#4b5563", fontSize: "0.875rem" }}>
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            style={{
              ...S.pageBtn,
              opacity: pagination.page >= pagination.totalPages ? 0.4 : 1,
              cursor: pagination.page >= pagination.totalPages ? "default" : "pointer",
            }}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

const LogRow = ({ log, expanded, onToggle }) => {
  const actionStyle = ACTION_COLORS[log.action] || { bg: "#f3f4f6", color: "#6b7280" };

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
      <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
        <td style={S.td}>
          <span style={{ fontSize: "0.82rem", color: "#374151" }}>
            {formatDateTime(log.createdAt)}
          </span>
        </td>
        <td style={{ ...S.td, fontWeight: 500, color: "#1f2937" }}>
          {log.userName}
        </td>
        <td style={S.td}>
          <span style={{ color: "#6b7280", fontSize: "0.82rem" }}>
            {ROLE_LABELS[log.userRole] || log.userRole}
          </span>
        </td>
        <td style={S.td}>
          <span
            style={{
              backgroundColor: actionStyle.bg,
              color: actionStyle.color,
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              fontSize: "0.75rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {ACTION_LABELS[log.action] || log.action}
          </span>
        </td>
        <td style={S.td}>
          <span style={{ color: "#374151", fontSize: "0.85rem" }}>
            {TABLE_LABELS[log.tableName] || log.tableName}
          </span>
        </td>
        <td style={{ ...S.td, maxWidth: "280px" }}>
          <span
            style={{
              color: "#4b5563",
              fontSize: "0.82rem",
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
        <td style={S.td}>
          {(previousValues || newValues) && (
            <button onClick={onToggle} style={S.detailBtn}>
              {expanded ? "Ocultar" : "Ver"}
            </button>
          )}
        </td>
      </tr>
      {expanded && (previousValues || newValues) && (
        <tr>
          <td colSpan={7} style={{ padding: "0" }}>
            <div style={S.expandedContainer}>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                {previousValues && (
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <h4 style={S.expandedTitle}>Valores Anteriores</h4>
                    <JsonDisplay data={previousValues} />
                  </div>
                )}
                {newValues && (
                  <div style={{ flex: 1, minWidth: "250px" }}>
                    <h4 style={{ ...S.expandedTitle, color: "#166534" }}>Valores Nuevos</h4>
                    <JsonDisplay data={newValues} />
                  </div>
                )}
              </div>
              {log.ipAddress && (
                <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#9ca3af" }}>
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
    <div style={S.jsonContainer}>
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
          <div key={key} style={S.jsonRow}>
            <span style={S.jsonKey}>{label}:</span>
            <span style={S.jsonValue}>{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
};

/* Estilos inline (consistentes con DashboardAdmin) */
const S = {
  filterLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#4b5563",
  },
  input: {
    padding: "0.55rem 0.75rem",
    border: "1.5px solid #d1d5db",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    outline: "none",
    minWidth: "160px",
  },
  select: {
    padding: "0.55rem 0.75rem",
    border: "1.5px solid #d1d5db",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    outline: "none",
    backgroundColor: "white",
    minWidth: "130px",
  },
  searchBtn: {
    backgroundColor: "#0d9488",
    color: "white",
    padding: "0.55rem 1rem",
    border: "none",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  clearBtn: {
    padding: "0.55rem 1rem",
    border: "1.5px solid #d1d5db",
    borderRadius: "0.5rem",
    fontSize: "0.82rem",
    fontWeight: 500,
    color: "#6b7280",
    backgroundColor: "white",
    cursor: "pointer",
  },
  th: {
    padding: "0.85rem 1rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "0.75rem 1rem",
    color: "#374151",
    fontSize: "0.875rem",
    verticalAlign: "top",
  },
  detailBtn: {
    padding: "0.25rem 0.65rem",
    fontSize: "0.78rem",
    fontWeight: 600,
    border: "1px solid #d1d5db",
    borderRadius: "0.4rem",
    backgroundColor: "#f9fafb",
    color: "#374151",
    cursor: "pointer",
  },
  pageBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
    fontWeight: 500,
    border: "1.5px solid #d1d5db",
    borderRadius: "0.5rem",
    backgroundColor: "white",
    color: "#374151",
    cursor: "pointer",
  },
  expandedContainer: {
    padding: "1rem 2rem 1.25rem",
    backgroundColor: "#f9fafb",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
  },
  expandedTitle: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "#991b1b",
    marginBottom: "0.5rem",
    marginTop: 0,
  },
  jsonContainer: {
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "0.5rem",
    padding: "0.75rem 1rem",
  },
  jsonRow: {
    display: "flex",
    gap: "0.5rem",
    padding: "0.25rem 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "0.8rem",
  },
  jsonKey: {
    color: "#6b7280",
    fontWeight: 500,
    minWidth: "140px",
    flexShrink: 0,
  },
  jsonValue: {
    color: "#1f2937",
    wordBreak: "break-word",
  },
};
