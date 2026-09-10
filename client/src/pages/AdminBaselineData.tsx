import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, MapPin, Users, TrendingUp, Database, RefreshCw, ShieldAlert } from "lucide-react";
import { PageLoadingSpinner, LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";

interface BaselineData {
  id: string;
  category: string;
  key: string;
  value: number;
  label: string | null;
  description: string | null;
  year: number | null;
  source: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: "county_population", label: "County Population", icon: MapPin },
  { value: "national", label: "National Statistics", icon: Users },
  { value: "sector", label: "Sector Targets", icon: TrendingUp },
  { value: "other", label: "Other Data", icon: Database },
];

export default function AdminBaselineData() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("county_population");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BaselineData | null>(null);
  const [formData, setFormData] = useState({
    category: "county_population",
    key: "",
    value: "",
    label: "",
    description: "",
    year: new Date().getFullYear().toString(),
    source: "",
  });

  const { data: allData = [], isLoading, refetch } = useQuery<BaselineData[]>({
    queryKey: ["/api/baseline-data"],
  });

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You must be an administrator to access this page.</p>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const filteredData = allData.filter(item => item.category === activeTab);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/baseline-data", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Data entry created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-data"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      return await apiRequest("PUT", `/api/baseline-data/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Data entry updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-data"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/baseline-data/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Data entry deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/baseline-data"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      category: activeTab,
      key: "",
      value: "",
      label: "",
      description: "",
      year: new Date().getFullYear().toString(),
      source: "",
    });
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    resetForm();
    setFormData(prev => ({ ...prev, category: activeTab }));
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: BaselineData) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      key: item.key,
      value: item.value.toString(),
      label: item.label || "",
      description: item.description || "",
      year: item.year?.toString() || new Date().getFullYear().toString(),
      source: item.source || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat().format(value);
  };

  const getTotalByCategory = (category: string) => {
    return allData
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + item.value, 0);
  };

  return (
    <div className="min-h-screen" data-testid="admin-baseline-page">
      <Header />
      <main className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <BackButton />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">Baseline Data Management</h1>
              <p className="text-muted-foreground">
                Manage reference data for statistics calculations (populations, targets, etc.)
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleOpenCreate} data-testid="button-add-data">
                <Plus className="h-4 w-4 mr-2" />
                Add Data
              </Button>
            </div>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {categories.map(cat => (
          <Card key={cat.value} className={activeTab === cat.value ? "border-primary" : ""}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{cat.label}</CardTitle>
              <cat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cat.value === "county_population" 
                  ? formatNumber(getTotalByCategory(cat.value))
                  : allData.filter(d => d.category === cat.value).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {cat.value === "county_population" 
                  ? "Total population"
                  : `${allData.filter(d => d.category === cat.value).length} entries`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {categories.map(cat => (
            <TabsTrigger key={cat.value} value={cat.value} data-testid={`tab-${cat.value}`}>
              <cat.icon className="h-4 w-4 mr-2" />
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat.value} value={cat.value}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <cat.icon className="h-5 w-5" />
                  {cat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No data entries found for this category.</p>
                    <Button variant="outline" className="mt-4" onClick={handleOpenCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Entry
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map(item => (
                        <TableRow key={item.id} data-testid={`row-${item.key}`}>
                          <TableCell className="font-medium">{item.key}</TableCell>
                          <TableCell>{item.label || "-"}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(item.value)}
                          </TableCell>
                          <TableCell>
                            {item.year ? (
                              <Badge variant="outline">{item.year}</Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {item.source || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenEdit(item)}
                                data-testid={`button-edit-${item.key}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(item.id)}
                                data-testid={`button-delete-${item.key}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Data Entry" : "Add New Data Entry"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Key *</Label>
              <Input
                id="key"
                value={formData.key}
                onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                placeholder="e.g., Montserrado, total_population"
                required
                data-testid="input-key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="e.g., 1572000"
                required
                data-testid="input-value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Display Label</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="e.g., Montserrado County"
                data-testid="input-label"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Reference Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="2024"
                  data-testid="input-year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Data Source</Label>
                <Input
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                  placeholder="e.g., LISGIS Census"
                  data-testid="input-source"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional notes about this data"
                rows={2}
                data-testid="input-description"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
}
