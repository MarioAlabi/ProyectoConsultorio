import { api } from "../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const useSettings = () => {
    return useQuery({
        queryKey: ["settings"],
        queryFn: async () => {
        const res = await api.get('/settings');
        return res.data?.data || null; 
        },
        staleTime: 1000 * 60 * 30, 
    });
    };

    export const useUpdateSettings = () => {
    const qc = useQueryClient();
    
    return useMutation({
        mutationFn: async (data) => {
        const res = await api.post('/settings', data);
        return res.data;
        },
        onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["settings"] });
        toast.success("Configuración guardada correctamente.");
        },
        onError: (err) => {
        toast.error(err.response?.data?.message || "Error al guardar la configuración.");
        },
    });
    };