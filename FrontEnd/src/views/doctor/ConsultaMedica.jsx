import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Hooks
import { consultationSchema } from "../../lib/validations/consultationSchema";
import { usePreclinicalRecord } from "../../hooks/usePreclinical";
import { useFinishConsultation } from "../../hooks/useConsultations";
import { usePatient, usePatientClinicalHistory } from "../../hooks/usePatients";

import { PatientSidebar } from "../../components/consultation/PatientSidebar";
import { ClinicalForm } from "../../components/consultation/ClinicalForm";
import { CoverageSection } from "../../components/consultation/CoverageSection";
import { MedicationSection } from "../../components/consultation/MedicationSection";
import { DocumentsSection } from "../../components/consultation/DocumentsSection";

const toNull = (v) => (v === "" || v === undefined ? null : v);

export const ConsultaMedica = () => {
  const { id } = useParams(); // preclinicalId
  const navigate = useNavigate();

  const { data, isLoading, isError } = usePreclinicalRecord(id);
  const finishMutation = useFinishConsultation();

  const patientId = useMemo(() => {
    const rawId = data?.patientId || data?.patient?.id || data?.patient_id;
    return rawId ? String(rawId) : null;
  }, [data]);

  const { data: patientProfile } = usePatient(patientId);
  const { data: historialClinico, isLoading: historialLoading, isError: historialError } = usePatientClinicalHistory(patientId);

  const [medicamentos, setMedicamentos] = useState([]);
  const [documentosGenerados, setDocumentosGenerados] = useState([]);

  const methods = useForm({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      anamnesis: "", physicalExam: "", diagnosis: "", labResults: "", observations: "",
      billingType: "private", insurerId: "", agreedAmount: "",
      bloodPressure: "", temperature: "", heartRate: "", oxygenSaturation: "", weight: "", height: "",
    },
  });

  useEffect(() => {
    if (data) {
      methods.setValue("bloodPressure", data.bloodPressure || "");
      methods.setValue("temperature", data.temperature || "");
      methods.setValue("heartRate", data.heartRate || "");
      methods.setValue("oxygenSaturation", data.oxygenSaturation || "");
      methods.setValue("weight", data.weight || "");
      methods.setValue("height", data.height || "");
    }
  }, [data, methods]);

  // --- LÓGICA DE IMPRESIÓN POST-GUARDADO ---
  const imprimirDocumentos = async (docs) => {
    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      try {
        let base64Raw = doc.pdfBase64;
        if (!base64Raw) continue;

        // 1. Aseguramos que tenga el prefijo correcto para fetch
        const dataUri = base64Raw.startsWith('data:application/pdf;base64,') 
          ? base64Raw 
          : `data:application/pdf;base64,${base64Raw}`;

        // 2. Usamos fetch para convertir el Data URI en un BLOB real de forma nativa
        // Esto es MIL veces más estable que usar atob() manualmente
        const response = await fetch(dataUri);
        const blob = await response.blob();
        
        const blobUrl = URL.createObjectURL(blob);
        
        // 3. Abrimos la ventana con un ligero retraso para evitar bloqueos
        setTimeout(() => {
          const printWindow = window.open(blobUrl);
          if (printWindow) {
            printWindow.onload = () => {
              // Intentamos imprimir, si falla, al menos el PDF queda visible para el usuario
              try { printWindow.print(); } catch (e) { console.warn("Auto-print bloqueado, pero PDF cargado."); }
            };
          } else {
            toast.error("Ventana bloqueada. Por favor permite los pop-ups.");
          }
        }, i * 1000);

      } catch (error) {
        console.error("Error al procesar PDF para impresión:", error);
        toast.error("No se pudo procesar uno de los documentos.");
      }
    }
  };

  const onSubmit = (formData) => {
    const medicamentosPreparados = medicamentos
      .filter((m) => m.name.trim())
      .map((med) => ({
        name: med.name,
        concentration: med.concentration || null,
        concentrationUnit: med.concentrationUnit,
        dose: med.doseAmount ? String(med.doseAmount) : "",
        doseUnit: med.doseUnit,
        route: med.route,
        frequency: med.frequencyAmount ? `Cada ${med.frequencyAmount} ${med.frequencyUnit}` : "",
        duration: med.durationAmount ? `Por ${med.durationAmount} ${med.durationUnit}` : "",
        additionalInstructions: med.additionalInstructions || null,
      }));

    const body = {
      ...formData,
      bloodPressure: toNull(formData.bloodPressure),
      temperature: toNull(formData.temperature),
      heartRate: toNull(formData.heartRate),
      oxygenSaturation: toNull(formData.oxygenSaturation),
      weight: toNull(formData.weight),
      height: toNull(formData.height),
      bmi: (formData.weight && formData.height) ? String(((parseFloat(formData.weight) * 0.453592) / (parseFloat(formData.height) ** 2)).toFixed(2)) : null,
      
      insurerId: formData.billingType === "insurance" ? formData.insurerId : undefined,
      agreedAmount: formData.billingType === "insurance" ? formData.agreedAmount : undefined,
      
      medicamentos: medicamentosPreparados,
      documentos: documentosGenerados,
    };

    finishMutation.mutate(
      { id, data: body },
      {
        onSuccess: () => {
          toast.success("Consulta y documentos guardados con éxito");
          
          // --- DISPARAMOS LA IMPRESIÓN ---
          if (documentosGenerados.length > 0) {
            imprimirDocumentos(documentosGenerados);
          }

          setTimeout(() => navigate("/doctor"), 2000);
        },
        onError: (err) => toast.error(err.message || "Error al finalizar la consulta"),
      }
    );
  };

  if (isLoading) return <div className="page" style={{ textAlign: "center", color: "var(--fg-muted)" }}>Cargando consulta…</div>;
  if (isError || !data) return <div className="page" style={{ textAlign: "center", color: "var(--accent-coral)" }}>Error al cargar datos.</div>;

  return (
    <div className="page" style={{ maxWidth: "1350px" }}>
      <header className="page-header" style={{ marginBottom: "2rem" }}>
        <div className="page-header__title">
          <span className="page-header__eyebrow">Consulta médica</span>
          <h1 className="page-header__heading">{data.patientName || data.fullName || patientProfile?.fullName || "Paciente"}</h1>
        </div>
      </header>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <div style={{ display: "grid", gridTemplateColumns: "370px 1fr", gap: "2rem", alignItems: "start" }}>
            
            <PatientSidebar 
              data={data} 
              patientProfile={patientProfile} 
              patientId={patientId}
              historialClinico={historialClinico}
              historialLoading={historialLoading}
              historialError={historialError}
            />

            <main style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <ClinicalForm />
              
              <CoverageSection />
              
              <MedicationSection 
                medicamentos={medicamentos} 
                setMedicamentos={setMedicamentos}
                data={data}
                patientProfile={patientProfile}
              />
              
              <DocumentsSection 
                preclinicalId={id} 
                data={data}
                patientProfile={patientProfile}
                documentosGenerados={documentosGenerados}
                setDocumentosGenerados={setDocumentosGenerados} 
              />

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={finishMutation.isPending}
                style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}
              >
                {finishMutation.isPending ? "Finalizando consulta…" : "Finalizar consulta y Generar Documentos"}
              </button>
            </main>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};