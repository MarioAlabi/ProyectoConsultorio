import { useState } from "react";
import { Modal } from "./Modal";
import { useGenerateDraft, useRenderPdf } from "../hooks/useDocuments";
import toast from "react-hot-toast";

export const DocumentGeneratorModal = ({ isOpen, onClose, patientId, currentDiagnosis, initialDocType, onDocumentGenerated }) => {
  const [step, setStep] = useState(1);
  const [documentType, setDocumentType] = useState(initialDocType || "certificate");
  const [promptText, setPromptText] = useState("");
  const [finalText, setFinalText] = useState("");

  const draftMutation = useGenerateDraft();
  const renderMutation = useRenderPdf();

  const handleGenerateDraft = () => {
    if (!promptText.trim()) return toast.error("Ingrese instrucciones.");
    if (!currentDiagnosis) return toast.error("Debe llenar el campo de Diagnóstico primero.");

    draftMutation.mutate(
      { patientId, diagnosis: currentDiagnosis, promptText },
      {
        onSuccess: (data) => {
          setFinalText(data.draftText);
          setStep(2);
        },
      }
    );
  };

  const handlePrint = (base64) => {
    try {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const printWindow = window.open(blobUrl);
        if (printWindow) printWindow.onload = () => printWindow.print();
    } catch (error) { toast.error("Error al abrir PDF."); }
  };

  const handleSaveAndPrint = () => {
    renderMutation.mutate(
      { patientId, finalText },
      {
        onSuccess: (data) => {
          handlePrint(data.pdfBase64); 
          // Pasamos el documento a la pantalla de Consulta Médica para que lo guarde al finalizar
          onDocumentGenerated({
            documentType,
            textContent: finalText,
            pdfBase64: `data:application/pdf;base64,${data.pdfBase64}`
          });
          toast.success("Documento preparado para guardar.");
          handleClose();
        },
      }
    );
  };

  const handleClose = () => {
    setStep(1); setPromptText(""); setFinalText(""); onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generador de documentos médicos" size="lg">
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
              <option value="sick_leave">Incapacidad médica</option>
              <option value="prescription">Receta médica extra</option>
              <option value="other">Documento libre / otro</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Instrucciones para la IA (prompt)</label>
            <textarea
              className="form-input"
              rows={4}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ej. Genera una constancia de incapacidad por 5 días por cuadro gripal…"
            />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGenerateDraft}
              className="btn btn-ai"
              disabled={draftMutation.isPending}
            >
              <i className="ri-sparkling-2-line"></i>
              {draftMutation.isPending ? "Generando…" : "Generar borrador"}
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "grid", gap: "1.1rem" }}>
          <div className="form-group">
            <label className="form-label">Borrador editable</label>
            <textarea
              className="form-input"
              rows={12}
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              style={{ fontFamily: "Georgia, serif", fontSize: "0.95rem", lineHeight: 1.6 }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "space-between" }}>
            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary">
              ← Regresar
            </button>
            <button
              type="button"
              onClick={handleSaveAndPrint}
              className="btn btn-primary"
              disabled={renderMutation.isPending}
            >
              <i className="ri-printer-line"></i>
              {renderMutation.isPending ? "Procesando…" : "Imprimir y adjuntar"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};