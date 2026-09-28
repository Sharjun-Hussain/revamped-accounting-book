import { toast } from "sonner";
import api from "@/lib/api";

export const donorService = {
    getAll: async (search = "") => {
        try {
            const res = await api.get(`/donors${search ? `?search=${encodeURIComponent(search)}` : ""}`);
            return res.data;
        } catch (error) {
            console.error("Error fetching donors:", error);
            toast.error("Failed to load donors");
            return [];
        }
    },

    getById: async (id) => {
        try {
            const res = await api.get(`/donors/${id}`);
            return res.data;
        } catch (error) {
            console.error("Error fetching donor:", error);
            toast.error("Failed to load donor details");
            return null;
        }
    },

    create: async (data) => {
        try {
            const res = await api.post("/donors", data);
            return res.data;
        } catch (error) {
            console.error("Error creating donor:", error);
            throw error;
        }
    },

    update: async (id, data) => {
        try {
            const res = await api.put(`/donors/${id}`, data);
            return res.data;
        } catch (error) {
            console.error("Error updating donor:", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            await api.delete(`/donors/${id}`);
            return true;
        } catch (error) {
            console.error("Error deleting donor:", error);
            throw error;
        }
    },
};
