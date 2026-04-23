import { useState } from "react";
import { Modal } from "./Modal";
import { useGenerateDraft, useRenderPdf } from "../hooks/useDocuments";
import toast from "react-hot-toast";

export const DocumentGeneratorModal = ({ isOpen, onClose, patientId, currentDiagnosis, initialDocType, onDocumentGenerated }) => {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState(initialDocType || "certificate");
  const [promptText, setPromptText] = useState("");
  const [finalText, setFinalText] = useState("");
  const [sickLeaveDays, setSickLeaveDays] = useState(1);

  const draftMutation = useGenerateDraft();
  const renderMutation = useRenderPdf();

  const handleGenerateDraft = () => {
    if (!currentDiagnosis) return toast.error("Debe llenar el campo de Diagnóstico primero.");
    
    if (documentType !== "sick_leave" && !promptText.trim()) {
        return toast.error("Ingrese instrucciones para la IA.");
    }

    let finalPrompt = promptText;
    if (documentType === "sick_leave") {
        finalPrompt = `Genera una incapacidad médica formal por ${sickLeaveDays} día(s) de reposo (incluyendo el día de hoy). ${promptText}`;
    }

    draftMutation.mutate(
      { patientId, diagnosis: currentDiagnosis, promptText: finalPrompt },
      {
        onSuccess: (data) => {
          setFinalText(data.draftText);
          setStep(2);
        },
      }
    );
  };

  // Esta función ahora solo prepara los datos, ya no abre el pop-up de impresión
 const handleSaveToConsultation = () => {
    // 1. Mapeamos el título según el tipo seleccionado
    const titulosFormales = {
        certificate: "CONSTANCIA MÉDICA",
        sick_leave: "INCAPACIDAD MÉDICA",
        other: "DOCUMENTO MÉDICO"
    };
    
    const tituloSeleccionado = titulosFormales[documentType] || "DOCUMENTO MÉDICO";

    renderMutation.mutate(
      { 
        patientId, 
        finalText, 
        title: tituloSeleccionado // <-- Enviamos el título al Backend
      },
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

  const handleClose = () => {
    setStep(1); 
    setPromptText(""); 
    setFinalText(""); 
    setSickLeaveDays(1);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Asistente de Documentos IA" size="lg">
      {step === 1 && (
        <div style={{ display: "grid", gap: "1.1rem" }}>
          <div className="form-group">
            <label className="form-label">Tipo de documento</label>
            <select
              className="form-input"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="certificate">Constancia médica</option>
              <option value="sick_leave">Incapacidad médica (Reposo)</option>
              <option value="other">Documento libre / otro</option>
            </select>
          </div>

          {documentType === "sick_leave" && (
            <div className="form-group" style={{ background: "var(--brand-soft)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-default)" }}>
              <label className="form-label" style={{ color: "var(--brand)", fontWeight: "bold" }}>
                <i className="ri-calendar-check-line"></i> Días de incapacidad (Máximo 3)
              </label>
              <select
                className="form-input"
                value={sickLeaveDays}
                onChange={(e) => setSickLeaveDays(e.target.value)}
                style={{ background: "white" }}
              >
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
              placeholder="Ej. Redactar constancia de buena salud para fines laborales..."
            />
          </div>

          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
            <button
              type="button"
              onClick={handleGenerateDraft}
              className="btn btn-primary"
              disabled={draftMutation.isPending}
            >
              {draftMutation.isPending ? "Generando..." : "Generar con IA"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "grid", gap: "1.1rem" }}>
          <div style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "0.75rem", borderRadius: "8px", fontSize: "0.9rem", border: "1px solid #bae6fd" }}>
            <i className="ri-information-line"></i> <strong>Aviso:</strong> El documento se adjuntará a la consulta actual. El PDF final para imprimir se generará automáticamente al hacer clic en <strong>"Finalizar Consulta"</strong>.
          </div>
          <div className="form-group">
            <textarea
              className="form-input"
              rows={12}
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "space-between" }}>
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">← Editar</button>
            <button
              type="button"
              onClick={handleSaveToConsultation}
              className="btn btn-primary"
              disabled={renderMutation.isPending}
            >
              <i className="ri-attachment-line"></i>
              {renderMutation.isPending ? " Procesando..." : " Confirmar y adjuntar a consulta"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};