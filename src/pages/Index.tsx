import { Navbar } from "@/components/Navbar";
import { PhoneCard } from "@/components/PhoneCard";
import { Button } from "@/components/ui/button";
import { useFeaturedPhones, useSalePhones } from "@/hooks/usePhones";
import { useActiveCampaigns } from "@/hooks/useCampaigns";
import { ArrowRight, Sparkles, Percent, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { data: featuredPhones, isLoading: loadingFeatured } = useFeaturedPhones();
  const { data: salePhones, isLoading: loadingSale } = useSalePhones();
  const { data: campaigns } = useActiveCampaigns();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(262_83%_58%/0.3),transparent_50%)]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Find Your Perfect
              <span className="text-gradient block">Smartphone</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Discover the latest phones from top brands. Compare specs, prices, and find amazing deals.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Link to="/catalog">
                <Button size="lg" className="gradient-primary text-primary-foreground border-0">
                  Browse Catalog
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Active Campaign Banner */}
      {campaigns && campaigns.length > 0 && (
        <section className="bg-primary/10 border-y border-primary/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-3 text-center">
              <Percent className="w-5 h-5 text-primary" />
              <p className="font-medium">
                <span className="text-primary font-bold">{campaigns[0].name}</span>
                {campaigns[0].discount_percent && (
                  <span> — Up to {campaigns[0].discount_percent}% off!</span>
                )}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Featured Phones */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl md:text-3xl font-bold">Featured Phones</h2>
          </div>
          <Link to="/catalog">
            <Button variant="ghost">
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-secondary animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPhones?.map((phone) => (
              <PhoneCard key={phone.id} phone={phone} />
            ))}
          </div>
        )}
      </section>

      {/* On Sale */}
      {salePhones && salePhones.length > 0 && (
        <section className="bg-secondary/50 py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Percent className="w-6 h-6 text-sale" />
                <h2 className="font-display text-2xl md:text-3xl font-bold">Hot Deals</h2>
              </div>
              <Link to="/catalog?sale=true">
                <Button variant="ghost">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {salePhones?.map((phone) => (
                <PhoneCard key={phone.id} phone={phone} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">PhoneHub</span>
          </div>
          <p className="text-sm">© 2024 PhoneHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;