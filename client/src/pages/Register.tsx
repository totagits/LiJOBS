import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Building2, 
  User,
  Loader2,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  GraduationCap,
  Briefcase,
  MapPin,
  Phone,
  Shield,
  ChevronRight,
  ChevronLeft,
  Users,
  Target,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ministryOfLaborLogo from "@/assets/images/ministry-of-labor-logo.png";

const counties = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const sectors = [
  "Agriculture", "Construction", "Education", "Finance", "Healthcare",
  "Hospitality", "Manufacturing", "Mining", "Public Sector", "Retail",
  "Technology", "Transportation", "Other"
];

const employerTypes = [
  { value: "private", label: "Private Sector" },
  { value: "public", label: "Public Sector" },
  { value: "ngo", label: "NGO / Development Project" }
];

const educationLevels = [
  { value: "none", label: "No Formal Education" },
  { value: "primary", label: "Primary School" },
  { value: "junior_high", label: "Junior High School" },
  { value: "senior_high", label: "Senior High School" },
  { value: "vocational", label: "Vocational / Technical" },
  { value: "associate", label: "Associate Degree" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "doctorate", label: "Doctorate / PhD" },
];

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Prefer not to say" },
];

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .refine(val => /[A-Z]/.test(val), "Password must include at least one uppercase letter")
  .refine(val => /[a-z]/.test(val), "Password must include at least one lowercase letter")
  .refine(val => /[0-9]/.test(val), "Password must include at least one number");

const employerSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  employerType: z.string().min(1, "Please select employer type"),
  sector: z.string().min(1, "Please select a sector"),
  county: z.string().min(1, "Please select a county"),
  businessRegistrationNumber: z.string().min(1, "Business registration number is required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  password: passwordSchema,
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, "You must agree to the terms"),
  businessCertificateUrl: z.string().min(1, "Business certificate is required"),
  taxClearanceUrl: z.string().min(1, "Tax clearance document is required"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const individualSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone number is required"),
  password: passwordSchema,
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, "You must agree to the terms"),
  idNumber: z.string().min(1, "National ID number is required"),
  idCardUrl: z.string().min(1, "ID card copy is required"),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  county: z.string().optional(),
  district: z.string().optional(),
  physicalAddress: z.string().optional(),
  dateOfBirth: z.string().optional(),
  educationLevel: z.string().optional(),
  educationInstitution: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  currentEmployer: z.string().optional(),
  currentJobTitle: z.string().optional(),
  relevantSkills: z.string().optional(),
  languagesSpoken: z.string().optional(),
  expectedSalary: z.string().optional(),
  availableStartDate: z.string().optional(),
  willingToRelocate: z.boolean().optional(),
  hasDisability: z.boolean().optional(),
  preferredSectors: z.array(z.string()).optional(),
  preferredCounties: z.array(z.string()).optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  resumeUrl: z.string().optional(),
  supportingDocUrls: z.array(z.string()).optional(),
  referenceName1: z.string().optional(),
  referencePhone1: z.string().optional(),
  referenceRelation1: z.string().optional(),
  referenceName2: z.string().optional(),
  referencePhone2: z.string().optional(),
  referenceRelation2: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type EmployerFormData = z.infer<typeof employerSchema>;
type IndividualFormData = z.infer<typeof individualSchema>;

function FileUploadField({ 
  label, 
  description,
  value, 
  onChange, 
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  testId 
}: { 
  label: string; 
  description: string;
  value: string; 
  onChange: (url: string) => void; 
  accept?: string;
  testId: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch("/api/upload/registration-doc", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onChange(data.url);
      setFileName(file.name);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          accept={accept}
          className="hidden"
          data-testid={testId}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : value ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isUploading ? "Uploading..." : value ? "Change File" : "Upload File"}
        </Button>
        {value && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {fileName || "Uploaded"}
          </span>
        )}
      </div>
    </div>
  );
}

