import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Setting } from "@/types/database";

// In JSON-only mode we don't persist settings in a database.
// Configure the WhatsApp number via VITE_WHATSAPP_NUMBER in a .env file.
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "";

export function useSettings() {
  // Return an empty settings array to keep the admin UI from crashing.
  return useQuery<Setting[]>({
    queryKey: ["settings"],
    queryFn: async () => [],
  });
}

export function useWhatsAppNumber() {
  return useQuery({
    queryKey: ["settings", "whatsapp_number"],
    queryFn: async () => WHATSAPP_NUMBER,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (_payload: { key: string; value: string }) => {
      // No-op: settings are not persisted without a database.
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function generateWhatsAppLink(phoneNumber: string, phoneModel: string) {
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  const message = encodeURIComponent(`Hi, I'm interested in the ${phoneModel}. Is it available?`);
  return `https://wa.me/${cleanNumber}?text=${message}`;
}
