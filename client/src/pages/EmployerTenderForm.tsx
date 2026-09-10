import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Gavel,
  MapPin,
  DollarSign,
  Calendar,
  Save,
  Loader2,
  FileText,
  Phone,
  Mail,
  X,
  ChevronDown,
} from "lucide-react";
import type { Tender } from "@shared/schema";

const LIBERIA_COUNTIES = [
  "Montserrado", "Nimba", "Bong", "Lofa", "Grand Bassa", "Margibi",
  "Grand Cape Mount", "Bomi", "Grand Gedeh", "Sinoe", "River Cess",
  "Gbarpolu", "Maryland", "Grand Kru", "River Gee"
];

const TENDER_TYPES = [
  { value: "procurement", label: "Procurement" },
  { value: "service", label: "Service" },
];

const CATEGORIES = [
  { value: "construction", label: "Construction" },
  { value: "consulting", label: "Consulting" },
  { value: "supply", label: "Supply" },
  { value: "IT", label: "IT" },
  { value: "transportation", label: "Transportation" },
  { value: "catering", label: "Catering" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

const SECTORS = [
  { value: "public", label: "Public Sector" },
  { value: "private", label: "Private Sector" },
  { value: "ngo", label: "NGO" },
];

const tenderFormSchema = z.object({
  type: z.string().min(1, "Type is required"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  sector: z.string().optional(),
  county: z.string().optional(),
  district: z.string().optional(),
  budgetMin: z.string().optional(),
  budgetMax: z.string().optional(),
  currency: z.string().default("LRD"),
  deadline: z.string().min(1, "Deadline is required"),
  requirements: z.string().optional(),
  deliverables: z.string().optional(),
  eligibility: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
});

type TenderFormData = z.infer<typeof tenderFormSchema>;

interface Employer {
  id: string;
  legalName: string;
  sector: string;
  county: string;
  userId: string;
}

export default function EmployerTenderForm() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/employer/tenders/:id/edit");
  const isEditing = !!match;
  const tenderId = params?.id;
  const { toast } = useToast();

  const { data: employer } = useQuery<Employer>({
    queryKey: ["/api/employers/me"],
    enabled: !!user && user.role === "employer",
  });

  const { data: existingTender } = useQuery<Tender>({
    queryKey: [`/api/tenders/${tenderId}`],
    enabled: isEditing && !!tenderId,
  });

  const form = useForm<TenderFormData>({
    resolver: zodResolver(tenderFormSchema),
    defaultValues: {
      type: "procurement",
      title: "",
      description: "",
      category: "",
      sector: "",
      county: "",
      district: "",
      budgetMin: "",
      budgetMax: "",
      currency: "LRD",
      deadline: "",
      requirements: "",
      deliverables: "",
      eligibility: "",
      contactEmail: "",
      contactPhone: "",
    },
  });

  useEffect(() => {
    if (existingTender && isEditing) {
      form.reset({
        type: existingTender.type || "procurement",
        title: existingTender.title || "",
        description: existingTender.description || "",
        category: existingTender.category || "",
        sector: existingTender.sector || "",
        county: existingTender.county || "",
        district: existingTender.district || "",
        budgetMin: existingTender.budgetMin?.toString() || "",
        budgetMax: existingTender.budgetMax?.toString() || "",
        currency: existingTender.currency || "LRD",
        deadline: existingTender.deadline || "",
        requirements: existingTender.requirements || "",
        deliverables: existingTender.deliverables || "",
        eligibility: existingTender.eligibility || "",
        contactEmail: existingTender.contactEmail || "",
        contactPhone: existingTender.contactPhone || "",
      });
    }
  }, [existingTender, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: async (data: TenderFormData) => {
      const payload = {
        ...data,
        budgetMin: data.budgetMin ? parseInt(data.budgetMin) : null,
        budgetMax: data.budgetMax ? parseInt(data.budgetMax) : null,
        employerId: employer?.id,
      };
      return apiRequest("POST", "/api/tenders", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({
        title: "Tender Posted",
        description: "Your tender has been published successfully.",
      });
      setLocation("/employer/tenders");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post tender",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TenderFormData) => {
      const payload = {
        ...data,
        budgetMin: data.budgetMin ? parseInt(data.budgetMin) : null,
        budgetMax: data.budgetMax ? parseInt(data.budgetMax) : null,
      };
      return apiRequest("PATCH", `/api/tenders/${tenderId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      toast({
        title: "Tender Updated",
        description: "Your tender has been updated successfully.",
      });
      setLocation("/employer/tenders");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update tender",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TenderFormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!isAuthenticated || user?.role !== "employer") {
    setLocation("/login");
    return null;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen" data-testid="employer-tender-form-page">
      <Header />
      <main className="pt-24 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              {isEditing ? "Edit Tender" : "Post New Tender"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? "Update your tender listing details" : "Create a new tender to receive bids"}
            </p>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    Tender Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TENDER_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Supply of Office Equipment" {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the tender requirements, scope, and objectives..."
                            className="min-h-32"
                            {...field}
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-sector">
                              <SelectValue placeholder="Select sector" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SECTORS.map((sector) => (
                              <SelectItem key={sector.value} value={sector.value}>
                                {sector.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="county"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Counties / Locations</FormLabel>
                        <p className="text-sm text-muted-foreground mb-2">Select one or more counties where this tender applies</p>
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {field.value.split(", ").filter(Boolean).map((c: string) => (
                              <Badge key={c} variant="secondary" className="gap-1">
                                <MapPin className="w-3 h-3" />
                                {c}
                                <button
                                  type="button"
                                  data-testid={`button-remove-county-${c.replace(/\s+/g, "-").toLowerCase()}`}
                                  onClick={() => {
                                    const counties = field.value?.split(", ").filter((x: string) => x !== c) || [];
                                    field.onChange(counties.join(", "));
                                  }}
                                  className="ml-1 rounded-full"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border rounded-md p-3 max-h-48 overflow-y-auto" data-testid="county-selector">
                          {LIBERIA_COUNTIES.map((county) => {
                            const selectedCounties = field.value?.split(", ").filter(Boolean) || [];
                            const isSelected = selectedCounties.includes(county);
                            return (
                              <div key={county} className="flex items-center gap-2">
                                <Checkbox
                                  id={`county-${county}`}
                                  data-testid={`checkbox-county-${county.replace(/\s+/g, "-").toLowerCase()}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    let counties = field.value?.split(", ").filter(Boolean) || [];
                                    if (checked) {
                                      counties.push(county);
                                    } else {
                                      counties = counties.filter((c: string) => c !== county);
                                    }
                                    field.onChange(counties.join(", "));
                                  }}
                                />
                                <label htmlFor={`county-${county}`} className="text-sm cursor-pointer">{county}</label>
                              </div>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Greater Monrovia, Buchanan" {...field} data-testid="input-district" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Budget & Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-currency">
                                <SelectValue placeholder="Currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LRD">LRD (Liberian Dollar)</SelectItem>
                              <SelectItem value="USD">USD (US Dollar)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Min</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} data-testid="input-budget-min" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budgetMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Max</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} data-testid="input-budget-max" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Deadline *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-deadline" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requirements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requirements</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder={"1. Must be a registered business entity in Liberia with valid business registration certificate\n2. Minimum 5 years of experience in similar projects within West Africa\n3. Proof of financial capacity (audited financial statements for the last 3 years)\n4. Valid tax clearance certificate from the Liberia Revenue Authority (LRA)\n5. Demonstrated technical expertise with qualified personnel (CVs of key staff required)\n6. Evidence of completed similar contracts with reference letters from previous clients\n7. Must comply with all applicable Liberian labor laws and safety standards"}
                            {...field}
                            data-testid="input-requirements"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deliverables"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deliverables</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder={"1. Detailed project work plan and implementation timeline\n2. Inception report within 14 days of contract signing\n3. Monthly progress reports with photographic documentation\n4. Final completion report with all technical specifications and as-built drawings\n5. Training and capacity building for local staff (where applicable)\n6. All project documentation, manuals, and handover materials\n7. Warranty and maintenance plan for a minimum of 12 months post-completion"}
                            {...field}
                            data-testid="input-deliverables"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eligibility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligibility Criteria</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={6}
                            placeholder={"1. Open to all legally registered firms and joint ventures operating in Liberia\n2. Must not be under any government suspension, debarment, or blacklisting\n3. Must have a valid Public Procurement and Concessions Commission (PPCC) registration\n4. Joint ventures and consortia are permitted with a clearly designated lead firm\n5. Local Liberian-owned firms or firms with Liberian partnerships will receive preferential consideration\n6. Must demonstrate compliance with Environmental Protection Agency (EPA) regulations\n7. Must have no outstanding legal disputes with the Government of Liberia"}
                            {...field}
                            data-testid="input-eligibility"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@example.com" {...field} data-testid="input-contact-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+231 xxx xxx xxxx" {...field} data-testid="input-contact-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/employer/tenders")} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2" data-testid="button-submit">
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isEditing ? "Updating..." : "Posting..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? "Update Tender" : "Post Tender"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
