import { useParams, useNavigate } from "react-router-dom";
import { useConsultation } from "../../hooks/useConsultations";

const label = {
  display: "block",
  fontSize: "0.72rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--fg-muted)",
  marginBottom: "0.35rem",
};

const textValue = {
  margin: 0,
  color: "var(--fg-primary)",
  fontSize: "0.95rem",
  lineHeight: 1.55,
  background: "var(--bg-surface-alt)",
  padding: "0.85rem 1rem",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border-subtle)",
  whiteSpace: "pre-wrap",
};

const diagnosisValue = {
  ...textValue,
  background: "var(--accent-ochre-soft)",
  border: "1px solid var(--accent-ochre-soft)",
  color: "var(--accent-ochre)",
};

const medCard = {
  background: "var(--accent-slate-soft)",
  border: "1px solid var(--accent-slate-soft)",
  borderRadius: "var(--radius-md)",
  padding: "1rem 1.1rem",
  marginBottom: "0.8rem",
};

const medGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "0.7rem",
};

export const ConsultaDetalleShared = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: consulta, isLoading, isError } = useConsultation(id);

  if (isLoading) {
    return (
      <div className="page" style={{ textAlign: "center", color: "var(--fg-muted)" }}>
        Cargando expediente médico…
      </div>
    );
  }

  if (isError || !consulta) {
    return (
      <div className="page" style={{ maxWidth: "900px" }}>
        <header className="page-header">
          <div className="page-header__title">
            <span className="page-header__eyebrow">Error</span>
            <h1 className="page-header__heading">No se pudo cargar la consulta</h1>
          </div>
          <div className="page-header__actions">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
              Regresar
            </button>
          </div>
        </header>
        <div
          className="card"
          style={{ textAlign: "center", color: "var(--accent-coral)", background: "var(--accent-coral-soft)" }}
        >
          <p style={{ fontWeight: 600, fontSize: "1.05rem", margin: 0 }}>
            No se pudo cargar el detalle de la consulta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: "900px" }}>
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Expediente</span>
          <h1 className="page-header__heading">Detalle de consulta médica</h1>
        </div>
        <div className="page-header__actions">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            Regresar
          </button>
        </div>
      </header>

      <section className="card" style={{ marginBottom: "1.25rem" }}>
        <h2 className="card-heading">Evaluación clínica</h2>
        <div style={{ display: "grid", gap: "1rem", marginTop: "0.75rem" }}>
          <div>
            <span style={label}>Anamnesis</span>
            <div style={textValue}>{consulta.anamnesis || "No registrado"}</div>
          </div>
          <div>
            <span style={label}>Examen físico</span>
            <div style={textValue}>{consulta.physicalExam || "No registrado"}</div>
          </div>
          <div>
            <span style={label}>Diagnóstico</span>
            <div style={diagnosisValue}>{consulta.diagnosis || "No registrado"}</div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: "1.25rem" }}>
        <h2 className="card-heading">Notas adicionales</h2>
        <div style={{ display: "grid", gap: "1rem", marginTop: "0.75rem" }}>
          <div>
            <span style={label}>Cobertura</span>
            <div style={textValue}>
              {consulta.insurer?.companyName || "Particular"}
              {consulta.agreedAmount
                ? ` | Monto aplicado: $${Number(consulta.agreedAmount).toFixed(2)}`
                : ""}
            </div>
          </div>
          <div>
            <span style={label}>Resultados de laboratorio</span>
            <div style={textValue}>{consulta.labResults || "Sin resultados reportados."}</div>
          </div>
          <div>
            <span style={label}>Observaciones médicas</span>
            <div style={textValue}>{consulta.observations || "Ninguna observación adicional."}</div>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="card-heading">Receta médica ({consulta.receta?.length || 0})</h2>
        {!consulta.receta || consulta.receta.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "1.25rem",
              color: "var(--fg-muted)",
              background: "var(--bg-surface-alt)",
              borderRadius: "var(--radius-md)",
              marginTop: "0.75rem",
            }}
          >
            No se prescribieron medicamentos en esta consulta.
          </div>
        ) : (
          <div style={{ marginTop: "0.75rem" }}>
            {consulta.receta.map((med) => (
              <div key={med.id} style={medCard}>
                <h3
                  style={{
                    margin: "0 0 0.7rem",
                    color: "var(--accent-slate)",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    fontFamily: "var(--font-display)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {med.name}{" "}
                  <span style={{ fontSize: "0.85rem", color: "var(--accent-slate)", fontWeight: 500 }}>
                    ({med.concentration} {med.concentrationUnit})
                  </span>
                </h3>
                <div style={medGrid}>
                  <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                    Dosis: <strong style={{ color: "var(--fg-primary)" }}>{med.dose} {med.doseUnit}</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                    Vía: <strong style={{ color: "var(--fg-primary)" }}>{med.route}</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                    Frecuencia: <strong style={{ color: "var(--fg-primary)" }}>Cada {med.frequency} hrs</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                    Duración: <strong style={{ color: "var(--fg-primary)" }}>Por {med.duration} días</strong>
                  </div>
                </div>
                {med.additionalInstructions && (
                  <div
                    style={{
                      marginTop: "0.7rem",
                      fontSize: "0.85rem",
                      color: "var(--accent-slate)",
                      background: "var(--bg-surface)",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <strong>Indicaciones:</strong> {med.additionalInstructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
