import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../lib/api";

/**
 * Hooks para las integraciones de IA clínica.
 * Todos manejan 503 (no configurada) vs 502/500 (error real) con mensajes distintos.
 */

const handleAIError = (err, fallback = "Error al contactar con la IA.") => {
  if (err.response?.status === 503) {
    toast.error("La IA no está configurada en el servidor.");
  } else if (err.response?.status === 429) {
    toast.error("Demasiadas solicitudes. Espera un momento.");
  } else {
    toast.error(err.response?.data?.message || fallback);
  }
};

// ─── 1. Sugerencia ICD-10 ────────────────────────────────────────────────────

export const useSuggestIcd10 = () => {
  return useMutation({
    mutationFn: async (diagnosis) => {
      const res = await api.post("/ai/suggest-icd10", { diagnosis });
      return res.data?.data;
    },
    onError: (err) => handleAIError(err, "No se pudo sugerir código CIE-10."),
  });
};

// ─── 2. Resumen clínico del paciente ──────────────────────────────────────────

export const usePatientAISummary = (patientId, enabled = false) => {
  return useQuery({
    queryKey: ["ai", "patient-summary", patientId],
    queryFn: async () => {
      const res = await api.get(`/ai/patient/${patientId}/summary`);
      return res.data?.data;
    },
    enabled: !!patientId && enabled,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 min, evita recomputar al toggle
  });
};

// ─── 3. Borrador de anamnesis ────────────────────────────────────────────────

export const useDraftAnamnesis = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/ai/draft-anamnesis", payload);
      return res.data?.data;
    },
    onError: (err) => handleAIError(err, "No se pudo generar el borrador."),
  });
};

// ─── 4. Chequeo de receta ────────────────────────────────────────────────────

export const useCheckPrescription = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/ai/check-prescription", payload);
      return res.data?.data;
    },
    onError: (err) => handleAIError(err, "No se pudo revisar la receta."),
  });
};

// ─── 5. Extracción estructurada de antecedentes ──────────────────────────────

export const useExtractHistory = () => {
  return useMutation({
    mutationFn: async (text) => {
      const res = await api.post("/ai/extract-history", { text });
      return res.data?.data;
    },
    onError: (err) => handleAIError(err, "No se pudo estructurar el texto."),
  });
};

// ─── 6. Análisis narrativo de reportes ───────────────────────────────────────

export const useAnalyzeReport = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/ai/analyze-report", payload);
      return res.data?.data;
    },
    onError: (err) => handleAIError(err, "No se pudo generar el análisis."),
  });
};
