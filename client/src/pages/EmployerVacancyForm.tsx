import { useState, useEffect } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Briefcase, 
  MapPin, 
  DollarSign,
  Calendar,
  Users,
  Save,
  Loader2
} from "lucide-react";

const LIBERIA_COUNTIES = [
  "Montserrado", "Nimba", "Bong", "Lofa", "Grand Bassa", "Margibi",
  "Grand Cape Mount", "Bomi", "Grand Gedeh", "Sinoe", "River Cess",
  "Gbarpolu", "Maryland", "Grand Kru", "River Gee"
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
  { value: "seasonal", label: "Seasonal" },
];

const SECTORS = [
  { value: "private", label: "Private Sector" },
  { value: "public", label: "Public Sector" },
  { value: "ngo", label: "NGO/Projects" },
  { value: "informal", label: "Informal" },
];

const vacancySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  county: z.string().min(1, "County is required"),
  district: z.string().optional(),
  employmentType: z.string().min(1, "Employment type is required"),
  sector: z.string().min(1, "Sector is required"),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  salaryCurrency: z.string().default("LRD"),
  positionsAvailable: z.string().min(1, "Number of positions is required"),
  applicationDeadline: z.string().optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  iscoCode: z.string().optional(),
  isicCode: z.string().optional(),
});

type VacancyFormData = z.infer<typeof vacancySchema>;

interface Employer {
  id: number;
  name: string;
  sector: string;
  county: string;
  userId: number;
}

interface IscoCodes {
  code: string;
  title: string;
}

interface IsicCodes {
  code: string;
  description: string;
}

export default function EmployerVacancyForm() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/employer/vacancies/:id/edit");
  const isEditing = !!match;
  const vacancyId = params?.id;
  const { toast } = useToast();

  const { data: employer } = useQuery<Employer>({
    queryKey: ["/api/employers/me"],
    enabled: !!user && user.role === "employer",
  });

  const { data: iscoCodes = [] } = useQuery<IscoCodes[]>({
    queryKey: ["/api/reference/isco"],
  });

  const { data: isicCodes = [] } = useQuery<IsicCodes[]>({
    queryKey: ["/api/reference/isic"],
  });

  const { data: existingVacancy } = useQuery({
    queryKey: ["/api/vacancies", vacancyId],
    enabled: isEditing && !!vacancyId,
  });

  const form = useForm<VacancyFormData>({
    resolver: zodResolver(vacancySchema),
    defaultValues: {
      title: "",
      description: "",
      county: "",
      district: "",
      employmentType: "full_time",
      sector: "private",
      salaryMin: "",
      salaryMax: "",
      salaryCurrency: "LRD",
      positionsAvailable: "1",
      applicationDeadline: "",
      requirements: "",
      benefits: "",
      iscoCode: "",
      isicCode: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: VacancyFormData) => {
      const payload = {
        ...data,
        salaryMin: data.salaryMin ? parseInt(data.salaryMin) : null,
        salaryMax: data.salaryMax ? parseInt(data.salaryMax) : null,
        positionsAvailable: parseInt(data.positionsAvailable),
        applicationDeadline: data.applicationDeadline || null,
        employerId: employer?.id,
      };
      return apiRequest("POST", "/api/vacancies", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacancies"] });
      toast({
        title: "Vacancy Posted",
        description: "Your job vacancy has been published successfully.",
      });
      setLocation("/employer/vacancies");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post vacancy",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: VacancyFormData) => {
      const payload = {
        ...data,
        salaryMin: data.salaryMin ? parseInt(data.salaryMin) : null,
        salaryMax: data.salaryMax ? parseInt(data.salaryMax) : null,
        positionsAvailable: parseInt(data.positionsAvailable),
        applicationDeadline: data.applicationDeadline || null,
      };
      return apiRequest("PATCH", `/api/vacancies/${vacancyId}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vacancies"] });
      toast({
        title: "Vacancy Updated",
        description: "Your job vacancy has been updated successfully.",
      });
      setLocation("/employer/vacancies");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vacancy",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VacancyFormData) => {
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
    <div className="min-h-screen" data-testid="employer-vacancy-form-page">
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
              {isEditing ? "Edit Vacancy" : "Post New Vacancy"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? "Update your job listing details" : "Create a new job listing to attract candidates"}
            </p>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Accountant" {...field} data-testid="input-title" />
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
                        <FormLabel>Job Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the role, responsibilities, and ideal candidate..."
                            className="min-h-32"
                            {...field} 
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="employmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employment Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-employment-type">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {EMPLOYMENT_TYPES.map((type) => (
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
                      name="sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sector *</FormLabel>
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
                  </div>

                  <FormField
                    control={form.control}
                    name="positionsAvailable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Positions *</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} data-testid="input-positions" />
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
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-county">
                                <SelectValue placeholder="Select county" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LIBERIA_COUNTIES.map((county) => (
                                <SelectItem key={county} value={county}>
                                  {county}
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
                      name="district"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>District (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Greater Monrovia" {...field} data-testid="input-district" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Compensation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="salaryCurrency"
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
                      name="salaryMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Salary</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} data-testid="input-salary-min" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salaryMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Salary</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} data-testid="input-salary-max" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="applicationDeadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Deadline</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-deadline" />
                        </FormControl>
                        <FormDescription>Leave blank for no deadline</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>International Classification (Optional)</CardTitle>
                  <CardDescription>
                    Add ISCO-08 and ISIC codes for standardized reporting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="iscoCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISCO-08 Occupation Code</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-isco">
                                <SelectValue placeholder="Select occupation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {iscoCodes.map((isco) => (
                                <SelectItem key={isco.code} value={isco.code}>
                                  {isco.code} - {isco.title}
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
                      name="isicCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ISIC Rev.4 Industry Code</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-isic">
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isicCodes.map((isic) => (
                                <SelectItem key={isic.code} value={isic.code}>
                                  {isic.code} - {isic.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
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
                            placeholder="List qualifications, experience, and skills required..."
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
                    name="benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Benefits</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe benefits, perks, and work culture..."
                            {...field} 
                            data-testid="input-benefits"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setLocation("/employer/vacancies")}>
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
                      {isEditing ? "Update Vacancy" : "Post Vacancy"}
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
