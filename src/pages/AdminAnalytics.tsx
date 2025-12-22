import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { useAnalyticsSummary, useTopPhones } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Eye, MousePointer, MessageCircle, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#10B981", "#F59E0B", "#EF4444"];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
    }
    return { start, end };
  };

  const { start, end } = getDateRange();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsSummary(start, end);
  const { data: topPhones, isLoading: topPhonesLoading } = useTopPhones(5);

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

  const stats = [
    {
      title: "Total Views",
      value: analytics?.totalViews || 0,
      icon: Eye,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Product Clicks",
      value: analytics?.totalClicks || 0,
      icon: MousePointer,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "WhatsApp Clicks",
      value: analytics?.whatsappClicks || 0,
      icon: MessageCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Conversion Rate",
      value: `${(analytics?.ctr || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ];

  const pieData = [
    { name: "Product Views", value: analytics?.totalViews || 0 },
    { name: "Product Clicks", value: analytics?.totalClicks || 0 },
    { name: "WhatsApp Clicks", value: analytics?.whatsappClicks || 0 },
  ].filter((d) => d.value > 0);

  const topPhonesData = topPhones?.slice(0, 5).map((phone) => ({
    name: `${phone.brand?.name || ""} ${phone.model}`.substring(0, 20),
    views: phone.view_count,
    clicks: phone.click_count,
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-2xl font-bold">Analytics</h1>
          </div>
          <Select value={dateRange} onValueChange={(v: "7d" | "30d" | "90d") => setDateRange(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {analyticsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <Card key={stat.title} className="bg-card/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Daily Trends */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle>Daily Trends</CardTitle>
                  <CardDescription>Views, clicks, and conversions over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics?.dailyStats || []}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorWhatsapp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          labelFormatter={(v) => new Date(v).toLocaleDateString()}
                        />
                        <Area
                          type="monotone"
                          dataKey="views"
                          stroke="hsl(var(--primary))"
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          strokeWidth={2}
                          name="Views"
                        />
                        <Area
                          type="monotone"
                          dataKey="whatsapp"
                          stroke="#10B981"
                          fillOpacity={1}
                          fill="url(#colorWhatsapp)"
                          strokeWidth={2}
                          name="WhatsApp"
                        />
                        <Legend />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Event Distribution */}
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle>Event Distribution</CardTitle>
                  <CardDescription>Breakdown of user interactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {pieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Phones */}
            <Card className="bg-card/50">
              <CardHeader>
                <CardTitle>Top Performing Phones</CardTitle>
                <CardDescription>Most viewed and clicked products</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {topPhonesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topPhonesData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="clicks" fill="hsl(var(--accent))" name="Clicks" radius={[0, 4, 4, 0]} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No phone data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
