import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { consultationSchema } from "../../lib/validations/consultationSchema";
import { usePreclinicalRecord } from "../../hooks/usePreclinical";
import { useFinishConsultation } from "../../hooks/useConsultations";
import { useInsurers } from "../../hooks/useInsurers";
import { calcularEdad, clasificarIMC } from "../../lib/utils";
import "../../views/shared/Shared.css";

const toNull = (v) => (v === "" || v === undefined ? null : v);
const createMedicationDraft = () => ({
  clientId: crypto.randomUUID(),
  name: "",
  concentration: "",
  concentrationUnit: "mg",
  dose: "",
  doseUnit: "tableta(s)",
  route: "Oral",
  frequency: "",
  duration: "",
  additionalInstructions: "",
});

export const ConsultaMedica = () => {
  const { id } = useParams();
  const navigate = useNavigate();

const { data, isLoading, isError } = usePreclinicalRecord(id);
  const finishMutation = useFinishConsultation();
  const { data: insurers = [] } = useInsurers();

  const [medicamentos, setMedicamentos] = useState([]);

  const { register, watch, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      anamnesis: "",
      physicalExam: "",
      diagnosis: "",
      labResults: "",
      observations: "",
      billingType: "private",
      insurerId: "",
      agreedAmount: "",
      // Agregamos valores por defecto para los signos vitales
      bloodPressure: "",
      temperature: "",
      heartRate: "",
      oxygenSaturation: "",
      weight: "",
      height: "",
    },
  });

  const billingType = watch("billingType");
  const selectedInsurerId = watch("insurerId");
  const selectedInsurer = insurers.find((insurer) => insurer.id === selectedInsurerId);
  const billingTypeField = register("billingType");
  const insurerField = register("insurerId");

  // Observamos los signos vitales para calcular IMC y presión en tiempo real
  const currentWeight = watch("weight");
  const currentHeight = watch("height");
  const currentBp = watch("bloodPressure");

  // Cargar datos pre-clínicos en el formulario cuando la data esté lista
  useEffect(() => {
    if (data) {
      setValue("bloodPressure", data.bloodPressure || "");
      setValue("temperature", data.temperature || "");
      setValue("heartRate", data.heartRate || "");
      setValue("oxygenSaturation", data.oxygenSaturation || "");
      setValue("weight", data.weight || "");
      setValue("height", data.height || "");
    }
  }, [data, setValue]);

  useEffect(() => {
    if (billingType !== "insurance") {
      setValue("agreedAmount", "", { shouldValidate: false });
      return;
    }

    if (selectedInsurer) {
      setValue("agreedAmount", String(selectedInsurer.fixedConsultationAmount ?? ""), { shouldValidate: true });
    }
  }, [billingType, selectedInsurer, setValue]);

  // Cálculo de IMC en tiempo real basado en los inputs
  const bmi = useMemo(() => {
    if (!currentWeight || !currentHeight) return null;
    const wKg = parseFloat(currentWeight) * 0.453592; // Asumiendo que el peso está en libras
    return (wKg / (parseFloat(currentHeight) ** 2)).toFixed(2);
  }, [currentWeight, currentHeight]);

  const imcInfo = clasificarIMC(bmi ? parseFloat(bmi) : null);

  const agregarMedicamento = () => {
    setMedicamentos((current) => [...current, createMedicationDraft()]);
  };

  const updateMed = (idx, field, value) => {
    setMedicamentos((current) => {
      const copy = [...current];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const removeMed = (idx) => setMedicamentos((current) => current.filter((_, i) => i !== idx));

  const onSubmit = (formData) => {
    const body = {
      ...formData,
      // Usamos toNull para convertir "" a null
      bloodPressure: toNull(formData.bloodPressure),
      temperature: toNull(formData.temperature),
      heartRate: toNull(formData.heartRate),
      oxygenSaturation: toNull(formData.oxygenSaturation),
      weight: toNull(formData.weight),
      height: toNull(formData.height),
      bmi: bmi ? String(bmi) : null, 
      
      insurerId: formData.billingType === "insurance" ? formData.insurerId : undefined,
      agreedAmount: formData.billingType === "insurance" ? formData.agreedAmount : undefined,
      medicamentos: medicamentos
        .filter((m) => m.name.trim())
        .map(({ clientId, ...medication }) => medication),
    };

    finishMutation.mutate({ id, data: body }, {
      onSuccess: () => {
        setTimeout(() => navigate("/doctor"), 1200);
      },
    });
  };

  const evaluarPresion = (bp) => {
    if (!bp || !bp.includes("/")) return { label: "N/A", color: "#6b7280" };
    const [sys, dia] = bp.split("/").map(Number);
    if (isNaN(sys) || isNaN(dia)) return { label: "N/A", color: "#6b7280" };
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
    vitalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0", borderBottom: "1px solid #f3f4f6" },
    vitalInput: { width: "80px", padding: "0.25rem 0.5rem", border: "1px solid #d1d5db", borderRadius: "6px", textAlign: "right", outline: "none", fontSize: "0.9rem" },
    errorMsg: { color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem" },
    medCard: { padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "12px", marginBottom: "1rem" },
    medGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" },
  };

  if (isLoading) return <div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "#6b7280" }}>Cargando consulta...</p></div>;
  if (isError || !data) return <div style={{ ...S.page, display: "flex", justifyContent: "center", alignItems: "center" }}><p style={{ color: "#ef4444" }}>Error al cargar datos de la consulta.</p></div>;
console.log("Datos de la pre-clínica:", data);
  const bpInfo = evaluarPresion(currentBp);
  const edad = calcularEdad(data.patientDob);
  
const expediente = 
  data.patientFileNumber || 
  data.fileNumber || 
  data.file_number || 
  data.patient?.file_number || 
  "N/A";
const rawGender = data.patientGender || data.gender || data.patient?.gender;
const isMale = rawGender?.toLowerCase() === "male" || rawGender?.toLowerCase() === "masculino";

const fechaNacimiento = data.patientDob || data.yearOfBirth || data.year_of_birth || data.patient?.year_of_birth;
console.log("Llaves disponibles en data:", Object.keys(data));
console.log("Valores encontrados:", { edad, rawGender, expediente });
  return (
    <div style={S.page}>
      <div style={S.layout}>
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "contents" }}>
          
          {/* Sidebar: Info paciente + Signos Vitales Editables */}
          <aside style={S.sidebar}>
            <h2 style={{ margin: "0 0 0.5rem", color: "#1f2937" }}>{data.patientName || data.fullName || "Paciente"}</h2>
            <p style={{ color: "#6b7280", margin: "0 0 1rem", fontSize: "0.9rem" }}>
              {edad > 0 ? `${edad} años` : "Edad N/A"} | {isMale ? "Masculino" : "Femenino"} | Exp: {expediente}
            </p>
            <h3 style={{ color: "#0d9488", fontSize: "1rem", margin: "1rem 0 0.5rem" }}>Signos Vitales</h3>
            
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280", display: "flex", flexDirection: "column" }}>
                Presión Arterial <small style={{ color: bpInfo.color, fontWeight: 600 }}>{bpInfo.label}</small>
              </span>
              <input type="text" placeholder="120/80" style={S.vitalInput} {...register("bloodPressure")} />
            </div>
            
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280" }}>Temperatura (°C)</span>
              <input type="number" step="0.1" style={S.vitalInput} {...register("temperature")} />
            </div>
            
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280" }}>Frec. Cardíaca (bpm)</span>
              <input type="number" style={S.vitalInput} {...register("heartRate")} />
            </div>
            
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280" }}>Saturación O2 (%)</span>
              <input type="number" style={S.vitalInput} {...register("oxygenSaturation")} />
            </div>
            
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280" }}>Peso (lb)</span>
              <input type="number" step="0.1" style={S.vitalInput} {...register("weight")} />
            </div>
            
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280" }}>Estatura (m)</span>
              <input type="number" step="0.01" style={S.vitalInput} {...register("height")} />
            </div>
            
            <div style={S.vitalRow}>
              <span style={{ color: "#6b7280", display: "flex", flexDirection: "column" }}>
                IMC <small style={{ color: imcInfo.color, fontWeight: 600 }}>{imcInfo.label}</small>
              </span>
              <span style={{ fontWeight: 600, paddingRight: "0.5rem" }}>{bmi || "N/A"}</span>
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f0fdfa", borderRadius: "10px" }}>
              <strong style={{ color: "#0d9488" }}>Motivo:</strong>
              <p style={{ margin: "0.3rem 0 0", color: "#374151", fontSize: "0.9rem" }}>{data.motivo || "N/A"}</p>
            </div>
          </aside>

          {/* Main: Formulario consulta */}
          <main style={S.main}>
            <div style={S.card}>
              <h2 style={S.sectionTitle}>Consulta Médica</h2>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Anamnesis / Historia de enfermedad actual *</label>
                <textarea className="form-input" rows={4} placeholder="Describa los síntomas, evolución..." {...register("anamnesis")} />
                {errors.anamnesis && <span style={S.errorMsg}>{errors.anamnesis.message}</span>}
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Examen Físico</label>
                <textarea className="form-input" rows={3} placeholder="Hallazgos del examen físico..." {...register("physicalExam")} />
              </div>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="form-label">Diagnóstico *</label>
                <textarea className="form-input" rows={2} placeholder="Diagnóstico clínico..." {...register("diagnosis")} />
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

            <div style={S.card}>
              <h2 style={S.sectionTitle}>Cobertura de la consulta</h2>
              <p style={{ margin: "0 0 1rem", color: "#6b7280", fontSize: "0.95rem" }}>
                Define si esta atención será normal o si viene respaldada por una aseguradora.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: billingType === "insurance" ? "1fr 1fr 1fr" : "1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Tipo de cobertura</label>
                  <select
                    className="form-input"
                    {...billingTypeField}
                    onChange={(e) => {
                      billingTypeField.onChange(e);
                      const nextType = e.target.value;
                      if (nextType !== "insurance") {
                        setValue("insurerId", "", { shouldValidate: true });
                        setValue("agreedAmount", "", { shouldValidate: false });
                      }
                    }}
                    style={{ backgroundColor: "white" }}
                  >
                    <option value="private">Normal</option>
                    <option value="insurance">Aseguradora</option>
                  </select>
                </div>

                {billingType === "insurance" && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Aseguradora</label>
                      <select
                        className="form-input"
                        {...insurerField}
                        onChange={(e) => {
                          insurerField.onChange(e);
                          const insurer = insurers.find((item) => item.id === e.target.value);
                          setValue("agreedAmount", insurer ? String(insurer.fixedConsultationAmount ?? "") : "", { shouldValidate: true });
                        }}
                        style={{ backgroundColor: "white" }}
                      >
                        <option value="">Seleccione una aseguradora</option>
                        {insurers.map((insurer) => (
                          <option key={insurer.id} value={insurer.id}>
                            {insurer.companyName}
                          </option>
                        ))}
                      </select>
                      {errors.insurerId && <span style={S.errorMsg}>{errors.insurerId.message}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Monto que cubre la aseguradora</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="form-input"
                        placeholder="0.00"
                        {...register("agreedAmount")}
                      />
                      {errors.agreedAmount && <span style={S.errorMsg}>{errors.agreedAmount.message}</span>}
                    </div>
                  </>
                )}
              </div>

              {billingType === "insurance" && (
                insurers.length === 0 ? (
                  <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "12px", backgroundColor: "#fff7ed", color: "#9a3412" }}>
                    No hay aseguradoras registradas. Crea una desde el menú "Aseguradoras" para poder asignarla a esta consulta.
                  </div>
                ) : selectedInsurer ? (
                  <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "12px", backgroundColor: "#f0fdfa", color: "#115e59" }}>
                    <strong>Paciente con aseguradora:</strong> {selectedInsurer.companyName}. Se cargó automáticamente el monto sugerido de ${Number(selectedInsurer.fixedConsultationAmount || 0).toFixed(2)} y puedes ajustarlo si hace falta.
                  </div>
                ) : (
                  <div style={{ marginTop: "1rem", padding: "1rem", borderRadius: "12px", backgroundColor: "#f8fafc", color: "#475569" }}>
                    Selecciona la aseguradora para que se coloque automáticamente el monto cubierto.
                  </div>
                )
              )}
            </div>

            {/* Medicamentos */}
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ ...S.sectionTitle, marginBottom: 0 }}>Receta Médica ({medicamentos.length})</h2>
                <button type="button" onClick={agregarMedicamento} className="doc-btn" style={{ color: "#0d9488" }}>+ Agregar Medicamento</button>
              </div>

              {medicamentos.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af", padding: "1rem" }}>No se han agregado medicamentos.</p>
              ) : (
                medicamentos.map((med, idx) => (
                  <div key={med.clientId} style={S.medCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <strong style={{ color: "#374151" }}>Medicamento #{idx + 1}</strong>
                      <button type="button" onClick={() => removeMed(idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.1rem" }}>
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                    <div style={S.medGrid}>
                      <div className="form-group"><label className="form-label">Nombre *</label><input type="text" className="form-input" value={med.name} onChange={(e) => updateMed(idx, "name", e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Concentración</label><input type="text" className="form-input" value={med.concentration} onChange={(e) => updateMed(idx, "concentration", e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Unidad</label><select className="form-input" value={med.concentrationUnit} onChange={(e) => updateMed(idx, "concentrationUnit", e.target.value)} style={{ backgroundColor: "white" }}><option>mg</option><option>ml</option><option>g</option><option>UI</option><option>%</option></select></div>
                      <div className="form-group"><label className="form-label">Dosis</label><input type="text" className="form-input" value={med.dose} onChange={(e) => updateMed(idx, "dose", e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Vía</label><select className="form-input" value={med.route} onChange={(e) => updateMed(idx, "route", e.target.value)} style={{ backgroundColor: "white" }}><option>Oral</option><option>Intravenosa</option><option>Intramuscular</option><option>Tópica</option><option>Sublingual</option><option>Rectal</option></select></div>
                      <div className="form-group"><label className="form-label">Frecuencia (hrs)</label><input type="text" className="form-input" value={med.frequency} onChange={(e) => updateMed(idx, "frequency", e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Duración (días)</label><input type="text" className="form-input" value={med.duration} onChange={(e) => updateMed(idx, "duration", e.target.value)} /></div>
                      <div className="form-group" style={{ gridColumn: "span 2" }}><label className="form-label">Indicaciones</label><input type="text" className="form-input" value={med.additionalInstructions} onChange={(e) => updateMed(idx, "additionalInstructions", e.target.value)} /></div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button type="submit" className="submit-btn" disabled={finishMutation.isPending} style={{ width: "100%" }}>
              {finishMutation.isPending ? "Finalizando consulta..." : "Finalizar Consulta"}
            </button>
          </main>
        </form>
      </div>
    </div>
  );
};