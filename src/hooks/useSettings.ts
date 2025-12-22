import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import type { Setting } from "@/types/database";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*");
      if (error) throw error;
      return data as Setting[];
    },
  });
}

export function useWhatsAppNumber() {
  return useQuery({
    queryKey: ["settings", "whatsapp_number"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .single();
      if (error) throw error;
      return data?.value || "";
    },
  });
}

export function generateWhatsAppLink(phoneNumber: string, phoneModel: string) {
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  const message = encodeURIComponent(`Hi, I'm interested in the ${phoneModel}. Is it available?`);
  return `https://wa.me/${cleanNumber}?text=${message}`;
}