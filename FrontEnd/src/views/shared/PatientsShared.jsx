import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientSchema } from "../../lib/validations/patientSchema";
import { usePatients, useCreatePatient, useUpdatePatient, useUpdatePatientStatus, usePatientClinicalHistory } from "../../hooks/usePatients";
import { useInsurers } from "../../hooks/useInsurers";
import { Modal } from "../../components/Modal";
import { ClinicalHistoryTimeline } from "../../components/clinical-history/ClinicalHistoryTimeline";
import { calcularEdad, formatDUI, formatPhone, getStatusBadge } from "../../lib/utils";

export const PatientsShared = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDoctor = location.pathname.startsWith("/doctor");

  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [historialPatientId, setHistorialPatientId] = useState(null);

  const [statusModal, setStatusModal] = useState({ isOpen: false, patient: null, newStatus: "" });

  const { data: patients = [], isLoading } = usePatients("");
  const { data: insurers = [] } = useInsurers();
  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();
  const updateStatusMutation = useUpdatePatientStatus();
  const { data: historialClinico, isLoading: historialLoading, isError: historialError } = usePatientClinicalHistory(historialPatientId);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      fullName: "", dateOfBirth: "", identityDocument: "", gender: "male",
      phone: "", address: "", isMinor: false, responsibleName: "",
      personalHistory: "", familyHistory: "", insurerId: "",
    },
  });

  const esMenor = watch("isMinor");
  const fechaNacimiento = watch("dateOfBirth");
  const edadActual = fechaNacimiento ? calcularEdad(fechaNacimiento) : 0;
  const isAdult = fechaNacimiento && edadActual >= 18;
  useEffect(() => {
    if (fechaNacimiento) {
      if (edadActual < 18) {
        setValue("isMinor", true, { shouldValidate: true });
      } else {
        setValue("isMinor", false, { shouldValidate: true });
      }
    }
  }, [fechaNacimiento, edadActual, setValue]);

  const filtered = useMemo(() => {
    let list = patients;

    if (!mostrarInactivos) {
      list = list.filter((p) => p.status === "active");
    }

    if (!search) return list;

    const q = search.toLowerCase();
    return list.filter((p) =>
      p.fullName?.toLowerCase().includes(q) ||
      p.identityDocument?.includes(q) ||
      p.fileNumber?.toLowerCase().includes(q)
    );
  }, [patients, search, mostrarInactivos]);

  const openCreate = () => {
    setEditingPatient(null);
    reset({
      fullName: "", dateOfBirth: "", identityDocument: "", gender: "male",
      phone: "", address: "", isMinor: false, responsibleName: "",
      personalHistory: "", familyHistory: "", insurerId: "",
    });
    setShowModal(true);
  };

  const openEdit = (patient) => {
    setEditingPatient(patient);
    reset({
      fullName: patient.fullName || "",
      dateOfBirth: patient.yearOfBirth?.split("T")[0] || "",
      identityDocument: patient.identityDocument || "",
      gender: patient.gender || "male",
      phone: patient.phone || "",
      address: patient.address || "",
      isMinor: !!patient.isMinor,
      responsibleName: patient.responsibleName || "",
      personalHistory: patient.personalHistory || "",
      familyHistory: patient.familyHistory || "",
      insurerId: patient.insurerId || "",
    });
    setShowModal(true);
  };

  const onSubmit = (data) => {
    if (!data.isMinor) {
      data.responsibleName = null;
    }
    if (!data.insurerId || data.insurerId.trim() === "") {
      data.insurerId = null;
    }

    if (editingPatient) {
      updateMutation.mutate(
        { id: editingPatient.id, data },
        { onSuccess: () => { setShowModal(false); setEditingPatient(null); } }
      );
    } else {
      createMutation.mutate(data, { onSuccess: () => setShowModal(false) });
    }
  };

  const openStatusModal = (patient) => {
    setStatusModal({ isOpen: true, patient, newStatus: patient.status || "active" });
  };

  const handleStatusSave = () => {
    if (statusModal.newStatus === "deceased") {
      const confirmed = window.confirm(` ADVERTENCIA:\n\n¿Está seguro que desea marcar a ${statusModal.patient.fullName} como "Fallecido"?\n\nEsta acción lo ocultará de las búsquedas principales.`);
      if (!confirmed) return;
    }

    updateStatusMutation.mutate(
      { id: statusModal.patient.id, status: statusModal.newStatus },
      { onSuccess: () => setStatusModal({ isOpen: false, patient: null, newStatus: "" }) }
    );
  };

  const goToPreclinica = (patient) => {
    const basePath = isDoctor ? "/doctor" : "/reception";
    navigate(`${basePath}/preclinica`, { state: { paciente: patient, redirectTo: `${basePath}/pacientes` } });
  };

  const patientSelectedForHistory = useMemo(
    () => patients.find((patient) => patient.id === historialPatientId) || null,
    [patients, historialPatientId]
  );

  const gridForm = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" };

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Expedientes clínicos</span>
          <h1 className="page-header__heading">Pacientes</h1>
          <p className="page-header__sub">
            Gestión de expedientes, búsqueda, historial clínico y cambios de estado.
          </p>
        </div>
        <div className="page-header__actions">
          <button onClick={openCreate} className="btn btn-primary">
            <i className="ri-user-add-line"></i> Nuevo paciente
          </button>
        </div>
      </header>

      {/* Toolbar de búsqueda */}
      <div
        className="card"
        style={{
          padding: "0.9rem 1.25rem",
          marginBottom: "1.25rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 320px", minWidth: "260px" }}>
          <i
            className="ri-search-line"
            style={{
              position: "absolute",
              left: "0.9rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-muted)",
              fontSize: "1rem",
            }}
          ></i>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nombre, DUI o número de expediente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: "2.5rem" }}
          />
        </div>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            cursor: "pointer",
            fontSize: "0.88rem",
            color: "var(--fg-secondary)",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={mostrarInactivos}
            onChange={(e) => setMostrarInactivos(e.target.checked)}
            style={{ width: "16px", height: "16px", accentColor: "var(--brand)" }}
          />
          Mostrar archivados
        </label>
        <span className="text-muted" style={{ fontSize: "0.82rem" }}>
          {isLoading ? "Cargando…" : `${filtered.length} de ${patients.length}`}
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {isLoading ? (
          <p style={{ padding: "2.5rem", textAlign: "center", color: "var(--fg-muted)" }}>
            Cargando pacientes…
          </p>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--fg-muted)" }}>
            <i
              className="ri-search-line"
              style={{ fontSize: "1.8rem", opacity: 0.5, display: "block", marginBottom: "0.4rem" }}
            ></i>
            No se encontraron pacientes con los filtros actuales.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Expediente</th>
                  <th>DUI</th>
                  <th>Edad</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const edad = calcularEdad(p.yearOfBirth);
                  const badge = getStatusBadge(p.status || "active");
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--fg-primary)" }}>
                          {p.fullName}
                          {Boolean(p.isMinor) && (
                            <span className="badge badge-warning" style={{ marginLeft: "0.4rem" }}>
                              Menor
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--fg-muted)" }}>
                        {p.fileNumber}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: "var(--fg-muted)" }}>
                        {p.identityDocument}
                      </td>
                      <td>{edad} años</td>
                      <td>
                        <span
                          className="badge"
                          style={{ background: badge.bg, color: badge.color, border: "none" }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button onClick={() => openEdit(p)} className="btn btn-ghost btn-sm" title="Editar">
                            <i className="ri-edit-2-line"></i>
                          </button>
                          <button onClick={() => openStatusModal(p)} className="btn btn-ghost btn-sm" title="Estado">
                            <i className="ri-archive-line"></i>
                          </button>
                          <button onClick={() => setHistorialPatientId(p.id)} className="btn btn-ghost btn-sm" title="Historial">
                            <i className="ri-history-line"></i>
                          </button>
                          {p.status === "active" && (
                            <button onClick={() => goToPreclinica(p)} className="btn btn-primary btn-sm">
                              <i className="ri-heart-pulse-line"></i> Pre-clínica
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingPatient(null); }}
        title={editingPatient ? "Editar paciente" : "Nuevo paciente"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: "grid", gap: "1.1rem" }}>
            <div style={gridForm}>
              <div className="form-group">
                <label className="form-label">Nombre completo *</label>
                <input type="text" className="form-input" {...register("fullName")} />
                {errors.fullName && <span className="field-error">{errors.fullName.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de nacimiento *</label>
                <input type="date" className="form-input" {...register("dateOfBirth")} />
                {errors.dateOfBirth && <span className="field-error">{errors.dateOfBirth.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {esMenor ? "DUI del responsable *" : "DUI *"}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="12345678-9"
                  {...register("identityDocument")}
                  onChange={(e) =>
                    setValue("identityDocument", formatDUI(e.target.value), { shouldValidate: true })
                  }
                />
                {errors.identityDocument && <span className="field-error">{errors.identityDocument.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Género *</label>
                <select className="form-input" {...register("gender")}>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="0000-0000"
                  {...register("phone")}
                  onChange={(e) => setValue("phone", formatPhone(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input type="text" className="form-input" {...register("address")} />
              </div>

              <div className="form-group" style={{ gridColumn: "span 2" }}>
                <label className="form-label">Aseguradora (opcional)</label>
                <select className="form-input" {...register("insurerId")}>
                  <option value="">Sin aseguradora / particular</option>
                  {insurers.filter((i) => i.status !== "inactive").map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.companyName} — ${Number(i.fixedConsultationAmount).toFixed(2)} por consulta
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  cursor: isAdult ? "not-allowed" : "pointer",
                  opacity: isAdult ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  {...register("isMinor")}
                  disabled={isAdult}
                  style={{ accentColor: "var(--brand)" }}
                />
                <span className="form-label" style={{ margin: 0 }}>
                  Paciente es menor de edad
                  {isAdult && (
                    <span style={{ color: "var(--accent-coral)", fontSize: "0.8rem", marginLeft: "0.35rem" }}>
                      (bloqueado por fecha de nacimiento)
                    </span>
                  )}
                </span>
              </label>
            </div>

            {esMenor && (
              <div className="form-group">
                <label className="form-label">Nombre del responsable *</label>
                <input type="text" className="form-input" {...register("responsibleName")} />
                {errors.responsibleName && <span className="field-error">{errors.responsibleName.message}</span>}
              </div>
            )}

            <div style={gridForm}>
              <div className="form-group">
                <label className="form-label">Antecedentes personales</label>
                <textarea className="form-input" rows={2} {...register("personalHistory")} />
              </div>

              <div className="form-group">
                <label className="form-label">Antecedentes familiares</label>
                <textarea className="form-input" rows={2} {...register("familyHistory")} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.3rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowModal(false); setEditingPatient(null); }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending)
                  ? "Guardando…"
                  : editingPatient ? "Guardar cambios" : "Registrar paciente"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ isOpen: false, patient: null, newStatus: "" })}
        title="Archivo y estado del paciente"
        size="sm"
      >
        {statusModal.patient && (
          <div style={{ display: "grid", gap: "1.1rem" }}>
            <p style={{ color: "var(--fg-secondary)", fontSize: "0.92rem", margin: 0 }}>
              Modificar estado de <strong style={{ color: "var(--fg-primary)" }}>{statusModal.patient.fullName}</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">Estado actual</label>
              <select
                className="form-input"
                value={statusModal.newStatus}
                onChange={(e) => setStatusModal(prev => ({ ...prev, newStatus: e.target.value }))}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="deceased">Fallecido</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStatusModal({ isOpen: false, patient: null, newStatus: "" })}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStatusSave}
                className="btn btn-primary"
                disabled={updateStatusMutation.isPending || statusModal.newStatus === statusModal.patient.status}
              >
                {updateStatusMutation.isPending ? "Actualizando…" : "Guardar estado"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!historialPatientId}
        onClose={() => setHistorialPatientId(null)}
        title={`Historial Clínico${patientSelectedForHistory ? ` - ${patientSelectedForHistory.fullName}` : ""}`}
        size="xl"
      >
        <ClinicalHistoryTimeline history={historialClinico} isLoading={historialLoading} isError={historialError} />
      </Modal>
    </div>
  );
};