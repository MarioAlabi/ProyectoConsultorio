import { useParams, useNavigate } from "react-router-dom";
import { useConsultation } from "../../hooks/useConsultations";
import "./Shared.css";

export const ConsultaDetalleShared = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: consulta, isLoading, isError } = useConsultation(id);

  const S = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: "2rem 1rem" },
    container: { maxWidth: "900px", margin: "0 auto" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
    title: { margin: 0, color: "#1f2937", fontSize: "1.5rem", fontWeight: 800 },
    btnBack: { backgroundColor: "white", border: "1px solid #d1d5db", color: "#374151", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" },
    card: { backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
    sectionTitle: { margin: "0 0 15px", color: "#0d9488", fontSize: "1.1rem", borderBottom: "2px solid #f0fdfa", paddingBottom: "8px" },
    label: { display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase" },
    textValue: { margin: 0, color: "#1f2937", fontSize: "0.95rem", lineHeight: "1.5", backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", border: "1px solid #f3f4f6", whiteSpace: "pre-wrap" },
    medCard: { backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "16px", marginBottom: "12px" },
    medTitle: { margin: "0 0 10px", color: "#0369a1", fontSize: "1.05rem", fontWeight: 800 },
    medGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" },
  };

  if (isLoading) {
    return (<div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "#6b7280", fontSize: "1.2rem", fontWeight: "bold" }}>Cargando expediente medico...</p></div>);
  }

  if (isError || !consulta) {
    return (
      <div style={S.page}><div style={S.container}>
        <div style={S.header}><h1 style={S.title}>Error</h1><button onClick={() => navigate(-1)} style={S.btnBack}>Volver</button></div>
        <div style={{ ...S.card, textAlign: "center", color: "#b91c1c", backgroundColor: "#fef2f2", borderColor: "#fecaca" }}><p style={{ fontWeight: "bold", fontSize: "1.1rem" }}>No se pudo cargar el detalle de la consulta.</p></div>
      </div></div>
    );
  }

  return (
    <div style={S.page}><div style={S.container}>
      <div style={S.header}><h1 style={S.title}>Detalle de Consulta Medica</h1><button type="button" onClick={() => navigate(-1)} style={S.btnBack}>Regresar</button></div>

      <div style={S.card}>
        <h2 style={S.sectionTitle}>Evaluacion Clinica</h2>
        <div style={{ marginBottom: "16px" }}><span style={S.label}>Anamnesis</span><div style={S.textValue}>{consulta.anamnesis || "No registrado"}</div></div>
        <div style={{ marginBottom: "16px" }}><span style={S.label}>Examen Fisico</span><div style={S.textValue}>{consulta.physicalExam || "No registrado"}</div></div>
        <div style={{ marginBottom: "16px" }}><span style={S.label}>Diagnostico</span><div style={{ ...S.textValue, backgroundColor: "#fffbeb", borderColor: "#fef08a", color: "#92400e" }}>{consulta.diagnosis || "No registrado"}</div></div>
      </div>

      <div style={S.card}>
        <h2 style={S.sectionTitle}>Notas Adicionales</h2>
        <div style={{ marginBottom: "16px" }}><span style={S.label}>Resultados de Laboratorio</span><div style={S.textValue}>{consulta.labResults || "Sin resultados reportados."}</div></div>
        <div style={{ marginBottom: "16px" }}><span style={S.label}>Observaciones Medicas</span><div style={S.textValue}>{consulta.observations || "Ninguna observacion adicional."}</div></div>
      </div>

      <div style={S.card}>
        <h2 style={S.sectionTitle}>Receta Medica ({consulta.receta?.length || 0})</h2>
        {!consulta.receta || consulta.receta.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", backgroundColor: "#f9fafb", borderRadius: "8px" }}>No se prescribieron medicamentos en esta consulta.</div>
        ) : (
          consulta.receta.map((med) => (
            <div key={med.id} style={S.medCard}>
              <h3 style={S.medTitle}>{med.name} <span style={{ fontSize: "0.9rem", color: "#0284c7" }}>({med.concentration} {med.concentrationUnit})</span></h3>
              <div style={S.medGrid}>
                <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>Dosis: <strong style={{ color: "#1f2937" }}>{med.dose} {med.doseUnit}</strong></div>
                <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>Via: <strong style={{ color: "#1f2937" }}>{med.route}</strong></div>
                <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>Frecuencia: <strong style={{ color: "#1f2937" }}>Cada {med.frequency} hrs</strong></div>
                <div style={{ fontSize: "0.85rem", color: "#4b5563" }}>Duracion: <strong style={{ color: "#1f2937" }}>Por {med.duration} dias</strong></div>
              </div>
              {med.additionalInstructions && (<div style={{ marginTop: "10px", fontSize: "0.85rem", color: "#0369a1", backgroundColor: "white", padding: "8px", borderRadius: "6px" }}><strong>Indicaciones:</strong> {med.additionalInstructions}</div>)}
            </div>
          ))
        )}
      </div>
    </div></div>
  );
};
