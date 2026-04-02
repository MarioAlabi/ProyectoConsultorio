import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import toast from "react-hot-toast";

export const useAppointments = (date) => {
  return useQuery({
    queryKey: ["appointments", date],
    queryFn: async () => {
      const res = await api.get(`/appointments?date=${date}`);
      return res.data?.data || [];
    },
    enabled: !!date,
  });
};

export const useAppointmentsRange = (from, to) => {
  return useQuery({
    queryKey: ["appointments", "range", from, to],
    queryFn: async () => {
      const res = await api.get(`/appointments?from=${from}&to=${to}`);
      return res.data?.data || [];
    },
    enabled: !!from && !!to,
  });
};

export const useCreateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/appointments", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Cita agendada correctamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al agendar cita.");
    },
  });
};

export const useUpdateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/appointments/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Cita actualizada correctamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al actualizar cita.");
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.patch(`/appointments/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Estado de cita actualizado.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al actualizar estado.");
    },
  });
};

export const useBulkCancelAppointments = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.patch("/appointments/bulk-cancel", data);
      return res.data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["preclinical"] });
      toast.success(data.message || "Citas canceladas exitosamente.");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Error al cancelar citas.");
    },
  });
};
