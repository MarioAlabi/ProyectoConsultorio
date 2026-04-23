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
    <Modal isOpen={isOpen} onClose={handleClose} title="Generador de Documentos Médicos" size="lg">
      {step === 1 && (
        <div style={{ padding: "1rem" }}>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Tipo de Documento</label>
            <select className="form-input" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <option value="certificate">Constancia Médica</option>
              <option value="sick_leave">Incapacidad Médica</option>
              <option value="prescription">Receta Médica Extra</option>
              <option value="other">Documento Libre / Otro</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Instrucciones para la IA (Prompt)</label>
            <textarea className="form-input" rows={4} value={promptText} onChange={(e) => setPromptText(e.target.value)} />
          </div>
          <button onClick={handleGenerateDraft} className="submit-btn" disabled={draftMutation.isPending} style={{ width: "100%", backgroundColor: "#0ea5e9" }}>
            {draftMutation.isPending ? "Generando..." : "Generar Borrador"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ padding: "1rem" }}>
          <div className="form-group">
            <textarea className="form-input" rows={12} value={finalText} onChange={(e) => setFinalText(e.target.value)} style={{ fontSize: "1.05rem" }}/>
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: "0.75rem", borderRadius: "8px" }}>Regresar</button>
            <button onClick={handleSaveAndPrint} className="submit-btn" disabled={renderMutation.isPending} style={{ flex: 2, margin: 0 }}>
              {renderMutation.isPending ? "Procesando..." : "Imprimir y Adjuntar"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};