import { useState, useMemo, useEffect } from "react";
import { Modal } from "./Modal";
import { useGenerateDraft, useRenderPdf } from "../hooks/useDocuments";
import { useDocumentTemplates, useGenerateDocument } from "../hooks/useDocumentTemplates";
import toast from "react-hot-toast";

// Variables del sistema que no necesitan input manual (el backend las llena)
const SYSTEM_PLACEHOLDERS = ["paciente", "medico", "clinica", "consulta", "fecha"];

export const DocumentGeneratorModal = ({ isOpen, onClose, patientId, currentDiagnosis, initialDocType, onDocumentGenerated }) => {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState(initialDocType || "certificate");
  const [creationMethod, setCreationMethod] = useState("template"); // 'template' | 'ai'
  
  // Estados para IA
  const [promptText, setPromptText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [sickLeaveDays, setSickLeaveDays] = useState(1);

  // Estados para Plantillas
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [extras, setExtras] = useState({});

  // Mapeo del tipo de frontend al tipo de backend para plantillas
  const mappedTemplateType = documentType === "certificate" ? "constancia" : documentType === "sick_leave" ? "incapacidad" : null;

  // Hooks
  const draftMutation = useGenerateDraft();
  const renderMutation = useRenderPdf();
  const generateTemplateMutation = useGenerateDocument();
  const { data: templates = [], isLoading: isLoadingTemplates } = useDocumentTemplates({ 
    type: mappedTemplateType || "all" 
  });

  // Si elige "Otro", forzamos a usar IA porque no hay plantillas genéricas
  useEffect(() => {
    if (documentType === "other") {
      setCreationMethod("ai");
    } else if (templates.length > 0) {
      setCreationMethod("template");
      // Seleccionar por defecto la primera o la que sea "isDefault"
      const def = templates.find(t => t.isDefault) || templates[0];
      if (def) setSelectedTemplateId(def.id);
    }
  }, [documentType, templates]);

  // Extraer las variables libres que el doctor debe llenar manualmente
  const selectedTemplate = useMemo(() => templates.find((t) => t.id === selectedTemplateId), [templates, selectedTemplateId]);
  const extraFields = useMemo(() => {
    if (!selectedTemplate?.placeholders) return [];
    return selectedTemplate.placeholders.filter(p => !SYSTEM_PLACEHOLDERS.some(sys => p.startsWith(`${sys}.`)) && p !== "fecha.hoy");
  }, [selectedTemplate]);

  // Limpiar campos al cambiar
  const handleClose = () => {
    setStep(1); 
    setPromptText(""); 
    setFinalText(""); 
    setSickLeaveDays(1);
    setExtras({});
    onClose();
  };

  // --- FLUJO 1: REDACCIÓN CON IA ---
  const handleGenerateDraft = () => {
    if (!currentDiagnosis) return toast.error("Debe llenar el campo de Diagnóstico en la consulta primero.");
    if (documentType !== "sick_leave" && !promptText.trim()) return toast.error("Ingrese instrucciones para la IA.");

    let finalPrompt = promptText;
    if (documentType === "sick_leave") {
        finalPrompt = `Genera una incapacidad médica formal por ${sickLeaveDays} día(s) de reposo (incluyendo el día de hoy). ${promptText}`;
    }

    draftMutation.mutate(
      { patientId, diagnosis: currentDiagnosis, promptText: finalPrompt },
      { onSuccess: (data) => { setFinalText(data.draftText); setStep(2); } }
    );
  };

  const handleSaveAI = () => {
    const titulosFormales = { certificate: "CONSTANCIA MÉDICA", sick_leave: "INCAPACIDAD MÉDICA", other: "DOCUMENTO MÉDICO" };
    const tituloSeleccionado = titulosFormales[documentType] || "DOCUMENTO MÉDICO";

    renderMutation.mutate(
      { patientId, finalText, title: tituloSeleccionado },
      {
        onSuccess: (data) => {
          onDocumentGenerated({
            documentType,
            textContent: finalText,
            pdfBase64: data.pdfBase64.startsWith('data:') ? data.pdfBase64 : `data:application/pdf;base64,${data.pdfBase64}`
          });
          toast.success(`${tituloSeleccionado} adjuntada a la consulta.`, { icon: '📎' });
          handleClose();
        },
      }
    );
  };

  // --- FLUJO 2: GENERACIÓN DESDE PLANTILLA ---
  const handleSaveTemplate = () => {
    if (!selectedTemplateId) return toast.error("Seleccione una plantilla.");
    
    // Validar que llenó todos los extras
    const missing = extraFields.filter(f => !extras[f] || extras[f].trim() === "");
    if (missing.length > 0) return toast.error(`Complete los campos requeridos: ${missing.join(", ")}`);

    const titulosFormales = { certificate: "CONSTANCIA MÉDICA", sick_leave: "INCAPACIDAD MÉDICA" };
    
    generateTemplateMutation.mutate({
        templateId: selectedTemplateId,
        patientId,
        extras,
        title: titulosFormales[documentType] || selectedTemplate?.name
    }, {
        onSuccess: (data) => {
            // El backend ya hizo el merge y generó el PDF
            onDocumentGenerated({
                documentType,
                textContent: data.content,
                pdfBase64: data.pdfBase64.startsWith('data:') ? data.pdfBase64 : `data:application/pdf;base64,${data.pdfBase64}`
            });
            toast.success("Plantilla procesada y adjuntada a la consulta.", { icon: '📎' });
            handleClose();
        }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Emisión de Documentos Clínicos" size="lg">
      {step === 1 && (
        <div style={{ display: "grid", gap: "1.2rem" }}>
          
          {/* Selector Principal de Tipo */}
          <div className="form-group">
            <label className="form-label">Tipo de documento</label>
            <select className="form-input" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <option value="certificate">Constancia médica</option>
              <option value="sick_leave">Incapacidad médica (Reposo)</option>
              <option value="other">Documento libre / otro</option>
            </select>
          </div>

          {/* Selector de Método (Solo si no es "Otro") */}
          {documentType !== "other" && (
             <div style={{ display: "flex", gap: "1rem", background: "var(--bg-surface-alt)", padding: "0.5rem", borderRadius: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: creationMethod === "template" ? "bold" : "normal" }}>
                    <input type="radio" name="method" checked={creationMethod === "template"} onChange={() => setCreationMethod("template")} style={{ accentColor: "var(--brand)" }}/>
                    <i className="ri-file-copy-2-line"></i> Usar Plantilla Predefinida
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: creationMethod === "ai" ? "bold" : "normal" }}>
                    <input type="radio" name="method" checked={creationMethod === "ai"} onChange={() => setCreationMethod("ai")} style={{ accentColor: "var(--brand)" }}/>
                    <i className="ri-sparkling-2-line"></i> Redactar con IA
                </label>
             </div>
          )}

          <hr style={{ border: 0, borderTop: "1px solid var(--border-subtle)", margin: "0" }} />

          {/* MODO: PLANTILLA */}
          {creationMethod === "template" && (
            <div style={{ display: "grid", gap: "1rem" }}>
                {isLoadingTemplates ? (
                    <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>Cargando plantillas disponibles...</p>
                ) : templates.length === 0 ? (
                    <div style={{ padding: "1rem", background: "#fffbeb", color: "#b45309", borderRadius: "8px", fontSize: "0.9rem" }}>
                        No hay plantillas configuradas para este tipo de documento. Por favor, utiliza la opción de <strong>Redactar con IA</strong>.
                    </div>
                ) : (
                    <>
                        <div className="form-group">
                            <label className="form-label">Seleccionar Plantilla</label>
                            <select className="form-input" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} {t.isDefault ? "(Por defecto)" : ""}</option>
                                ))}
                            </select>
                            {selectedTemplate?.description && (
                                <small style={{ display: "block", marginTop: "5px", color: "var(--fg-muted)" }}>{selectedTemplate.description}</small>
                            )}
                        </div>

                        {/* Campos dinámicos requeridos por la plantilla */}
                        {extraFields.length > 0 && (
                            <div style={{ background: "var(--bg-surface-alt)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                                <strong style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", display: "block", marginBottom: "0.8rem" }}>
                                    Información requerida para esta plantilla:
                                </strong>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                                    {extraFields.map(field => {
                                        
                                        // 1. Validación para DÍAS (1 a 3 máximo, solo números)
                                        if (field === "incapacidad.dias") {
                                            return (
                                                <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: "0.8rem" }}>Días de reposo (1 a 3)</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" 
                                                        max="3"
                                                        className="form-input" 
                                                        placeholder="Ej. 3"
                                                        value={extras[field] || ""} 
                                                        onChange={(e) => {
                                                            let val = e.target.value.replace(/[^0-9]/g, ''); // Quita letras/símbolos
                                                            if (val !== "") {
                                                                const num = parseInt(val, 10);
                                                                if (num < 1) val = "1";
                                                                if (num > 3) val = "3";
                                                            }
                                                            setExtras({...extras, [field]: val});
                                                        }} 
                                                    />
                                                </div>
                                            );
                                        }

                                        // 2. Validación para DESDE (Calendario normal)
                                        if (field === "incapacidad.desde") {
                                            return (
                                                <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: "0.8rem" }}>Fecha de inicio</label>
                                                    <input 
                                                        type="date" 
                                                        className="form-input" 
                                                        value={extras[field] || ""} 
                                                        onChange={(e) => setExtras({...extras, [field]: e.target.value})} 
                                                    />
                                                </div>
                                            );
                                        }

                                        // 3. Validación para HASTA (Calendario bloqueado al 'desde')
                                        if (field === "incapacidad.hasta") {
                                            return (
                                                <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                                                    <label className="form-label" style={{ fontSize: "0.8rem" }}>Fecha de finalización</label>
                                                    <input 
                                                        type="date" 
                                                        className="form-input" 
                                                        min={extras["incapacidad.desde"] || ""} // Bloquea fechas anteriores
                                                        value={extras[field] || ""} 
                                                        onChange={(e) => setExtras({...extras, [field]: e.target.value})} 
                                                    />
                                                </div>
                                            );
                                        }

                                        // Fallback para cualquier otra variable libre
                                        return (
                                            <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label" style={{ fontSize: "0.8rem", textTransform: "capitalize" }}>
                                                    {field.replace('.', ' ')}
                                                </label>
                                                <input 
                                                    type="text" 
                                                    className="form-input" 
                                                    placeholder={`Ej. valor para ${field}`}
                                                    value={extras[field] || ""} 
                                                    onChange={(e) => setExtras({...extras, [field]: e.target.value})} 
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
                            <button type="button" onClick={handleSaveTemplate} className="btn btn-primary" disabled={generateTemplateMutation.isPending}>
                                <i className="ri-attachment-line"></i> {generateTemplateMutation.isPending ? "Procesando..." : "Confirmar y Adjuntar"}
                            </button>
                        </div>
                    </>
                )}
            </div>
          )}

          {/* MODO: INTELIGENCIA ARTIFICIAL */}
          {creationMethod === "ai" && (
             <div style={{ display: "grid", gap: "1rem" }}>
                {documentType === "sick_leave" && (
                    <div className="form-group" style={{ background: "var(--brand-soft)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-default)" }}>
                        <label className="form-label" style={{ color: "var(--brand)", fontWeight: "bold" }}>
                            <i className="ri-calendar-check-line"></i> Días de incapacidad (Máximo 3)
                        </label>
                        <select className="form-input" value={sickLeaveDays} onChange={(e) => setSickLeaveDays(e.target.value)} style={{ background: "white" }}>
                            <option value="1">1 Día</option>
                            <option value="2">2 Días</option>
                            <option value="3">3 Días</option>
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">Instrucciones para la IA</label>
                    <textarea
                        className="form-input"
                        rows={4}
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Ej. Redactar constancia indicando que el paciente asistió a evaluación por dolor abdominal..."
                    />
                </div>

                <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
                    <button type="button" onClick={handleGenerateDraft} className="btn btn-primary" disabled={draftMutation.isPending} style={{ background: "var(--brand)" }}>
                        <i className="ri-sparkling-2-line"></i> {draftMutation.isPending ? "Generando borrador..." : "Generar Borrador"}
                    </button>
                </div>
            </div>
          )}
        </div>
      )}

      {/* PASO 2: SOLO PARA REVISIÓN DE IA */}
      {step === 2 && (
        <div style={{ display: "grid", gap: "1.1rem" }}>
          <div style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "0.75rem", borderRadius: "8px", fontSize: "0.9rem", border: "1px solid #bae6fd" }}>
            <i className="ri-information-line"></i> <strong>Revisión Manual:</strong> Modifique el texto si es necesario. El PDF con formato oficial de Santa Ana se generará automáticamente al finalizar la consulta.
          </div>
          <div className="form-group">
            <textarea
              className="form-input"
              rows={14}
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "space-between" }}>
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">← Editar instrucciones</button>
            <button type="button" onClick={handleSaveAI} className="btn btn-primary" disabled={renderMutation.isPending}>
              <i className="ri-attachment-line"></i> {renderMutation.isPending ? " Procesando..." : " Confirmar y adjuntar"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};