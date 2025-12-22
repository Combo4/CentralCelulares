import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useSettings, useUpdateSetting } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, MessageCircle, Save } from "lucide-react";

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  useEffect(() => {
    if (settings) {
      const whatsapp = settings.find((s) => s.key === "whatsapp_number");
      const name = settings.find((s) => s.key === "store_name");
      const address = settings.find((s) => s.key === "store_address");
      
      if (whatsapp) setWhatsappNumber(whatsapp.value);
      if (name) setStoreName(name.value);
      if (address) setStoreAddress(address.value);
    }
  }, [settings]);

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

  const handleSave = async (key: string, value: string) => {
    try {
      await updateSetting.mutateAsync({ key, value });
      toast({ title: "Setting saved successfully" });
    } catch (error: any) {
      toast({
        title: "Error saving setting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {settingsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  WhatsApp Configuration
                </CardTitle>
                <CardDescription>
                  Configure the WhatsApp number for customer inquiries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <div className="flex gap-2">
                    <Input
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+1234567890"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSave("whatsapp_number", whatsappNumber)}
                      disabled={updateSetting.isPending}
                      className="gradient-primary"
                    >
                      {updateSetting.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., +1 for US, +44 for UK)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>
                  Basic store details shown to customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Store Name</Label>
                  <div className="flex gap-2">
                    <Input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="My Phone Store"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSave("store_name", storeName)}
                      disabled={updateSetting.isPending}
                      variant="outline"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Store Address</Label>
                  <div className="flex gap-2">
                    <Input
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="123 Main St, City, Country"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSave("store_address", storeAddress)}
                      disabled={updateSetting.isPending}
                      variant="outline"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
