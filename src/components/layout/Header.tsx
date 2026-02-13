import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Phone, Mail, ChevronDown, LogIn, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();

  const dashboardPath = role === "admin" ? "/admin" : role === "nurse" ? "/nurse" : role === "doctor" ? "/doctor" : role === "patient" ? "/patient" : null;

  const isActive = (path: string) => location.pathname === path;

  const servicesDropdown = [
    { href: "/services#infusion", label: "IV Infusion Therapy" },
    { href: "/services#wound", label: "Advanced Wound Care" },
    { href: "/services#stoma", label: "Stoma Care" },
  ];

  const trainingDropdown = [
    { href: "/iv-training", label: "IV Line Insertion Training" },
    { href: "/anaphylaxis-training", label: "Anaphylaxis Training" },
  ];

  return (
    <header className="w-full">
      {/* Main navigation bar */}
      <nav className="bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="The Johannesburg Infusion Centre" className="h-16 w-auto" />
            </Link>

            {/* Contact info - desktop */}
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <a 
                href="mailto:gayle@infusioncentre.co.za" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>gayle@infusioncentre.co.za</span>
              </a>
              <a 
                href="https://wa.me/27722487355" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>072 248 7355</span>
              </a>
              <a 
                href="tel:+27722487355" 
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>072 248 7355</span>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8 py-3 border-t border-border">
            <Link
              to="/"
              className={`font-body text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-foreground"
              }`}
            >
              Home
            </Link>

            {/* Services dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setOpenDropdown("services")}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                to="/services"
                className={`font-body text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                  location.pathname.includes("/services") ? "text-primary" : "text-foreground"
                }`}
              >
                Services
                <ChevronDown className="h-4 w-4" />
              </Link>
              {openDropdown === "services" && (
                <div className="absolute top-full left-0 bg-background border border-border shadow-lg min-w-[220px] z-50">
                  {servicesDropdown.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="block px-4 py-3 text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Training & Education dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setOpenDropdown("training")}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                className={`font-body text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                  location.pathname.includes("training") ? "text-primary" : "text-foreground"
                }`}
              >
                Training & Education
                <ChevronDown className="h-4 w-4" />
              </button>
              {openDropdown === "training" && (
                <div className="absolute top-full left-0 bg-background border border-border shadow-lg min-w-[220px] z-50">
                  {trainingDropdown.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="block px-4 py-3 text-sm text-foreground hover:bg-secondary hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              to="/doctors"
              className={`font-body text-sm font-medium transition-colors hover:text-primary ${
                isActive("/doctors") ? "text-primary" : "text-foreground"
              }`}
            >
              Information for Doctors
            </Link>

            <Link
              to="/contact"
              className={`font-body text-sm font-medium transition-colors hover:text-primary ${
                isActive("/contact") ? "text-primary" : "text-foreground"
              }`}
            >
              Contact Us
            </Link>

            {/* Auth buttons */}
            <div className="ml-auto flex items-center gap-2">
              {user ? (
                <>
                  {dashboardPath && (
                    <Button variant="outline" size="sm" onClick={() => navigate(dashboardPath)}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => navigate("/login")}>
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border">
            <div className="container mx-auto px-4 py-4 space-y-4">
              {/* Mobile contact info */}
              <div className="flex flex-col gap-2 pb-4 border-b border-border text-sm">
                <a href="mailto:gayle@infusioncentre.co.za" className="flex items-center gap-2 text-primary">
                  <Mail className="h-4 w-4" />
                  gayle@infusioncentre.co.za
                </a>
                <a href="tel:+27722487355" className="flex items-center gap-2 text-primary">
                  <Phone className="h-4 w-4" />
                  072 248 7355
                </a>
              </div>

              <Link
                to="/"
                className="block py-2 text-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/services"
                className="block py-2 text-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Services
              </Link>
              <Link
                to="/iv-training"
                className="block py-2 text-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                IV Line Insertion Training
              </Link>
              <Link
                to="/anaphylaxis-training"
                className="block py-2 text-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Anaphylaxis Training
              </Link>
              <Link
                to="/doctors"
                className="block py-2 text-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Information for Doctors
              </Link>
              <Link
                to="/contact"
                className="block py-2 text-foreground hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact Us
              </Link>

              {/* Mobile auth */}
              <div className="pt-4 border-t border-border">
                {user ? (
                  <div className="flex flex-col gap-2">
                    {dashboardPath && (
                      <Button variant="outline" className="w-full justify-start" onClick={() => { navigate(dashboardPath); setIsMenuOpen(false); }}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full justify-start" onClick={() => { signOut(); setIsMenuOpen(false); }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => { navigate("/login"); setIsMenuOpen(false); }}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
