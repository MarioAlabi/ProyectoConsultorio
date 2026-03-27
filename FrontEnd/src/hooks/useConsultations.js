import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export const useConsultation = (id) => {
  return useQuery({
    queryKey: ["consultations", id],
    queryFn: async () => {
      const res = await api.get(`/consultations/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
  });
};

export const useFinishConsultation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.post(`/consultations/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: ["preclinical"] });
      toast.success("Consulta finalizada correctamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al finalizar consulta.");
    },
  });
};
