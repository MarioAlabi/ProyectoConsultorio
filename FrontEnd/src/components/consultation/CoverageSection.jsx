import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useInsurers } from "../../hooks/useInsurers";

export const CoverageSection = () => {
  // Extraemos las herramientas necesarias
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  
  // Obtenemos la lista de aseguradoras desde el hook
  const { data: insurers = [] } = useInsurers();

  // Observamos los cambios en el tipo de cobro y la aseguradora seleccionada
  const billingType = watch("billingType");
  const selectedInsurerId = watch("insurerId");

  // Campos registrados con lógica personalizada en el onChange
  const billingTypeField = register("billingType");
  const insurerField = register("insurerId");

  const preventNegative = (e) => {
    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") e.preventDefault();
  };

  return (
    <section className="card">
      <h2 className="card-heading">Cobertura de la consulta</h2>
      
      <div
        style={{
          display: "grid",
          gridTemplateColumns: billingType === "insurance" ? "1fr 1fr 1fr" : "1fr",
          gap: "1rem",
          marginTop: "0.75rem",
        }}
      >
        <div className="form-group">
          <label className="form-label">Tipo de cobertura</label>
          <select
            className="form-input"
            {...billingTypeField}
            onChange={(e) => {
              billingTypeField.onChange(e);
              // Si cambia a Particular, reseteamos los campos de aseguradora
              if (e.target.value !== "insurance") {
                setValue("insurerId", "", { shouldValidate: true });
                setValue("agreedAmount", "", { shouldValidate: false });
              }
            }}
            style={{ backgroundColor: "white" }}
          >
            <option value="private">Particular</option>
            <option value="insurance">Aseguradora</option>
          </select>
        </div>

        {/* Campos condicionales si es Aseguradora */}
        {billingType === "insurance" && (
          <>
            <div className="form-group">
              <label className="form-label">Aseguradora</label>
              <select
                className="form-input"
                {...insurerField}
                onChange={(e) => {
                  insurerField.onChange(e);
                  // Buscamos la aseguradora para poner el monto por defecto
                  const ins = insurers.find((i) => String(i.id) === String(e.target.value));
                  setValue("agreedAmount", ins ? String(ins.fixedConsultationAmount ?? "") : "", { shouldValidate: true });
                }}
                style={{ backgroundColor: "white" }}
              >
                <option value="">Seleccione una aseguradora</option>
                {insurers.filter((i) => i.status !== "inactive").map((i) => (
                  <option key={i.id} value={i.id}>{i.companyName}</option>
                ))}
              </select>
              {errors.insurerId && <span className="field-error">{errors.insurerId.message}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Monto a cubrir</label>
              <input
                type="number"
                step="0.01"
                min="0"
                onKeyDown={preventNegative}
                className="form-input"
                placeholder="0.00"
                {...register("agreedAmount")}
              />
              {errors.agreedAmount && <span className="field-error">{errors.agreedAmount.message}</span>}
            </div>
          </>
        )}
      </div>
    </section>
  );
};