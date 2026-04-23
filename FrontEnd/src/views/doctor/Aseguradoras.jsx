import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal } from "../../components/Modal";
import { useInsurers, useCreateInsurer, useUpdateInsurer, useToggleInsurerStatus } from "../../hooks/useInsurers";
import { insurerSchema } from "../../lib/validations/insurerSchema";
import "../shared/Shared.css";

export const Aseguradoras = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingInsurer, setEditingInsurer] = useState(null);
  
  const { data: insurers = [], isLoading, isError } = useInsurers();
  const createMutation = useCreateInsurer();
  const updateMutation = useUpdateInsurer();
  const toggleStatusMutation = useToggleInsurerStatus();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(insurerSchema),
    defaultValues: { companyName: "", contactName: "", phone: "", email: "", fixedConsultationAmount: "" }
  });

  // Estadísticas calculadas
  const activeCount = useMemo(() => insurers.filter(i => i.status !== 'inactive').length, [insurers]);
  const averageAmount = useMemo(() => {
    if (insurers.length === 0) return 0;
    const sum = insurers.reduce((acc, curr) => acc + Number(curr.fixedConsultationAmount), 0);
    return (sum / insurers.length).toFixed(2);
  }, [insurers]);

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInsurer(null);
    reset({ companyName: "", contactName: "", phone: "", email: "", fixedConsultationAmount: "" });
  };

  const handleOpenEdit = (insurer) => {
    setEditingInsurer(insurer);
    reset({
      companyName: insurer.companyName,
      contactName: insurer.contactName,
      phone: insurer.phone,
      email: insurer.email,
      fixedConsultationAmount: insurer.fixedConsultationAmount.toString(),
    });
    setShowModal(true);
  };

  const handleToggleStatus = (insurer) => {
    const isActivating = insurer.status === 'inactive';
    const msg = `¿Está seguro de ${isActivating ? 'activar' : 'inhabilitar'} a ${insurer.companyName}?`;
    
    if (!window.confirm(msg)) return;
    
    toggleStatusMutation.mutate({ id: insurer.id, status: isActivating ? 'active' : 'inactive' }, {
      onSuccess: () => toast.success(isActivating ? "Aseguradora reactivada" : "Aseguradora inhabilitada")
    });
  };

  const onSubmit = (data) => {
    const mutation = editingInsurer ? updateMutation : createMutation;
    const payload = editingInsurer ? { id: editingInsurer.id, ...data } : data;

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(editingInsurer ? "Datos actualizados" : "Aseguradora registrada con éxito");
        handleCloseModal();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Ocurrió un error");
      }
    });
  };

  if (isLoading) return <div style={S.loadingContainer}>Cargando catálogo de aseguradoras...</div>;
  if (isError) return <div style={S.errorContainer}>Error al conectar con el servidor.</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "1150px", margin: "0 auto" }}>
      <div style={S.header}>
        <div>
          <h1 style={{ color: "#1f2937", margin: 0 }}>Aseguradoras</h1>
          <p style={{ color: "#6b7280", margin: "0.35rem 0 0" }}>Registra y gestiona convenios para tus pacientes.</p>
        </div>
        <button className="submit-btn" style={{ width: 'auto', padding: "0.8rem 1.5rem" }} onClick={() => setShowModal(true)}>
          + Nueva Aseguradora
        </button>
      </div>

      <div style={S.statsGrid}>
        <StatCard label="Aseguradoras Activas" value={activeCount} color="#0d9488" />
        <StatCard label="Monto Promedio" value={`$${averageAmount}`} color="#0284c7" />
        <StatCard label="Inactivas" value={insurers.length - activeCount} color="#94a3b8" />
      </div>

      <div style={S.tableCard}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={S.tableHeaderRow}>
              <th style={S.th}>Compañía</th>
              <th style={S.th}>Contacto / Teléfono</th>
              <th style={S.th}>Monto por Consulta</th>
              <th style={S.th}>Estado</th>
              <th style={S.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insurers.map((insurer) => (
              <tr key={insurer.id} style={{ 
                borderBottom: "1px solid #f3f4f6", 
                backgroundColor: insurer.status === 'inactive' ? '#fcfcfc' : 'white',
                opacity: insurer.status === 'inactive' ? 0.7 : 1
              }}>
                <td style={S.td}>
                  <div style={{ fontWeight: 600, color: "#1f2937" }}>{insurer.companyName}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{insurer.email}</div>
                </td>
                <td style={S.td}>
                  <div>{insurer.contactName}</div>
                  <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{insurer.phone}</div>
                </td>
                <td style={{ ...S.td, color: "#0f766e", fontWeight: 700 }}>
                  ${Number(insurer.fixedConsultationAmount).toFixed(2)}
                </td>
                <td style={S.td}>
                  <span style={{ ...S.badge, ...(insurer.status === 'inactive' ? S.badgeInactive : S.badgeActive) }}>
                    {insurer.status === 'inactive' ? 'Inactiva' : 'Activa'}
                  </span>
                </td>
                <td style={S.td}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenEdit(insurer)} style={S.btnEdit}>Editar</button>
                    <button onClick={() => handleToggleStatus(insurer)} style={insurer.status === 'inactive' ? S.btnActivate : S.btnDeactivate}>
                      {insurer.status === 'inactive' ? 'Activar' : 'Inhabilitar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingInsurer ? "Editar Aseguradora" : "Nueva Aseguradora"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2rem" }}>
            <div className="form-group">
              <label className="form-label">Nombre de la Compañía *</label>
              <input {...register("companyName")} className="form-input" placeholder="Ej. ASESUISA" />
              {errors.companyName && <span style={S.error}>{errors.companyName.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Monto Prenegociado ($) *</label>
              <input type="number" step="0.01" {...register("fixedConsultationAmount")} className="form-input" placeholder="0.00" />
              {errors.fixedConsultationAmount && <span style={S.error}>{errors.fixedConsultationAmount.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Persona de Contacto *</label>
              <input {...register("contactName")} className="form-input" placeholder="Nombre del encargado" />
              {errors.contactName && <span style={S.error}>{errors.contactName.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono *</label>
              <input {...register("phone")} className="form-input" placeholder="2200-0000" />
              {errors.phone && <span style={S.error}>{errors.phone.message}</span>}
            </div>
            <div className="form-group" style={{ gridColumn: "span 2" }}>
              <label className="form-label">Correo Electrónico *</label>
              <input type="email" {...register("email")} className="form-input" placeholder="contacto@empresa.com" />
              {errors.email && <span style={S.error}>{errors.email.message}</span>}
            </div>
          </div>
          <button type="submit" className="submit-btn" disabled={updateMutation.isPending || createMutation.isPending} style={{ marginTop: "1.5rem" }}>
            {updateMutation.isPending || createMutation.isPending ? "Procesando..." : (editingInsurer ? "Guardar Cambios" : "Registrar Aseguradora")}
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" },
  tableCard: { backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", overflow: "hidden" },
  tableHeaderRow: { borderBottom: "2px solid #e5e7eb", color: "#4b5563", fontSize: "0.85rem", textAlign: "left" },
  th: { padding: "1rem 1.15rem", fontWeight: 600 },
  td: { padding: "1rem 1.15rem", color: "#4b5563", fontSize: "0.9rem" },
  badge: { padding: "0.25rem 0.6rem", borderRadius: "99px", fontSize: "0.75rem", fontWeight: 600 },
  badgeActive: { backgroundColor: "#ccfbf1", color: "#115e59" },
  badgeInactive: { backgroundColor: "#fee2e2", color: "#991b1b" },
  btnEdit: { padding: "0.4rem 0.8rem", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "0.4rem", cursor: "pointer", fontSize: "0.8rem" },
  btnDeactivate: { padding: "0.4rem 0.8rem", backgroundColor: "#fee2e2", color: "#991b1b", border: "none", borderRadius: "0.4rem", cursor: "pointer", fontSize: "0.8rem" },
  btnActivate: { padding: "0.4rem 0.8rem", backgroundColor: "#ccfbf1", color: "#115e59", border: "none", borderRadius: "0.4rem", cursor: "pointer", fontSize: "0.8rem" },
  error: { color: "#ef4444", fontSize: "0.8rem", marginTop: "0.25rem", display: "block" },
  loadingContainer: { padding: "5rem", textAlign: "center", color: "#6b7280" },
  errorContainer: { padding: "5rem", textAlign: "center", color: "#dc2626" }
};