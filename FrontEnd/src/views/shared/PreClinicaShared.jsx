import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { usePatients } from "../../hooks/usePatients";
import {
  useCreatePreclinical,
  useUpdatePreclinical,
  usePreclinicalByPatient,
} from "../../hooks/usePreclinical";
import { calcularEdad } from "../../lib/utils";

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

  useEffect(() => {
    if (historialPaciente && paciente) {
      // Solo consideramos "activo" un registro creado hoy y en estado abierto.
      // Sin este filtro, un waiting olvidado de días previos capturaría el
      // formulario en modo edición, y al guardar no moveria al paciente a la
      // cola del día (porque el dashboard filtra por createdAt === hoy).
      const todayKey = new Date().toISOString().split("T")[0];
      const isOpen = (r) => r.status === "waiting" || r.status === "in_consultation";
      const isToday = (r) =>
        typeof r.createdAt === "string" && r.createdAt.startsWith(todayKey);

      const activeRecord = historialPaciente.find((r) => isOpen(r) && isToday(r));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historialPaciente, paciente]);

  const seleccionarPaciente = (p) => {
    setPaciente(p);
    setValue("patientId", p.id);
    setBusqueda("");
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

  const isPending = isEditing ? updateMutation.isPending : createMutation.isPending;

  return (
    <div className="page" style={{ maxWidth: "860px" }}>
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Pre-clínica</span>
          <h1 className="page-header__heading">
            {isEditing ? "Modificar pre-clínica" : "Registro pre-clínico"}
          </h1>
          <p className="page-header__sub">
            {isEditing
              ? "Edita los datos del paciente y guarda los cambios."
              : "Completa la información de pre-clínica del paciente."}
          </p>
        </div>
      </header>

      <section className="card" style={{ marginBottom: "1.25rem" }}>
        <h2 className="card-heading">Paciente</h2>
        {!paciente ? (
          <>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar paciente por nombre…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ marginTop: "0.5rem" }}
            />
            {resultados.length > 0 && (
              <div
                style={{
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  marginTop: "0.5rem",
                  maxHeight: "180px",
                  overflowY: "auto",
                  background: "var(--bg-surface)",
                }}
              >
                {resultados.map((p) => (
                  <div
                    key={p.id}
                    role="option"
                    tabIndex={0}
                    onClick={() => seleccionarPaciente(p)}
                    onKeyDown={(e) => e.key === "Enter" && seleccionarPaciente(p)}
                    style={{
                      padding: "0.6rem 0.75rem",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-subtle)",
                      color: "var(--fg-primary)",
                    }}
                  >
                    <strong>{p.fullName}</strong>{" "}
                    <span style={{ color: "var(--fg-muted)" }}>— Exp: {p.fileNumber}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              background: "var(--brand-soft)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--brand-soft)",
              marginTop: "0.5rem",
            }}
          >
            <div style={{ width: "100%" }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "1.05rem",
                  marginBottom: "0.25rem",
                  color: "var(--fg-primary)",
                }}
              >
                {paciente.fullName || paciente.patientName}
                {cargandoHistorial && (
                  <span style={{ color: "var(--accent-slate)", fontSize: "0.85rem", marginLeft: "10px" }}>
                    Cargando datos…
                  </span>
                )}
              </div>
              <div
                style={{
                  color: "var(--fg-secondary)",
                  fontSize: "0.9rem",
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginBottom: "0.5rem",
                }}
              >
                <span><strong>Exp:</strong> {paciente.fileNumber}</span>
                {paciente.yearOfBirth || paciente.patientDob ? (
                  <span>
                    <strong>Edad:</strong>{" "}
                    {calcularEdad(paciente.yearOfBirth || paciente.patientDob)} años
                  </span>
                ) : null}
              </div>
              <div
                style={{
                  color: "var(--brand)",
                  fontSize: "0.95rem",
                  background: "var(--bg-surface)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--brand-soft)",
                }}
              >
                <strong>Motivo:</strong> {motivoVal ? motivoVal : "Sin motivo especificado…"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleLimpiar(true)}
              aria-label="Quitar paciente"
              style={{
                background: "none",
                border: "none",
                color: "var(--accent-coral)",
                cursor: "pointer",
                fontSize: "1.5rem",
                padding: "0.5rem",
              }}
            >
              <i className="ri-close-circle-line"></i>
            </button>
          </div>
        )}
        <input type="hidden" {...register("patientId")} />
      </section>

      <form onSubmit={handleSubmit(onSubmit)}>
        <section className="card" style={{ marginBottom: "1.25rem" }}>
          <h2 className="card-heading">Motivo de consulta</h2>
          <div className="form-group">
            <textarea
              className="form-input"
              rows={3}
              placeholder="Describa el motivo de la visita del paciente (opcional)…"
              {...register("motivo")}
              disabled={cargandoHistorial}
            />
          </div>
        </section>

        <section className="card" style={{ marginBottom: "1.25rem" }}>
          <h2 className="card-heading">Signos vitales (opcional)</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginTop: "0.75rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">Presión arterial</label>
              <input
                type="text"
                className="form-input"
                placeholder="120/80"
                {...register("bloodPressure")}
                disabled={cargandoHistorial}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Temperatura (°C)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="36.5"
                {...register("temperature")}
                disabled={cargandoHistorial}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Frec. cardíaca (bpm)</label>
              <input
                type="number"
                className="form-input"
                placeholder="80"
                {...register("heartRate")}
                disabled={cargandoHistorial}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Peso (lb)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                placeholder="150"
                {...register("weight")}
                disabled={cargandoHistorial}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Estatura (m)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="1.70"
                {...register("height")}
                disabled={cargandoHistorial}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Saturación O₂ (%)</label>
              <input
                type="number"
                className="form-input"
                placeholder="98"
                {...register("oxygenSaturation")}
                disabled={cargandoHistorial}
              />
            </div>
          </div>
          {bmi && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: "var(--accent-forest-soft)",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
                border: "1px solid var(--accent-forest-soft)",
                color: "var(--accent-forest)",
                fontWeight: 600,
              }}
            >
              <strong>IMC calculado:</strong> {bmi}
            </div>
          )}
        </section>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => handleLimpiar(false)}
            disabled={cargandoHistorial}
            className="btn btn-secondary btn-lg"
            style={{ flex: 1 }}
          >
            Limpiar
          </button>
          <button
            type="submit"
            disabled={isPending || cargandoHistorial}
            className="btn btn-primary btn-lg"
            style={{ flex: 2 }}
          >
            {isPending
              ? (isEditing ? "Actualizando…" : "Registrando…")
              : (isEditing ? "Guardar cambios" : "Registrar pre-clínica")}
          </button>
        </div>
      </form>
    </div>
  );
};
