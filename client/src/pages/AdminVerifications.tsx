import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageLoadingSpinner, SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  ShieldCheck, 
  ShieldX,
  FileText,
  Clock,
  RefreshCw,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle,
  XCircle,
  ShieldAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  sector: string | null;
  county: string | null;
  organizationName: string | null;
  organizationType: string | null;
  phone: string | null;
  approvalStatus: string;
  businessRegistrationNumber: string | null;
  businessCertificateUrl: string | null;
  taxClearanceUrl: string | null;
  idNumber: string | null;
  idCardUrl: string | null;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  director: "Director of Statistics",
  ministry: "Ministry Verifier",
  employer: "Employer",
  enumerator: "County Enumerator",
  individual: "Individual Worker",
};

export default function AdminVerifications() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingUsers = [], isLoading, refetch, isError } = useQuery<PendingUser[]>({
    queryKey: ["/api/admin/pending-registrations"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes?: string }) => {
      return apiRequest("POST", `/api/admin/registrations/${userId}/approve`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-registrations"] });
      toast({ title: "Registration approved successfully" });
      setReviewDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to approve registration", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ userId, notes }: { userId: string; notes: string }) => {
      return apiRequest("POST", `/api/admin/registrations/${userId}/reject`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-registrations"] });
      toast({ title: "Registration rejected" });
      setRejectDialogOpen(false);
      setSelectedUser(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to reject registration", description: error.message, variant: "destructive" });
    },
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openReviewDialog = (pendingUser: PendingUser) => {
    setSelectedUser(pendingUser);
    setReviewDialogOpen(true);
  };

  const openRejectDialog = () => {
    setReviewDialogOpen(false);
    setRejectDialogOpen(true);
  };

  const handleApprove = () => {
    if (selectedUser) {
      approveMutation.mutate({ userId: selectedUser.id, notes: "Verified and approved" });
    }
  };

  const handleReject = () => {
    if (selectedUser && rejectionReason.trim()) {
      rejectMutation.mutate({ userId: selectedUser.id, notes: rejectionReason });
    }
  };

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (user.role !== "admin" && user.role !== "ministry") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You must be an administrator or ministry verifier to access this page.</p>
        <Button asChild>
          <Link href="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8 max-w-6xl">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pending Verifications</h1>
              <p className="text-muted-foreground">Review and verify new registrations</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <SectionLoadingSpinner />
        ) : isError ? (
          <Card className="text-center py-12">
            <CardContent>
              <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-destructive opacity-50" />
              <h3 className="font-semibold mb-2">Failed to load pending registrations</h3>
              <p className="text-muted-foreground mb-4">Please try refreshing the page</p>
              <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        ) : pendingUsers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="font-semibold mb-2">No pending verifications at this time</h3>
              <p className="text-muted-foreground">New submissions will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingUsers.map((pendingUser) => (
              <Card key={pendingUser.id} data-testid={`card-pending-${pendingUser.id}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${pendingUser.role === "employer" ? "bg-blue-100 dark:bg-blue-900" : "bg-green-100 dark:bg-green-900"}`}>
                            {pendingUser.role === "employer" ? (
                              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">
                              {pendingUser.firstName} {pendingUser.lastName}
                            </h3>
                            <Badge variant="secondary">
                              {roleLabels[pendingUser.role] || pendingUser.role}
                            </Badge>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          {pendingUser.email}
                        </div>
                        {pendingUser.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            {pendingUser.phone}
                          </div>
                        )}
                        {pendingUser.county && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {pendingUser.county}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Registered {formatDate(pendingUser.createdAt)}
                        </div>
                      </div>

                      {pendingUser.organizationName && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="font-medium">{pendingUser.organizationName}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {pendingUser.sector || pendingUser.organizationType}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {pendingUser.role === "employer" ? (
                          <>
                            {pendingUser.businessRegistrationNumber && (
                              <Badge variant="outline">
                                Reg #: {pendingUser.businessRegistrationNumber}
                              </Badge>
                            )}
                            {pendingUser.businessCertificateUrl && (
                              <Badge variant="outline" className="gap-1">
                                <FileText className="h-3 w-3" />
                                Business Certificate
                              </Badge>
                            )}
                            {pendingUser.taxClearanceUrl && (
                              <Badge variant="outline" className="gap-1">
                                <FileText className="h-3 w-3" />
                                Tax Clearance
                              </Badge>
                            )}
                          </>
                        ) : (
                          <>
                            {pendingUser.idNumber && (
                              <Badge variant="outline">
                                ID #: {pendingUser.idNumber}
                              </Badge>
                            )}
                            {pendingUser.idCardUrl && (
                              <Badge variant="outline" className="gap-1">
                                <FileText className="h-3 w-3" />
                                ID Card Copy
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 md:justify-center">
                      <Button 
                        onClick={() => openReviewDialog(pendingUser)} 
                        data-testid={`button-review-${pendingUser.id}`}
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Registration</DialogTitle>
              <DialogDescription>
                Review the submitted documents and approve or reject this registration
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedUser.role === "employer" ? "bg-blue-100 dark:bg-blue-900" : "bg-green-100 dark:bg-green-900"}`}>
                    {selectedUser.role === "employer" ? (
                      <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <User className="h-8 w-8 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <Badge>{roleLabels[selectedUser.role] || selectedUser.role}</Badge>
                  </div>
                </div>

                {selectedUser.organizationName && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Organization Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedUser.organizationName}</span>
                      </div>
                      {selectedUser.sector && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Sector:</span>
                          <span className="font-medium capitalize">{selectedUser.sector}</span>
                        </div>
                      )}
                      {selectedUser.county && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">County:</span>
                          <span className="font-medium capitalize">{selectedUser.county}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Submitted Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedUser.role === "employer" ? (
                      <>
                        {selectedUser.businessRegistrationNumber && (
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Business Registration #:</span>
                            <span className="font-mono font-medium">{selectedUser.businessRegistrationNumber}</span>
                          </div>
                        )}
                        {selectedUser.businessCertificateUrl && (
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">Business Certificate:</span>
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedUser.businessCertificateUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Document
                              </a>
                            </Button>
                          </div>
                        )}
                        {selectedUser.taxClearanceUrl && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">Tax Clearance:</span>
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedUser.taxClearanceUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Document
                              </a>
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {selectedUser.idNumber && (
                          <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-muted-foreground">National ID #:</span>
                            <span className="font-mono font-medium">{selectedUser.idNumber}</span>
                          </div>
                        )}
                        {selectedUser.idCardUrl && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-muted-foreground">ID Card Copy:</span>
                            <Button variant="outline" size="sm" asChild>
                              <a href={selectedUser.idCardUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Document
                              </a>
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                <DialogFooter className="flex gap-2 sm:gap-0">
                  <Button
                    variant="destructive"
                    onClick={openRejectDialog}
                    disabled={rejectMutation.isPending}
                    data-testid="button-reject"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    data-testid="button-approve"
                  >
                    {approveMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Registration</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this registration. This will be shared with the applicant.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                data-testid="textarea-rejection-reason"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setReviewDialogOpen(true);
                }}
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                data-testid="button-confirm-reject"
              >
                {rejectMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
