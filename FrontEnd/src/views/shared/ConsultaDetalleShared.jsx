import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import './Shared.css';

export const ConsultaDetalleShared = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [consulta, setConsulta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancel = false;
        const fetchDetalle = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/consultations/${id}`);
            if (!cancel) {
            setConsulta(res.data?.data);
            }
        } catch (err) {
            console.error(err);
            if (!cancel) {
            setError("No se pudo cargar el detalle de la consulta. Es posible que no se haya guardado correctamente.");
            }
        } finally {
            if (!cancel) setLoading(false);
        }
        };

        fetchDetalle();
        return () => { cancel = true; };
    }, [id]);

    // Estilos reutilizables (Modo Lectura)
    const S = {
        page: { minHeight: "100vh", background: "#f8fafc", padding: "2rem 1rem" },
        container: { maxWidth: "900px", margin: "0 auto" },
        header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" },
        title: { margin: 0, color: "#1f2937", fontSize: "1.5rem", fontWeight: 800 },
        btnBack: { 
        backgroundColor: "white", border: "1px solid #d1d5db", color: "#374151", 
        padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        },
        card: { backgroundColor: "white", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px", marginBottom: "20px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" },
        sectionTitle: { margin: "0 0 15px", color: "#0d9488", fontSize: "1.1rem", borderBottom: "2px solid #f0fdfa", paddingBottom: "8px" },
        fieldGroup: { marginBottom: "16px" },
        label: { display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#6b7280", marginBottom: "6px", textTransform: "uppercase" },
        textValue: { margin: 0, color: "#1f2937", fontSize: "0.95rem", lineHeight: "1.5", backgroundColor: "#f9fafb", padding: "12px", borderRadius: "8px", border: "1px solid #f3f4f6", whiteSpace: "pre-wrap" },
        medCard: { backgroundColor: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "16px", marginBottom: "12px" },
        medTitle: { margin: "0 0 10px", color: "#0369a1", fontSize: "1.05rem", fontWeight: 800 },
        medGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" },
        medData: { fontSize: "0.85rem", color: "#4b5563" },
        medHighlight: { fontWeight: 700, color: "#1f2937" }
    };

    if (loading) {
        return (
        <div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <p style={{ color: "#6b7280", fontSize: "1.2rem", fontWeight: "bold" }}>Cargando expediente médico...</p>
        </div>
        );
    }

    if (error || !consulta) {
        return (
        <div style={S.page}>
            <div style={S.container}>
            <div style={S.header}>
                <h1 style={S.title}>Error</h1>
                <button onClick={() => navigate(-1)} style={S.btnBack}>← Volver</button>
            </div>
            <div style={{ ...S.card, textAlign: "center", color: "#b91c1c", backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
                <p style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{error || "Consulta no encontrada."}</p>
            </div>
            </div>
        </div>
        );
    }

    return (
        <div style={S.page}>
        <div style={S.container}>
            
            {/* --- HEADER --- */}
            <div style={S.header}>
            <h1 style={S.title}>Detalle de Consulta Médica</h1>
            {/* navigate(-1) simula el botón "Atrás" del navegador */}
            <button type="button" onClick={() => navigate(-1)} style={S.btnBack}>
                ← Regresar
            </button>
            </div>

            {/* --- DATOS CLÍNICOS --- */}
            <div style={S.card}>
            <h2 style={S.sectionTitle}>Evaluación Clínica</h2>
            
            <div style={S.fieldGroup}>
                <span style={S.label}>Motivo de Consulta / Anamnesis</span>
                <div style={S.textValue}>{consulta.anamnesis || "No registrado"}</div>
            </div>

            <div style={S.fieldGroup}>
                <span style={S.label}>Examen Físico</span>
                <div style={S.textValue}>{consulta.physicalExam || "No registrado"}</div>
            </div>

            <div style={S.fieldGroup}>
                <span style={S.label}>Diagnóstico</span>
                <div style={{ ...S.textValue, backgroundColor: "#fffbeb", borderColor: "#fef08a", color: "#92400e" }}>
                {consulta.diagnosis || "No registrado"}
                </div>
            </div>
            </div>

            {/* --- RESULTADOS Y OBSERVACIONES --- */}
            <div style={S.card}>
            <h2 style={S.sectionTitle}>Notas Adicionales</h2>

            <div style={S.fieldGroup}>
                <span style={S.label}>Resultados de Laboratorio</span>
                <div style={S.textValue}>{consulta.labResults || "Sin resultados reportados."}</div>
            </div>

            <div style={S.fieldGroup}>
                <span style={S.label}>Observaciones Médicas</span>
                <div style={S.textValue}>{consulta.observations || "Ninguna observación adicional."}</div>
            </div>
            </div>

            {/* --- RECETA MÉDICA --- */}
            <div style={S.card}>
            <h2 style={S.sectionTitle}>Receta Médica ({consulta.receta?.length || 0})</h2>

            {!consulta.receta || consulta.receta.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#9ca3af", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                No se prescribieron medicamentos en esta consulta.
                </div>
            ) : (
                consulta.receta.map((med) => (
                <div key={med.id} style={S.medCard}>
                    <h3 style={S.medTitle}>
                    💊 {med.name} <span style={{ fontSize: "0.9rem", color: "#0284c7" }}>({med.concentration} {med.concentrationUnit})</span>
                    </h3>
                    
                    <div style={S.medGrid}>
                    <div style={S.medData}>
                        <span>Dosis: </span>
                        <span style={S.medHighlight}>{med.dose} {med.doseUnit}</span>
                    </div>
                    <div style={S.medData}>
                        <span>Vía: </span>
                        <span style={S.medHighlight}>{med.route}</span>
                    </div>
                    <div style={S.medData}>
                        <span>Frecuencia: </span>
                        <span style={S.medHighlight}>Cada {med.frequency} hrs</span>
                    </div>
                    <div style={S.medData}>
                        <span>Duración: </span>
                        <span style={S.medHighlight}>Por {med.duration} días</span>
                    </div>
                    </div>

                    {med.additionalInstructions && (
                    <div style={{ marginTop: "10px", fontSize: "0.85rem", color: "#0369a1", backgroundColor: "white", padding: "8px", borderRadius: "6px" }}>
                        <strong>Indicaciones:</strong> {med.additionalInstructions}
                    </div>
                    )}
                </div>
                ))
            )}
            </div>

        </div>
        </div>
    );
};