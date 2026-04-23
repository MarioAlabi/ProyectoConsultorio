import { useFormContext } from "react-hook-form";
import { useSuggestIcd10, useDraftAnamnesis } from "../../hooks/useAIClinical";
import toast from "react-hot-toast";

// Recibimos la data preclínica (motivo, signos, paciente) por props para mandarla a la IA
export const ClinicalForm = ({ preclinicalData, patientProfile }) => {
  const { register, formState: { errors }, watch, setValue, getValues } = useFormContext();
  
  // Hooks de IA
  const suggestIcdMutation = useSuggestIcd10();
  const draftAnamnesisMutation = useDraftAnamnesis();

  // Escuchamos el texto que el doctor escribe en el diagnóstico
  const currentDiagnosis = watch("diagnosis");
  const currentAnamnesis = watch("anamnesis");

  // --- FUNCIÓN: BORRADOR DE ANAMNESIS ---
  const handleGenerateAnamnesis = () => {
    // Si ya escribió algo, le advertimos que lo vamos a sobrescribir
    if (currentAnamnesis?.length > 10 && !window.confirm("¿Sobrescribir tu anamnesis actual con el borrador de la IA?")) {
        return;
    }

    const payload = {
        motivo: preclinicalData?.motivo,
        signosVitales: {
            PA: preclinicalData?.bloodPressure,
            FC: preclinicalData?.heartRate,
            Temp: preclinicalData?.temperature,
            Peso: preclinicalData?.weight,
        },
        antecedentes: {
            personal: patientProfile?.personalHistory,
            familiares: patientProfile?.familyHistory
        },
        edad: patientProfile?.yearOfBirth ? new Date().getFullYear() - new Date(patientProfile.yearOfBirth).getFullYear() : null,
        genero: patientProfile?.gender
    };

    draftAnamnesisMutation.mutate(payload, {
        onSuccess: (data) => {
            // Ponemos el borrador en el textarea
            setValue("anamnesis", data.draft, { shouldValidate: true });
            
            // Si la IA sugiere preguntas, se las mostramos como un Toast informativo
            if (data.suggestedQuestions?.length > 0) {
                toast("Preguntas sugeridas por la IA:\n\n" + data.suggestedQuestions.map(q => `• ${q}`).join("\n"), {
                    duration: 8000,
                    icon: '💡',
                });
            }
            toast.success("Borrador de anamnesis generado.");
        }
    });
  };

  // --- FUNCIÓN: SUGERENCIA CIE-10 ---
  const handleSuggestICD = () => {
    if (!currentDiagnosis || currentDiagnosis.length < 3) {
        return toast.error("Escribe un poco más en el diagnóstico para que la IA pueda analizarlo.");
    }

    suggestIcdMutation.mutate(currentDiagnosis, {
        onSuccess: (data) => {
            if (data.confidence < 0.3) {
                toast("Diagnóstico muy ambiguo. Escribe más detalles.", { icon: '⚠️' });
                return;
            }

            // Guardamos el código y el nombre oficial en el formulario
            setValue("diagnosisCode", data.code, { shouldValidate: true });
            setValue("diagnosisCodeName", data.canonicalName, { shouldValidate: true });
            
            toast.success(`CIE-10 Detectado: ${data.code} - ${data.canonicalName}`);
        }
    });
  };

  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="card-heading">Consulta médica</h2>
      </div>
      
      <div style={{ display: "grid", gap: "1rem", marginTop: "0.75rem" }}>
        
        {/* --- CAMPO: ANAMNESIS --- */}
        <div className="form-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
              <label className="form-label" style={{ margin: 0 }}>Anamnesis / historia de enfermedad actual *</label>
              <button 
                type="button" 
                onClick={handleGenerateAnamnesis} 
                className="btn btn-ghost btn-sm"
                disabled={draftAnamnesisMutation.isPending || !preclinicalData?.motivo}
                style={{ color: "var(--accent-plum)", fontSize: "0.8rem", padding: "0.2rem 0.5rem" }}
              >
                  <i className="ri-sparkling-2-line"></i> 
                  {draftAnamnesisMutation.isPending ? "Generando..." : "Borrador con IA"}
              </button>
          </div>
          <textarea 
            className="form-input" 
            rows={5} 
            {...register("anamnesis")} 
            placeholder="Describa los síntomas, evolución..."
          />
          {errors.anamnesis && <span className="field-error">{errors.anamnesis.message}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Examen físico</label>
          <textarea 
            className="form-input" 
            rows={3} 
            {...register("physicalExam")} 
            placeholder="Hallazgos del examen físico..."
          />
        </div>

        {/* --- CAMPO: DIAGNÓSTICO Y CIE-10 --- */}
        <div className="form-group">
          <label className="form-label">Diagnóstico Clínico *</label>
          <textarea 
            className="form-input" 
            rows={2} 
            {...register("diagnosis")} 
            placeholder="Diagnóstico en texto libre..."
          />
          {errors.diagnosis && <span className="field-error">{errors.diagnosis.message}</span>}
          
          {/* Fila para el Código CIE-10 */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center" }}>
              <div style={{ flex: "0 0 100px" }}>
                  <input 
                      type="text" 
                      className="form-input" 
                      placeholder="CIE-10" 
                      {...register("diagnosisCode")} 
                      readOnly // Lo hacemos de solo lectura para que la IA lo llene
                      style={{ background: "var(--bg-surface-alt)", textAlign: "center", fontWeight: "bold" }}
                  />
              </div>
              <div style={{ flex: 1 }}>
                  <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Nombre oficial (CIE-10)" 
                      {...register("diagnosisCodeName")} 
                      readOnly
                      style={{ background: "var(--bg-surface-alt)", color: "var(--fg-secondary)" }}
                  />
              </div>
              <button 
                  type="button" 
                  onClick={handleSuggestICD} 
                  className="btn btn-secondary btn-sm"
                  disabled={suggestIcdMutation.isPending}
                  title="Detectar CIE-10 con Inteligencia Artificial"
              >
                  <i className="ri-robot-2-line"></i> {suggestIcdMutation.isPending ? "..." : "Auto CIE-10"}
              </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Resultados de laboratorio</label>
            <textarea className="form-input" rows={2} {...register("labResults")} />
          </div>
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea className="form-input" rows={2} {...register("observations")} />
          </div>
        </div>

      </div>
    </section>
  );
};