// Campaign-related hooks were only used by the admin panel and are now unused.
// This file is left as a stub.

export function useActiveCampaigns() {
  return useQuery({
    queryKey: ["campaigns", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("is_active", true)
        .gte("end_date", new Date().toISOString())
        .lte("start_date", new Date().toISOString());
      if (error) throw error;
      return data as Campaign[];
    },
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Campaign[];
    },
  });
}

export function useCampaignPhones(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["campaign_phones", campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from("campaign_phones")
        .select(`
          *,
          phone:phones(*, brand:brands(*))
        `)
        .eq("campaign_id", campaignId);
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Omit<Campaign, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("campaigns")
        .insert(campaign)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Campaign> & { id: string }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useAddPhoneToCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, phoneId }: { campaignId: string; phoneId: string }) => {
      const { data, error } = await supabase
        .from("campaign_phones")
        .insert({ campaign_id: campaignId, phone_id: phoneId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign_phones", campaignId] });
    },
  });
}

export function useRemovePhoneFromCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, phoneId }: { campaignId: string; phoneId: string }) => {
      const { error } = await supabase
        .from("campaign_phones")
        .delete()
        .eq("campaign_id", campaignId)
        .eq("phone_id", phoneId);
      if (error) throw error;
    },
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ["campaign_phones", campaignId] });
    },
  });
}