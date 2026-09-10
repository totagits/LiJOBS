import { Badge } from "@/components/ui/badge";
import { Shield, Globe, Lock, Award, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const trustItems = [
  { icon: Shield, label: "Government Certified" },
  { icon: Globe, label: "ISCO-08 Compliant" },
  { icon: Lock, label: "Privacy by Design" },
  { icon: Award, label: "ISIC Rev.4 Standard" },
  { icon: CheckCircle, label: "Multi-Layer Verification" },
];

export function TrustBar() {
  return (
    <section className="py-10 bg-primary/5 border-y border-primary/10" data-testid="trust-bar-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-6"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Trusted by the Government of Liberia
          </p>
          <div className="flex items-center justify-center flex-wrap gap-4">
            {trustItems.map((item) => {
              const IconComp = item.icon;
              return (
                <Badge
                  key={item.label}
                  variant="outline"
                  className="gap-2 px-4 py-2 text-sm font-medium no-default-active-elevate"
                  data-testid={`trust-badge-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <IconComp className="w-4 h-4 text-primary" />
                  {item.label}
                </Badge>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
