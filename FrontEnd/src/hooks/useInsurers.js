import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../lib/api";

export const useInsurers = () => {
  return useQuery({
    queryKey: ["insurers"],
    queryFn: async () => {
      const res = await api.get("/insurers");
      return res.data?.data || [];
    },
  });
};

export const useCreateInsurer = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/insurers", data);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insurers"] });
      // El toast de éxito ya lo estamos manejando en el onSubmit del componente, 
      // pero dejarlo aquí está bien si prefieres la lógica centralizada.
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al registrar aseguradora.");
    },
  });
};

// --- ESTOS SON LOS DOS HOOKS NUEVOS PARA EDITAR E INHABILITAR ---

export const useUpdateInsurer = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const res = await api.put(`/insurers/${id}`, updateData);
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insurers"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al actualizar la aseguradora.");
    },
  });
};

export const useToggleInsurerStatus = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/insurers/${id}/status`, { status });
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insurers"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al cambiar el estado.");
    },
  });
};

// --- TU HOOK ORIGINAL DE REPORTES SE MANTIENE INTACTO ---

export const useInsurerConsultationReport = (filters = {}) => {
  const { insurerId, from, to } = filters;
  const enabled = Boolean(insurerId && from && to);

  return useQuery({
    queryKey: ["consultations", "report", "insurer", insurerId, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({
        insurerId,
        from,
        to,
      });
      const res = await api.get(`/consultations/reports/by-insurer?${params.toString()}`);
      return res.data?.data || { items: [], summary: { totalPatients: 0, totalAmount: "0.00" }, empty: true };
    },
    enabled,
  });
};