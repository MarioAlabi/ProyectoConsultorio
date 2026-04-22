import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export const useWaitingRoom = () => {
  return useQuery({
    queryKey: ["preclinical", "waiting"],
    queryFn: async () => {
      const res = await api.get("/preclinical");
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return list;
    },
    refetchInterval: 8000,
  });
};

export const usePreclinicalRecord = (id) => {
  return useQuery({
    queryKey: ["preclinical", id],
    queryFn: async () => {
      const res = await api.get(`/preclinical/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
  });
};

export const useCreatePreclinical = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/preclinical", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preclinical"] });
      toast.success("Registro pre-clinico creado correctamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al crear registro pre-clinico.");
    },
  });
};

export const useUpdatePreclinicalStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/preclinical/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preclinical"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al actualizar estado.");
    },
  });
};

export const useDoctorDashboard = (date) => {
  return useQuery({
    queryKey: ["preclinical", "dashboard", date],
    queryFn: async () => {
      const params = date ? `?date=${date}` : "";
      const res = await api.get(`/preclinical/dashboard${params}`);
      return res.data?.data || res.data;
    },
    refetchInterval: 8000,
  });
};
export const useUpdatePreclinical = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await api.patch(`/preclinical/${id}/status`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["preclinical"] });
      toast.success("Registro pre-clínico actualizado correctamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al actualizar registro.");
    },
  });
};
export const usePreclinicalByPatient = (patientId) => {
  return useQuery({
    queryKey: ["preclinical", "patient", patientId],
    queryFn: async () => {
      const res = await api.get(`/preclinical/patient/${patientId}`);
      return res.data?.data || [];
    },
    enabled: !!patientId, 
  });
};