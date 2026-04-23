import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * HU-07: obtiene el reporte de diagnósticos agrupado por CIE-10 + año.
 * @param {{ fromYear: number, toYear: number, diagnosisCode?: string }} filters
 * @param {boolean} enabled - La vista solo debe disparar la query al pulsar "Buscar".
 */
export const useDiagnosticsReport = (filters, enabled = false) => {
    return useQuery({
        queryKey: ["reports", "diagnostics", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.fromYear) params.append("fromYear", filters.fromYear);
            if (filters?.toYear) params.append("toYear", filters.toYear);
            if (filters?.diagnosisCode) params.append("diagnosisCode", filters.diagnosisCode);
            const suffix = params.toString() ? `?${params.toString()}` : "";
            const res = await api.get(`/consultations/reports/diagnostics${suffix}`);
            return res.data?.data;
        },
        enabled,
    });
};

/**
 * Catálogo de diagnósticos (códigos CIE-10 que existen en DB).
 * Alimenta el selector "Tipo de diagnóstico" del reporte.
 */
export const useDiagnosisCatalog = () => {
    return useQuery({
        queryKey: ["reports", "diagnosis-catalog"],
        queryFn: async () => {
            const res = await api.get("/consultations/reports/diagnosis-catalog");
            return res.data?.data || [];
        },
    });
};
