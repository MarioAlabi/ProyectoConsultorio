import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "../../lib/validations/appointmentSchema";
import {
  useAppointmentsRange,
  useCreateAppointment,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
} from "../../hooks/useAppointments";
import { usePatients } from "../../hooks/usePatients";
import { useWaitingRoom } from "../../hooks/usePreclinical";
import { CalendarHeader } from "../../components/calendar/CalendarHeader";
import { CalendarMonthView } from "../../components/calendar/CalendarMonthView";
import { CalendarWeekView } from "../../components/calendar/CalendarWeekView";
import { CalendarDayView } from "../../components/calendar/CalendarDayView";
import { formatDateKey, getWeekDays } from "../../components/calendar/calendarUtils";
import { Modal } from "../../components/Modal";

const TIME_SLOTS_30 = [];
const TIME_SLOTS_60 = [];
for (let h = 7; h <= 17; h++) {
  const hh = String(h).padStart(2, "0");
  TIME_SLOTS_60.push(`${hh}:00`);
  TIME_SLOTS_30.push(`${hh}:00`);
  TIME_SLOTS_30.push(`${hh}:30`);
}
TIME_SLOTS_60.push("18:00");
TIME_SLOTS_30.push("18:00");

const statusAccent = {
  scheduled: "var(--accent-slate)",
  present: "var(--accent-forest)",
  cancelled: "var(--accent-coral)",
  done: "var(--fg-subtle)",
};

