import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { CartDrawer } from "./CartDrawer";
import { SearchBar } from "./SearchBar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NavLink } from "./NavLink";
import { fetchCollections, ShopifyCollection } from "@/lib/shopify";
import logo from "@/assets/logo.jpg";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [collections, setCollections] = useState<ShopifyCollection[]>([]);
  const location = useLocation();

  const showSearch = true; // Search enabled on all pages

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        const data = await fetchCollections(10);
        setCollections(data);
      } catch (error) {
        console.error("Error loading collections:", error);
      }
    };
    loadCollections();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Error signing out");
    else toast.success("Signed out successfully");
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const adminLinks = [
    { href: "/admin", label: "Admin Home" },
    { href: "/admin/trends", label: "Trend Intelligence" },
    { href: "/admin/bi", label: "BI & Risk" },
    { href: "/admin/approvals", label: "AI Approvals" },
    { href: "/admin/connectors", label: "Affiliate & Suppliers" },
    { href: "/admin/products", label: "Products" },
    { href: "/admin/social", label: "Social Accounts" },
    { href: "/admin/dropship", label: "Dropship Ops" },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-4 flex-shrink-0 mr-auto">
            <img
              src={logo}
              alt="HORUSIA"
              className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-lg"
            />
            <div className="hidden md:flex flex-col">
              <span className="text-2xl md:text-3xl font-serif font-bold bg-gradient-to-r from-gold via-[#E2C37C] to-gold bg-clip-text text-transparent leading-tight">
                HORUSIA
              </span>
              <span className="text-sm md:text-base text-foreground/80">One Stop Store</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-1 flex-1 justify-center">
            {navLinks.map((link) => (
              <div
                key={link.href}
                className="px-3 py-1.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <NavLink to={link.href} className="text-foreground">
                  {link.label}
                </NavLink>
              </div>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-base font-medium hover:bg-secondary/50 transition-colors px-4 py-2 rounded-lg bg-secondary/30 text-foreground"
                >
                  Products Gallery
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card/95 backdrop-blur text-foreground">
                <DropdownMenuItem asChild>
                  <Link to="/shop" className="hover:bg-secondary/50">All Products</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/collections" className="hover:bg-secondary/50">All Collections</Link>
                </DropdownMenuItem>
                {collections.length > 0 && <div className="my-1 h-px bg-border" />}
                {collections.map((collection) => (
                  <DropdownMenuItem key={collection.id} asChild>
                    <Link to={`/collections/${collection.handle}`} className="hover:bg-secondary/50">
                      {collection.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-base font-medium hover:bg-secondary/50 transition-colors px-4 py-2 rounded-lg bg-secondary/30 text-foreground"
                >
                  Admin
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-card/95 backdrop-blur text-foreground">
                {adminLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link to={link.href} className="hover:bg-secondary/50">{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md">
              <SearchBar />
            </div>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            {showSearch && (
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <SearchIcon className="h-5 w-5" />
              </Button>
            )}
            <ThemeToggle />
            <CartDrawer />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="text-foreground">
                  <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="outline" size="sm" asChild className="hidden md:flex">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {showSearch && isSearchOpen && (
          <div className="lg:hidden mt-4 animate-fade-in">
            <SearchBar />
          </div>
        )}
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t bg-background/95 backdrop-blur animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block px-4 py-3 text-base font-medium hover:bg-secondary/80 rounded-lg transition-colors text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="space-y-1">
              <div className="px-4 py-2 text-sm font-semibold text-foreground/70 bg-secondary/30 rounded-lg">
                Products Gallery
              </div>
              <Link to="/shop" className="block px-4 py-3 text-foreground hover:bg-secondary/80 rounded-lg" onClick={() => setIsMenuOpen(false)}>All Products</Link>
              <Link to="/collections" className="block px-4 py-3 text-foreground hover:bg-secondary/80 rounded-lg" onClick={() => setIsMenuOpen(false)}>All Collections</Link>
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.handle}`}
                  className="block px-4 py-3 text-foreground hover:bg-secondary/80 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {collection.title}
                </Link>
              ))}
            </div>
            <div className="space-y-1">
              <div className="px-4 py-2 text-sm font-semibold text-foreground/70 bg-secondary/30 rounded-lg">
                Admin
              </div>
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block px-4 py-3 text-foreground hover:bg-secondary/80 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            {!user && (
              <Button variant="outline" size="sm" asChild className="w-full mt-4">
                <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};