import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  GraduationCap, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle,
  BookOpen,
  Users,
  Award,
  ArrowLeft,
  ExternalLink,
  DollarSign,
  ChevronRight
} from "lucide-react";
import type { TrainingProvider, Course } from "@shared/schema";

const LIBERIA_COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

export default function TrainingProviders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<TrainingProvider | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<TrainingProvider | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    county: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    accreditationStatus: "pending"
  });

  const canManage = user?.role === "admin" || user?.role === "ministry";

  const { data: providers = [], isLoading } = useQuery<TrainingProvider[]>({
    queryKey: ["/api/training-providers"]
  });

  const { data: courses = [] } = useQuery<(Course & { providerName?: string })[]>({
    queryKey: ["/api/courses"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/training-providers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-providers"] });
      toast({ title: "Training provider created successfully" });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create training provider", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TrainingProvider> }) => {
      return apiRequest("PATCH", `/api/training-providers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-providers"] });
      toast({ title: "Training provider updated successfully" });
      setEditProvider(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update training provider", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/training-providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-providers"] });
      toast({ title: "Training provider deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete training provider", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      county: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      accreditationStatus: "pending"
    });
  };

  const handleEdit = (provider: TrainingProvider) => {
    setEditProvider(provider);
    setFormData({
      name: provider.name,
      county: provider.county || "",
      address: provider.address || "",
      phone: provider.phone || "",
      email: provider.email || "",
      website: provider.website || "",
      accreditationStatus: provider.accreditationStatus || "pending"
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (editProvider) {
      updateMutation.mutate({ id: editProvider.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "accredited":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Accredited</Badge>;
      case "suspended":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredProviders = providers.filter(p => {
    if (selectedTab === "all") return true;
    return p.accreditationStatus === selectedTab;
  });

  const providerCourseCount = (providerId: string) => {
    return courses.filter(c => c.providerId === providerId).length;
  };

  const getProviderCourses = (providerId: string) => {
    return courses.filter(c => c.providerId === providerId);
  };

  const isUserInProviderCounty = (provider: TrainingProvider) => {
    if (!user) return false;
    return user.county === provider.county;
  };

  const stats = {
    total: providers.length,
    accredited: providers.filter(p => p.accreditationStatus === "accredited").length,
    pending: providers.filter(p => p.accreditationStatus === "pending").length,
    suspended: providers.filter(p => p.accreditationStatus === "suspended").length,
    totalCourses: courses.length
  };

  const ProviderForm = () => (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Institution Name *</Label>
        <Input
          id="name"
          data-testid="input-provider-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter institution name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="county">County</Label>
          <Select value={formData.county} onValueChange={(v) => setFormData({ ...formData, county: v })}>
            <SelectTrigger data-testid="select-county">
              <SelectValue placeholder="Select county" />
            </SelectTrigger>
            <SelectContent>
              {LIBERIA_COUNTIES.map(county => (
                <SelectItem key={county} value={county}>{county}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="accreditationStatus">Accreditation Status</Label>
          <Select value={formData.accreditationStatus} onValueChange={(v) => setFormData({ ...formData, accreditationStatus: v })}>
            <SelectTrigger data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accredited">Accredited</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          data-testid="input-address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter full address"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            data-testid="input-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+231 xxx xxx xxxx"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            data-testid="input-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="contact@institution.edu.lr"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          data-testid="input-website"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://www.institution.edu.lr"
        />
      </div>
      <Button 
        data-testid="button-submit-provider"
        onClick={handleSubmit} 
        disabled={createMutation.isPending || updateMutation.isPending}
        className="w-full"
      >
        {editProvider ? "Update Provider" : "Create Provider"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (selectedProvider) {
    const providerCourses = getProviderCourses(selectedProvider.id);
    const isInCounty = isUserInProviderCounty(selectedProvider);

    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setSelectedProvider(null)}
              data-testid="button-back-providers"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Training Providers
            </Button>

            <Card className="mb-6 border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <GraduationCap className="w-8 h-8 text-primary" />
                      <CardTitle className="text-2xl">{selectedProvider.name}</CardTitle>
                      {getStatusBadge(selectedProvider.accreditationStatus)}
                    </div>
                    <CardDescription className="text-base">Training institution in Liberia</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {selectedProvider.county && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedProvider.county}</span>
                        {isInCounty && user && (
                          <Badge variant="default" className="bg-green-600 text-xs ml-2">Your County</Badge>
                        )}
                      </div>
                    )}
                    {selectedProvider.address && (
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{selectedProvider.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedProvider.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${selectedProvider.phone}`} className="text-primary hover:underline">{selectedProvider.phone}</a>
                      </div>
                    )}
                    {selectedProvider.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${selectedProvider.email}`} className="text-primary hover:underline">{selectedProvider.email}</a>
                      </div>
                    )}
                    {selectedProvider.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a href={selectedProvider.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          Visit Website <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {user && !isInCounty && selectedProvider.county && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      You are not in {selectedProvider.county} county. You can browse courses but enrollment is recommended for residents of the provider's county.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Courses Offered ({providerCourses.length})
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Browse and enroll in courses offered by this training provider
              </p>
            </div>

            {providerCourses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Courses Available</h3>
                  <p className="text-muted-foreground mt-1">
                    This training provider has not published any courses yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providerCourses.map(course => (
                  <Card key={course.id} className="flex flex-col hover:border-primary/30 transition-colors" data-testid={`card-course-${course.id}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      {course.description && (
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2 text-sm">
                        {course.durationWeeks && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {course.durationWeeks} weeks
                          </Badge>
                        )}
                        {course.cost !== null && course.cost !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {Number(course.cost) === 0 ? "Free" : `${course.currency || "LRD"} ${Number(course.cost).toLocaleString()}`}
                          </Badge>
                        )}
                      </div>
                      {course.skillsCovered && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Skills Covered:</p>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(course.skillsCovered) ? course.skillsCovered : [course.skillsCovered]).slice(0, 4).map((skill: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <div className="p-4 pt-0">
                      <Link href={`/courses/${course.id}`}>
                        <Button
                          className="w-full"
                          variant={user && isInCounty ? "default" : "outline"}
                          data-testid={`button-view-course-${course.id}`}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {user && isInCounty ? "Enroll & Start Learning" : "View Course Details"}
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <GraduationCap className="w-8 h-8 text-primary" />
                Training Providers
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage accredited training institutions across Liberia
              </p>
            </div>
        {canManage && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-provider">
                <Plus className="w-4 h-4 mr-2" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Training Provider</DialogTitle>
              </DialogHeader>
              <ProviderForm />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.accredited}</p>
                <p className="text-sm text-muted-foreground">Accredited</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="accredited" data-testid="tab-accredited">Accredited ({stats.accredited})</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="suspended" data-testid="tab-suspended">Suspended ({stats.suspended})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {filteredProviders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No training providers found</h3>
                <p className="text-muted-foreground mt-1">
                  {selectedTab === "all" 
                    ? "No training providers have been registered yet."
                    : `No ${selectedTab} training providers.`}
                </p>
                {canManage && selectedTab === "all" && (
                  <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Provider
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredProviders.map(provider => (
                <Card 
                  key={provider.id} 
                  data-testid={`card-provider-${provider.id}`}
                  className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
                  onClick={() => setSelectedProvider(provider)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{provider.name}</h3>
                          {getStatusBadge(provider.accreditationStatus)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {provider.county && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {provider.county}
                            </div>
                          )}
                          {provider.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="w-4 h-4" />
                              {provider.phone}
                            </div>
                          )}
                          {provider.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {provider.email}
                            </div>
                          )}
                          {provider.website && (
                            <div className="flex items-center gap-2 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                              <Globe className="w-4 h-4" />
                              <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                Website
                              </a>
                            </div>
                          )}
                        </div>
                        {provider.address && (
                          <p className="text-sm text-muted-foreground mt-2">{provider.address}</p>
                        )}
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="outline">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {providerCourseCount(provider.id)} Courses
                          </Badge>
                          <span className="text-sm text-primary flex items-center gap-1">
                            View Courses <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-start">
                        {canManage && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Dialog open={editProvider?.id === provider.id} onOpenChange={(open) => {
                              if (!open) {
                                setEditProvider(null);
                                resetForm();
                              }
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => handleEdit(provider)} data-testid={`button-edit-${provider.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Edit Training Provider</DialogTitle>
                                </DialogHeader>
                                <ProviderForm />
                              </DialogContent>
                            </Dialog>
                            {user?.role === "admin" && (
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this provider?")) {
                                    deleteMutation.mutate(provider.id);
                                  }
                                }}
                                data-testid={`button-delete-${provider.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
        </div>
      </main>
    </div>
  );
}
