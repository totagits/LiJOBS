import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PageLoadingSpinner, SectionLoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Users, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  Shield, 
  Building2, 
  UserCheck,
  UserX,
  Clock,
  Mail,
  Phone,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface SafeUser {
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
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  director: "Director of Statistics",
  ministry: "Ministry Verifier",
  employer: "Employer",
  enumerator: "County Enumerator",
  individual: "Individual Worker",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  director: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  ministry: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  employer: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  enumerator: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  individual: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const liberianCounties = [
  "Bomi", "Bong", "Gbarpolu", "Grand Bassa", "Grand Cape Mount",
  "Grand Gedeh", "Grand Kru", "Lofa", "Margibi", "Maryland",
  "Montserrado", "Nimba", "River Cess", "River Gee", "Sinoe"
];

const sectors = ["public", "private", "ngo", "informal", "seasonal"];

const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "ministry", "employer", "enumerator", "individual"]),
  sector: z.string().optional(),
  county: z.string().optional(),
  organizationName: z.string().optional(),
  organizationType: z.string().optional(),
  phone: z.string().optional(),
});

const editUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "ministry", "employer", "enumerator", "individual"]),
  sector: z.string().optional(),
  county: z.string().optional(),
  organizationName: z.string().optional(),
  organizationType: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  isActive: z.boolean(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

export default function AdminUsers() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);

  const { data: users = [], isLoading, refetch } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/toggle-status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user status", description: error.message, variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user role", description: error.message, variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      return apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User created successfully" });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create user", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<EditUserFormData> }) => {
      const cleanData = { ...data };
      if (!cleanData.password) {
        delete cleanData.password;
      }
      return apiRequest("PUT", `/api/admin/users/${id}`, cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated successfully" });
      setEditDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update user", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete user", description: error.message, variant: "destructive" });
    },
  });

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "individual",
      sector: "",
      county: "",
      organizationName: "",
      organizationType: "",
      phone: "",
    },
  });

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: "individual",
      sector: "",
      county: "",
      organizationName: "",
      organizationType: "",
      phone: "",
      password: "",
      isActive: true,
    },
  });

  const handleEditUser = (u: SafeUser) => {
    setSelectedUser(u);
    editForm.reset({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role as "admin" | "ministry" | "employer" | "enumerator" | "individual",
      sector: u.sector || "",
      county: u.county || "",
      organizationName: u.organizationName || "",
      organizationType: u.organizationType || "",
      phone: u.phone || "",
      password: "",
      isActive: u.isActive,
    });
    setEditDialogOpen(true);
  };

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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.organizationName && u.organizationName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.isActive) ||
      (statusFilter === "inactive" && !u.isActive) ||
      (statusFilter === "demo" && u.isDemo);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    inactive: users.filter((u) => !u.isActive).length,
    demo: users.filter((u) => u.isDemo).length,
    byRole: {
      admin: users.filter((u) => u.role === "admin").length,
      ministry: users.filter((u) => u.role === "ministry").length,
      employer: users.filter((u) => u.role === "employer").length,
      enumerator: users.filter((u) => u.role === "enumerator").length,
      individual: users.filter((u) => u.role === "individual").length,
    },
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-8 max-w-7xl">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">Create, edit, and manage all registered users</p>
            </div>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-user">
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. All fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit((data) => createUserMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} data-testid="input-create-firstname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} data-testid="input-create-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john.doe@example.com" {...field} data-testid="input-create-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Minimum 6 characters" {...field} data-testid="input-create-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-role">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="ministry">Ministry Verifier</SelectItem>
                            <SelectItem value="employer">Employer</SelectItem>
                            <SelectItem value="enumerator">County Enumerator</SelectItem>
                            <SelectItem value="individual">Individual Worker</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+231-XX-XXX-XXXX" {...field} data-testid="input-create-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-create-county">
                                <SelectValue placeholder="Select county" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {liberianCounties.map((county) => (
                                <SelectItem key={county} value={county}>{county}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sector</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-create-sector">
                                <SelectValue placeholder="Select sector" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sectors.map((s) => (
                                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={createForm.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Organization name" {...field} data-testid="input-create-org" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="organizationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-orgtype">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="government">Government</SelectItem>
                            <SelectItem value="private">Private Company</SelectItem>
                            <SelectItem value="ngo">NGO</SelectItem>
                            <SelectItem value="international">International Organization</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createUserMutation.isPending} data-testid="button-submit-create">
                      {createUserMutation.isPending ? "Creating..." : "Create User"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.byRole.admin}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-cyan-500" />
              <div>
                <p className="text-2xl font-bold">{stats.byRole.employer}</p>
                <p className="text-xs text-muted-foreground">Employers</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.demo}</p>
                <p className="text-xs text-muted-foreground">Demo</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Users ({filteredUsers.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh-users">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-role-filter">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="ministry">Ministry Verifier</SelectItem>
                  <SelectItem value="employer">Employer</SelectItem>
                  <SelectItem value="enumerator">Enumerator</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="demo">Demo Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <SectionLoadingSpinner />
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Users className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No users found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {u.firstName} {u.lastName}
                            </span>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </div>
                            {u.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {u.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={roleColors[u.role] || ""}>
                            {roleLabels[u.role] || u.role}
                          </Badge>
                          {u.isDemo && (
                            <Badge variant="outline" className="ml-1 text-xs">
                              Demo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {u.organizationName ? (
                            <div className="flex flex-col">
                              <span className="font-medium">{u.organizationName}</span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {u.sector || u.organizationType || "-"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.isActive}
                              onCheckedChange={() => toggleStatusMutation.mutate(u.id)}
                              disabled={u.isDemo || toggleStatusMutation.isPending}
                              data-testid={`switch-status-${u.id}`}
                            />
                            <span className={u.isActive ? "text-green-600" : "text-red-600"}>
                              {u.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(u.lastLogin)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(u.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditUser(u)}
                              disabled={u.isDemo}
                              data-testid={`button-edit-${u.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  disabled={u.isDemo || u.id === user.id}
                                  data-testid={`button-delete-${u.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {u.firstName} {u.lastName}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUserMutation.mutate(u.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    data-testid={`button-confirm-delete-${u.id}`}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. Leave password empty to keep current password.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit((data) => updateUserMutation.mutate({ id: selectedUser.id, data }))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-edit-firstname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-edit-lastname" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-edit-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password (optional)</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Leave empty to keep current" {...field} data-testid="input-edit-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-role">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Administrator</SelectItem>
                              <SelectItem value="ministry">Ministry Verifier</SelectItem>
                              <SelectItem value="employer">Employer</SelectItem>
                              <SelectItem value="enumerator">County Enumerator</SelectItem>
                              <SelectItem value="individual">Individual Worker</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <div className="flex items-center gap-2 h-10">
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-edit-active"
                            />
                            <span className={field.value ? "text-green-600" : "text-red-600"}>
                              {field.value ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+231-XX-XXX-XXXX" {...field} data-testid="input-edit-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="county"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>County</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-county">
                                <SelectValue placeholder="Select county" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {liberianCounties.map((county) => (
                                <SelectItem key={county} value={county}>{county}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="sector"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sector</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-sector">
                                <SelectValue placeholder="Select sector" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {sectors.map((s) => (
                                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={editForm.control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-org" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="organizationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-orgtype">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="government">Government</SelectItem>
                            <SelectItem value="private">Private Company</SelectItem>
                            <SelectItem value="ngo">NGO</SelectItem>
                            <SelectItem value="international">International Organization</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateUserMutation.isPending} data-testid="button-submit-edit">
                      {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
