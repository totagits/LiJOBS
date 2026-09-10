import { useEffect, useState, useCallback } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Gavel,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  Mail,
  Phone,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Upload,
  Paperclip,
  X,
} from "lucide-react";
import type { Tender, Employer } from "@shared/schema";

interface UploadedDoc {
  name: string;
  url: string;
  type: string;
  size: number;
}

const bidFormSchema = z.object({
  bidderName: z.string().min(2, "Name is required"),
  bidderEmail: z.string().email("Valid email is required"),
  bidderPhone: z.string().optional(),
  companyName: z.string().optional(),
  proposalText: z.string().min(20, "Proposal must be at least 20 characters"),
  price: z.string().min(1, "Proposed price is required"),
  currency: z.string().default("LRD"),
  deliveryTimeline: z.string().optional(),
  experience: z.string().optional(),
});

type BidFormData = z.infer<typeof bidFormSchema>;

export default function TenderDetail() {
  const [, params] = useRoute("/tenders/:id");
  const tenderId = params?.id;
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = [
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg", "image/png",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds 10MB limit.`, variant: "destructive" });
        e.target.value = "";
        return;
      }
    }

    setIsUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        const metaRes = await fetch("/api/uploads/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type || "application/octet-stream",
          }),
        });
        if (!metaRes.ok) throw new Error("Failed to get upload URL");
        const { uploadURL, directUrl } = await metaRes.json();

        const uploadRes = await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
        if (!uploadRes.ok) throw new Error("Failed to upload file");

        setUploadedDocs(prev => [...prev, {
          name: file.name,
          url: directUrl,
          type: file.type || "application/octet-stream",
          size: file.size,
        }]);
      }
      toast({ title: "Files uploaded", description: "Documents attached to your bid." });
    } catch (err) {
      toast({ title: "Upload failed", description: "Could not upload file. Please try again.", variant: "destructive" });
    } finally {
      setIsUploadingFile(false);
      e.target.value = "";
    }
  }, [toast]);

  const removeDoc = useCallback((index: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index));
  }, []);

  const { data: tender, isLoading } = useQuery<Tender>({
    queryKey: [`/api/tenders/${tenderId}`],
    enabled: !!tenderId,
  });

  const { data: employers = [] } = useQuery<Employer[]>({
    queryKey: ["/api/employers"],
  });

  const getEmployerName = (employerId: string) => {
    const employer = employers.find((e) => e.id === employerId);
    return employer?.legalName || "Unknown Organization";
  };

  const form = useForm<BidFormData>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      bidderName: "",
      bidderEmail: "",
      bidderPhone: "",
      companyName: "",
      proposalText: "",
      price: "",
      currency: "LRD",
      deliveryTimeline: "",
      experience: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.setValue("bidderName", user.fullName || user.username || "");
      form.setValue("bidderEmail", user.email || "");
    }
  }, [user, form]);

  const submitBidMutation = useMutation({
    mutationFn: async (data: BidFormData) => {
      const payload = {
        ...data,
        price: parseInt(data.price),
        bidderId: user?.id,
        tenderId,
        documents: uploadedDocs.length > 0 ? JSON.stringify(uploadedDocs) : null,
      };
      return apiRequest("POST", `/api/tenders/${tenderId}/submissions`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Bid Submitted",
        description: "Your bid has been submitted successfully.",
      });
      form.reset();
      setUploadedDocs([]);
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit bid",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BidFormData) => {
    submitBidMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-emerald-500">Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      case "awarded":
        return <Badge className="bg-blue-500">Awarded</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "procurement":
        return <Badge className="bg-blue-500">Procurement</Badge>;
      case "service":
        return <Badge className="bg-violet-500">Service</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatBudget = (min: number | null, max: number | null, currency: string | null) => {
    const curr = currency || "LRD";
    if (!min && !max) return "Negotiable";
    if (min && max) return `${curr} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${curr} ${min.toLocaleString()}+`;
    return `Up to ${curr} ${max?.toLocaleString()}`;
  };

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  if (!tender) {
    return (
      <div className="min-h-screen flex flex-col" data-testid="tender-not-found">
        <Header />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
          <BackButton />
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Tender Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The tender you are looking for does not exist or has been removed.
              </p>
              <Link href="/tenders">
                <Button data-testid="button-back-to-tenders">Back to Tenders</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const isOpen = tender.status === "open";

  return (
    <div className="min-h-screen flex flex-col" data-testid="tender-detail-page">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2" data-testid="text-tender-title">
                        {tender.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {getTypeBadge(tender.type)}
                        {getStatusBadge(tender.status)}
                        <Badge variant="outline" data-testid="text-tender-category">{tender.category}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-tender-description">
                      {tender.description}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Posted by:</span>
                      <span data-testid="text-tender-employer">{getEmployerName(tender.employerId)}</span>
                    </div>
                    {tender.sector && (
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Sector:</span>
                        <span className="capitalize" data-testid="text-tender-sector">{tender.sector}</span>
                      </div>
                    )}
                    {tender.county && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-muted-foreground">Location(s): </span>
                          <span data-testid="text-tender-county">
                            {tender.county}{tender.district ? ` | Districts: ${tender.district}` : ""}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Budget:</span>
                      <span data-testid="text-tender-budget">
                        {formatBudget(tender.budgetMin, tender.budgetMax, tender.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Deadline:</span>
                      <span data-testid="text-tender-deadline">
                        {new Date(tender.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Posted:</span>
                      <span data-testid="text-tender-posted">
                        {new Date(tender.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {tender.requirements && (
                    <div>
                      <h3 className="font-semibold mb-2">Requirements</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-tender-requirements">
                        {tender.requirements}
                      </p>
                    </div>
                  )}

                  {tender.deliverables && (
                    <div>
                      <h3 className="font-semibold mb-2">Deliverables</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-tender-deliverables">
                        {tender.deliverables}
                      </p>
                    </div>
                  )}

                  {tender.eligibility && (
                    <div>
                      <h3 className="font-semibold mb-2">Eligibility Criteria</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap" data-testid="text-tender-eligibility">
                        {tender.eligibility}
                      </p>
                    </div>
                  )}

                  {(tender.contactEmail || tender.contactPhone) && (
                    <div>
                      <h3 className="font-semibold mb-2">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        {tender.contactEmail && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <span data-testid="text-tender-contact-email">{tender.contactEmail}</span>
                          </div>
                        )}
                        {tender.contactPhone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <span data-testid="text-tender-contact-phone">{tender.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {!isOpen && (
                <Card>
                  <CardContent className="py-8 text-center">
                    {tender.status === "awarded" && (
                      <>
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-blue-500" />
                        <h3 className="font-semibold mb-1" data-testid="text-status-message">Tender Awarded</h3>
                        <p className="text-sm text-muted-foreground">This tender has been awarded to a bidder.</p>
                      </>
                    )}
                    {tender.status === "closed" && (
                      <>
                        <XCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                        <h3 className="font-semibold mb-1" data-testid="text-status-message">Tender Closed</h3>
                        <p className="text-sm text-muted-foreground">This tender is no longer accepting bids.</p>
                      </>
                    )}
                    {tender.status === "cancelled" && (
                      <>
                        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
                        <h3 className="font-semibold mb-1" data-testid="text-status-message">Tender Cancelled</h3>
                        <p className="text-sm text-muted-foreground">This tender has been cancelled.</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {isOpen && !isAuthenticated && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Gavel className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="font-semibold mb-2">Interested in this tender?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Log in to submit your bid for this opportunity.
                    </p>
                    <Link href="/login">
                      <Button className="gap-2" data-testid="button-login-to-bid">
                        Login to Submit a Bid
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {isOpen && isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2" data-testid="text-bid-form-title">
                      <Send className="w-5 h-5" />
                      Submit Your Bid
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="bidderName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Your Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Full name" {...field} data-testid="input-bidder-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bidderEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="email@example.com" {...field} data-testid="input-bidder-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bidderPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="+231 xxx xxx xxxx" {...field} data-testid="input-bidder-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Your company or organization" {...field} data-testid="input-company-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="proposalText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Proposal *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your proposal, approach, and methodology..."
                                  className="min-h-24"
                                  {...field}
                                  data-testid="input-proposal"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Proposed Price *</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="0" {...field} data-testid="input-price" />
                                </FormControl>
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-bid-currency">
                                      <SelectValue placeholder="Currency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="LRD">LRD</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="deliveryTimeline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delivery Timeline</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 30 days, 3 months" {...field} data-testid="input-delivery-timeline" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="experience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relevant Experience</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your relevant experience and past projects..."
                                  className="min-h-20"
                                  {...field}
                                  data-testid="input-experience"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-3">
                          <label className="text-sm font-medium leading-none">
                            Supporting Documents
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Upload certificates, registrations, tax clearance, financial statements, or other required documents (PDF, DOC, DOCX, JPG, PNG - max 10MB each)
                          </p>

                          {uploadedDocs.length > 0 && (
                            <div className="space-y-2">
                              {uploadedDocs.map((doc, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                                  data-testid={`uploaded-doc-${index}`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{doc.name}</span>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                      ({(doc.size / 1024).toFixed(0)} KB)
                                    </span>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeDoc(index)}
                                    data-testid={`button-remove-doc-${index}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isUploadingFile}
                              onClick={() => document.getElementById("bid-file-input")?.click()}
                              className="gap-2"
                              data-testid="button-upload-documents"
                            >
                              {isUploadingFile ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Upload Documents
                                </>
                              )}
                            </Button>
                            <input
                              id="bid-file-input"
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                              className="hidden"
                              onChange={handleFileUpload}
                              data-testid="input-file-upload"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={submitBidMutation.isPending}
                          className="w-full gap-2"
                          data-testid="button-submit-bid"
                        >
                          {submitBidMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Submit Bid
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
