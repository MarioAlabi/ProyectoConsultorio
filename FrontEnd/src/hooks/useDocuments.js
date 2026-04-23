import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export const useGenerateDraft = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/documents/generate-draft", data);
      return res.data?.data;
    },
    onError: (err) => toast.error(err.response?.data?.message || "Error al conectar con la IA."),
  });
};

export const useRenderPdf = () => {
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/documents/render-pdf", data);
      return res.data?.data;
    },
    onError: (err) => toast.error(err.response?.data?.message || "Error al generar el PDF final."),
  });
};