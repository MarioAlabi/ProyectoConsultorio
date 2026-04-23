import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Modal } from "../../components/Modal";
import {
  useDocumentTemplates,
  useCreateDocumentTemplate,
  useUpdateDocumentTemplate,
  useToggleDocumentTemplateStatus,
  useDeleteDocumentTemplate,
  useDraftTemplateWithAI,
} from "../../hooks/useDocumentTemplates";
import { documentTemplateSchema } from "../../lib/validations/documentTemplateSchema";

const TYPE_LABELS = {
  constancia: "Constancia",
  incapacidad: "Incapacidad",
};

const AVAILABLE_VARIABLES = [
  { key: "paciente.nombre", desc: "Nombre completo del paciente" },
  { key: "paciente.dui", desc: "DUI / documento de identidad" },
  { key: "paciente.expediente", desc: "Número de expediente" },
  { key: "paciente.edad", desc: "Edad del paciente" },
  { key: "paciente.genero", desc: "Género del paciente" },
  { key: "paciente.telefono", desc: "Teléfono del paciente" },
  { key: "paciente.direccion", desc: "Dirección del paciente" },
  { key: "medico.nombre", desc: "Nombre del médico" },
  { key: "medico.jvpm", desc: "JVPM del médico" },
  { key: "medico.telefono", desc: "Teléfono del médico" },
  { key: "clinica.nombre", desc: "Nombre de la clínica" },
  { key: "clinica.direccion", desc: "Dirección de la clínica" },
  { key: "consulta.diagnostico", desc: "Diagnóstico de la consulta" },
  { key: "consulta.motivo", desc: "Motivo de la consulta" },
  { key: "fecha.hoy", desc: "Fecha actual" },
  { key: "incapacidad.dias", desc: "Días (variable libre)" },
  { key: "incapacidad.desde", desc: "Fecha de inicio (variable libre)" },
  { key: "incapacidad.hasta", desc: "Fecha de fin (variable libre)" },
  { key: "incapacidad.indicaciones", desc: "Indicaciones (variable libre)" },
];

