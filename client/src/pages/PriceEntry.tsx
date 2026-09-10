import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart,
  Save,
  RefreshCw,
  CheckCircle,
  MapPin,
  Calendar,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { BASKET_ITEMS } from "@shared/schema";

const COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

export default function PriceEntry() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [county, setCounty] = useState("");
  const [district, setDistrict] = useState("");
  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const { data: existingEntries = [], isLoading: entriesLoading } = useQuery<any[]>({
    queryKey: [county ? `/api/price-entries?county=${encodeURIComponent(county)}&month=${month}&year=${year}` : "/api/price-entries"],
    enabled: !!county,
  });

  const bulkMutation = useMutation({
    mutationFn: async (entries: any[]) => {
      const res = await apiRequest("POST", "/api/price-entries/bulk", { entries });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Prices Saved",
        description: `${data.count} price entries recorded for ${county}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/price-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/economic-indicators"] });
      setPrices({});
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save price entries",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user || !["admin", "ministry", "enumerator", "director"].includes(user.role)) {
    setLocation("/login");
    return null;
  }

  const handleSubmit = () => {
    if (!county) {
      toast({ title: "Select a county", variant: "destructive" });
      return;
    }

    const entries = BASKET_ITEMS
      .filter(item => prices[item.code] && parseFloat(prices[item.code]) > 0)
      .map(item => ({
        county,
        district: district || undefined,
        itemCode: item.code,
        itemName: item.name,
        price: parseFloat(prices[item.code]),
        currency: "LRD",
        unit: item.unit,
        category: item.category,
        month: parseInt(month),
        year: parseInt(year),
        notes: notes || undefined,
      }));

    if (entries.length === 0) {
      toast({ title: "Enter at least one price", variant: "destructive" });
      return;
    }

    bulkMutation.mutate(entries);
  };

  const filledCount = Object.values(prices).filter(v => v && parseFloat(v) > 0).length;
  const existingForCountyMonth = existingEntries;

  const groupedItems = BASKET_ITEMS.reduce<Record<string, typeof BASKET_ITEMS[number][]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    (acc[item.category] as any[]).push(item);
    return acc;
  }, {} as any);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[hsl(355,70%,95%)] via-white to-[hsl(215,60%,95%)]">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 pb-8">
        <BackButton />

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-price-entry-title">
              Monthly Price Data Entry
            </h1>
          </div>
          <p className="text-muted-foreground">
            Enter current prices for the standard basket of goods in your assigned county
          </p>
        </div>

        {/* Location & Period Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" /> Location & Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>County *</Label>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger data-testid="select-county">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>District (Optional)</Label>
                <Input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g., Monrovia"
                  data-testid="input-district"
                />
              </div>
              <div>
                <Label>Month *</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger data-testid="select-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Year *</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger data-testid="select-year">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {existingForCountyMonth.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>{existingForCountyMonth.length}</strong> price entries already exist for {county} in {MONTHS[parseInt(month) - 1]} {year}.
                  New entries will be added alongside existing data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Entry Grid */}
        {county && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Basket of Goods Prices (LRD)</span>
                <Badge variant="outline">{filledCount}/{BASKET_ITEMS.length} items</Badge>
              </CardTitle>
              <CardDescription>
                Enter the current market price for each item. Leave blank for items not available.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 border-b pb-1">
                    {category}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {items.map((item) => (
                      <div key={item.code} className="flex items-center gap-3">
                        <div className="flex-1">
                          <Label className="text-sm" htmlFor={`price-${item.code}`}>
                            {item.name}
                            <span className="text-xs text-muted-foreground ml-1">({item.unit})</span>
                          </Label>
                        </div>
                        <div className="w-32 relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">L$</span>
                          <Input
                            id={`price-${item.code}`}
                            type="number"
                            min="0"
                            step="0.01"
                            className="pl-8"
                            value={prices[item.code] || ""}
                            onChange={(e) => setPrices(prev => ({ ...prev, [item.code]: e.target.value }))}
                            placeholder="0.00"
                            data-testid={`input-price-${item.code.toLowerCase()}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-6">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any observations about market conditions, shortages, or unusual price changes..."
                  className="mt-1"
                  data-testid="input-notes"
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {filledCount} items priced out of {BASKET_ITEMS.length}
                </p>
                <Button
                  onClick={handleSubmit}
                  disabled={bulkMutation.isPending || filledCount === 0}
                  data-testid="button-submit-prices"
                >
                  {bulkMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save {filledCount} Price{filledCount !== 1 ? "s" : ""}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Entries for this county */}
        {county && existingForCountyMonth.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Existing Entries — {county}, {MONTHS[parseInt(month) - 1]} {year}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Price (LRD)</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {existingForCountyMonth.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.itemName}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{entry.category}</Badge></TableCell>
                        <TableCell className="text-right font-semibold">L${entry.price.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
