import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { usePatients } from "../../hooks/usePatients";
import { useCreatePreclinical, useUpdatePreclinical, usePreclinicalByPatient } from "../../hooks/usePreclinical";
import { calcularEdad } from "../../lib/utils";
import "../shared/Shared.css";

export const PreclinicaShared = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTo = location.state?.redirectTo || "/reception";
  
  const pacienteFromState = location.state?.paciente || null;
  const initialEditRecord = location.state?.editRecord || null; 

  const [busqueda, setBusqueda] = useState("");
  const [paciente, setPaciente] = useState(pacienteFromState);
  const [editRecord, setEditRecord] = useState(initialEditRecord);
  const isEditing = !!editRecord; 

  const { data: resultados = [] } = usePatients(busqueda.length >= 3 ? busqueda : "");
  
  const { data: historialPaciente, isFetching: cargandoHistorial } = usePreclinicalByPatient(paciente?.id);

  const createMutation = useCreatePreclinical();
  const updateMutation = useUpdatePreclinical(); 

  // 1. ELIMINAMOS ZOD: Ahora el formulario solo extrae los valores de los txt sin juzgarlos
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      patientId: editRecord?.patientId || pacienteFromState?.id || "",
      motivo: editRecord?.motivo || "", 
      bloodPressure: editRecord?.bloodPressure || "", 
      temperature: editRecord?.temperature || "", 
      weight: editRecord?.weight || "",
      height: editRecord?.height || "", 
      heartRate: editRecord?.heartRate || "", 
      oxygenSaturation: editRecord?.oxygenSaturation || "",
    },
  });

  const weightVal = watch("weight");
  const heightVal = watch("height");
  const motivoVal = watch("motivo");

  const bmi = useMemo(() => {
    const w = parseFloat(weightVal);
    const h = parseFloat(heightVal);
    if (!w || !h || h <= 0) return null;
    const wKg = w * 0.453592;
    return (wKg / (h * h)).toFixed(2);
  }, [weightVal, heightVal]);

  useEffect(() => {
    if (historialPaciente && paciente) {
      const activeRecord = historialPaciente.find(r => r.status === "waiting" || r.status === "in_consultation");
      
      if (activeRecord) {
        setEditRecord(activeRecord);
        setValue("motivo", activeRecord.motivo || "");
        setValue("bloodPressure", activeRecord.bloodPressure || "");
        setValue("temperature", activeRecord.temperature || "");
        setValue("weight", activeRecord.weight || "");
        setValue("height", activeRecord.height || "");
        setValue("heartRate", activeRecord.heartRate || "");
        setValue("oxygenSaturation", activeRecord.oxygenSaturation || "");
        toast.success("Registro activo cargado.");
      } else {
        setEditRecord(null);
        handleLimpiar(false); 
      }
    }
  }, [historialPaciente, paciente]);

  const seleccionarPaciente = (p) => {
    setPaciente(p);
    setValue("patientId", p.id);
    setBusqueda("");
  };

  const handleLimpiar = (clearPatient = true) => {
    setValue("motivo", "");
    setValue("bloodPressure", "");
    setValue("temperature", "");
    setValue("weight", "");
    setValue("height", "");
    setValue("heartRate", "");
    setValue("oxygenSaturation", "");
    
    if (clearPatient) {
      setPaciente(null);
      setEditRecord(null);
      setValue("patientId", "");
    }
  };

  const onSubmit = (data) => {
    if (!data.patientId) {
      toast.error("Debe seleccionar un paciente.");
      return;
    }

    const payload = {
      patientId: data.patientId,
      motivo: data.motivo || "", 
      bloodPressure: data.bloodPressure || null,
      temperature: data.temperature ? Number(data.temperature) : null,
      weight: data.weight ? Number(data.weight) : null,
      height: data.height ? Number(data.height) : null,
      heartRate: data.heartRate ? Number(data.heartRate) : null,
      oxygenSaturation: data.oxygenSaturation ? Number(data.oxygenSaturation) : null,
      bmi: bmi ? Number(bmi) : null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: editRecord.id, ...payload });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setTimeout(() => navigate(redirectTo), 1200);
        },
      });
    }
  };

  const S = {
    page: { minHeight: "100vh", background: "#f8fafc", padding: "2rem 1rem" },
    container: { maxWidth: "800px", margin: "0 auto" },
    card: { backgroundColor: "white", borderRadius: "18px", border: "1px solid #e5e7eb", boxShadow: "0 4px 15px rgba(0,0,0,0.05)", padding: "2rem", marginBottom: "1.5rem" },
    sectionTitle: { color: "#0d9488", margin: "0 0 1rem", fontSize: "1.15rem", borderBottom: "2px solid #f0fdfa", paddingBottom: "8px" },
    grid3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" },
    patientCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", backgroundColor: "#f0fdfa", borderRadius: "12px", border: "1px solid #ccfbf1" },
  };

  const isPending = isEditing ? updateMutation.isPending : createMutation.isPending;

  return (
    <div style={S.page}>
      <div style={S.container}>
        <h1 style={{ color: "#1f2937", marginBottom: "0.5rem" }}>
          {isEditing ? "Modificar Pre-Clínica" : "Registro Pre-Clínico"}
        </h1>
        <p style={{ color: "#6b7280", marginBottom: "2rem" }}>
          {isEditing ? "Edite los datos del paciente y guarde los cambios." : "Complete la información de pre-clínica del paciente."}
        </p>

        <div style={S.card}>
          <h2 style={S.sectionTitle}>Paciente</h2>
          {!paciente ? (
            <>
              <input type="text" className="form-input" placeholder="Buscar paciente por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              {resultados.length > 0 && (
                <div style={{ border: "1px solid #ddd", borderRadius: "8px", marginTop: "8px", maxHeight: "180px", overflowY: "auto" }}>
                  {resultados.map((p) => (
                    <div key={p.id} role="option" tabIndex={0} onClick={() => seleccionarPaciente(p)} style={{ padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #eee" }}>
                      <strong>{p.fullName}</strong> <span style={{ color: "#6b7280" }}>- Exp: {p.fileNumber}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={S.patientCard}>
              <div style={{ width: "100%" }}>
                <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.25rem", color: "#1f2937" }}>
                  {paciente.fullName || paciente.patientName} 
                  {cargandoHistorial && <span style={{ color: "#0ea5e9", fontSize: "0.85rem", marginLeft: "10px" }}>Cargando datos...</span>}
                </div>
                <div style={{ color: "#4b5563", fontSize: "0.9rem", display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  <span><strong>Exp:</strong> {paciente.fileNumber}</span>
                  {paciente.yearOfBirth || paciente.patientDob ? (
                    <span><strong>Edad:</strong> {calcularEdad(paciente.yearOfBirth || paciente.patientDob)} años</span>
                  ) : null}
                </div>
                <div style={{ color: "#0d9488", fontSize: "0.95rem", backgroundColor: "white", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccfbf1" }}>
                  <strong>Motivo:</strong> {motivoVal ? motivoVal : "Sin motivo especificado..."}
                </div>
              </div>
              
              <button type="button" onClick={() => handleLimpiar(true)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "1.5rem", padding: "0.5rem" }}>
                <i className="ri-close-circle-line"></i>
              </button>
            </div>
          )}
          <input type="hidden" {...register("patientId")} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={S.card}>
            <h2 style={S.sectionTitle}>Motivo de Consulta</h2>
            <div className="form-group">
              <textarea className="form-input" rows={3} placeholder="Describa el motivo de la visita del paciente (Opcional)..." {...register("motivo")} disabled={cargandoHistorial} />
            </div>
          </div>

          <div style={S.card}>
            <h2 style={S.sectionTitle}>Signos Vitales (Opcional)</h2>
            <div style={S.grid3}>
              <div className="form-group">
                <label className="form-label">Presión Arterial</label>
                <input type="text" className="form-input" placeholder="120/80" {...register("bloodPressure")} disabled={cargandoHistorial} />
              </div>
              <div className="form-group">
                <label className="form-label">Temperatura (°C)</label>
                <input type="number" step="0.1" className="form-input" placeholder="36.5" {...register("temperature")} disabled={cargandoHistorial} />
              </div>
              <div className="form-group">
                <label className="form-label">Frec. Cardíaca (bpm)</label>
                <input type="number" className="form-input" placeholder="80" {...register("heartRate")} disabled={cargandoHistorial} />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (lb)</label>
                <input type="number" step="0.1" className="form-input" placeholder="150" {...register("weight")} disabled={cargandoHistorial} />
              </div>
              <div className="form-group">
                <label className="form-label">Estatura (m)</label>
                <input type="number" step="0.01" className="form-input" placeholder="1.70" {...register("height")} disabled={cargandoHistorial} />
              </div>
              <div className="form-group">
                <label className="form-label">Saturación O2 (%)</label>
                <input type="number" className="form-input" placeholder="98" {...register("oxygenSaturation")} disabled={cargandoHistorial} />
              </div>
            </div>
            {bmi && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "#f0fdf4", borderRadius: "8px", textAlign: "center", border: "1px solid #bbf7d0", color: "#166534" }}>
                <strong>IMC calculado:</strong> {bmi}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button 
              type="button" 
              onClick={() => handleLimpiar(false)} 
              disabled={cargandoHistorial}
              style={{ 
                flex: "1", padding: "1rem", backgroundColor: "white", border: "1px solid #d1d5db", 
                borderRadius: "0.5rem", color: "#374151", fontWeight: "bold", cursor: "pointer" 
              }}
            >
              Limpiar
            </button>

            <button 
              type="submit" 
              disabled={isPending || cargandoHistorial} 
              style={{ 
                flex: "2", padding: "1rem", backgroundColor: isEditing ? "#0ea5e9" : "#0d9488", border: "none", 
                borderRadius: "0.5rem", color: "white", fontWeight: "bold", fontSize: "1.1rem", 
                cursor: (isPending || cargandoHistorial) ? "not-allowed" : "pointer", opacity: (isPending || cargandoHistorial) ? 0.7 : 1 
              }}
            >
              {isPending ? (isEditing ? "Actualizando..." : "Registrando...") : (isEditing ? "Editar" : "Registrar Pre-Clínica")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};