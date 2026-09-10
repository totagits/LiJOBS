import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Building2, 
  Users, 
  Upload, 
  FileSpreadsheet,
  Plus,
  Briefcase,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Loader2,
  XCircle,
  Download
} from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { liberianCounties, sectors } from "@shared/schema";

const contractTypes = [
  { value: "full_time", label: "Full-time Permanent" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Fixed-term Contract" },
  { value: "seasonal", label: "Seasonal" },
  { value: "informal", label: "Informal" }
];

const employerTypes = [
  { value: "government", label: "Government Ministry/Agency" },
  { value: "private_company", label: "Private Company" },
  { value: "ngo", label: "NGO/Non-profit" },
  { value: "international_org", label: "International Organization" },
  { value: "sole_proprietor", label: "Sole Proprietor" },
  { value: "cooperative", label: "Cooperative" },
  { value: "household", label: "Household" }
];

const wagePeriods = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" }
];

const currencies = [
  { value: "LRD", label: "LRD (Liberian Dollar)" },
  { value: "USD", label: "USD (US Dollar)" },
  { value: "LRD_USD", label: "Both LRD & USD" }
];

const jobReportSchema = z.object({
  employerName: z.string().min(2, "Employer name is required"),
  employerType: z.string().min(1, "Please select employer type"),
  sector: z.enum(sectors, { required_error: "Please select a sector" }),
  county: z.string().min(1, "Please select a county"),
  district: z.string().optional(),
  jobTitle: z.string().min(2, "Job title is required"),
  employeeName: z.string().min(2, "Employee full name is required"),
  employeeGender: z.enum(["male", "female", "other"], { required_error: "Please select gender" }),
  employeeAge: z.coerce.number().min(15, "Minimum age is 15").max(100, "Maximum age is 100"),
  employeeAddress: z.string().optional(),
  employeeDistrict: z.string().optional(),
  employeeCounty: z.string().min(1, "Employee county is required"),
  contractType: z.enum(["full_time", "part_time", "contract", "seasonal", "informal"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  wageAmount: z.coerce.number().optional(),
  wagePeriod: z.enum(["daily", "weekly", "monthly"]).default("monthly"),
  currency: z.enum(["LRD", "USD", "LRD_USD"]).default("LRD"),
  notes: z.string().optional()
});

type JobReportFormData = z.infer<typeof jobReportSchema>;

interface BulkUploadResult {
  row: number;
  status: "valid" | "error";
  errors: string[];
  data?: any;
}

interface BulkUploadResponse {
  success: boolean;
  summary: {
    totalRows: number;
    validRows: number;
    errorRows: number;
  };
  results: BulkUploadResult[];
  validRecords?: any[];
}

export default function ReportJobs() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const form = useForm<JobReportFormData>({
    resolver: zodResolver(jobReportSchema),
    defaultValues: {
      employerName: user?.organizationName || "",
      employerType: "",
      sector: undefined,
      county: "",
      district: "",
      jobTitle: "",
      employeeName: "",
      employeeGender: undefined,
      employeeAge: undefined,
      employeeAddress: "",
      employeeDistrict: "",
      employeeCounty: "",
      contractType: "full_time",
      startDate: "",
      endDate: "",
      wageAmount: undefined,
      wagePeriod: "monthly",
      currency: "LRD",
      notes: ""
    }
  });

  // Fetch user's employment spells
  const { data: mySpells = [], isLoading: spellsLoading } = useQuery<any[]>({
    queryKey: ["/api/employment-spells"],
    enabled: isAuthenticated,
  });

  // Create employment spell mutation
  const createSpellMutation = useMutation({
    mutationFn: async (data: JobReportFormData) => {
      const response = await apiRequest("POST", "/api/employment-spells", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit report");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Report Submitted",
        description: "Your employment data has been submitted for verification."
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/employment-spells"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: JobReportFormData) => {
    createSpellMutation.mutate(data);
  };

  const handleDownloadBlankTemplate = () => {
    window.location.href = "/api/bulk-upload/template/blank";
  };

  const handleDownloadPrefilledTemplate = () => {
    window.location.href = "/api/bulk-upload/template/prefilled";
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/bulk-upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      setUploadResult(result);

      if (result.summary.errorRows > 0) {
        toast({
          title: "Validation Issues Found",
          description: `${result.summary.errorRows} rows have errors. Please review and fix them.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "File Validated Successfully",
          description: `${result.summary.validRows} records are ready to submit.`
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmitBulkRecords = async () => {
    if (!uploadResult?.validRecords || uploadResult.validRecords.length === 0) {
      toast({
        title: "No Valid Records",
        description: "Please fix the errors in your file first.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/bulk-upload/submit", {
        records: uploadResult.validRecords
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Submission failed");
      }

      const result = await response.json();
      toast({
        title: "Records Submitted",
        description: result.message
      });
      setUploadResult(null);
      queryClient.invalidateQueries({ queryKey: ["/api/employment-spells"] });
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <PageLoadingSpinner />
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Calculate stats from actual data
  const pendingCount = mySpells.filter((s: any) => s.verificationStatus === "pending").length;
  const verifiedCount = mySpells.filter((s: any) => s.verificationStatus === "verified").length;
  const totalEmployees = mySpells.length;

  return (
    <div className="min-h-screen" data-testid="report-jobs-page">
      <Header />
      <main className="pt-24">
        <section className="relative py-16 bg-secondary text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-secondary/80" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <BackButton />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-white/20 text-white mb-4">Employer Portal</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-report-title">
                Report Employment Data
              </h1>
              <p className="text-xl text-white/80 max-w-3xl">
                Submit your organization's employment information to contribute to 
                Liberia's national job creation statistics.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-8 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Verified Records</p>
                  <p className="font-semibold" data-testid="text-verified-count">{verifiedCount} verified</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="font-semibold" data-testid="text-employees-count">{totalEmployees} submitted</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Verification</p>
                  <p className="font-semibold" data-testid="text-pending-count">{pendingCount} pending</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs defaultValue="single" className="space-y-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="single" className="gap-2" data-testid="tab-single-report">
                  <Plus className="w-4 h-4" />
                  Single Report
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2" data-testid="tab-bulk-upload">
                  <Upload className="w-4 h-4" />
                  Bulk Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      New Employment Record
                    </CardTitle>
                    <CardDescription>
                      Report a new employment spell (job position with start/end dates)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Employer Information */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Employer Information</h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="employerName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Employer/Organization Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Ministry of Labor" {...field} data-testid="input-employer-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="employerType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Employer Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-employer-type">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {employerTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="sector"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Sector</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-sector">
                                        <SelectValue placeholder="Select sector" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {sectors.map(sector => (
                                        <SelectItem key={sector} value={sector}>
                                          {sector.charAt(0).toUpperCase() + sector.slice(1)}
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
                              name="county"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>County</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-county">
                                        <SelectValue placeholder="Select county" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {liberianCounties.map(county => (
                                        <SelectItem key={county} value={county}>{county}</SelectItem>
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
                                    <Input placeholder="e.g., Central Monrovia" {...field} data-testid="input-district" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Job Information */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Job Information</h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="jobTitle"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Job Title / Position</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., Agricultural Worker" {...field} data-testid="input-job-title" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="contractType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contract Type</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-contract-type">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {contractTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} data-testid="input-start-date" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date (if known)</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} data-testid="input-end-date" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="wageAmount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Wage Amount (Optional)</FormLabel>
                                  <FormControl>
                                    <Input type="number" placeholder="e.g., 1500" {...field} data-testid="input-wage-amount" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="wagePeriod"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Wage Period</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-wage-period">
                                        <SelectValue placeholder="Select period" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {wagePeriods.map(period => (
                                        <SelectItem key={period.value} value={period.value}>{period.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="currency"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Currency</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-currency">
                                        <SelectValue placeholder="Select currency" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {currencies.map(curr => (
                                        <SelectItem key={curr.value} value={curr.value}>{curr.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Employee Information (Required) */}
                        <div className="space-y-4">
                          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Employee Information</h3>
                          <div className="grid sm:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="employeeName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Employee full name" {...field} data-testid="input-employee-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="employeeGender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-gender">
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">Female</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="employeeAge"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Age *</FormLabel>
                                  <FormControl>
                                    <Input type="number" min="15" max="100" placeholder="Age" {...field} data-testid="input-age" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid sm:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="employeeCounty"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Employee County *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-employee-county">
                                        <SelectValue placeholder="Select county" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {liberianCounties.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="employeeDistrict"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Employee District</FormLabel>
                                  <FormControl>
                                    <Input placeholder="District" {...field} data-testid="input-employee-district" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="employeeAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Employee Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Street address or community" {...field} data-testid="input-employee-address" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Additional Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Any additional details about this employment..."
                                  rows={3}
                                  {...field}
                                  data-testid="input-notes"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center flex-wrap gap-4">
                          <Button 
                            type="submit" 
                            size="lg" 
                            className="gap-2"
                            disabled={createSpellMutation.isPending}
                            data-testid="button-submit-report"
                          >
                            {createSpellMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                Submit Report
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </Button>
                          <Button type="button" variant="outline" size="lg" data-testid="button-save-draft">
                            Save as Draft
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bulk">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      Bulk Data Upload
                    </CardTitle>
                    <CardDescription>
                      Upload multiple employment records using our Excel template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      data-testid="input-file-upload"
                    />
                    
                    <div 
                      className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                          <p className="text-lg font-medium mb-2">Processing your file...</p>
                          <p className="text-sm text-muted-foreground">Please wait while we validate your data</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium mb-2">Click to select your file</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Excel files only (.xlsx, .xls, .csv), max 10MB
                          </p>
                          <Button variant="outline" data-testid="button-choose-file" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                            Choose File
                          </Button>
                        </>
                      )}
                    </div>

                    {uploadResult && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold">{uploadResult.summary.totalRows}</p>
                              <p className="text-xs text-muted-foreground">Total Rows</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-green-600">{uploadResult.summary.validRows}</p>
                              <p className="text-xs text-muted-foreground">Valid</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-red-600">{uploadResult.summary.errorRows}</p>
                              <p className="text-xs text-muted-foreground">Errors</p>
                            </div>
                          </div>
                          {uploadResult.summary.validRows > 0 && uploadResult.summary.errorRows === 0 && (
                            <Button 
                              onClick={handleSubmitBulkRecords} 
                              disabled={isSubmitting}
                              className="gap-2"
                              data-testid="button-submit-bulk"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  Submit All Records
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {uploadResult.results.length > 0 && (
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {uploadResult.results.map((result, idx) => (
                              <div 
                                key={idx} 
                                className={`flex items-start gap-3 p-3 rounded-lg border ${
                                  result.status === "valid" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                                }`}
                              >
                                {result.status === "valid" ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <p className="font-medium text-sm">Row {result.row}</p>
                                  {result.status === "error" && result.errors.length > 0 && (
                                    <ul className="text-xs text-red-600 mt-1 space-y-0.5">
                                      {result.errors.map((error, errIdx) => (
                                        <li key={errIdx}>{error}</li>
                                      ))}
                                    </ul>
                                  )}
                                  {result.status === "valid" && result.data && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {result.data.employeeName} - {result.data.jobTitle} ({result.data.sector})
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Download Template</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Choose a template option below. For your first upload, download the blank template. 
                        To update existing employees, download the pre-filled template.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          variant="outline" 
                          className="gap-2" 
                          onClick={handleDownloadBlankTemplate}
                          data-testid="button-download-blank-template"
                        >
                          <Download className="w-4 h-4" />
                          Blank Template
                        </Button>
                        <Button 
                          variant="outline" 
                          className="gap-2" 
                          onClick={handleDownloadPrefilledTemplate}
                          data-testid="button-download-prefilled-template"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          Pre-filled with Existing Employees
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Upload Guidelines:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Use the official LiJOBS Excel template
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Required: First Name, Last Name, Job Title, Sector, County, Start Date
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Maximum 1,000 records per upload
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Dates must be in YYYY-MM-DD format
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Recent Submissions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {spellsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : mySpells.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No employment records submitted yet</p>
                    <p className="text-sm">Submit your first report above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mySpells.slice(0, 5).map((spell: any, index: number) => (
                      <div key={spell.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`submission-${index}`}>
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{spell.jobTitle}</p>
                            <p className="text-sm text-muted-foreground">
                              {spell.employerName} - {spell.county}
                            </p>
                          </div>
                        </div>
                        <Badge variant={spell.verificationStatus === "verified" ? "default" : "secondary"}>
                          {spell.verificationStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
