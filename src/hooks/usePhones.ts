import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Phone, PhoneWithBrand, PhoneFilters, Brand } from "@/types/database";

export function usePhones(filters?: PhoneFilters) {
  return useQuery({
    queryKey: ["phones", filters],
    queryFn: async () => {
      let query = supabase
        .from("phones")
        .select(`
          *,
          brand:brands(*)
        `)
        .eq("is_published", true);

      if (filters?.search) {
        query = query.or(`model.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.brands && filters.brands.length > 0) {
        query = query.in("brand_id", filters.brands);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters?.releaseYear && filters.releaseYear.length > 0) {
        query = query.in("release_year", filters.releaseYear);
      }

      switch (filters?.sortBy) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "newest":
          query = query.order("release_year", { ascending: false });
          break;
        case "popular":
          query = query.order("view_count", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PhoneWithBrand[];
    },
  });
}

export function usePhone(id: string | undefined) {
  return useQuery({
    queryKey: ["phone", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("phones")
        .select(`
          *,
          brand:brands(*)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as PhoneWithBrand;
    },
    enabled: !!id,
  });
}

export function useFeaturedPhones() {
  return useQuery({
    queryKey: ["phones", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phones")
        .select(`
          *,
          brand:brands(*)
        `)
        .eq("is_published", true)
        .eq("is_featured", true)
        .limit(6);
      if (error) throw error;
      return data as PhoneWithBrand[];
    },
  });
}

export function useSalePhones() {
  return useQuery({
    queryKey: ["phones", "sale"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phones")
        .select(`
          *,
          brand:brands(*)
        `)
        .eq("is_published", true)
        .not("sale_price", "is", null)
        .limit(8);
      if (error) throw error;
      return data as PhoneWithBrand[];
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Brand[];
    },
  });
}

// Admin hooks
export function useAllPhones() {
  return useQuery({
    queryKey: ["phones", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phones")
        .select(`
          *,
          brand:brands(*)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PhoneWithBrand[];
    },
  });
}

export function useCreatePhone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (phone: Omit<Phone, "id" | "created_at" | "updated_at" | "view_count" | "click_count">) => {
      const { data, error } = await supabase
        .from("phones")
        .insert(phone)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
    },
  });
}

export function useUpdatePhone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Phone> & { id: string }) => {
      const { data, error } = await supabase
        .from("phones")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
    },
  });
}

export function useDeletePhone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("phones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phones"] });
    },
  });
}