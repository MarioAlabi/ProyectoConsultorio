import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * Hook para obtener registros de auditoría con filtros y paginación.
 * Solo disponible para administradores.
 */
export const useAuditLogs = (filters = {}) => {
  const { tableName, action, search, from, to, page = 1, limit = 20 } = filters;

  return useQuery({
    queryKey: ["audit-logs", { tableName, action, search, from, to, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tableName) params.set("tableName", tableName);
      if (action) params.set("action", action);
      if (search) params.set("search", search);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const res = await api.get(`/audit?${params.toString()}`);
      return {
        data: res.data?.data || [],
        pagination: res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
      };
    },
    keepPreviousData: true,
  });
};

/**
 * Hook para obtener el historial de auditoría de un paciente específico.
 */
export const useAuditLogsByPatient = (patientId) => {
  return useQuery({
    queryKey: ["audit-logs", "patient", patientId],
    queryFn: async () => {
      const res = await api.get(`/audit/patient/${patientId}`);
      return res.data?.data || [];
    },
    enabled: !!patientId,
  });
};

/**
 * Hook para obtener el historial de auditoría de un registro específico.
 */
export const useAuditLogsByRecord = (recordId) => {
  return useQuery({
    queryKey: ["audit-logs", "record", recordId],
    queryFn: async () => {
      const res = await api.get(`/audit/record/${recordId}`);
      return res.data?.data || [];
    },
    enabled: !!recordId,
  });
};
