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
      toast.success("Aseguradora registrada correctamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al registrar aseguradora.");
    },
  });
};

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
