import { Navbar } from "@/components/Navbar";
import { PhoneCard } from "@/components/PhoneCard";
import { Button } from "@/components/ui/button";
import { useFeaturedPhones, useSalePhones } from "@/hooks/usePhones";
import { ArrowRight, Sparkles, Percent, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "/central-celulares-logo.png";

const Index = () => {
  const { data: featuredPhones, isLoading: loadingFeatured } = useFeaturedPhones();
  const { data: salePhones, isLoading: loadingSale } = useSalePhones();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary)/0.3),transparent_50%)]" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-2 animate-fade-in">
              Bienvenido a
              <span className="block text-[#0434b2]">Central Celulares</span>
            </h1>
            <p
              className="text-lg md:text-xl text-muted-foreground max-w-2xl animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              Catálogo de celulares nuevos y usados, con precios claros y atención personalizada.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Link to="/catalog">
                <Button size="lg" className="gradient-primary text-primary-foreground border-0">
                  Ver catálogo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Phones */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="font-display text-2xl md:text-3xl font-bold">Destacados</h2>
          </div>
          <Link to="/catalog">
            <Button variant="ghost">
              Ver todos <ArrowRight className="w-4 h-4 ml-2" />
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
                <h2 className="font-display text-2xl md:text-3xl font-bold">Ofertas</h2>
              </div>
              <Link to="/catalog?sale=true">
                <Button variant="ghost">
                  Ver todas <ArrowRight className="w-4 h-4 ml-2" />
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
      <footer className="border-t py-8 bg-[#F8F9FA] text-gray-700">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Central Celulares · Caaguazú, Paraguay
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