export const AgendaCitas = () => {
  const routerNavigate = useNavigate();
  const location = useLocation();
  // La agenda es compartida por doctor y recepción; determinamos a qué
  // área volver tras tomar signos para preservar el scope de la sesión.
  const basePath = location.pathname.startsWith("/doctor") ? "/doctor" : "/reception";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCita, setEditingCita] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [intervalo, setIntervalo] = useState("30");

  const [busqueda, setBusqueda] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [ocultarCanceladas, setOcultarCanceladas] = useState(false);

  const { data: waitingList = [] } = useWaitingRoom();
  // Pacientes con pre-clínica activa hoy: para saber si basta mostrar el badge
  // "En sala de espera" o todavía falta la toma de signos.
  const patientsInClinicalQueue = useMemo(
    () => new Set(
      waitingList
        .filter((w) => w.status === "waiting" || w.status === "in_consultation")
        .map((w) => w.patientId)
    ),
    [waitingList]
  );

  const irAPreclinica = (cita) => {
    if (!cita?.patientId) return;
    routerNavigate(`${basePath}/preclinica`, {
      state: {
        paciente: {
          id: cita.patientId,
          fullName: cita.patientName,
          patientName: cita.patientName,
        },
        redirectTo: `${basePath}/agenda`,
      },
    });
  };

  const { from, to } = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    if (view === "month") {
      const first = new Date(y, m, 1);
      let dow = first.getDay() - 1;
      if (dow < 0) dow = 6;
      const gridStart = new Date(first);
      gridStart.setDate(1 - dow);
      const gridEnd = new Date(gridStart);
      gridEnd.setDate(gridStart.getDate() + 41);
      return { from: formatDateKey(gridStart), to: formatDateKey(gridEnd) };
    }
    if (view === "week") {
      const days = getWeekDays(currentDate);
      return { from: formatDateKey(days[0]), to: formatDateKey(days[6]) };
    }
    const key = formatDateKey(currentDate);
    return { from: key, to: key };
  }, [currentDate, view]);

  const { data: appointments = [], isLoading } = useAppointmentsRange(from, to);
  const { data: pacientesResultados = [] } = usePatients(busqueda.length >= 3 ? busqueda : "");
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const statusMutation = useUpdateAppointmentStatus();

  const timeSlots = intervalo === "60" ? TIME_SLOTS_60 : TIME_SLOTS_30;

  const selectedDateKey = formatDateKey(selectedDate);
  const citasDelDia = useMemo(() => {
    return appointments.filter((a) => {
      const k = typeof a.date === "string" ? a.date.split("T")[0] : formatDateKey(new Date(a.date));
      return k === selectedDateKey;
    });
  }, [appointments, selectedDateKey]);

  const horasOcupadas = useMemo(() => {
    return new Set(
      citasDelDia.filter((c) => c.status !== "cancelled").map((c) => c.time)
    );
  }, [citasDelDia]);

  const createForm = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { patientId: "", date: formatDateKey(selectedDate), time: "", reason: "" },
  });

  const editForm = useForm({
    defaultValues: { date: "", time: "", reason: "" },
  });

  const navigate = (dir) => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const goToday = () => { const t = new Date(); setCurrentDate(t); setSelectedDate(t); };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    createForm.setValue("date", formatDateKey(date), { shouldValidate: true });
    if (view === "month" && date.getMonth() !== currentDate.getMonth()) setCurrentDate(date);
  };

  const onCreateSubmit = (data) => {
    createMutation.mutate(
      { ...data, date: formatDateKey(selectedDate) },
      {
        onSuccess: () => {
          createForm.reset({ patientId: "", date: formatDateKey(selectedDate), time: "", reason: "" });
          setPacienteSeleccionado(null);
          setBusqueda("");
          setShowNewModal(false);
        },
      }
    );
  };

  const seleccionarPaciente = (p) => {
    setPacienteSeleccionado(p);
    createForm.setValue("patientId", p.id, { shouldValidate: true });
    setBusqueda("");
  };

  const openEditModal = (cita) => {
    setEditingCita(cita);
    const dateStr = typeof cita.date === "string" ? cita.date.split("T")[0] : formatDateKey(new Date(cita.date));
    editForm.reset({ date: dateStr, time: cita.time, reason: cita.reason || "" });
  };

  const onEditSubmit = (data) => {
    updateMutation.mutate(
      { id: editingCita.id, data },
      { onSuccess: () => setEditingCita(null) }
    );
  };

  const confirmCancel = () => {
    if (!cancelConfirm) return;
    statusMutation.mutate({ id: cancelConfirm.id, status: "cancelled" }, {
      onSuccess: () => setCancelConfirm(null),
    });
  };

  const cambiarEstado = (id, status) => {
    statusMutation.mutate({ id, status });
  };

  const visibleAppts = ocultarCanceladas ? appointments.filter((a) => a.status !== "cancelled") : appointments;

  return (
    <div className="page" style={{ maxWidth: "1400px" }}>
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Agenda</span>
          <h1 className="page-header__heading">Citas y disponibilidad</h1>
          <p className="page-header__sub">
            {currentDate.toLocaleDateString("es-SV", { month: "long", year: "numeric" })} — organiza los espacios del consultorio.
          </p>
        </div>
        <div className="page-header__actions">
          <button
            type="button"
            onClick={() => setOcultarCanceladas(!ocultarCanceladas)}
            className={`btn ${ocultarCanceladas ? "btn-primary" : "btn-secondary"} btn-sm`}
          >
            <i className={ocultarCanceladas ? "ri-eye-off-line" : "ri-eye-line"}></i>
            {ocultarCanceladas ? "Canceladas ocultas" : "Ocultar canceladas"}
          </button>
          <button type="button" onClick={() => setShowNewModal(true)} className="btn btn-primary btn-sm">
            <i className="ri-add-line"></i> Nueva cita
          </button>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div className="stat-card">
          <span className="stat-card__accent" />
          <div className="stat-card__label"><i className="ri-calendar-line"></i> Total</div>
          <div className="stat-card__value">{appointments.length}</div>
          <div className="stat-card__meta">Citas en el rango visible</div>
        </div>
        <div className="stat-card stat-card--slate">
          <span className="stat-card__accent" />
          <div className="stat-card__label"><i className="ri-time-line"></i> Programadas</div>
          <div className="stat-card__value">{appointments.filter((a) => a.status === "scheduled").length}</div>
          <div className="stat-card__meta">Pendientes de atención</div>
        </div>
        <div className="stat-card stat-card--forest">
          <span className="stat-card__accent" />
          <div className="stat-card__label"><i className="ri-user-received-2-line"></i> Presentes</div>
          <div className="stat-card__value">{appointments.filter((a) => a.status === "present").length}</div>
          <div className="stat-card__meta">Pacientes registrados</div>
        </div>
        <div className="stat-card stat-card--coral">
          <span className="stat-card__accent" />
          <div className="stat-card__label"><i className="ri-close-circle-line"></i> Canceladas</div>
          <div className="stat-card__value">{appointments.filter((a) => a.status === "cancelled").length}</div>
          <div className="stat-card__meta">En el rango visible</div>
        </div>
      </div>

      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "0.75rem",
          padding: "0.75rem 1.1rem",
          marginBottom: "1.5rem",
        }}
      >
        <span className="eyebrow" style={{ letterSpacing: "0.12em" }}>Intervalo</span>
        <div
          role="group"
          aria-label="Intervalo de tiempo"
          style={{
            display: "inline-flex",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "1px solid var(--border-default)",
          }}
        >
          {[
            { k: "30", label: "30 min" },
            { k: "60", label: "1 hora" },
          ].map((opt, i) => {
            const active = intervalo === opt.k;
            return (
              <button
                key={opt.k}
                type="button"
                onClick={() => setIntervalo(opt.k)}
                aria-pressed={active}
                style={{
                  padding: "0.45rem 1rem",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  border: "none",
                  borderLeft: i > 0 ? "1px solid var(--border-default)" : "none",
                  cursor: "pointer",
                  background: active ? "var(--brand)" : "var(--bg-surface)",
                  color: active ? "var(--fg-on-brand)" : "var(--fg-secondary)",
                  transition: "background var(--t-fast), color var(--t-fast)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "flex-start" }}>
        <div>
          <CalendarHeader
            currentDate={currentDate}
            view={view}
            onPrev={() => navigate(-1)}
            onNext={() => navigate(1)}
            onToday={goToday}
            onViewChange={setView}
          />
          {isLoading && (
            <div style={{ textAlign: "center", padding: "1rem", color: "var(--fg-muted)" }}>
              Cargando citas…
            </div>
          )}
          {view === "month" && (
            <CalendarMonthView
              currentDate={currentDate}
              appointments={visibleAppts}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
          {view === "week" && (
            <CalendarWeekView
              currentDate={currentDate}
              appointments={visibleAppts}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}
          {view === "day" && (
            <CalendarDayView currentDate={currentDate} appointments={visibleAppts} />
          )}
        </div>

        <aside className="card" style={{ display: "flex", flexDirection: "column", gap: "0.9rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="eyebrow">Citas del día</div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "var(--fg-primary)",
                  marginTop: "0.2rem",
                  textTransform: "capitalize",
                }}
              >
                {selectedDate.toLocaleDateString("es-SV", { weekday: "long", day: "numeric", month: "short" })}
              </div>
            </div>
            <span className="badge badge-brand">
              {citasDelDia.filter((c) => c.status !== "cancelled").length} citas
            </span>
          </div>

          {citasDelDia.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "2rem 1rem",
                color: "var(--fg-muted)",
                border: "1px dashed var(--border-default)",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-surface-alt)",
              }}
            >
              <i className="ri-calendar-line" style={{ fontSize: "1.75rem", display: "block", marginBottom: "0.4rem", color: "var(--fg-subtle)" }}></i>
              Sin citas para este día
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "520px", overflowY: "auto" }}>
              {citasDelDia
                .filter((c) => !(ocultarCanceladas && c.status === "cancelled"))
                .map((c) => {
                  const cancelled = c.status === "cancelled";
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.7rem 0.8rem",
                        borderRadius: "var(--radius-md)",
                        background: cancelled ? "var(--accent-coral-soft)" : "var(--bg-surface-alt)",
                        border: `1px solid ${cancelled ? "var(--accent-coral-soft)" : "var(--border-subtle)"}`,
                        opacity: cancelled ? 0.65 : 1,
                        transition: "background var(--t-fast)",
                      }}
                    >
                      <span
                        style={{
                          background: statusAccent[c.status] || "var(--fg-subtle)",
                          color: "#fff",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          fontVariantNumeric: "tabular-nums",
                          fontFamily: "var(--font-mono)",
                          minWidth: "54px",
                          textAlign: "center",
                        }}
                      >
                        {c.time}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.88rem",
                            color: "var(--fg-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.patientName || "Paciente"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--fg-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.reason || "Sin motivo"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.15rem", flexShrink: 0 }}>
                        {c.status === "scheduled" && (
                          <>
                            <IconAction onClick={() => cambiarEstado(c.id, "present")} tone="forest" icon="ri-user-received-2-line" label="Marcar presente" />
                            <IconAction onClick={() => openEditModal(c)} tone="slate" icon="ri-pencil-line" label="Editar cita" />
                            <IconAction onClick={() => setCancelConfirm(c)} tone="coral" icon="ri-close-circle-line" label="Cancelar cita" />
                          </>
                        )}
                        {c.status === "present" && (
                          patientsInClinicalQueue.has(c.patientId) ? (
                            <span className="badge badge-success badge-dot" title="Pre-clínica registrada, el doctor ya puede atender">
                              En sala de espera
                            </span>
                          ) : (
                            <IconAction
                              onClick={() => irAPreclinica(c)}
                              tone="forest"
                              icon="ri-heart-pulse-line"
                              label="Tomar signos vitales"
                            />
                          )
                        )}
                        {c.status === "done" && (
                          <span className="badge">Atendido</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </aside>
      </div>

      <Modal
        isOpen={showNewModal}
        onClose={() => {
          setShowNewModal(false);
          setPacienteSeleccionado(null);
          setBusqueda("");
          createForm.clearErrors();
        }}
        title="Agendar nueva cita"
        size="md"
      >
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)}>
          <div style={{ display: "grid", gap: "1.1rem" }}>
            <div className="form-group">
              <label className="form-label">Paciente *</label>
              {!pacienteSeleccionado ? (
                <>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar por nombre o DUI…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                  {createForm.formState.errors.patientId && (
                    <span className="field-error">{createForm.formState.errors.patientId.message}</span>
                  )}
                  {pacientesResultados.length > 0 && (
                    <div
                      style={{
                        border: "1px solid var(--border-default)",
                        borderRadius: "var(--radius-md)",
                        marginTop: "0.4rem",
                        maxHeight: "160px",
                        overflowY: "auto",
                        background: "var(--bg-surface)",
                      }}
                    >
                      {pacientesResultados.map((p) => (
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
                            fontSize: "0.9rem",
                            color: "var(--fg-primary)",
                          }}
                        >
                          <strong>{p.fullName}</strong>{" "}
                          <span style={{ color: "var(--fg-muted)" }}>— {p.identityDocument}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  style={{
                    padding: "0.6rem 0.85rem",
                    background: "var(--brand-soft)",
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid var(--brand-soft)",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--brand)" }}>{pacienteSeleccionado.fullName}</span>
                  <button
                    type="button"
                    onClick={() => { setPacienteSeleccionado(null); createForm.setValue("patientId", ""); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-coral)",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                    }}
                    aria-label="Quitar paciente"
                  >
                    <i className="ri-close-circle-line"></i>
                  </button>
                </div>
              )}
              <input type="hidden" {...createForm.register("patientId")} />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-input"
                value={formatDateKey(selectedDate)}
                {...createForm.register("date")}
                onChange={(e) => {
                  setSelectedDate(new Date(e.target.value + "T12:00:00"));
                  createForm.setValue("date", e.target.value, { shouldValidate: true });
                }}
              />
              {createForm.formState.errors.date && (
                <span className="field-error">{createForm.formState.errors.date.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Hora * (intervalo: {intervalo} min)</label>
              <select className="form-input" {...createForm.register("time")}>
                <option value="">Seleccionar hora…</option>
                {timeSlots.map((t) => {
                  const occupied = horasOcupadas.has(t);
                  return (
                    <option key={t} value={t} disabled={occupied}>
                      {t}{occupied ? " (ocupado)" : ""}
                    </option>
                  );
                })}
              </select>
              {createForm.formState.errors.time && (
                <span className="field-error">{createForm.formState.errors.time.message}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Motivo (opcional)</label>
              <input type="text" className="form-input" placeholder="Ej. Control de azúcar" {...createForm.register("reason")} />
            </div>

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.3rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowNewModal(false);
                  setPacienteSeleccionado(null);
                  setBusqueda("");
                  createForm.clearErrors();
                }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Agendando…" : "Agendar cita"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editingCita} onClose={() => setEditingCita(null)} title="Editar cita" size="md">
        {editingCita && (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)}>
            <div style={{ display: "grid", gap: "1.1rem" }}>
              <div
                style={{
                  padding: "0.7rem 0.85rem",
                  background: "var(--brand-soft)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--brand-soft)",
                }}
              >
                <strong style={{ color: "var(--brand)" }}>{editingCita.patientName}</strong>
              </div>

              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input type="date" className="form-input" {...editForm.register("date")} />
              </div>

              <div className="form-group">
                <label className="form-label">Hora (intervalo: {intervalo} min)</label>
                <select className="form-input" {...editForm.register("time")}>
                  <option value="">Seleccionar hora…</option>
                  {timeSlots.map((t) => {
                    const occupied = horasOcupadas.has(t) && t !== editingCita.time;
                    return (
                      <option key={t} value={t} disabled={occupied}>
                        {t}
                        {occupied ? " (ocupado)" : ""}
                        {t === editingCita.time ? " (actual)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Motivo</label>
                <input type="text" className="form-input" {...editForm.register("reason")} />
              </div>

              <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.3rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingCita(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={!!cancelConfirm} onClose={() => setCancelConfirm(null)} title="Cancelar cita" size="sm">
        {cancelConfirm && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <p style={{ color: "var(--fg-secondary)", margin: 0 }}>
              ¿Estás seguro de cancelar esta cita?
            </p>
            <div
              style={{
                padding: "0.85rem 1rem",
                background: "var(--accent-coral-soft)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--accent-coral-soft)",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--fg-primary)" }}>
                {cancelConfirm.time} — {cancelConfirm.patientName}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--fg-muted)" }}>
                {cancelConfirm.reason || "Sin motivo"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCancelConfirm(null)}>
                No, mantener
              </button>
              <button
                type="button"
                className="btn btn-danger-solid"
                onClick={confirmCancel}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? "Cancelando…" : "Sí, cancelar cita"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const IconAction = ({ onClick, tone, icon, label }) => {
  const color = {
    forest: "var(--accent-forest)",
    slate: "var(--accent-slate)",
    coral: "var(--accent-coral)",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color,
        padding: "0.25rem",
        borderRadius: "var(--radius-sm)",
        fontSize: "1rem",
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        transition: "background var(--t-fast)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-surface-alt)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <i className={icon}></i>
    </button>
  );
};

