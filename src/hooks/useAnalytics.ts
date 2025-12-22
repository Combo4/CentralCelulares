import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

// Generate or get session ID for analytics
function getSessionId(): string {
  const key = "phone_catalog_session";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export async function trackEvent(
  eventType: "page_view" | "product_view" | "product_click" | "whatsapp_click",
  phoneId?: string
) {
  try {
    await supabase.from("analytics_events").insert({
      event_type: eventType,
      phone_id: phoneId || null,
      page_url: window.location.href,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
    });
  } catch (error) {
    console.error("Error tracking event:", error);
  }
}

export function useAnalyticsSummary(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["analytics", "summary", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase.from("analytics_events").select("*");

      if (startDate) {
        query = query.gte("created_at", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data: events, error } = await query;
      if (error) throw error;

      const totalViews = events.filter((e) => e.event_type === "product_view").length;
      const totalClicks = events.filter((e) => e.event_type === "product_click").length;
      const whatsappClicks = events.filter((e) => e.event_type === "whatsapp_click").length;
      const ctr = totalViews > 0 ? (whatsappClicks / totalViews) * 100 : 0;

      // Group by phone
      const phoneStats = events.reduce((acc, event) => {
        if (!event.phone_id) return acc;
        if (!acc[event.phone_id]) {
          acc[event.phone_id] = { views: 0, clicks: 0 };
        }
        if (event.event_type === "product_view") acc[event.phone_id].views++;
        if (event.event_type === "whatsapp_click") acc[event.phone_id].clicks++;
        return acc;
      }, {} as Record<string, { views: number; clicks: number }>);

      // Group by date
      const dailyStats = events.reduce((acc, event) => {
        const date = new Date(event.created_at).toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, views: 0, clicks: 0, whatsapp: 0 };
        }
        if (event.event_type === "product_view") acc[date].views++;
        if (event.event_type === "product_click") acc[date].clicks++;
        if (event.event_type === "whatsapp_click") acc[date].whatsapp++;
        return acc;
      }, {} as Record<string, { date: string; views: number; clicks: number; whatsapp: number }>);

      return {
        totalViews,
        totalClicks,
        whatsappClicks,
        ctr,
        phoneStats,
        dailyStats: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
      };
    },
  });
}

export function useTopPhones(limit = 10) {
  return useQuery({
    queryKey: ["analytics", "top_phones", limit],
    queryFn: async () => {
      const { data: phones, error } = await supabase
        .from("phones")
        .select(`
          *,
          brand:brands(*)
        `)
        .order("view_count", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return phones;
    },
  });
}