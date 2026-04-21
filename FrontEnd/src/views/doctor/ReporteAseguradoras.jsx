import { useMemo, useState } from "react";
import { useInsurerConsultationReport, useInsurers } from "../../hooks/useInsurers";
import { formatDateTime } from "../../lib/utils";

const today = new Date().toISOString().split("T")[0];
const firstDayOfMonth = `${today.slice(0, 8)}01`;

export const ReporteAseguradoras = () => {
  const [filters, setFilters] = useState({
    insurerId: "",
    from: firstDayOfMonth,
    to: today,
  });
  const [submittedFilters, setSubmittedFilters] = useState({
    insurerId: "",
    from: "",
    to: "",
  });

  const { data: insurers = [], isLoading: insurersLoading } = useInsurers();
  const { data: report, isLoading, isError } = useInsurerConsultationReport(submittedFilters);

  const selectedInsurer = useMemo(
    () => insurers.find((insurer) => insurer.id === submittedFilters.insurerId) || null,
    [insurers, submittedFilters.insurerId]
  );

  const onSearch = (e) => {
    e.preventDefault();
    setSubmittedFilters(filters);
  };

  const hasSearch = Boolean(submittedFilters.insurerId && submittedFilters.from && submittedFilters.to);

  return (
    <div style={{ padding: "2rem", maxWidth: "1180px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{ color: "#1f2937", margin: 0 }}>Reporte por Aseguradora</h1>
        <p style={{ color: "#6b7280", margin: "0.35rem 0 0" }}>
          Filtra las consultas por aseguradora y rango de fechas para obtener el detalle de cobro.
        </p>
      </div>

      <form
        onSubmit={onSearch}
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
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: "260px" }}>
          <label style={S.filterLabel}>Aseguradora</label>
          <select
            className="form-input"
            value={filters.insurerId}
            onChange={(e) => setFilters((prev) => ({ ...prev, insurerId: e.target.value }))}
            style={{ backgroundColor: "white" }}
          >
            <option value="">Selecciona una aseguradora</option>
            {insurers.map((insurer) => (
              <option key={insurer.id} value={insurer.id}>
                {insurer.companyName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={S.filterLabel}>Desde</label>
          <input
            type="date"
            className="form-input"
            value={filters.from}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <label style={S.filterLabel}>Hasta</label>
          <input
            type="date"
            className="form-input"
            value={filters.to}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <button type="submit" className="submit-btn" style={{ marginTop: 0, padding: "0.8rem 1.35rem" }} disabled={insurersLoading}>
          Buscar
        </button>
      </form>

      {selectedInsurer ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          <SummaryCard label="Aseguradora" value={selectedInsurer.companyName} color="#0d9488" />
          <SummaryCard label="Monto fijo actual" value={`$${Number(selectedInsurer.fixedConsultationAmount || 0).toFixed(2)}`} color="#0284c7" />
          <SummaryCard label="Pacientes atendidos" value={report?.summary?.totalPatients ?? 0} color="#16a34a" />
          <SummaryCard label="Total a cobrar" value={`$${report?.summary?.totalAmount || "0.00"}`} color="#d97706" />
        </div>
      ) : null}

      <div style={{ backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {!hasSearch ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
            Selecciona una aseguradora y un rango de fechas para generar el reporte.
          </div>
        ) : isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Generando reporte...</div>
        ) : isError ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#dc2626" }}>
            No se pudo cargar el reporte. Verifica los filtros e intenta nuevamente.
          </div>
        ) : report?.empty ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
            No se encontraron consultas para esta aseguradora en el rango seleccionado.
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontSize: "0.85rem" }}>
                  <th style={S.th}>Fecha de atencion</th>
                  <th style={S.th}>Paciente</th>
                  <th style={S.th}>DUI</th>
                  <th style={S.th}>Diagnostico</th>
                  <th style={S.th}>Monto prenegociado</th>
                </tr>
              </thead>
              <tbody>
                {(report?.items || []).map((item) => (
                  <tr key={item.consultationId} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={S.td}>{formatDateTime(item.consultationDate)}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: "#1f2937" }}>{item.patientName}</td>
                    <td style={S.td}>{item.identityDocument}</td>
                    <td style={S.td}>{item.diagnosis || "No registrado"}</td>
                    <td style={{ ...S.td, color: "#0f766e", fontWeight: 700 }}>${Number(item.agreedAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "1.25rem 1.5rem", backgroundColor: "#f8fafc", flexWrap: "wrap" }}>
              <div style={S.totalCard}>
                <span style={S.totalLabel}>Conteo total de pacientes atendidos</span>
                <strong style={S.totalValue}>{report?.summary?.totalPatients || 0}</strong>
              </div>
              <div style={S.totalCard}>
                <span style={S.totalLabel}>Suma total del monto a cobrar</span>
                <strong style={S.totalValue}>${report?.summary?.totalAmount || "0.00"}</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, color }) => (
  <div style={{ backgroundColor: "white", padding: "1.25rem", borderRadius: "1rem", boxShadow: "0 2px 4px rgba(0,0,0,0.03)", borderLeft: `5px solid ${color}` }}>
    <div style={{ color: "#6b7280", fontSize: "0.84rem", fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#1f2937", marginTop: "0.25rem" }}>{value}</div>
  </div>
);

const S = {
  filterLabel: {
    color: "#4b5563",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  th: {
    padding: "1rem 1.15rem",
    fontWeight: 600,
  },
  td: {
    padding: "1rem 1.15rem",
    color: "#4b5563",
    verticalAlign: "top",
  },
  totalCard: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "0.9rem",
    padding: "1rem 1.15rem",
    minWidth: "260px",
  },
  totalLabel: {
    color: "#6b7280",
    fontSize: "0.82rem",
    fontWeight: 600,
  },
  totalValue: {
    color: "#111827",
    fontSize: "1.35rem",
  },
};
