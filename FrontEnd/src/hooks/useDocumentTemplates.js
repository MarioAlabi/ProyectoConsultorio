import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../lib/api";

export const useDocumentTemplates = ({ type, includeInactive = false } = {}) => {
  return useQuery({
    queryKey: ["document-templates", type || "all", includeInactive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      if (includeInactive) params.append("includeInactive", "true");
      const suffix = params.toString() ? `?${params.toString()}` : "";
      const res = await api.get(`/document-templates${suffix}`);
      return res.data?.data || [];
    },
  });
};

export const useDocumentTemplate = (id) => {
  return useQuery({
    queryKey: ["document-templates", id],
    queryFn: async () => {
      const res = await api.get(`/document-templates/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });
};

export const useCreateDocumentTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/document-templates", data);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Plantilla creada correctamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al crear plantilla.");
    },
  });
};

export const useUpdateDocumentTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/document-templates/${id}`, data);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Plantilla actualizada.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al actualizar plantilla.");
    },
  });
};

export const useToggleDocumentTemplateStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/document-templates/${id}/status`, { status });
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-templates"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al cambiar estado.");
    },
  });
};

export const useDeleteDocumentTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/document-templates/${id}`);
      return res.data?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["document-templates"] });
      toast.success("Plantilla eliminada.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al eliminar plantilla.");
    },
  });
};

export const useGenerateDocument = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      // Emitir documento desde plantilla reutilizable (flujo de plantillas).
      // /api/documents quedó reservado para el flujo ad-hoc con Puppeteer,
      // así que los documentos a partir de plantilla viven en /generated-documents.
      const res = await api.post("/generated-documents", payload);
      return res.data?.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["patient-documents", data?.patientId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al generar documento.");
    },
  });
};

export const useDraftTemplateWithAI = () => {
  return useMutation({
    mutationFn: async ({ prompt, preferType, extraContext } = {}) => {
      const res = await api.post("/document-templates/ai-draft", { prompt, preferType, extraContext });
      return res.data?.data;
    },
    onError: (err) => {
      const status = err.response?.status;
      if (status === 503) {
        toast.error("La IA no está configurada en el servidor. Avisa al administrador.");
      } else {
        toast.error(err.response?.data?.message || "La IA no pudo generar la plantilla.");
      }
    },
  });
};

export const usePatientDocuments = (patientId) => {
  return useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: async () => {
      const res = await api.get(`/generated-documents/patient/${patientId}`);
      return res.data?.data || [];
    },
    enabled: !!patientId,
  });
};
