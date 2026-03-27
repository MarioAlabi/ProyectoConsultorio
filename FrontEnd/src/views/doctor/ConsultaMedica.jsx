import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { consultationSchema } from "../../lib/validations/consultationSchema";
import { usePreclinicalRecord } from "../../hooks/usePreclinical";
import { useFinishConsultation } from "../../hooks/useConsultations";
import { calcularEdad, clasificarIMC } from "../../lib/utils";
import "../../views/shared/Shared.css";

const toNull = (v) => (v === "" || v === undefined ? null : v);

export const ConsultaMedica = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = usePreclinicalRecord(id);
  const finishMutation = useFinishConsultation();

  const [medicamentos, setMedicamentos] = useState([]);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(consultationSchema),
    defaultValues: { anamnesis: "", physicalExam: "", diagnosis: "", labResults: "", observations: "" },
  });

  const bmi = useMemo(() => {
    if (!data?.weight || !data?.height) return null;
    const wKg = parseFloat(data.weight) * 0.453592;
    return (wKg / (parseFloat(data.height) ** 2)).toFixed(2);
  }, [data]);

  const imcInfo = clasificarIMC(bmi ? parseFloat(bmi) : null);

  const agregarMedicamento = () => {
    setMedicamentos([...medicamentos, { name: "", concentration: "", concentrationUnit: "mg", dose: "", doseUnit: "tableta(s)", route: "Oral", frequency: "", duration: "", additionalInstructions: "" }]);
  };

  const updateMed = (idx, field, value) => {
    const copy = [...medicamentos];
    copy[idx] = { ...copy[idx], [field]: value };
    setMedicamentos(copy);
  };

  const removeMed = (idx) => setMedicamentos(medicamentos.filter((_, i) => i !== idx));

  const onSubmit = (formData) => {
    const body = {
      ...formData,
      medicamentos: medicamentos.filter((m) => m.name.trim()),
    };

    finishMutation.mutate({ id, data: body }, {
      onSuccess: () => {
        setTimeout(() => navigate("/doctor"), 1200);
      },
    });
  };

  const evaluarPresion = (bp) => {
    if (!bp) return { label: "N/A", color: "#6b7280" };
    const [sys, dia] = bp.split("/").map(Number);
    if (sys < 120 && dia < 80) return { label: "Normal", color: "#22c55e" };
    if (sys < 140 && dia < 90) return { label: "Elevada", color: "#f59e0b" };
    return { label: "Alta", color: "#ef4444" };
  };

  const S = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: "2rem" },
    layout: { display: "grid", gridTemplateColumns: "370px 1fr", gap: "2rem", maxWidth: "1300px", margin: "0 auto" },
    sidebar: { backgroundColor: "white", borderRadius: "18px", padding: "1.5rem", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", height: "fit-content", position: "sticky", top: "2rem" },
    main: { display: "flex", flexDirection: "column", gap: "1.5rem" },
    card: { backgroundColor: "white", borderRadius: "18px", padding: "2rem", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" },
    sectionTitle: { color: "#0d9488", margin: "0 0 1rem", fontSize: "1.1rem", borderBottom: "2px solid #f0fdfa", paddingBottom: "8px" },
    vitalRow: { display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid #f3f4f6" },
    errorMsg: { color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem" },
    medCard: { padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "12px", marginBottom: "1rem" },
    medGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" },
  };

  if (isLoading) return <div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "#6b7280" }}>Cargando consulta...</p></div>;
  if (isError || !data) return <div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "#ef4444" }}>Error al cargar datos de la consulta.</p></div>;

  const bp = evaluarPresion(data.bloodPressure);
  const edad = calcularEdad(data.patientDob);

  return (
    <div style={S.page}>
      <div style={S.layout}>
        {/* Sidebar: Info paciente + Signos */}
        <aside style={S.sidebar}>
          <h2 style={{ margin: "0 0 0.5rem", color: "#1f2937" }}>{data.patientName || "Paciente"}</h2>
          <p style={{ color: "#6b7280", margin: "0 0 1rem", fontSize: "0.9rem" }}>
            {edad > 0 ? `${edad} anios` : ""} | {data.patientGender === "male" ? "Masculino" : "Femenino"} | Exp: {data.patientFileNumber || "N/A"}
          </p>

          <h3 style={{ color: "#0d9488", fontSize: "1rem", margin: "1rem 0 0.5rem" }}>Signos Vitales</h3>
          <div style={S.vitalRow}><span style={{ color: "#6b7280" }}>Presion Arterial</span><span style={{ fontWeight: 600, color: bp.color }}>{data.bloodPressure || "N/A"} <small>({bp.label})</small></span></div>
          <div style={S.vitalRow}><span style={{ color: "#6b7280" }}>Temperatura</span><span style={{ fontWeight: 600 }}>{data.temperature ? `${data.temperature} C` : "N/A"}</span></div>
          <div style={S.vitalRow}><span style={{ color: "#6b7280" }}>Frecuencia Cardiaca</span><span style={{ fontWeight: 600 }}>{data.heartRate ? `${data.heartRate} bpm` : "N/A"}</span></div>
          <div style={S.vitalRow}><span style={{ color: "#6b7280" }}>Saturacion O2</span><span style={{ fontWeight: 600 }}>{data.oxygenSaturation ? `${data.oxygenSaturation}%` : "N/A"}</span></div>
          <div style={S.vitalRow}><span style={{ color: "#6b7280" }}>Peso</span><span style={{ fontWeight: 600 }}>{data.weight ? `${data.weight} lb` : "N/A"}</span></div>
          <div style={S.vitalRow}><span style={{ color: "#6b7280" }}>Estatura</span><span style={{ fontWeight: 600 }}>{data.height ? `${data.height} m` : "N/A"}</span></div>
          <div style={S.vitalRow}><span style={{ color: "#6b7280" }}>IMC</span><span style={{ fontWeight: 600, color: imcInfo.color }}>{bmi || "N/A"} <small>({imcInfo.label})</small></span></div>

          <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f0fdfa", borderRadius: "10px" }}>
            <strong style={{ color: "#0d9488" }}>Motivo:</strong>
            <p style={{ margin: "0.3rem 0 0", color: "#374151", fontSize: "0.9rem" }}>{data.motivo || "N/A"}</p>
          </div>
        </aside>

        {/* Main: Formulario consulta */}
        <main style={S.main}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={S.card}>
              <h2 style={S.sectionTitle}>Consulta Medica</h2>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Anamnesis / Historia de enfermedad actual *</label>
                <textarea className="form-input" rows={4} placeholder="Describa los sintomas, evolucion..." {...register("anamnesis")} />
                {errors.anamnesis && <span style={S.errorMsg}>{errors.anamnesis.message}</span>}
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Examen Fisico</label>
                <textarea className="form-input" rows={3} placeholder="Hallazgos del examen fisico..." {...register("physicalExam")} />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Diagnostico *</label>
                <textarea className="form-input" rows={2} placeholder="Diagnostico clinico..." {...register("diagnosis")} />
                {errors.diagnosis && <span style={S.errorMsg}>{errors.diagnosis.message}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Resultados de Laboratorio</label>
                  <textarea className="form-input" rows={2} {...register("labResults")} />
                </div>
                <div className="form-group">
                  <label className="form-label">Observaciones</label>
                  <textarea className="form-input" rows={2} {...register("observations")} />
                </div>
              </div>
            </div>

            {/* Medicamentos */}
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ ...S.sectionTitle, marginBottom: 0 }}>Receta Medica ({medicamentos.length})</h2>
                <button type="button" onClick={agregarMedicamento} className="doc-btn" style={{ color: "#0d9488" }}>+ Agregar Medicamento</button>
              </div>

              {medicamentos.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af", padding: "1rem" }}>No se han agregado medicamentos.</p>
              ) : (
                medicamentos.map((med, idx) => (
                  <div key={`med-${idx}-${med.name}`} style={S.medCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <strong style={{ color: "#374151" }}>Medicamento #{idx + 1}</strong>
                      <button type="button" onClick={() => removeMed(idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}>
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                    <div style={S.medGrid}>
                      <div className="form-group"><label className="form-label">Nombre *</label><input type="text" className="form-input" value={med.name} onChange={(e) => updateMed(idx, "name", e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Concentracion</label><input type="text" className="form-input" value={med.concentration} onChange={(e) => updateMed(idx, "concentration", e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Unidad</label><select className="form-input" value={med.concentrationUnit} onChange={(e) => updateMed(idx, "concentrationUnit", e.target.value)} style={{ backgroundColor: "white" }}><option>mg</option><option>ml</option><option>g</option><option>UI</option><option>%</option></select></div>
                      <div className="form-group"><label className="form-label">Dosis</label><input type="text" className="form-input" value={med.dose} onChange={(e) => updateMed(idx, "dose", e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Via</label><select className="form-input" value={med.route} onChange={(e) => updateMed(idx, "route", e.target.value)} style={{ backgroundColor: "white" }}><option>Oral</option><option>Intravenosa</option><option>Intramuscular</option><option>Topica</option><option>Sublingual</option><option>Rectal</option></select></div>
                      <div className="form-group"><label className="form-label">Frecuencia (hrs)</label><input type="text" className="form-input" value={med.frequency} onChange={(e) => updateMed(idx, "frequency", e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Duracion (dias)</label><input type="text" className="form-input" value={med.duration} onChange={(e) => updateMed(idx, "duration", e.target.value)} /></div>
                      <div className="form-group" style={{ gridColumn: "span 2" }}><label className="form-label">Indicaciones</label><input type="text" className="form-input" value={med.additionalInstructions} onChange={(e) => updateMed(idx, "additionalInstructions", e.target.value)} /></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={finishMutation.isPending} style={{ width: "100%" }}>
              {finishMutation.isPending ? "Finalizando consulta..." : "Finalizar Consulta"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};
