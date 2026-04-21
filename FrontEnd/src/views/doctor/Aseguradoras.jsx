import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../../components/Modal";
import { useCreateInsurer, useInsurers } from "../../hooks/useInsurers";
import { insurerSchema } from "../../lib/validations/insurerSchema";
import "../shared/Shared.css";

export const Aseguradoras = () => {
  const [showModal, setShowModal] = useState(false);
  const { data: insurers = [], isLoading, isError } = useInsurers();
  const createMutation = useCreateInsurer();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(insurerSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      phone: "",
      email: "",
      fixedConsultationAmount: "",
    },
  });

  const onSubmit = (data) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        setShowModal(false);
      },
    });
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1150px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ color: "#1f2937", margin: 0 }}>Aseguradoras</h1>
          <p style={{ color: "#6b7280", margin: "0.35rem 0 0" }}>
            Registra y consulta los convenios disponibles para asignarlos a tus pacientes.
          </p>
        </div>
        <button
          type="button"
          className="submit-btn"
          style={{ marginTop: 0, padding: "0.8rem 1.35rem" }}
          onClick={() => setShowModal(true)}
        >
          + Nueva
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Aseguradoras activas" value={insurers.length} color="#0d9488" />
        <StatCard
          label="Monto fijo promedio"
          value={insurers.length ? `$${(insurers.reduce((sum, insurer) => sum + Number(insurer.fixedConsultationAmount || 0), 0) / insurers.length).toFixed(2)}` : "$0.00"}
          color="#0284c7"
        />
      </div>

      <div style={{ backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Cargando aseguradoras...</div>
        ) : isError ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#dc2626" }}>No se pudo cargar el catalogo de aseguradoras.</div>
        ) : insurers.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}>
            Aun no hay aseguradoras registradas. Usa <strong>Nueva</strong> para agregar la primera.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontSize: "0.85rem" }}>
                <th style={S.th}>Compania</th>
                <th style={S.th}>Contacto</th>
                <th style={S.th}>Telefono</th>
                <th style={S.th}>Correo</th>
                <th style={S.th}>Monto fijo por consulta</th>
              </tr>
            </thead>
            <tbody>
              {insurers.map((insurer) => (
                <tr key={insurer.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ ...S.td, fontWeight: 600, color: "#1f2937" }}>{insurer.companyName}</td>
                  <td style={S.td}>{insurer.contactName}</td>
                  <td style={S.td}>{insurer.phone}</td>
                  <td style={S.td}>{insurer.email}</td>
                  <td style={{ ...S.td, color: "#0f766e", fontWeight: 700 }}>${Number(insurer.fixedConsultationAmount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Aseguradora" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Nombre de la compania *</label>
              <input type="text" className="form-input" {...register("companyName")} />
              {errors.companyName && <span style={S.errorMsg}>{errors.companyName.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Persona encargada *</label>
              <input type="text" className="form-input" {...register("contactName")} />
              {errors.contactName && <span style={S.errorMsg}>{errors.contactName.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Telefono *</label>
              <input type="text" className="form-input" {...register("phone")} />
              {errors.phone && <span style={S.errorMsg}>{errors.phone.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Correo electronico *</label>
              <input type="email" className="form-input" {...register("email")} />
              {errors.email && <span style={S.errorMsg}>{errors.email.message}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Monto fijo prenegociado por consulta *</label>
            <input type="number" step="0.01" min="0" className="form-input" placeholder="25.00" {...register("fixedConsultationAmount")} />
            {errors.fixedConsultationAmount && <span style={S.errorMsg}>{errors.fixedConsultationAmount.message}</span>}
          </div>

          <button type="submit" className="submit-btn" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Guardando..." : "Registrar Aseguradora"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div style={{ backgroundColor: "white", padding: "1.25rem", borderRadius: "1rem", boxShadow: "0 2px 4px rgba(0,0,0,0.03)", borderLeft: `5px solid ${color}` }}>
    <div style={{ color: "#6b7280", fontSize: "0.84rem", fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#1f2937", marginTop: "0.25rem" }}>{value}</div>
  </div>
);

const S = {
  th: { padding: "1rem 1.15rem", fontWeight: 600 },
  td: { padding: "1rem 1.15rem", color: "#4b5563" },
  errorMsg: { color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem" },
};
