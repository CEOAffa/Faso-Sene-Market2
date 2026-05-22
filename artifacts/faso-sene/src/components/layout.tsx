import React from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Leaf, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const WA_NUMBER = "22374947541";
const WA_MESSAGE = encodeURIComponent("Bonjour, je souhaite commander des produits sur Faso Sènè.");
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MESSAGE}`;

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showWaLabel, setShowWaLabel] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setShowWaLabel(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const navigation = [
    { name: "Accueil", href: "/" },
    { name: "Catalogue", href: "/catalogue" },
    { name: "Prix du Jour", href: "/prix" },
    { name: "Commander", href: "/commander" },
    { name: "Fournisseurs", href: "/fournisseurs" },
    { name: "Tableau de bord", href: "/tableau-de-bord" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight text-primary">Faso Sènè</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link href="/admin">
              <Button variant="outline" size="sm" className="ml-4">Admin</Button>
            </Link>
          </nav>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t p-4 space-y-4 bg-background">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block text-sm font-medium p-2 rounded-md ${
                  location === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-start mt-4">Admin</Button>
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-muted/40 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">Faso Sènè</span>
          </div>
          <p>Le marché agricole numérique du Mali.</p>
          <p className="mt-2">© {new Date().getFullYear()} Faso Sènè. Tous droits réservés.</p>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        <AnimatePresence>
          {showWaLabel && (
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="bg-white text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-lg border border-gray-100 whitespace-nowrap"
            >
              Commander via WhatsApp
            </motion.div>
          )}
        </AnimatePresence>
        <motion.a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Commander via WhatsApp"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onHoverStart={() => setShowWaLabel(true)}
          onHoverEnd={() => setShowWaLabel(false)}
          className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
          style={{ boxShadow: "0 4px 24px rgba(37,211,102,0.45)" }}
        >
          <MessageCircle className="h-7 w-7 text-white fill-white" />
        </motion.a>
      </div>
    </div>
  );
}
