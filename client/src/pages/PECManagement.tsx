import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Users,
  Briefcase,
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  Clock,
  Calendar,
  Send,
  ChevronRight,
  GraduationCap
} from "lucide-react";
import type { PublicEmploymentCentre } from "@shared/schema";

const LIBERIA_COUNTIES = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const PEC_SERVICES = [
  "Job Search Assistance",
  "Resume/CV Writing Support",
  "Career Counseling",
  "Skills Assessment",
  "Employer Referrals",
  "Training Registration",
  "Labour Law Information",
  "Grievance Filing Support"
];

export default function PECManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editPEC, setEditPEC] = useState<PublicEmploymentCentre | null>(null);
  const [selectedPEC, setSelectedPEC] = useState<PublicEmploymentCentre | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactName, setContactName] = useState(user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [formData, setFormData] = useState({
    name: "",
    county: "",
    district: "",
    address: "",
    phone: "",
    email: "",
    isActive: true
  });

  const canManage = user?.role === "admin" || user?.role === "ministry";

  const { data: pecs = [], isLoading } = useQuery<PublicEmploymentCentre[]>({
    queryKey: ["/api/pecs"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/pecs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pecs"] });
      toast({ title: "Employment centre created successfully" });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create employment centre", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PublicEmploymentCentre> }) => {
      return apiRequest("PATCH", `/api/pecs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pecs"] });
      toast({ title: "Employment centre updated successfully" });
      setEditPEC(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update employment centre", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/pecs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pecs"] });
      toast({ title: "Employment centre deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete employment centre", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      county: "",
      district: "",
      address: "",
      phone: "",
      email: "",
      isActive: true
    });
  };

  const handleEdit = (pec: PublicEmploymentCentre) => {
    setEditPEC(pec);
    setFormData({
      name: pec.name,
      county: pec.county,
      district: pec.district || "",
      address: pec.address || "",
      phone: pec.phone || "",
      email: pec.email || "",
      isActive: pec.isActive
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    if (!formData.county) {
      toast({ title: "County is required", variant: "destructive" });
      return;
    }
    if (editPEC) {
      updateMutation.mutate({ id: editPEC.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim() || !contactName.trim() || !contactEmail.trim()) {
      toast({ title: "Please fill in all contact fields", variant: "destructive" });
      return;
    }
    if (selectedPEC?.email) {
      window.location.href = `mailto:${selectedPEC.email}?subject=Inquiry from ${contactName}&body=${encodeURIComponent(contactMessage)}%0A%0AFrom: ${contactName}%0AEmail: ${contactEmail}`;
    }
    toast({ title: "Message prepared", description: "Your email client will open with the message. If it doesn't, please email the centre directly." });
    setContactMessage("");
  };

  const filteredPECs = pecs.filter(pec => {
    if (selectedCounty === "all") return true;
    return pec.county === selectedCounty;
  });

  const stats = {
    total: pecs.length,
    active: pecs.filter(p => p.isActive).length,
    byCounty: LIBERIA_COUNTIES.reduce((acc, county) => {
      acc[county] = pecs.filter(p => p.county === county).length;
      return acc;
    }, {} as Record<string, number>)
  };

  const PECForm = () => (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Centre Name *</Label>
        <Input
          id="name"
          data-testid="input-pec-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter employment centre name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="county">County *</Label>
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
          <Label htmlFor="district">District</Label>
          <Input
            id="district"
            data-testid="input-district"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            placeholder="Enter district"
          />
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
            placeholder="contact@pec.gov.lr"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="isActive" 
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-4 h-4"
          data-testid="checkbox-active"
        />
        <Label htmlFor="isActive">Active</Label>
      </div>
      <Button 
        data-testid="button-submit-pec"
        onClick={handleSubmit} 
        disabled={createMutation.isPending || updateMutation.isPending}
        className="w-full"
      >
        {editPEC ? "Update Employment Centre" : "Create Employment Centre"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (selectedPEC) {
    const isUserInCounty = user?.county === selectedPEC.county;

    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => setSelectedPEC(null)}
              data-testid="button-back-pecs"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Employment Centres
            </Button>

            <Card className="mb-6 border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="w-8 h-8 text-primary" />
                      <CardTitle className="text-2xl">{selectedPEC.name}</CardTitle>
                      {selectedPEC.isActive ? (
                        <Badge variant="default" className="bg-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>
                      ) : (
                        <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>
                      )}
                    </div>
                    <CardDescription className="text-base">Public Employment Centre - {selectedPEC.county} County</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedPEC.county}{selectedPEC.district ? `, ${selectedPEC.district}` : ""}</span>
                      {isUserInCounty && user && (
                        <Badge variant="default" className="bg-green-600 text-xs ml-2">Your County</Badge>
                      )}
                    </div>
                    {selectedPEC.address && (
                      <div className="flex items-start gap-2">
                        <Building className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{selectedPEC.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedPEC.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${selectedPEC.phone}`} data-testid="link-phone" className="text-primary">{selectedPEC.phone}</a>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`tel:${selectedPEC.phone}`} data-testid="button-call">Call Now</a>
                        </Button>
                      </div>
                    )}
                    {selectedPEC.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${selectedPEC.email}`} data-testid="link-email" className="text-primary">{selectedPEC.email}</a>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`mailto:${selectedPEC.email}`} data-testid="button-email">Email</a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Services Available
                  </CardTitle>
                  <CardDescription>Services offered at this employment centre</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    {PEC_SERVICES.map((service, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Upcoming Trainings & Events
                  </CardTitle>
                  <CardDescription>Scheduled activities at this centre</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">Job Readiness Workshop</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Resume writing, interview skills, and workplace etiquette training for job seekers.</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Weekly - Mondays 9AM</span>
                        <Badge variant="outline" className="text-xs">Free</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">Employer Registration Drive</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Help local businesses register with LiJOBS and post vacancies.</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Monthly - First Friday</span>
                        <Badge variant="outline" className="text-xs">Free</Badge>
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">Career Counseling Session</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">One-on-one career guidance and labour market information for individuals.</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Walk-in available</span>
                        <Badge variant="outline" className="text-xs">Free</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Contact This Centre
                </CardTitle>
                <CardDescription>Send an inquiry or request to this employment centre</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 max-w-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contactName">Your Name</Label>
                      <Input
                        id="contactName"
                        data-testid="input-contact-name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Full name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contactEmail">Your Email</Label>
                      <Input
                        id="contactEmail"
                        data-testid="input-contact-email"
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactMessage">Message</Label>
                    <Textarea
                      id="contactMessage"
                      data-testid="textarea-contact-message"
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Describe your inquiry, question, or request for the employment centre..."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!contactMessage.trim() || !contactName.trim() || !contactEmail.trim()}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This will open your email client to send the message. You can also contact the centre directly by phone or email using the details above.
                  </p>
                </div>
              </CardContent>
            </Card>
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
                <Building className="w-8 h-8 text-primary" />
                Public Employment Centres
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage government employment centres across Liberia's 15 counties
              </p>
            </div>
        {canManage && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-pec">
                <Plus className="w-4 h-4 mr-2" />
                Add Centre
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Employment Centre</DialogTitle>
              </DialogHeader>
              <PECForm />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Centres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Centres</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">15</p>
                <p className="text-sm text-muted-foreground">Counties Covered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{Object.values(stats.byCounty).filter(v => v > 0).length}</p>
                <p className="text-sm text-muted-foreground">Counties with PECs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Label className="font-medium">Filter by County:</Label>
            <Select value={selectedCounty} onValueChange={setSelectedCounty}>
              <SelectTrigger className="w-64" data-testid="filter-county">
                <SelectValue placeholder="All Counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties ({pecs.length})</SelectItem>
                {LIBERIA_COUNTIES.map(county => (
                  <SelectItem key={county} value={county}>
                    {county} ({stats.byCounty[county] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredPECs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No employment centres found</h3>
            <p className="text-muted-foreground mt-1">
              {pecs.length === 0 
                ? "No public employment centres have been registered yet."
                : `No centres in ${selectedCounty}.`}
            </p>
            {canManage && pecs.length === 0 && (
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Centre
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPECs.map(pec => (
            <Card 
              key={pec.id} 
              data-testid={`card-pec-${pec.id}`}
              className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
              onClick={() => setSelectedPEC(pec)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {pec.name}
                      {pec.isActive ? (
                        <Badge variant="default" className="bg-green-600 text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>
                      )}
                    </CardTitle>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Dialog open={editPEC?.id === pec.id} onOpenChange={(open) => {
                        if (!open) {
                          setEditPEC(null);
                          resetForm();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(pec)} data-testid={`button-edit-${pec.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Edit Employment Centre</DialogTitle>
                          </DialogHeader>
                          <PECForm />
                        </DialogContent>
                      </Dialog>
                      {user?.role === "admin" && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this employment centre?")) {
                              deleteMutation.mutate(pec.id);
                            }
                          }}
                          data-testid={`button-delete-${pec.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{pec.county}{pec.district ? `, ${pec.district}` : ""}</span>
                  </div>
                  {pec.address && (
                    <p className="text-muted-foreground pl-6">{pec.address}</p>
                  )}
                  {pec.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{pec.phone}</span>
                    </div>
                  )}
                  {pec.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{pec.email}</span>
                    </div>
                  )}
                  <div className="pt-2">
                    <span className="text-sm text-primary flex items-center gap-1">
                      View Details & Contact <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">County Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {LIBERIA_COUNTIES.map(county => (
              <div 
                key={county} 
                className={`p-3 rounded-lg border text-center cursor-pointer hover:shadow-sm transition-all ${
                  stats.byCounty[county] > 0 
                    ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 hover:border-green-400" 
                    : "bg-muted/50 hover:bg-muted"
                }`}
                onClick={() => {
                  setSelectedCounty(county);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <p className="font-medium text-sm">{county}</p>
                <p className={`text-xl font-bold ${stats.byCounty[county] > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                  {stats.byCounty[county] || 0}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}
