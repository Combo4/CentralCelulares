import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useAllPhones } from "@/hooks/usePhones";
import { useAnalyticsSummary } from "@/hooks/useAnalytics";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Phone, BarChart3, Tag, Eye, MousePointer, MessageCircle, LogOut, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: phones } = useAllPhones();
  const { data: campaigns } = useCampaigns();
  const { data: analytics } = useAnalyticsSummary();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && isAdmin === false) {
      navigate("/admin");
    }
  }, [isAdmin, adminLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin");
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const stats = [
    { label: "Total Phones", value: phones?.length || 0, icon: Phone, color: "text-primary" },
    { label: "Active Campaigns", value: campaigns?.filter(c => c.is_active).length || 0, icon: Tag, color: "text-accent" },
    { label: "Total Views", value: analytics?.totalViews || 0, icon: Eye, color: "text-success" },
    { label: "WhatsApp Clicks", value: analytics?.whatsappClicks || 0, icon: MessageCircle, color: "text-whatsapp" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Admin Dashboard</span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-8">Dashboard Overview</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold">{value}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Recent Phones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {phones?.slice(0, 5).map((phone) => (
                  <div key={phone.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden">
                      {phone.images?.[0] && (
                        <img src={phone.images[0]} alt={phone.model} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{phone.model}</p>
                      <p className="text-sm text-muted-foreground">{phone.brand?.name}</p>
                    </div>
                    <p className="font-bold">${phone.price}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                  <span>Click-through Rate</span>
                  <span className="font-bold text-primary">{analytics?.ctr.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                  <span>Total Product Clicks</span>
                  <span className="font-bold">{analytics?.totalClicks || 0}</span>
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Full analytics dashboard coming soon!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}