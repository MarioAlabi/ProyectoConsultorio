import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { preclinicalSchema } from "../../lib/validations/preclinicalSchema";
import { usePatients } from "../../hooks/usePatients";
import { useCreatePreclinical } from "../../hooks/usePreclinical";
import { calcularEdad } from "../../lib/utils";
import "../shared/Shared.css";

export const PreclinicaShared = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.redirectTo || "/reception";
  const pacienteFromState = location.state?.paciente || null;

  const [busqueda, setBusqueda] = useState("");
  const [paciente, setPaciente] = useState(pacienteFromState);

  const { data: resultados = [] } = usePatients(busqueda.length >= 3 ? busqueda : "");
  const createMutation = useCreatePreclinical();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(preclinicalSchema),
    defaultValues: {
      patientId: pacienteFromState?.id || "",
      motivo: "", bloodPressure: "", temperature: "", weight: "",
      height: "", heartRate: "", oxygenSaturation: "",
    },
  });

  const weightVal = watch("weight");
  const heightVal = watch("height");

  const bmi = useMemo(() => {
    const w = parseFloat(weightVal);
    const h = parseFloat(heightVal);
    if (!w || !h || h <= 0) return null;
    const wKg = w * 0.453592;
    return (wKg / (h * h)).toFixed(2);
  }, [weightVal, heightVal]);

  const seleccionarPaciente = (p) => {
    setPaciente(p);
    setValue("patientId", p.id, { shouldValidate: true });
    setBusqueda("");
  };

  const onSubmit = (data) => {
    const hasVitals = data.bloodPressure || data.temperature || data.weight || data.height || data.heartRate || data.oxygenSaturation;
    if (!hasVitals) {
      const proceed = window.confirm("No se han ingresado signos vitales. Desea continuar solo con el motivo de consulta?");
      if (!proceed) return;
    }

    const payload = {
      patientId: data.patientId,
      motivo: data.motivo,
      bloodPressure: data.bloodPressure || null,
      temperature: data.temperature ? Number(data.temperature) : null,
      weight: data.weight ? Number(data.weight) : null,
      height: data.height ? Number(data.height) : null,
      heartRate: data.heartRate ? Number(data.heartRate) : null,
      oxygenSaturation: data.oxygenSaturation ? Number(data.oxygenSaturation) : null,
      bmi: bmi ? Number(bmi) : null,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        setTimeout(() => navigate(redirectTo), 1200);
      },
    });
  };

  const S = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: "2rem 1rem" },
    container: { maxWidth: "800px", margin: "0 auto" },
    card: { backgroundColor: "white", borderRadius: "18px", border: "1px solid #e5e7eb", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", padding: "2rem", marginBottom: "1.5rem" },
    sectionTitle: { color: "#0d9488", margin: "0 0 1rem", fontSize: "1.15rem", borderBottom: "2px solid #f0fdfa", paddingBottom: "8px" },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" },
    errorMsg: { color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem" },
    patientCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", backgroundColor: "#f0fdfa", borderRadius: "12px", border: "1px solid #ccfbf1" },
  };

  return (
    <div style={S.page}>
      <div style={S.container}>
        <h1 style={{ color: "#1f2937", marginBottom: "0.5rem" }}>Registro Pre-Clinico</h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>Complete los signos vitales y motivo de consulta del paciente.</p>

        {/* Seleccion de paciente */}
        <div style={S.card}>
          <h2 style={S.sectionTitle}>Paciente</h2>
          {!paciente ? (
            <>
              <input type="text" className="form-input" placeholder="Buscar paciente por nombre o DUI..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              {errors.patientId && <span style={S.errorMsg}>{errors.patientId.message}</span>}
              {resultados.length > 0 && (
                <div style={{ border: "1px solid #ddd", borderRadius: "8px", marginTop: "8px", maxHeight: "180px", overflowY: "auto" }}>
                  {resultados.map((p) => (
                    <div key={p.id} role="option" tabIndex={0} onClick={() => seleccionarPaciente(p)} onKeyDown={(e) => e.key === "Enter" && seleccionarPaciente(p)} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}>
                      <strong>{p.fullName}</strong> <span style={{ color: "#6b7280" }}>- {p.identityDocument} ({p.fileNumber})</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={S.patientCard}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{paciente.fullName}</div>
                <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Exp: {paciente.fileNumber} | DUI: {paciente.identityDocument} | Edad: {calcularEdad(paciente.yearOfBirth)} anios</div>
              </div>
              <button type="button" onClick={() => { setPaciente(null); setValue("patientId", ""); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.2rem" }}>
                <i className="ri-close-circle-line"></i>
              </button>
            </div>
          )}
          <input type="hidden" {...register("patientId")} />
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Motivo */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>Motivo de Consulta</h2>
            <div className="form-group">
              <textarea className="form-input" rows={3} placeholder="Describa el motivo de la visita del paciente..." {...register("motivo")} />
              {errors.motivo && <span style={S.errorMsg}>{errors.motivo.message}</span>}
            </div>
          </div>

          {/* Signos vitales */}
          <div style={S.card}>
            <h2 style={S.sectionTitle}>Signos Vitales</h2>
            <div style={S.grid3}>
              <div className="form-group">
                <label className="form-label">Presion Arterial</label>
                <input type="text" className="form-input" placeholder="120/80" {...register("bloodPressure")} />
                {errors.bloodPressure && <span style={S.errorMsg}>{errors.bloodPressure.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Temperatura (C)</label>
                <input type="number" step="0.1" className="form-input" placeholder="36.5" {...register("temperature")} />
                {errors.temperature && <span style={S.errorMsg}>{errors.temperature.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Frecuencia Cardiaca (bpm)</label>
                <input type="number" className="form-input" placeholder="80" {...register("heartRate")} />
                {errors.heartRate && <span style={S.errorMsg}>{errors.heartRate.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Peso (lb)</label>
                <input type="number" step="0.1" className="form-input" placeholder="150" {...register("weight")} />
                {errors.weight && <span style={S.errorMsg}>{errors.weight.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Estatura (m)</label>
                <input type="number" step="0.01" className="form-input" placeholder="1.70" {...register("height")} />
                {errors.height && <span style={S.errorMsg}>{errors.height.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Saturacion O2 (%)</label>
                <input type="number" className="form-input" placeholder="98" {...register("oxygenSaturation")} />
                {errors.oxygenSaturation && <span style={S.errorMsg}>{errors.oxygenSaturation.message}</span>}
              </div>
            </div>
            {bmi && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#f0fdf4", borderRadius: "8px", textAlign: "center" }}>
                <strong>IMC calculado:</strong> {bmi}
              </div>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={createMutation.isPending} style={{ width: "100%" }}>
            {createMutation.isPending ? "Registrando..." : "Registrar Pre-Clinica"}
          </button>
        </form>
      </div>
    </div>
  );
};
