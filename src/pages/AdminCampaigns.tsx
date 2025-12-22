import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useCampaigns, useCampaignPhones, useCreateCampaign, useUpdateCampaign, useDeleteCampaign, useAddPhoneToCampaign, useRemovePhoneFromCampaign } from "@/hooks/useCampaigns";
import { useAllPhones } from "@/hooks/usePhones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Calendar, Percent, Tag, Phone } from "lucide-react";
import type { Campaign } from "@/types/database";
import { format } from "date-fns";

interface CampaignFormData {
  name: string;
  description: string;
  discount_percent: number | null;
  discount_amount: number | null;
  banner_image: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

const initialFormData: CampaignFormData = {
  name: "",
  description: "",
  discount_percent: null,
  discount_amount: null,
  banner_image: "",
  start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  end_date: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
  is_active: true,
};

export default function AdminCampaigns() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: phones } = useAllPhones();
  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const addPhoneToCampaign = useAddPhoneToCampaign();
  const removePhoneFromCampaign = useRemovePhoneFromCampaign();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [phonesDialogOpen, setPhonesDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);

  const { data: campaignPhones } = useCampaignPhones(selectedCampaignId || undefined);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    navigate("/admin");
    return null;
  }

  const handleOpenDialog = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        name: campaign.name,
        description: campaign.description || "",
        discount_percent: campaign.discount_percent,
        discount_amount: campaign.discount_amount ? parseFloat(campaign.discount_amount.toString()) : null,
        banner_image: campaign.banner_image || "",
        start_date: format(new Date(campaign.start_date), "yyyy-MM-dd'T'HH:mm"),
        end_date: format(new Date(campaign.end_date), "yyyy-MM-dd'T'HH:mm"),
        is_active: campaign.is_active ?? true,
      });
    } else {
      setEditingCampaign(null);
      setFormData(initialFormData);
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      };

      if (editingCampaign) {
        await updateCampaign.mutateAsync({ id: editingCampaign.id, ...payload });
        toast({ title: "Campaign updated successfully" });
      } else {
        await createCampaign.mutateAsync(payload);
        toast({ title: "Campaign created successfully" });
      }
      setDialogOpen(false);
      setEditingCampaign(null);
      setFormData(initialFormData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) return;

    try {
      await deleteCampaign.mutateAsync(campaign.id);
      toast({ title: "Campaign deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleManagePhones = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setPhonesDialogOpen(true);
  };

  const handleTogglePhone = async (phoneId: string, isInCampaign: boolean) => {
    if (!selectedCampaignId) return;

    try {
      if (isInCampaign) {
        await removePhoneFromCampaign.mutateAsync({ campaignId: selectedCampaignId, phoneId });
        toast({ title: "Phone removed from campaign" });
      } else {
        await addPhoneToCampaign.mutateAsync({ campaignId: selectedCampaignId, phoneId });
        toast({ title: "Phone added to campaign" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getCampaignStatus = (campaign: Campaign) => {
    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);

    if (!campaign.is_active) return { label: "Inactive", color: "bg-muted text-muted-foreground" };
    if (now < start) return { label: "Scheduled", color: "bg-blue-500/20 text-blue-400" };
    if (now > end) return { label: "Ended", color: "bg-destructive/20 text-destructive" };
    return { label: "Active", color: "bg-primary/20 text-primary" };
  };

  const campaignPhoneIds = campaignPhones?.map((cp) => cp.phone_id) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-2xl font-bold">Manage Campaigns</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create Campaign"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      value={formData.discount_percent || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discount_percent: e.target.value ? parseInt(e.target.value) : null,
                        }))
                      }
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Discount Amount ($)</Label>
                    <Input
                      type="number"
                      value={formData.discount_amount || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discount_amount: e.target.value ? parseFloat(e.target.value) : null,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.start_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Banner Image URL</Label>
                  <Input
                    value={formData.banner_image}
                    onChange={(e) => setFormData((prev) => ({ ...prev, banner_image: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={createCampaign.isPending || updateCampaign.isPending}>
                    {(createCampaign.isPending || updateCampaign.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingCampaign ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {campaignsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns?.map((campaign) => {
              const status = getCampaignStatus(campaign);
              return (
                <Card key={campaign.id} className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{campaign.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
                        </div>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground mb-2">{campaign.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(campaign.start_date), "MMM d")} - {format(new Date(campaign.end_date), "MMM d, yyyy")}
                          </span>
                          {campaign.discount_percent && (
                            <span className="flex items-center gap-1">
                              <Percent className="w-4 h-4" />
                              {campaign.discount_percent}% off
                            </span>
                          )}
                          {campaign.discount_amount && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-4 h-4" />
                              ${campaign.discount_amount} off
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleManagePhones(campaign.id)}>
                          <Phone className="w-4 h-4 mr-1" />
                          Phones
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleOpenDialog(campaign)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(campaign)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Phones Dialog */}
      <Dialog open={phonesDialogOpen} onOpenChange={setPhonesDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Campaign Phones</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {phones?.map((phone) => {
              const isInCampaign = campaignPhoneIds.includes(phone.id);
              return (
                <div key={phone.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-secondary overflow-hidden">
                      {phone.images?.[0] && (
                        <img src={phone.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{phone.brand?.name} {phone.model}</p>
                      <p className="text-xs text-muted-foreground">${phone.price}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isInCampaign}
                    onCheckedChange={() => handleTogglePhone(phone.id, isInCampaign)}
                  />
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
