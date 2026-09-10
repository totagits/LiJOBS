import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import ministryOfLaborLogo from "@/assets/images/ministry-of-labor-logo.png";
import { useToast } from "@/hooks/use-toast";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About LiJOBS", href: "/about" },
  { label: "Data Portal", href: "/data" },
  { label: "Reports", href: "/reports" },
  { label: "Resources", href: "/resources" },
  { label: "FAQs", href: "/resources" },
];

const dataLinks = [
  { label: "National Statistics", href: "/data" },
  { label: "County Data", href: "/data" },
  { label: "Sector Analysis", href: "/data" },
  { label: "Employment Trends", href: "/data" },
  { label: "Open Data API", href: "/resources" },
  { label: "Methodology", href: "/resources" },
];

const portalLinks = [
  { label: "Employer Portal", href: "/report-jobs" },
  { label: "County Office Portal", href: "/report-jobs" },
  { label: "Enumerator App", href: "/resources" },
  { label: "Bulk Upload", href: "/report-jobs" },
  { label: "Verification Status", href: "/report-jobs" },
  { label: "Support Center", href: "/contact" },
];

export function Footer() {
  const { toast } = useToast();

  const handleSubscribe = () => {
    toast({
      title: "Subscribed!",
      description: "Thank you for subscribing to our newsletter."
    });
  };

  return (
    <footer
      id="contact"
      className="bg-foreground text-background"
      data-testid="footer"
    >
      <div className="bg-primary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-primary-foreground mb-2">
                Stay Updated on Employment Data
              </h3>
              <p className="text-primary-foreground/80">
                Subscribe to receive the latest reports and employment statistics
              </p>
            </div>
            <div className="flex w-full md:w-auto flex-wrap gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60 min-w-[280px]"
                data-testid="input-newsletter"
              />
              <Button
                variant="secondary"
                className="gap-2 whitespace-nowrap"
                onClick={handleSubscribe}
                data-testid="button-subscribe"
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-4" data-testid="link-footer-logo">
                <div className="w-12 h-12 rounded-full bg-white overflow-hidden flex items-center justify-center">
                  <img
                    src={ministryOfLaborLogo}
                    alt="Ministry of Labor"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-bold">LiJOBS</h4>
                  <p className="text-sm text-white/70">Liberia Jobs Observatory System</p>
                </div>
              </Link>
              <p className="text-white/70 mb-6 max-w-sm">
                The official National Job Creation Data Platform for the Republic of Liberia. 
                Tracking, verifying, and reporting employment data across all sectors.
              </p>
              
              <div className="space-y-3">
                <a
                  href="mailto:info@ljobs.gov.lr"
                  className="flex items-center gap-3 text-white/70 transition-colors"
                  data-testid="link-email"
                >
                  <Mail className="w-5 h-5" />
                  info@ljobs.gov.lr
                </a>
                <a
                  href="tel:+231777000000"
                  className="flex items-center gap-3 text-white/70 transition-colors"
                  data-testid="link-phone"
                >
                  <Phone className="w-5 h-5" />
                  +231 777 000 000
                </a>
                <div className="flex items-start gap-3 text-white/70">
                  <MapPin className="w-5 h-5 mt-0.5" />
                  <span>
                    Ministry of Labor Building<br />
                    Capitol Hill, Monrovia<br />
                    Republic of Liberia
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/70 transition-colors"
                      data-testid={`link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Data Portal</h5>
              <ul className="space-y-2">
                {dataLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/70 transition-colors"
                      data-testid={`link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-4">Portal Access</h5>
              <ul className="space-y-2">
                {portalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-white/70 transition-colors"
                      data-testid={`link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-white/10" />

          <div className="flex flex-col md:flex-row items-center justify-between flex-wrap gap-4">
            <div className="flex items-center flex-wrap gap-6 text-sm text-white/60">
              <span>&copy; {new Date().getFullYear()} Ministry of Labor, Republic of Liberia</span>
              <Link href="/resources" className="transition-colors" data-testid="link-privacy-policy">
                Privacy Policy
              </Link>
              <Link href="/resources" className="transition-colors" data-testid="link-terms-of-use">
                Terms of Use
              </Link>
            </div>

            <div className="flex items-center flex-wrap gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="text-white/60"
                data-testid="social-facebook"
              >
                <Facebook className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white/60"
                data-testid="social-twitter"
              >
                <Twitter className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white/60"
                data-testid="social-linkedin"
              >
                <Linkedin className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white/60"
                data-testid="social-youtube"
              >
                <Youtube className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
