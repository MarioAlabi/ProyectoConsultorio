import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentSchema } from "../../lib/validations/appointmentSchema";
import { useAppointmentsRange, useCreateAppointment, useUpdateAppointment, useUpdateAppointmentStatus } from "../../hooks/useAppointments";
import { usePatients } from "../../hooks/usePatients";
import { getStatusBadge } from "../../lib/utils";
import { CalendarHeader } from "../../components/calendar/CalendarHeader";
import { CalendarMonthView } from "../../components/calendar/CalendarMonthView";
import { CalendarWeekView } from "../../components/calendar/CalendarWeekView";
import { CalendarDayView } from "../../components/calendar/CalendarDayView";
import { formatDateKey, getWeekDays } from "../../components/calendar/calendarUtils";
import { Modal } from "../../components/Modal";
import "../../views/shared/Shared.css";

// Generar slots de tiempo en intervalos de 30min
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

export const AgendaCitas = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCita, setEditingCita] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [intervalo, setIntervalo] = useState("30");

  // Busqueda de pacientes
  const [busqueda, setBusqueda] = useState("");
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [ocultarCanceladas, setOcultarCanceladas] = useState(false);

  // Rango de fechas segun vista
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

  // Data hooks
  const { data: appointments = [], isLoading } = useAppointmentsRange(from, to);
  const { data: pacientesResultados = [] } = usePatients(busqueda.length >= 3 ? busqueda : "");
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const statusMutation = useUpdateAppointmentStatus();

  const timeSlots = intervalo === "60" ? TIME_SLOTS_60 : TIME_SLOTS_30;

  // Citas del dia seleccionado
  const selectedDateKey = formatDateKey(selectedDate);
  const citasDelDia = useMemo(() => {
    return appointments.filter((a) => {
      const k = typeof a.date === "string" ? a.date.split("T")[0] : formatDateKey(new Date(a.date));
      return k === selectedDateKey;
    });
  }, [appointments, selectedDateKey]);

  // Horas ya ocupadas (para marcar en el select)
  const horasOcupadas = useMemo(() => {
    return new Set(
      citasDelDia.filter((c) => c.status !== "cancelled").map((c) => c.time)
    );
  }, [citasDelDia]);

  // --- Formulario crear ---
  const createForm = useForm({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { patientId: "", date: formatDateKey(selectedDate), time: "", reason: "" },
  });

  // --- Formulario editar ---
  const editForm = useForm({
    defaultValues: { date: "", time: "", reason: "" },
  });

  // Navegacion
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

  // --- Crear cita ---
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

  // --- Editar cita ---
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

  // --- Cancelar cita ---
  const confirmCancel = () => {
    if (!cancelConfirm) return;
    statusMutation.mutate({ id: cancelConfirm.id, status: "cancelled" }, {
      onSuccess: () => setCancelConfirm(null),
    });
  };

  const cambiarEstado = (id, status) => {
    statusMutation.mutate({ id, status });
  };

  // --- Estilos ---
  const C = {
    teal50: "#f0fdfa", teal600: "#0d9488", teal700: "#0f766e",
    gray50: "#f9fafb", gray100: "#f3f4f6", gray200: "#e5e7eb", gray400: "#9ca3af",
    gray500: "#6b7280", gray700: "#374151", gray900: "#111827",
    blue500: "#3b82f6", green500: "#22c55e", red500: "#ef4444",
  };

  const S = {
    layout: { /* moved to inline */ },
    sidebar: { display: "flex", flexDirection: "column", gap: "1rem" },
    card: {
      backgroundColor: "white", padding: "1.25rem", borderRadius: "12px",
      border: `1px solid ${C.gray200}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    sectionTitle: { margin: "0 0 1rem", color: C.gray900, fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" },
    citaRow: (status) => ({
      display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.75rem",
      borderRadius: "8px", marginBottom: "0.5rem", transition: "background 0.15s",
      backgroundColor: status === "cancelled" ? "#fef2f2" : C.gray50,
      opacity: status === "cancelled" ? 0.55 : 1,
      border: `1px solid ${status === "cancelled" ? "#fecaca" : C.gray100}`,
    }),
    timeBadge: (status) => ({
      backgroundColor: status === "scheduled" ? C.blue500 : status === "present" ? C.green500 : status === "cancelled" ? C.red500 : C.gray400,
      color: "white", padding: "3px 8px", borderRadius: "6px", fontSize: "0.78rem",
      fontWeight: 700, fontVariantNumeric: "tabular-nums", minWidth: "48px", textAlign: "center",
    }),
    actionsRow: { display: "flex", gap: "4px", marginLeft: "auto", flexShrink: 0 },
    iconBtn: (color) => ({
      background: "none", border: "none", cursor: "pointer", color,
      padding: "4px", borderRadius: "4px", fontSize: "1rem", lineHeight: 1,
      display: "inline-flex", alignItems: "center",
    }),
    selectTime: (occupied) => ({
      padding: "0.5rem 0.75rem", fontSize: "0.875rem", borderRadius: "6px",
      border: `1px solid ${C.gray200}`, backgroundColor: occupied ? "#fef2f2" : "white",
      color: occupied ? C.red500 : C.gray900, width: "100%",
    }),
    errorMsg: { color: C.red500, fontSize: "0.78rem", marginTop: "4px" },
    statBox: { textAlign: "center", padding: "0.6rem 0.4rem", borderRadius: "8px", backgroundColor: C.gray50 },
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1400px", margin: "0 auto", minHeight: "calc(100vh - 80px)" }}>
      {/* === BARRA SUPERIOR: STATS + INTERVALO === */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
        backgroundColor: "white", padding: "0.75rem 1.25rem", borderRadius: "12px",
        border: `1px solid ${C.gray200}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        marginBottom: "1.5rem", flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}><span style={{ fontSize: "1.3rem", fontWeight: 800, color: C.gray900 }}>{appointments.length}</span><span style={{ fontSize: "0.75rem", color: C.gray500, marginLeft: "6px" }}>Total</span></div>
          <div style={{ width: "1px", height: "28px", backgroundColor: C.gray200 }} />
          <div style={{ textAlign: "center" }}><span style={{ fontSize: "1.3rem", fontWeight: 800, color: C.blue500 }}>{appointments.filter((a) => a.status === "scheduled").length}</span><span style={{ fontSize: "0.75rem", color: C.gray500, marginLeft: "6px" }}>Programadas</span></div>
          <div style={{ textAlign: "center" }}><span style={{ fontSize: "1.3rem", fontWeight: 800, color: C.green500 }}>{appointments.filter((a) => a.status === "present").length}</span><span style={{ fontSize: "0.75rem", color: C.gray500, marginLeft: "6px" }}>Presentes</span></div>
          <div style={{ textAlign: "center" }}><span style={{ fontSize: "1.3rem", fontWeight: 800, color: C.red500 }}>{appointments.filter((a) => a.status === "cancelled").length}</span><span style={{ fontSize: "0.75rem", color: C.gray500, marginLeft: "6px" }}>Canceladas</span></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => setOcultarCanceladas(!ocultarCanceladas)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "5px 12px", fontSize: "0.8rem", fontWeight: 600, borderRadius: "6px", cursor: "pointer",
              border: `1px solid ${ocultarCanceladas ? C.teal600 : C.gray200}`,
              backgroundColor: ocultarCanceladas ? C.teal50 : "white",
              color: ocultarCanceladas ? C.teal600 : C.gray500,
            }}
          >
            <i className={ocultarCanceladas ? "ri-eye-off-line" : "ri-eye-line"} style={{ fontSize: "0.9rem" }}></i>
            {ocultarCanceladas ? "Canceladas ocultas" : "Ocultar citas canceladas"}
          </button>
          <div style={{ width: "1px", height: "24px", backgroundColor: C.gray200 }} />
          <span style={{ fontSize: "0.82rem", color: C.gray500, fontWeight: 600 }}>Intervalo</span>
          <div style={{ display: "inline-flex", borderRadius: "6px", overflow: "hidden", border: `1px solid ${C.gray200}` }}>
            <button onClick={() => setIntervalo("30")} style={{
              padding: "5px 14px", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer",
              backgroundColor: intervalo === "30" ? C.teal600 : "white", color: intervalo === "30" ? "white" : C.gray700,
            }}>30 min</button>
            <button onClick={() => setIntervalo("60")} style={{
              padding: "5px 14px", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer",
              borderLeft: `1px solid ${C.gray200}`,
              backgroundColor: intervalo === "60" ? C.teal600 : "white", color: intervalo === "60" ? "white" : C.gray700,
            }}>1 hora</button>
          </div>
        </div>
      </div>

      {/* === GRID: CALENDARIO + SIDEBAR === */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1.5rem", alignItems: "stretch" }}>
        {/* === COLUMNA PRINCIPAL: CALENDARIO === */}
        <div>
          <CalendarHeader currentDate={currentDate} view={view} onPrev={() => navigate(-1)} onNext={() => navigate(1)} onToday={goToday} onViewChange={setView} />
          {isLoading && <div style={{ textAlign: "center", padding: "1rem", color: C.gray500 }}>Cargando citas...</div>}
          {(() => {
            const visibleAppts = ocultarCanceladas ? appointments.filter((a) => a.status !== "cancelled") : appointments;
            return (
              <>
                {view === "month" && <CalendarMonthView currentDate={currentDate} appointments={visibleAppts} selectedDate={selectedDate} onSelectDate={handleSelectDate} />}
                {view === "week" && <CalendarWeekView currentDate={currentDate} appointments={visibleAppts} selectedDate={selectedDate} onSelectDate={handleSelectDate} />}
                {view === "day" && <CalendarDayView currentDate={currentDate} appointments={visibleAppts} />}
              </>
            );
          })()}
        </div>

        {/* === SIDEBAR DERECHA === */}
        <aside style={S.sidebar}>
          {/* Boton nueva cita */}
          <button onClick={() => setShowNewModal(true)} style={{
            backgroundColor: C.teal600, color: "white", border: "none", padding: "0.85rem 1rem",
            borderRadius: "10px", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: "0 2px 8px rgba(13,148,136,0.3)", transition: "background 0.15s",
          }}>
            <i className="ri-add-line" style={{ fontSize: "1.1rem" }}></i> Nueva Cita
          </button>

          {/* Citas del dia */}
          <div style={{ ...S.card, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={S.sectionTitle}>
              <span>
                <i className="ri-calendar-event-line" style={{ color: C.teal600, marginRight: "6px" }}></i>
                {selectedDate.toLocaleDateString("es-SV", { weekday: "long", day: "numeric", month: "short" })}
              </span>
              <span style={{ fontSize: "0.78rem", color: C.gray400, fontWeight: 500 }}>
                {citasDelDia.filter((c) => c.status !== "cancelled").length} citas
              </span>
            </div>

            {citasDelDia.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0", color: C.gray400 }}>
                <i className="ri-calendar-line" style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}></i>
                Sin citas para este dia
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: "auto" }}>
                {citasDelDia.filter((c) => !(ocultarCanceladas && c.status === "cancelled")).map((c) => {
                  const badge = getStatusBadge(c.status);
                  return (
                    <div key={c.id} style={S.citaRow(c.status)}>
                      <span style={S.timeBadge(c.status)}>{c.time}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem", color: C.gray900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.patientName || "Paciente"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: C.gray500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.reason || "Sin motivo"}
                        </div>
                      </div>
                      <div style={S.actionsRow}>
                        {c.status === "scheduled" && (
                          <>
                            <button onClick={() => cambiarEstado(c.id, "present")} style={S.iconBtn(C.green500)} title="Marcar presente">
                              <i className="ri-user-received-2-line"></i>
                            </button>
                            <button onClick={() => openEditModal(c)} style={S.iconBtn(C.blue500)} title="Editar cita">
                              <i className="ri-pencil-line"></i>
                            </button>
                            <button onClick={() => setCancelConfirm(c)} style={S.iconBtn(C.red500)} title="Cancelar cita">
                              <i className="ri-close-circle-line"></i>
                            </button>
                          </>
                        )}
                        {c.status === "present" && (
                          <span style={{ fontSize: "0.75rem", color: C.green500, fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                            <i className="ri-checkbox-circle-fill"></i> Presente
                          </span>
                        )}
                        {c.status === "done" && (
                          <span style={{ fontSize: "0.75rem", color: C.gray400 }}>Atendido</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </aside>
      </div>

      {/* === MODAL NUEVA CITA === */}
      <Modal isOpen={showNewModal} onClose={() => { setShowNewModal(false); setPacienteSeleccionado(null); setBusqueda(""); createForm.clearErrors(); }} title="Agendar Nueva Cita" size="md">
        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="login-form">
          {/* Paciente */}
          <div className="form-group">
            <label className="form-label">Paciente *</label>
            {!pacienteSeleccionado ? (
              <>
                <input type="text" className="form-input" placeholder="Buscar por nombre o DUI..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                {createForm.formState.errors.patientId && <span style={S.errorMsg}>{createForm.formState.errors.patientId.message}</span>}
                {pacientesResultados.length > 0 && (
                  <div style={{ border: `1px solid ${C.gray200}`, borderRadius: "8px", marginTop: "6px", maxHeight: "140px", overflowY: "auto" }}>
                    {pacientesResultados.map((p) => (
                      <div key={p.id} role="option" tabIndex={0} onClick={() => seleccionarPaciente(p)} onKeyDown={(e) => e.key === "Enter" && seleccionarPaciente(p)}
                        style={{ padding: "8px 10px", cursor: "pointer", borderBottom: `1px solid ${C.gray100}`, fontSize: "0.9rem" }}>
                        <strong>{p.fullName}</strong> <span style={{ color: C.gray500 }}>- {p.identityDocument}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: "8px 12px", backgroundColor: C.teal50, borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid #ccfbf1` }}>
                <span style={{ fontWeight: 600 }}>{pacienteSeleccionado.fullName}</span>
                <button type="button" onClick={() => { setPacienteSeleccionado(null); createForm.setValue("patientId", ""); }} style={{ background: "none", border: "none", color: C.red500, cursor: "pointer", fontSize: "1.1rem" }}>
                  <i className="ri-close-circle-line"></i>
                </button>
              </div>
            )}
            <input type="hidden" {...createForm.register("patientId")} />
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input type="date" className="form-input" value={formatDateKey(selectedDate)}
              {...createForm.register("date")}
              onChange={(e) => { setSelectedDate(new Date(e.target.value + "T12:00:00")); createForm.setValue("date", e.target.value, { shouldValidate: true }); }}
            />
            {createForm.formState.errors.date && <span style={S.errorMsg}>{createForm.formState.errors.date.message}</span>}
          </div>

          {/* Hora con slots */}
          <div className="form-group">
            <label className="form-label">Hora * (intervalo: {intervalo} min)</label>
            <select className="form-input" {...createForm.register("time")} style={{ backgroundColor: "white" }}>
              <option value="">Seleccionar hora...</option>
              {timeSlots.map((t) => {
                const occupied = horasOcupadas.has(t);
                return (
                  <option key={t} value={t} disabled={occupied} style={{ color: occupied ? C.red500 : "inherit" }}>
                    {t} {occupied ? " (ocupado)" : ""}
                  </option>
                );
              })}
            </select>
            {createForm.formState.errors.time && <span style={S.errorMsg}>{createForm.formState.errors.time.message}</span>}
          </div>

          {/* Motivo */}
          <div className="form-group">
            <label className="form-label">Motivo (opcional)</label>
            <input type="text" className="form-input" placeholder="Ej. Control de azucar" {...createForm.register("reason")} />
          </div>

          <button type="submit" className="submit-btn" disabled={createMutation.isPending} style={{ marginTop: "0.5rem" }}>
            {createMutation.isPending ? "Agendando..." : "Agendar Cita"}
          </button>
        </form>
      </Modal>

      {/* === MODAL EDITAR CITA === */}
      <Modal isOpen={!!editingCita} onClose={() => setEditingCita(null)} title="Editar Cita" size="md">
        {editingCita && (
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="login-form">
            <div style={{ padding: "0.75rem", backgroundColor: C.teal50, borderRadius: "8px", marginBottom: "1rem", border: "1px solid #ccfbf1" }}>
              <strong style={{ color: C.teal700 }}>{editingCita.patientName}</strong>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input type="date" className="form-input" {...editForm.register("date")} />
            </div>

            <div className="form-group">
              <label className="form-label">Hora (intervalo: {intervalo} min)</label>
              <select className="form-input" {...editForm.register("time")} style={{ backgroundColor: "white" }}>
                <option value="">Seleccionar hora...</option>
                {timeSlots.map((t) => {
                  const occupied = horasOcupadas.has(t) && t !== editingCita.time;
                  return (
                    <option key={t} value={t} disabled={occupied} style={{ color: occupied ? C.red500 : "inherit" }}>
                      {t} {occupied ? " (ocupado)" : ""} {t === editingCita.time ? " (actual)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Motivo</label>
              <input type="text" className="form-input" {...editForm.register("reason")} />
            </div>

            <button type="submit" className="submit-btn" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </button>
          </form>
        )}
      </Modal>

      {/* === MODAL CONFIRMAR CANCELACION === */}
      <Modal isOpen={!!cancelConfirm} onClose={() => setCancelConfirm(null)} title="Cancelar Cita" size="sm">
        {cancelConfirm && (
          <div>
            <p style={{ color: C.gray700, marginBottom: "0.5rem" }}>Estas seguro de cancelar esta cita?</p>
            <div style={{ padding: "0.75rem", backgroundColor: "#fef2f2", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #fecaca" }}>
              <div style={{ fontWeight: 700, color: C.gray900 }}>{cancelConfirm.time} - {cancelConfirm.patientName}</div>
              <div style={{ fontSize: "0.85rem", color: C.gray500 }}>{cancelConfirm.reason || "Sin motivo"}</div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setCancelConfirm(null)} className="doc-btn">No, mantener</button>
              <button onClick={confirmCancel} disabled={statusMutation.isPending}
                style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "none", backgroundColor: C.red500, color: "white", fontWeight: 700, cursor: "pointer", opacity: statusMutation.isPending ? 0.7 : 1 }}>
                {statusMutation.isPending ? "Cancelando..." : "Si, cancelar cita"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