export const PlantillasDocumentos = () => {
  const [filterType, setFilterType] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // IA: modal para generar borrador.
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPreferType, setAiPreferType] = useState("");

  const { data: templates = [], isLoading } = useDocumentTemplates({
    type: filterType || undefined,
    includeInactive,
  });
  const createMutation = useCreateDocumentTemplate();
  const updateMutation = useUpdateDocumentTemplate();
  const toggleMutation = useToggleDocumentTemplateStatus();
  const deleteMutation = useDeleteDocumentTemplate();
  const aiDraftMutation = useDraftTemplateWithAI();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(documentTemplateSchema),
    defaultValues: {
      type: "constancia",
      name: "",
      description: "",
      bodyTemplate: "",
      isDefault: false,
      status: "active",
    },
  });

  const bodyPreview = watch("bodyTemplate");

  const openCreate = () => {
    setEditing(null);
    reset({
      type: "constancia",
      name: "",
      description: "",
      bodyTemplate: "",
      isDefault: false,
      status: "active",
    });
    setShowModal(true);
  };

  const openEdit = (template) => {
    setEditing(template);
    reset({
      type: template.type,
      name: template.name,
      description: template.description || "",
      bodyTemplate: template.bodyTemplate,
      isDefault: !!template.isDefault,
      status: template.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const onSubmit = (data) => {
    const mutation = editing ? updateMutation : createMutation;
    const payload = editing ? { id: editing.id, data } : data;
    mutation.mutate(payload, {
      onSuccess: () => closeModal(),
    });
  };

  const handleToggleStatus = (template) => {
    const nextStatus = template.status === "active" ? "inactive" : "active";
    if (!window.confirm(`¿${nextStatus === "active" ? "Reactivar" : "Inhabilitar"} la plantilla "${template.name}"?`)) return;
    toggleMutation.mutate({ id: template.id, status: nextStatus }, {
      onSuccess: () => toast.success(`Plantilla ${nextStatus === "active" ? "reactivada" : "inhabilitada"}.`),
    });
  };

  const handleDelete = (template) => {
    if (!window.confirm(`¿Eliminar definitivamente la plantilla "${template.name}"? Esta acción no se puede deshacer.`)) return;
    deleteMutation.mutate(template.id);
  };

  const openAiModal = () => {
    setAiPrompt("");
    setAiPreferType("");
    setAiModalOpen(true);
  };

  const handleAiDraft = () => {
    if (!aiPrompt.trim() || aiPrompt.trim().length < 5) {
      toast.error("Describe con más detalle la plantilla que necesitas.");
      return;
    }
    aiDraftMutation.mutate(
      {
        prompt: aiPrompt.trim(),
        preferType: aiPreferType || undefined,
      },
      {
        onSuccess: (draft) => {
          if (!draft) return;
          setEditing(null);
          reset({
            type: draft.type,
            name: draft.name,
            description: draft.description || "",
            bodyTemplate: draft.bodyTemplate,
            isDefault: false,
            status: "active",
          });
          setAiModalOpen(false);
          setShowModal(true);
          toast.success("Borrador generado por IA. Revísalo y ajústalo antes de guardar.");
        },
      }
    );
  };

  const grouped = useMemo(() => {
    const map = { constancia: [], incapacidad: [] };
    for (const t of templates) {
      (map[t.type] || (map[t.type] = [])).push(t);
    }
    return map;
  }, [templates]);

  const insertVariable = (key) => {
    const textarea = document.getElementById("bodyTemplateInput");
    if (!textarea) return;
    const token = `{{${key}}}`;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const nextValue = `${before}${token}${after}`;
    // react-hook-form: disparamos un input event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    nativeInputValueSetter?.call(textarea, nextValue);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    const caret = start + token.length;
    setTimeout(() => {
      textarea.selectionStart = caret;
      textarea.selectionEnd = caret;
      textarea.focus();
    }, 0);
  };

  const S = {
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" },
    card: {
      background: "var(--bg-surface)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-lg)",
      padding: "1.15rem 1.25rem",
      borderLeft: "3px solid var(--brand)",
      transition: "transform var(--t-base), box-shadow var(--t-base)",
    },
    cardInactive: { borderLeftColor: "var(--ink-300)", opacity: 0.75 },
    btnRow: { display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.8rem" },
    varBtn: {
      padding: "0.3rem 0.6rem",
      borderRadius: "var(--radius-full)",
      background: "var(--bg-surface-alt)",
      border: "1px solid var(--border-default)",
      cursor: "pointer",
      fontSize: "0.75rem",
      fontFamily: "var(--font-mono)",
      color: "var(--fg-secondary)",
    },
    errorMsg: { color: "var(--accent-coral)", fontSize: "0.8rem", marginTop: "0.25rem" },
  };

  const renderTemplateCard = (t) => (
    <div key={t.id} style={{ ...S.card, ...(t.status === "inactive" ? S.cardInactive : {}) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div style={{ flex: 1 }}>
          <strong style={{ fontFamily: "var(--font-display)", color: "var(--fg-primary)", fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
            {t.name}
          </strong>
          {t.description && <p style={{ color: "var(--fg-muted)", fontSize: "0.82rem", margin: "0.25rem 0 0", lineHeight: 1.45 }}>{t.description}</p>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" }}>
          <span className={`badge ${t.status === "active" ? "badge-success" : "badge"}`}>
            {t.status === "active" ? "Activa" : "Inactiva"}
          </span>
          {t.isDefault && <span className="badge badge-warning">Por defecto</span>}
        </div>
      </div>
      {t.placeholders?.length > 0 && (
        <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {t.placeholders.slice(0, 6).map((p) => (
            <span key={p} style={{ fontSize: "0.7rem", background: "var(--bg-surface-alt)", color: "var(--fg-secondary)", padding: "2px 7px", borderRadius: "var(--radius-full)", fontFamily: "var(--font-mono)" }}>
              {`{{${p}}}`}
            </span>
          ))}
          {t.placeholders.length > 6 && (
            <span style={{ fontSize: "0.7rem", color: "var(--fg-muted)", padding: "2px 7px" }}>
              +{t.placeholders.length - 6}
            </span>
          )}
        </div>
      )}
      <div style={S.btnRow}>
        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>
          <i className="ri-edit-2-line"></i> Editar
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => handleToggleStatus(t)}>
          {t.status === "active" ? "Inhabilitar" : "Activar"}
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t)}>
          <i className="ri-delete-bin-line"></i>
        </button>
      </div>
    </div>
  );

  return (
    <div className="page">
      <header className="page-header">
        <div className="page-header__title">
          <span className="page-header__eyebrow">Documentación clínica</span>
          <h1 className="page-header__heading">Plantillas de documentos</h1>
          <p className="page-header__sub">
            Administra las plantillas de constancias e incapacidades con placeholders dinámicos. Usa IA para generar nuevas en segundos.
          </p>
        </div>
        <div className="page-header__actions">
          <button type="button" onClick={openAiModal} className="btn btn-ai">
            <i className="ri-sparkling-2-line"></i> Generar con IA
          </button>
          <button type="button" onClick={openCreate} className="btn btn-primary">
            <i className="ri-add-line"></i> Nueva plantilla
          </button>
        </div>
      </header>

      <div
        className="card"
        style={{
          padding: "0.8rem 1.2rem",
          marginBottom: "1.25rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <select className="form-input" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: "210px" }}>
          <option value="">Todos los tipos</option>
          <option value="constancia">Constancias</option>
          <option value="incapacidad">Incapacidades</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--fg-secondary)", fontSize: "0.88rem" }}>
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            style={{ width: "16px", height: "16px", accentColor: "var(--brand)" }}
          />
          Mostrar inactivas
        </label>
        <span className="text-muted" style={{ marginLeft: "auto", fontSize: "0.82rem" }}>
          {isLoading ? "Cargando…" : `${templates.length} ${templates.length === 1 ? "plantilla" : "plantillas"}`}
        </span>
      </div>

      {isLoading ? (
        <p style={{ color: "var(--fg-muted)", padding: "2rem", textAlign: "center" }}>Cargando plantillas…</p>
      ) : templates.length === 0 ? (
        <div style={{ padding: "3.5rem 1rem", textAlign: "center", color: "var(--fg-muted)" }}>
          <i className="ri-file-text-line" style={{ fontSize: "2rem", opacity: 0.5, display: "block", marginBottom: "0.5rem" }}></i>
          No hay plantillas configuradas todavía.
        </div>
      ) : (
        <>
          {(!filterType || filterType === "constancia") && grouped.constancia.length > 0 && (
            <>
              <h2 className="section-divider">Constancias</h2>
              <div style={S.grid}>{grouped.constancia.map(renderTemplateCard)}</div>
            </>
          )}
          {(!filterType || filterType === "incapacidad") && grouped.incapacidad.length > 0 && (
            <>
              <h2 className="section-divider" style={{ marginTop: "2rem" }}>Incapacidades</h2>
              <div style={S.grid}>{grouped.incapacidad.map(renderTemplateCard)}</div>
            </>
          )}
        </>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? "Editar plantilla" : "Nueva plantilla"}
        size="xl"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: "grid", gap: "1.1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select className="form-input" {...register("type")}>
                  <option value="constancia">Constancia</option>
                  <option value="incapacidad">Incapacidad</option>
                </select>
                {errors.type && <span className="field-error">{errors.type.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input type="text" className="form-input" {...register("name")} />
                {errors.name && <span className="field-error">{errors.name.message}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input type="text" className="form-input" {...register("description")} />
            </div>

            <div className="form-group">
              <label className="form-label">Cuerpo de la plantilla *</label>
              <textarea
                id="bodyTemplateInput"
                className="form-input"
                rows={14}
                {...register("bodyTemplate")}
                style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", lineHeight: 1.5, resize: "vertical" }}
              />
              {errors.bodyTemplate && <span className="field-error">{errors.bodyTemplate.message}</span>}
            </div>

            <div
              style={{
                background: "var(--bg-surface-alt)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "0.9rem 1rem",
              }}
            >
              <strong style={{ fontSize: "0.85rem", color: "var(--fg-secondary)" }}>
                Variables disponibles (clic para insertar):
              </strong>
              <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    type="button"
                    key={v.key}
                    title={v.desc}
                    onClick={() => insertVariable(v.key)}
                    style={S.varBtn}
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: "0.6rem", marginBottom: 0 }}>
                También puedes añadir variables libres con el formato <code>{`{{mi.variable}}`}</code> y el doctor las rellenará al emitir el documento.
              </p>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "var(--fg-secondary)",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  {...register("isDefault")}
                  style={{ width: "16px", height: "16px", accentColor: "var(--brand)" }}
                />
                Marcar como plantilla por defecto de su tipo
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <label className="form-label" style={{ margin: 0 }}>Estado:</label>
                <select className="form-input" {...register("status")} style={{ width: "140px" }}>
                  <option value="active">Activa</option>
                  <option value="inactive">Inactiva</option>
                </select>
              </div>
            </div>

            {bodyPreview && (
              <details>
                <summary style={{ cursor: "pointer", color: "var(--brand)", fontWeight: 600 }}>
                  Vista previa del cuerpo
                </summary>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    background: "var(--bg-surface-alt)",
                    padding: "1rem",
                    borderRadius: "var(--radius-md)",
                    marginTop: "0.5rem",
                    fontFamily: "Georgia, serif",
                    fontSize: "0.95rem",
                    color: "var(--fg-primary)",
                  }}
                >
                  {bodyPreview}
                </pre>
              </details>
            )}

            <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.3rem" }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando…"
                  : editing ? "Guardar cambios" : "Crear plantilla"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="Generar plantilla con IA" size="lg">
        <div
          style={{
            background: "var(--accent-plum-soft)",
            border: "1px solid var(--accent-plum)",
            borderRadius: "var(--radius-md)",
            padding: "0.9rem 1.1rem",
            marginBottom: "1.25rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <i
            className="ri-sparkling-2-line"
            style={{
              fontSize: "1.1rem",
              color: "var(--accent-plum)",
              marginTop: "2px",
            }}
          ></i>
          <div>
            <strong style={{ color: "var(--accent-plum)", fontSize: "0.9rem", display: "block", marginBottom: "0.25rem" }}>
              Asistente de redacción
            </strong>
            <p style={{ color: "var(--fg-secondary)", fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>
              Describe el documento que necesitas (por ejemplo: <em>“incapacidad por cirugía ambulatoria de 5 días”</em> o <em>“constancia de aptitud deportiva”</em>). La IA generará un borrador con placeholders que podrás editar antes de guardar.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tipo preferido (opcional)</label>
          <select className="form-input" value={aiPreferType} onChange={(e) => setAiPreferType(e.target.value)}>
            <option value="">Dejar que la IA decida</option>
            <option value="constancia">Constancia</option>
            <option value="incapacidad">Incapacidad</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">¿Qué plantilla necesitas? *</label>
          <textarea
            className="form-input"
            rows={5}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ej: Incapacidad por enfermedad respiratoria con 3 días de reposo. Incluir indicaciones y fecha de reincorporación."
            style={{ resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <button type="button" onClick={() => setAiModalOpen(false)} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="button" onClick={handleAiDraft} disabled={aiDraftMutation.isPending} className="btn btn-ai">
            <i className="ri-sparkling-2-line"></i>
            {aiDraftMutation.isPending ? "Generando…" : "Generar borrador"}
          </button>
        </div>
      </Modal>
    </div>
  );
};