function MultiFileUploadField({
  label,
  description,
  values,
  onChange,
  maxFiles = 5,
  testId
}: {
  label: string;
  description: string;
  values: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  testId: string;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (values.length >= maxFiles) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be under 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const response = await fetch("/api/upload/registration-doc", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      onChange([...values, data.url]);
      setFileNames([...fileNames, file.name]);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
    setFileNames(fileNames.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <p className="text-xs text-muted-foreground">{description}</p>
      {values.length > 0 && (
        <div className="space-y-1">
          {values.map((_, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 rounded px-3 py-1.5">
              <FileText className="h-3.5 w-3.5 text-green-600" />
              <span className="flex-1 truncate">{fileNames[i] || `Document ${i + 1}`}</span>
              <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {values.length < maxFiles && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            className="hidden"
            data-testid={testId}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {isUploading ? "Uploading..." : `Add Document (${values.length}/${maxFiles})`}
          </Button>
        </>
      )}
    </div>
  );
}

const INDIVIDUAL_STEPS = [
  { id: 1, title: "Personal Info", icon: User, description: "Basic information" },
  { id: 2, title: "Education & Work", icon: GraduationCap, description: "Background details" },
  { id: 3, title: "Job Preferences", icon: Target, description: "What you're looking for" },
  { id: 4, title: "Documents & Refs", icon: FileText, description: "Upload & references" },
  { id: 5, title: "Account Setup", icon: Shield, description: "Security & submit" },
];

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {INDIVIDUAL_STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                isActive ? "bg-primary text-primary-foreground" :
                isCompleted ? "bg-green-500 text-white" :
                "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs mt-1 text-center hidden sm:block ${isActive ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function Register() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [individualStep, setIndividualStep] = useState(1);
  
  const employerForm = useForm<EmployerFormData>({
    resolver: zodResolver(employerSchema),
    defaultValues: {
      organizationName: "",
      employerType: "",
      sector: "",
      county: "",
      businessRegistrationNumber: "",
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
      businessCertificateUrl: "",
      taxClearanceUrl: "",
    }
  });

  const individualForm = useForm<IndividualFormData>({
    resolver: zodResolver(individualSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      terms: false,
      idNumber: "",
      idCardUrl: "",
      gender: "",
      nationality: "Liberian",
      county: "",
      district: "",
      physicalAddress: "",
      dateOfBirth: "",
      educationLevel: "",
      educationInstitution: "",
      fieldOfStudy: "",
      yearsOfExperience: "",
      currentEmployer: "",
      currentJobTitle: "",
      relevantSkills: "",
      languagesSpoken: "",
      expectedSalary: "",
      availableStartDate: "",
      willingToRelocate: false,
      hasDisability: false,
      preferredSectors: [],
      preferredCounties: [],
      headline: "",
      summary: "",
      resumeUrl: "",
      supportingDocUrls: [],
      referenceName1: "",
      referencePhone1: "",
      referenceRelation1: "",
      referenceName2: "",
      referencePhone2: "",
      referenceRelation2: "",
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: () => {
      setRegistrationSuccess(true);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  });

  const onEmployerSubmit = (data: EmployerFormData) => {
    registerMutation.mutate({
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "employer",
      sector: data.employerType,
      county: data.county,
      organizationName: data.organizationName,
      organizationType: data.employerType === "private" ? "private_company" : 
                        data.employerType === "public" ? "government" : "ngo",
      phone: data.phone || undefined,
      businessRegistrationNumber: data.businessRegistrationNumber,
      businessCertificateUrl: data.businessCertificateUrl,
      taxClearanceUrl: data.taxClearanceUrl,
    });
  };

  const onIndividualSubmit = (data: IndividualFormData) => {
    registerMutation.mutate({
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "individual",
      phone: data.phone || undefined,
      idNumber: data.idNumber,
      idCardUrl: data.idCardUrl,
      gender: data.gender || undefined,
      nationality: data.nationality || undefined,
      county: data.county || undefined,
      district: data.district || undefined,
      physicalAddress: data.physicalAddress || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      educationLevel: data.educationLevel || undefined,
      educationInstitution: data.educationInstitution || undefined,
      fieldOfStudy: data.fieldOfStudy || undefined,
      yearsOfExperience: data.yearsOfExperience || undefined,
      currentEmployer: data.currentEmployer || undefined,
      currentJobTitle: data.currentJobTitle || undefined,
      relevantSkills: data.relevantSkills || undefined,
      languagesSpoken: data.languagesSpoken || undefined,
      expectedSalary: data.expectedSalary || undefined,
      availableStartDate: data.availableStartDate || undefined,
      willingToRelocate: data.willingToRelocate || false,
      hasDisability: data.hasDisability || false,
      preferredSectors: data.preferredSectors?.length ? data.preferredSectors : undefined,
      preferredCounties: data.preferredCounties?.length ? data.preferredCounties : undefined,
      headline: data.headline || undefined,
      summary: data.summary || undefined,
      resumeUrl: data.resumeUrl || undefined,
      supportingDocUrls: data.supportingDocUrls?.length ? data.supportingDocUrls : undefined,
      referenceName1: data.referenceName1 || undefined,
      referencePhone1: data.referencePhone1 || undefined,
      referenceRelation1: data.referenceRelation1 || undefined,
      referenceName2: data.referenceName2 || undefined,
      referencePhone2: data.referencePhone2 || undefined,
      referenceRelation2: data.referenceRelation2 || undefined,
    });
  };

  const validateCurrentStep = async () => {
    let fieldsToValidate: (keyof IndividualFormData)[] = [];
    switch (individualStep) {
      case 1:
        fieldsToValidate = ["firstName", "lastName", "email", "phone", "gender", "dateOfBirth", "county"];
        break;
      case 2:
        fieldsToValidate = ["educationLevel", "yearsOfExperience"];
        break;
      case 3:
        fieldsToValidate = [];
        break;
      case 4:
        fieldsToValidate = ["idNumber", "idCardUrl"];
        break;
      case 5:
        fieldsToValidate = ["password", "confirmPassword", "terms"];
        break;
    }
    
    if (fieldsToValidate.length === 0) return true;
    
    const result = await individualForm.trigger(fieldsToValidate);
    return result;
  };

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setIndividualStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setIndividualStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleArrayValue = (field: "preferredSectors" | "preferredCounties", value: string) => {
    const current = individualForm.getValues(field) || [];
    if (current.includes(value)) {
      individualForm.setValue(field, current.filter(v => v !== value));
    } else {
      individualForm.setValue(field, [...current, value]);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex flex-col" data-testid="register-success-page">
        <Header />
        <main className="flex-1 pt-24 pb-12 px-4 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 mx-auto mb-6 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Registration Submitted</h1>
                <p className="text-muted-foreground mb-6">
                  Your registration has been submitted for review. Our verification team will review your documents and approve your account within 1-3 business days.
                </p>
                <Alert className="mb-6 text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You will receive an email notification once your account is approved. Please ensure your submitted documents are valid and up-to-date.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <Link href="/">Return Home</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/login">Go to Login</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="register-page">
      <Header />
      <main className="flex-1 pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">
          <BackButton />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-white border mx-auto mb-4 overflow-hidden">
                <img src={ministryOfLaborLogo} alt="LiJOBS" className="w-full h-full object-contain p-1" />
              </div>
              <h1 className="text-2xl font-bold" data-testid="text-register-title">Create Your Account</h1>
              <p className="text-muted-foreground">Join LiJOBS to access employment data, job matching, and reporting tools</p>
            </div>

            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Document Verification Required:</strong> All registrations require document verification. Your account will be reviewed by our team before activation.
              </AlertDescription>
            </Alert>

            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="employer" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="employer" className="gap-2" data-testid="tab-employer" onClick={() => setIndividualStep(1)}>
                      <Building2 className="w-4 h-4" />
                      Employer
                    </TabsTrigger>
                    <TabsTrigger value="individual" className="gap-2" data-testid="tab-individual">
                      <User className="w-4 h-4" />
                      Individual
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="employer">
                    <Form {...employerForm}>
                      <form onSubmit={employerForm.handleSubmit(onEmployerSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="font-semibold flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Organization Information
                          </h3>
                          <FormField
                            control={employerForm.control}
                            name="organizationName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Organization Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your organization's official name" {...field} data-testid="input-organization-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={employerForm.control}
                            name="employerType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employer Type *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-employer-type">
                                      <SelectValue placeholder="Select employer type" />
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
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={employerForm.control}
                              name="sector"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Business Sector *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-sector">
                                        <SelectValue placeholder="Select sector" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {sectors.map(sector => (
                                        <SelectItem key={sector} value={sector.toLowerCase()}>{sector}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={employerForm.control}
                              name="county"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>County of Primary Operation *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-county">
                                        <SelectValue placeholder="Select county" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {counties.map(county => (
                                        <SelectItem key={county} value={county.toLowerCase()}>{county}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={employerForm.control}
                            name="businessRegistrationNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Business Registration Number *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter your business registration number" {...field} data-testid="input-business-reg-number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Required Documents
                          </h3>
                          <FormField
                            control={employerForm.control}
                            name="businessCertificateUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FileUploadField
                                  label="Business Certificate *"
                                  description="Upload a copy of your business registration certificate (PDF, JPG, or PNG)"
                                  value={field.value}
                                  onChange={field.onChange}
                                  testId="input-business-certificate"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={employerForm.control}
                            name="taxClearanceUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FileUploadField
                                  label="Tax Clearance Certificate *"
                                  description="Upload your current tax clearance certificate (PDF, JPG, or PNG)"
                                  value={field.value}
                                  onChange={field.onChange}
                                  testId="input-tax-clearance"
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-semibold flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Contact Person
                          </h3>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={employerForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your first name" {...field} data-testid="input-emp-first-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={employerForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Last Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Your last name" {...field} data-testid="input-emp-last-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={employerForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address *</FormLabel>
                                  <FormControl>
                                    <Input type="email" placeholder="you@company.com" {...field} data-testid="input-emp-email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={employerForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="+231 XXX XXX XXX" {...field} data-testid="input-emp-phone" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <FormField
                              control={employerForm.control}
                              name="password"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Password *</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="Create a password" {...field} data-testid="input-emp-password" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={employerForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirm Password *</FormLabel>
                                  <FormControl>
                                    <Input type="password" placeholder="Confirm password" {...field} data-testid="input-emp-confirm-password" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <FormField
                          control={employerForm.control}
                          name="terms"
                          render={({ field }) => (
                            <FormItem className="flex items-start gap-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="mt-1"
                                  data-testid="checkbox-emp-terms"
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                I agree to the <a href="#" className="text-primary underline" data-testid="link-emp-terms">Terms of Service</a> and{" "}
                                <a href="#" className="text-primary underline" data-testid="link-emp-privacy">Privacy Policy</a>, and consent to share 
                                employment data as required by law.
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full gap-2" size="lg" data-testid="button-register-employer" disabled={registerMutation.isPending}>
                          {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                          {registerMutation.isPending ? "Submitting..." : "Submit for Verification"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  <TabsContent value="individual">
                    <StepIndicator currentStep={individualStep} totalSteps={5} />
                    
                    <Form {...individualForm}>
                      <form onSubmit={individualForm.handleSubmit(onIndividualSubmit)} className="space-y-6">
                        <AnimatePresence mode="wait">
                          {individualStep === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                              <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <User className="w-5 h-5 text-primary" />
                                Personal Information
                              </h3>
                              <p className="text-sm text-muted-foreground">Tell us about yourself. This information helps us match you with the right opportunities.</p>
                              
                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="firstName" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name *</FormLabel>
                                    <FormControl><Input placeholder="Your first name" {...field} data-testid="input-ind-first-name" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="lastName" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name *</FormLabel>
                                    <FormControl><Input placeholder="Your last name" {...field} data-testid="input-ind-last-name" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>
                              
                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="email" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email Address *</FormLabel>
                                    <FormControl><Input type="email" placeholder="you@example.com" {...field} data-testid="input-ind-email" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="phone" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Phone Number *</FormLabel>
                                    <FormControl><Input placeholder="+231 XXX XXX XXX" {...field} data-testid="input-ind-phone" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="gender" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Gender</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-ind-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {genderOptions.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="dateOfBirth" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Date of Birth</FormLabel>
                                    <FormControl><Input type="date" {...field} data-testid="input-ind-dob" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="nationality" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nationality</FormLabel>
                                    <FormControl><Input placeholder="e.g., Liberian" {...field} data-testid="input-ind-nationality" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="county" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>County of Residence</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-ind-county"><SelectValue placeholder="Select county" /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {counties.map(c => <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="district" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>District</FormLabel>
                                    <FormControl><Input placeholder="Your district" {...field} data-testid="input-ind-district" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="physicalAddress" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Physical Address</FormLabel>
                                    <FormControl><Input placeholder="Street address or community" {...field} data-testid="input-ind-address" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>
                            </motion.div>
                          )}

                          {individualStep === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                              <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                Education & Work Experience
                              </h3>
                              <p className="text-sm text-muted-foreground">Your education and work history help the AI matching system find the best opportunities for you.</p>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="educationLevel" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Highest Education Level</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger data-testid="select-ind-education"><SelectValue placeholder="Select level" /></SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {educationLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="educationInstitution" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Institution / School Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., University of Liberia" {...field} data-testid="input-ind-institution" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="fieldOfStudy" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Field of Study</FormLabel>
                                    <FormControl><Input placeholder="e.g., Business Administration" {...field} data-testid="input-ind-field-of-study" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="yearsOfExperience" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Years of Work Experience</FormLabel>
                                    <FormControl><Input type="number" min="0" max="50" placeholder="e.g., 5" {...field} data-testid="input-ind-experience" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="currentEmployer" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Employer</FormLabel>
                                    <FormControl><Input placeholder="Company or organization name" {...field} data-testid="input-ind-current-employer" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="currentJobTitle" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Job Title</FormLabel>
                                    <FormControl><Input placeholder="e.g., Accountant" {...field} data-testid="input-ind-current-title" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>

                              <FormField control={individualForm.control} name="relevantSkills" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Relevant Skills</FormLabel>
                                  <FormControl><Textarea placeholder="List your key skills, separated by commas (e.g., Computer literacy, Accounting, English fluency, Project management)" rows={3} {...field} data-testid="textarea-ind-skills" /></FormControl>
                                  <FormDescription>These skills are used by the AI Job Matching system to find jobs suited to your abilities.</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )} />

                              <FormField control={individualForm.control} name="languagesSpoken" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Languages Spoken</FormLabel>
                                  <FormControl><Input placeholder="e.g., English, French, Kpelle" {...field} data-testid="input-ind-languages" /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />

                              <FormField control={individualForm.control} name="headline" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Professional Headline</FormLabel>
                                  <FormControl><Input placeholder="e.g., Experienced Accountant with 5+ years in the finance sector" {...field} data-testid="input-ind-headline" /></FormControl>
                                  <FormDescription>A short tagline that describes you professionally.</FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )} />

                              <FormField control={individualForm.control} name="summary" render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Professional Summary</FormLabel>
                                  <FormControl><Textarea placeholder="Briefly describe your professional background, strengths, and career goals..." rows={3} {...field} data-testid="textarea-ind-summary" /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )} />
                            </motion.div>
                          )}

                          {individualStep === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                              <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <Target className="w-5 h-5 text-primary" />
                                Job Preferences
                              </h3>
                              <p className="text-sm text-muted-foreground">Tell us what kind of work you're looking for so we can match you with the right opportunities.</p>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="expectedSalary" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Expected Salary (LRD/month)</FormLabel>
                                    <FormControl><Input type="number" min="0" placeholder="e.g., 25000" {...field} data-testid="input-ind-salary" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="availableStartDate" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Available Start Date</FormLabel>
                                    <FormControl><Input type="date" {...field} data-testid="input-ind-start-date" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="willingToRelocate" render={({ field }) => (
                                  <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-4">
                                    <FormControl>
                                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-ind-relocate" />
                                    </FormControl>
                                    <div>
                                      <FormLabel className="font-medium">Willing to Relocate</FormLabel>
                                      <FormDescription className="text-xs">Open to moving to another county for work</FormDescription>
                                    </div>
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="hasDisability" render={({ field }) => (
                                  <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border p-4">
                                    <FormControl>
                                      <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-ind-disability" />
                                    </FormControl>
                                    <div>
                                      <FormLabel className="font-medium">Disability Disclosure</FormLabel>
                                      <FormDescription className="text-xs">Optional, for equal opportunity monitoring</FormDescription>
                                    </div>
                                  </FormItem>
                                )} />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Preferred Work Sectors</label>
                                <p className="text-xs text-muted-foreground">Select the sectors where you'd like to work (you can pick multiple)</p>
                                <div className="flex flex-wrap gap-2" data-testid="preferred-sectors-list">
                                  {sectors.map(sector => {
                                    const isSelected = (individualForm.watch("preferredSectors") || []).includes(sector.toLowerCase());
                                    return (
                                      <Badge
                                        key={sector}
                                        variant={isSelected ? "default" : "outline"}
                                        className="cursor-pointer transition-colors"
                                        onClick={() => toggleArrayValue("preferredSectors", sector.toLowerCase())}
                                        data-testid={`badge-sector-${sector.toLowerCase()}`}
                                      >
                                        {sector}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Preferred Work Locations (Counties)</label>
                                <p className="text-xs text-muted-foreground">Select counties where you'd prefer to work</p>
                                <div className="flex flex-wrap gap-2" data-testid="preferred-counties-list">
                                  {counties.map(county => {
                                    const isSelected = (individualForm.watch("preferredCounties") || []).includes(county.toLowerCase());
                                    return (
                                      <Badge
                                        key={county}
                                        variant={isSelected ? "default" : "outline"}
                                        className="cursor-pointer transition-colors"
                                        onClick={() => toggleArrayValue("preferredCounties", county.toLowerCase())}
                                        data-testid={`badge-county-${county.toLowerCase()}`}
                                      >
                                        {county}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {individualStep === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                              <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <FileText className="w-5 h-5 text-primary" />
                                Documents & References
                              </h3>
                              <p className="text-sm text-muted-foreground">Upload your identity documents, resume, and provide professional references.</p>

                              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Shield className="w-4 h-4" />
                                  Identity Verification (Required)
                                </h4>
                                <FormField control={individualForm.control} name="idNumber" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>National ID Number *</FormLabel>
                                    <FormControl><Input placeholder="Enter your national ID number" {...field} data-testid="input-id-number" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="idCardUrl" render={({ field }) => (
                                  <FormItem>
                                    <FileUploadField
                                      label="ID Card Copy *"
                                      description="Upload a clear copy of your national ID card (front side, PDF, JPG, or PNG)"
                                      value={field.value}
                                      onChange={field.onChange}
                                      testId="input-id-card"
                                    />
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>

                              <div className="space-y-4 p-4 rounded-lg border">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Briefcase className="w-4 h-4" />
                                  Resume & Supporting Documents
                                </h4>
                                <FormField control={individualForm.control} name="resumeUrl" render={({ field }) => (
                                  <FormItem>
                                    <FileUploadField
                                      label="Resume / CV"
                                      description="Upload your resume or CV (PDF, DOC, or DOCX, max 10MB)"
                                      value={field.value || ""}
                                      onChange={field.onChange}
                                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      testId="input-resume"
                                    />
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <MultiFileUploadField
                                  label="Supporting Documents"
                                  description="Certificates, diplomas, recommendation letters, etc. (up to 5 files, max 10MB each)"
                                  values={individualForm.watch("supportingDocUrls") || []}
                                  onChange={(urls) => individualForm.setValue("supportingDocUrls", urls)}
                                  testId="input-supporting-docs"
                                />
                              </div>

                              <div className="space-y-4 p-4 rounded-lg border">
                                <h4 className="font-medium flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Professional References
                                </h4>
                                <p className="text-xs text-muted-foreground">Provide contacts who can vouch for your work experience and character.</p>
                                
                                <div className="p-3 bg-muted/40 rounded-lg space-y-3">
                                  <p className="text-sm font-medium">Reference 1</p>
                                  <div className="grid sm:grid-cols-3 gap-3">
                                    <FormField control={individualForm.control} name="referenceName1" render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Full Name</FormLabel>
                                        <FormControl><Input placeholder="Reference name" {...field} data-testid="input-ref1-name" /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )} />
                                    <FormField control={individualForm.control} name="referencePhone1" render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Phone</FormLabel>
                                        <FormControl><Input placeholder="+231 XXX XXX" {...field} data-testid="input-ref1-phone" /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )} />
                                    <FormField control={individualForm.control} name="referenceRelation1" render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Relationship</FormLabel>
                                        <FormControl><Input placeholder="e.g., Former Supervisor" {...field} data-testid="input-ref1-relation" /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )} />
                                  </div>
                                </div>

                                <div className="p-3 bg-muted/40 rounded-lg space-y-3">
                                  <p className="text-sm font-medium">Reference 2</p>
                                  <div className="grid sm:grid-cols-3 gap-3">
                                    <FormField control={individualForm.control} name="referenceName2" render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Full Name</FormLabel>
                                        <FormControl><Input placeholder="Reference name" {...field} data-testid="input-ref2-name" /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )} />
                                    <FormField control={individualForm.control} name="referencePhone2" render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Phone</FormLabel>
                                        <FormControl><Input placeholder="+231 XXX XXX" {...field} data-testid="input-ref2-phone" /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )} />
                                    <FormField control={individualForm.control} name="referenceRelation2" render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-xs">Relationship</FormLabel>
                                        <FormControl><Input placeholder="e.g., Colleague" {...field} data-testid="input-ref2-relation" /></FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )} />
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {individualStep === 5 && (
                            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                              <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <Shield className="w-5 h-5 text-primary" />
                                Account Setup
                              </h3>
                              <p className="text-sm text-muted-foreground">Create your secure login credentials to complete registration.</p>

                              <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={individualForm.control} name="password" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password *</FormLabel>
                                    <FormControl><Input type="password" placeholder="Create a password" {...field} data-testid="input-ind-password" /></FormControl>
                                    <FormDescription className="text-xs">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                                <FormField control={individualForm.control} name="confirmPassword" render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm Password *</FormLabel>
                                    <FormControl><Input type="password" placeholder="Confirm password" {...field} data-testid="input-ind-confirm-password" /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )} />
                              </div>

                              <FormField control={individualForm.control} name="terms" render={({ field }) => (
                                <FormItem className="flex items-start gap-2 space-y-0 p-4 rounded-lg border">
                                  <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" data-testid="checkbox-ind-terms" />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    I agree to the <a href="#" className="text-primary underline">Terms of Service</a> and{" "}
                                    <a href="#" className="text-primary underline">Privacy Policy</a>. I consent to my data being used for job matching and employment tracking as required by Liberian labor law.
                                  </FormLabel>
                                </FormItem>
                              )} />

                              <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  Once submitted, your profile will be reviewed by our verification team. You'll receive an email when your account is approved, typically within 1-3 business days.
                                </AlertDescription>
                              </Alert>

                              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                <h4 className="font-medium mb-2">Your Profile Summary</h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  <span className="text-muted-foreground">Name:</span>
                                  <span>{individualForm.watch("firstName")} {individualForm.watch("lastName")}</span>
                                  <span className="text-muted-foreground">Email:</span>
                                  <span>{individualForm.watch("email")}</span>
                                  <span className="text-muted-foreground">Phone:</span>
                                  <span>{individualForm.watch("phone") || "—"}</span>
                                  <span className="text-muted-foreground">County:</span>
                                  <span className="capitalize">{individualForm.watch("county") || "—"}</span>
                                  <span className="text-muted-foreground">Education:</span>
                                  <span className="capitalize">{educationLevels.find(l => l.value === individualForm.watch("educationLevel"))?.label || "—"}</span>
                                  <span className="text-muted-foreground">Experience:</span>
                                  <span>{individualForm.watch("yearsOfExperience") ? `${individualForm.watch("yearsOfExperience")} years` : "—"}</span>
                                  <span className="text-muted-foreground">Skills:</span>
                                  <span className="truncate">{individualForm.watch("relevantSkills") || "—"}</span>
                                  <span className="text-muted-foreground">ID Verified:</span>
                                  <span>{individualForm.watch("idCardUrl") ? "Yes" : "No"}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex gap-3 pt-4 border-t">
                          {individualStep > 1 && (
                            <Button type="button" variant="outline" onClick={handlePrevStep} className="gap-2" data-testid="button-prev-step">
                              <ChevronLeft className="w-4 h-4" /> Back
                            </Button>
                          )}
                          <div className="flex-1" />
                          {individualStep < 5 ? (
                            <Button type="button" onClick={handleNextStep} className="gap-2" data-testid="button-next-step">
                              Next <ChevronRight className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button type="submit" className="gap-2" size="lg" data-testid="button-register-individual" disabled={registerMutation.isPending}>
                              {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                              {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
                            </Button>
                          )}
                        </div>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary underline" data-testid="link-login">
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
