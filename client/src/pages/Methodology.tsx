import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  FileText,
  ShieldCheck,
  Info,
} from "lucide-react";
import { SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";

export default function Methodology() {
  const { data, isLoading } = useQuery<any>({ queryKey: ["/api/statistical-rigor/methodology"] });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] pt-24">
          <SectionLoadingSpinner />
        </div>
      </div>
    );
  }

  const methodologies = data?.methodologies || [];
  const categories = [...new Set(methodologies.map((m: any) => m.category))] as string[];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
            <BookOpen className="h-8 w-8 text-primary" />
            Methodology Documentation
          </h1>
          <p className="text-muted-foreground mt-2">
            How LiJOBS calculates and validates every statistic — transparent, reproducible, and open to scrutiny.
          </p>
        </div>

        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              Every statistic published through LiJOBS includes documentation on how it was calculated.
              This page provides complete methodology notes for all statistical outputs, making the data transparent and reproducible for researchers, journalists, international organizations, and the public.
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {categories.map(category => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">{category}</h3>
              {methodologies.filter((m: any) => m.category === category).map((method: any) => (
                <Card key={method.id} data-testid={`card-methodology-${method.id}`}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {method.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h5 className="text-sm font-semibold text-muted-foreground mb-1">Description</h5>
                      <p className="text-sm">{method.description}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-muted-foreground mb-1">Formula / Calculation</h5>
                      <div className="text-sm font-mono bg-muted p-2 rounded text-xs break-all">{method.formula}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <h5 className="text-sm font-semibold text-muted-foreground mb-1">Data Source</h5>
                        <p className="text-sm">{method.dataSource}</p>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-muted-foreground mb-1">Limitations</h5>
                        <p className="text-sm text-orange-700 dark:text-orange-400">{method.limitations}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">Last updated: {method.lastUpdated}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}