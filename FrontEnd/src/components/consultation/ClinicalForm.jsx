import { useFormContext } from "react-hook-form";

export const ClinicalForm = () => {
  // Extraemos las herramientas que necesitamos del FormProvider central
  const { register, formState: { errors } } = useFormContext();

  return (
    <section className="card">
      <h2 className="card-heading">Consulta médica</h2>
      <div style={{ display: "grid", gap: "1rem", marginTop: "0.75rem" }}>
        
        <div className="form-group">
          <label className="form-label">Anamnesis / historia de enfermedad actual *</label>
          <textarea 
            className="form-input" 
            rows={4} 
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

        <div className="form-group">
          <label className="form-label">Diagnóstico *</label>
          <textarea 
            className="form-input" 
            rows={2} 
            {...register("diagnosis")} 
            placeholder="Diagnóstico clínico..."
          />
          {errors.diagnosis && <span className="field-error">{errors.diagnosis.message}</span>}
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