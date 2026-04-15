import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export const usePatients = (search = "") => {
  return useQuery({
    queryKey: ["patients", search],
    queryFn: async () => {
      const params = search ? `?q=${encodeURIComponent(search)}` : "";
      const res = await api.get(`/patients${params}`);
      return res.data?.data || [];
    },
  });
};

export const usePatient = (id) => {
  return useQuery({
    queryKey: ["patients", id],
    queryFn: async () => {
      const res = await api.get(`/patients/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });
};

export const useCreatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/patients/register", data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success(data?.message || "Paciente registrado correctamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al registrar paciente.");
    },
  });
};

export const useUpdatePatient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/patients/${id}`, data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success(data?.message || "Paciente actualizado correctamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al actualizar paciente.");
    },
  });
};

export const useUpdatePatientStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/patients/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al cambiar estado.");
    },
  });
};

export const usePatientHistory = (patientId) => {
  return useQuery({
    queryKey: ["preclinical", "patient", patientId],
    queryFn: async () => {
      const res = await api.get(`/preclinical/patient/${patientId}`);
      return res.data?.data || [];
    },
    enabled: !!patientId,
  });
};

export const usePatientClinicalHistory = (patientId) => {
  const hasPatientId = typeof patientId === "string" && patientId.length > 0;

  return useQuery({
    queryKey: ["consultations", "patient-history", patientId],
    queryFn: async () => {
      const res = await api.get(`/consultations/patient/${patientId}/history`);
      return res.data?.data || { items: [], empty: true };
    },
    enabled: hasPatientId,
  });
};
