import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LogIn, UserPlus, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";
import sealOfLiberia from "@/assets/images/seal-of-liberia.png";
import ministryOfLaborLogo from "@/assets/images/ministry-of-labor-logo.png";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Data Portal",
    href: "/data",
    children: [
      { label: "National Statistics", href: "/data/national" },
      { label: "County Data", href: "/data/counties" },
      { label: "Sector Analysis", href: "/data/sectors" },
      { label: "Job Postings", href: "/data/postings" },
      { label: "Job Seekers", href: "/data/seekers" },
      { label: "Jobs Observatory", href: "/observatory" },
      { label: "Verification Dashboard", href: "/verification" },
      { label: "Director Dashboard", href: "/director" },
      { label: "Economic Data Hub", href: "/data-hub" },
      { label: "Labour Indicators", href: "/labour-indicators" },
      { label: "Economic Indicators", href: "/economic-indicators" },
      { label: "Occupational Economics", href: "/occupational-economics" },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Find Jobs", href: "/jobs" },
      { label: "Bids & Tenders", href: "/tenders" },
      { label: "Job Matching", href: "/job-matching" },
      { label: "Training Providers", href: "/training-providers" },
      { label: "Course Catalog", href: "/courses" },
      { label: "Employment Centres", href: "/pec-management" },
      { label: "Bulk Upload", href: "/bulk-upload" },
      { label: "Reports", href: "/reports" },
      { label: "User Guide", href: "/training" },
      { label: "Knowledge Base", href: "/knowledge-base" },
      { label: "Workplace Safety", href: "/workplace-safety" },
      { label: "Grievance System", href: "/grievances" },
      { label: "Methodology", href: "/methodology" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHomePage = location === "/";
  const showTransparent = isHomePage && !isScrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        showTransparent
          ? "bg-transparent"
          : "bg-background/95 backdrop-blur-md shadow-md"
      }`}
      data-testid="header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-20">
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-full overflow-hidden bg-white transition-all duration-300"
              data-testid="logo-ministry"
              title="Ministry of Labor"
            >
              <img
                src={ministryOfLaborLogo}
                alt="Ministry of Labor"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <span className={`hidden sm:block whitespace-nowrap text-sm font-bold transition-colors duration-300 ${showTransparent ? "text-white" : "text-foreground"}`}>Ministry of Labor </span>
          </Link>

          <div className="flex-1 flex items-center justify-end gap-2">
            <nav className="hidden lg:flex items-center gap-1" data-testid="nav-desktop">
              {navItems.map((item) =>
                item.children ? (
                  <DropdownMenu key={item.label}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`gap-1 ${showTransparent ? "text-white" : ""}`}
                        data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        {item.label}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {item.children.map((child) => (
                        <DropdownMenuItem
                          key={child.label}
                          asChild
                          data-testid={`nav-${child.label.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          <Link href={child.href} className="w-full cursor-pointer">
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    key={item.label}
                    variant="ghost"
                    size="sm"
                    asChild
                    className={showTransparent ? "text-white" : ""}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                )
              )}
            </nav>

            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={showTransparent ? "outline" : "default"}
                    size="sm"
                    className={`gap-2 ${showTransparent ? "text-white border-white/30 bg-white/10 hover:bg-white/20" : ""}`}
                    data-testid="button-get-started"
                  >
                    <User className="w-4 h-4" />
                    Get Started
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild data-testid="dropdown-login">
                    <Link href="/login" className="w-full cursor-pointer flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild data-testid="dropdown-register">
                    <Link href="/register" className="w-full cursor-pointer flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Create Account
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div
              className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-white transition-all duration-300 flex-shrink-0"
              data-testid="logo-seal"
              title="Seal of Liberia"
            >
              <img
                src={sealOfLiberia}
                alt="Seal of Liberia"
                className="w-full h-full object-cover"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className={`lg:hidden ${showTransparent ? "text-white" : ""}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            className="lg:hidden py-4 border-t border-white/10 animate-fade-in"
            data-testid="nav-mobile"
          >
            <nav className="flex flex-col gap-2">
              {navItems.map((item) =>
                item.children ? (
                  <div key={item.label} className="space-y-1">
                    <p
                      className={`px-4 py-2 font-medium ${
                        showTransparent ? "text-white" : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </p>
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className={`block px-8 py-2 transition-colors ${
                          showTransparent
                            ? "text-white/80"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`block px-4 py-2 transition-colors ${
                      showTransparent
                        ? "text-white"
                        : "text-foreground"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
              <div className="flex flex-col gap-2 px-4 pt-4 border-t border-white/10">
                <p className={`text-sm font-medium ${showTransparent ? "text-white/70" : "text-muted-foreground"}`}>
                  Get Started
                </p>
                <Button variant="outline" size="sm" className="justify-start gap-2" asChild>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                </Button>
                <Button size="sm" className="justify-start gap-2" asChild>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
