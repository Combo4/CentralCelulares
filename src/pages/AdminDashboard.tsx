import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useAllPhones } from "@/hooks/usePhones";
import { useAnalyticsSummary } from "@/hooks/useAnalytics";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Phone, BarChart3, Tag, Eye, MessageCircle, LogOut, Loader2, Settings, ArrowRight } from "lucide-react";

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
    { label: "Total Views", value: analytics?.totalViews || 0, icon: Eye, color: "text-green-500" },
    { label: "WhatsApp Clicks", value: analytics?.whatsappClicks || 0, icon: MessageCircle, color: "text-green-400" },
  ];

  const adminLinks = [
    { label: "Manage Phones", href: "/admin/phones", icon: Phone, description: "Add, edit, delete phones" },
    { label: "Campaigns", href: "/admin/campaigns", icon: Tag, description: "Manage promotions" },
    { label: "Analytics", href: "/admin/analytics", icon: BarChart3, description: "View detailed stats" },
    { label: "Settings", href: "/admin/settings", icon: Settings, description: "WhatsApp & store config" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
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

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="bg-card/50">
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

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {adminLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Card className="bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <link.icon className="w-8 h-8 text-primary mb-3" />
                      <h3 className="font-semibold mb-1">{link.label}</h3>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Phones */}
        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Recent Phones
            </CardTitle>
            <Link to="/admin/phones">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
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
                    <p className="font-medium truncate">{phone.brand?.name} {phone.model}</p>
                    <p className="text-sm text-muted-foreground">${phone.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}