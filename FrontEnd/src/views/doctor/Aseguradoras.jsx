import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal } from "../../components/Modal";
import { useInsurers, useCreateInsurer, useUpdateInsurer, useToggleInsurerStatus } from "../../hooks/useInsurers";
import { insurerSchema } from "../../lib/validations/insurerSchema";

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

  if (isLoading) return <div className="page" style={{ textAlign: "center", color: "var(--fg-muted)" }}>Cargando catálogo de aseguradoras…</div>;
  if (isError) return <div className="page" style={{ textAlign: "center", color: "var(--accent-coral)" }}>Error al conectar con el servidor.</div>;

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Convenios</span>
          <h1 className="page-header__heading">Aseguradoras</h1>
          <p className="page-header__sub">
            Registra y gestiona convenios con aseguradoras para cobertura de consultas.
          </p>
        </div>
        <div className="page-header__actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="ri-add-line"></i> Nueva aseguradora
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div className="stat-card stat-card--brand">
          <span className="stat-card__accent" />
          <div className="stat-card__label"><i className="ri-building-line"></i> Activas</div>
          <div className="stat-card__value">{activeCount}</div>
          <div className="stat-card__meta">{insurers.length} totales</div>
        </div>
        <div className="stat-card stat-card--slate">
          <span className="stat-card__accent" />
          <div className="stat-card__label"><i className="ri-money-dollar-circle-line"></i> Monto promedio</div>
          <div className="stat-card__value">${averageAmount}</div>
          <div className="stat-card__meta">por consulta</div>
        </div>
        <div className="stat-card">
          <span className="stat-card__accent" style={{ background: "var(--ink-300)" }} />
          <div className="stat-card__label"><i className="ri-pause-circle-line"></i> Inactivas</div>
          <div className="stat-card__value">{insurers.length - activeCount}</div>
          <div className="stat-card__meta">fuera de convenio</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Compañía</th>
                <th>Contacto / Teléfono</th>
                <th>Monto por consulta</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insurers.map((insurer) => (
                <tr key={insurer.id} style={{ opacity: insurer.status === 'inactive' ? 0.55 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--fg-primary)" }}>{insurer.companyName}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>{insurer.email}</div>
                  </td>
                  <td>
                    <div>{insurer.contactName}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>{insurer.phone}</div>
                  </td>
                  <td style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--brand)", fontSize: "1rem" }}>
                    ${Number(insurer.fixedConsultationAmount).toFixed(2)}
                  </td>
                  <td>
                    <span className={`badge ${insurer.status === 'inactive' ? "badge-danger" : "badge-success"} badge-dot`}>
                      {insurer.status === 'inactive' ? "Inactiva" : "Activa"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                      <button onClick={() => handleOpenEdit(insurer)} className="btn btn-ghost btn-sm">
                        <i className="ri-edit-2-line"></i> Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(insurer)}
                        className={`btn btn-sm ${insurer.status === 'inactive' ? "btn-secondary" : "btn-danger"}`}
                      >
                        {insurer.status === 'inactive' ? "Activar" : "Inhabilitar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingInsurer ? "Editar aseguradora" : "Nueva aseguradora"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: "grid", gap: "1.1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>
              <div className="form-group">
                <label className="form-label">Nombre de la compañía *</label>
                <input {...register("companyName")} className="form-input" placeholder="Ej. ASESUISA" />
                {errors.companyName && <span className="field-error">{errors.companyName.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Monto prenegociado ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("fixedConsultationAmount")}
                  className="form-input"
                  placeholder="0.00"
                />
                {errors.fixedConsultationAmount && (
                  <span className="field-error">{errors.fixedConsultationAmount.message}</span>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Persona de contacto *</label>
                <input {...register("contactName")} className="form-input" placeholder="Nombre del encargado" />
                {errors.contactName && <span className="field-error">{errors.contactName.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono *</label>
                <input {...register("phone")} className="form-input" placeholder="2200-0000" />
                {errors.phone && <span className="field-error">{errors.phone.message}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Correo electrónico *</label>
                <input type="email" {...register("email")} className="form-input" placeholder="contacto@empresa.com" />
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.3rem" }}>
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateMutation.isPending || createMutation.isPending}
              >
                {updateMutation.isPending || createMutation.isPending
                  ? "Procesando…"
                  : editingInsurer ? "Guardar cambios" : "Registrar aseguradora"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};