import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="flex mb-4 gap-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h1 className="text-2xl font-bold">404 Page Not Found</h1>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                The page you're looking for doesn't exist.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
