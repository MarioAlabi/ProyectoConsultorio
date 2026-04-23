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
    <div className="page" style={{ maxWidth: "1180px" }}>
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Reportes</span>
          <h1 className="page-header__heading">Reporte por aseguradora</h1>
          <p className="page-header__sub">
            Filtra las consultas por aseguradora y rango de fechas para obtener el detalle de cobro.
          </p>
        </div>
      </header>

      <form
        onSubmit={onSearch}
        className="card"
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          alignItems: "flex-end",
        }}
      >
        <div className="form-group" style={{ minWidth: "260px", flex: "1 1 260px" }}>
          <label className="form-label">Aseguradora</label>
          <select
            className="form-input"
            value={filters.insurerId}
            onChange={(e) => setFilters((prev) => ({ ...prev, insurerId: e.target.value }))}
          >
            <option value="">Selecciona una aseguradora</option>
            {insurers.map((insurer) => (
              <option key={insurer.id} value={insurer.id}>
                {insurer.companyName}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Desde</label>
          <input
            type="date"
            className="form-input"
            value={filters.from}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Hasta</label>
          <input
            type="date"
            className="form-input"
            value={filters.to}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={insurersLoading}>
          <i className="ri-search-line"></i> Buscar
        </button>
      </form>

      {selectedInsurer ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div className="stat-card stat-card--brand">
            <span className="stat-card__accent" />
            <div className="stat-card__label"><i className="ri-building-line"></i> Aseguradora</div>
            <div
              className="stat-card__value"
              style={{ fontSize: "1.25rem", lineHeight: 1.2 }}
            >
              {selectedInsurer.companyName}
            </div>
          </div>
          <div className="stat-card stat-card--slate">
            <span className="stat-card__accent" />
            <div className="stat-card__label"><i className="ri-money-dollar-circle-line"></i> Monto fijo actual</div>
            <div className="stat-card__value">
              ${Number(selectedInsurer.fixedConsultationAmount || 0).toFixed(2)}
            </div>
          </div>
          <div className="stat-card stat-card--forest">
            <span className="stat-card__accent" />
            <div className="stat-card__label"><i className="ri-group-line"></i> Pacientes atendidos</div>
            <div className="stat-card__value">{report?.summary?.totalPatients ?? 0}</div>
          </div>
          <div className="stat-card stat-card--ochre">
            <span className="stat-card__accent" />
            <div className="stat-card__label"><i className="ri-coins-line"></i> Total a cobrar</div>
            <div className="stat-card__value">${report?.summary?.totalAmount || "0.00"}</div>
          </div>
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {!hasSearch ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)" }}>
            Selecciona una aseguradora y un rango de fechas para generar el reporte.
          </div>
        ) : isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)" }}>
            Generando reporte…
          </div>
        ) : isError ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--accent-coral)" }}>
            No se pudo cargar el reporte. Verifica los filtros e intenta nuevamente.
          </div>
        ) : report?.empty ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)" }}>
            No se encontraron consultas para esta aseguradora en el rango seleccionado.
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha de atención</th>
                    <th>Paciente</th>
                    <th>DUI</th>
                    <th>Diagnóstico</th>
                    <th style={{ textAlign: "right" }}>Monto prenegociado</th>
                  </tr>
                </thead>
                <tbody>
                  {(report?.items || []).map((item) => (
                    <tr key={item.consultationId}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                        {formatDateTime(item.consultationDate)}
                      </td>
                      <td style={{ fontWeight: 600, color: "var(--fg-primary)" }}>{item.patientName}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--fg-muted)" }}>
                        {item.identityDocument}
                      </td>
                      <td>{item.diagnosis || "No registrado"}</td>
                      <td
                        style={{
                          color: "var(--brand)",
                          fontWeight: 700,
                          fontFamily: "var(--font-display)",
                          textAlign: "right",
                        }}
                      >
                        ${Number(item.agreedAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "1.25rem 1.5rem",
                background: "var(--bg-surface-alt)",
                flexWrap: "wrap",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <TotalCard
                label="Conteo total de pacientes atendidos"
                value={report?.summary?.totalPatients || 0}
              />
              <TotalCard
                label="Suma total del monto a cobrar"
                value={`$${report?.summary?.totalAmount || "0.00"}`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const TotalCard = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-md)",
      padding: "1rem 1.15rem",
      minWidth: "260px",
    }}
  >
    <span
      style={{
        color: "var(--fg-muted)",
        fontSize: "0.72rem",
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
    <strong
      style={{
        color: "var(--fg-primary)",
        fontSize: "1.35rem",
        fontFamily: "var(--font-display)",
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </strong>
  </div>
);
