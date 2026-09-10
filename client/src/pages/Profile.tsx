import { useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { useAuth, getRoleLabel, getSectorLabel } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  User, 
  Building2, 
  MapPin, 
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
  Save
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().optional(),
  organizationName: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
      organizationName: user?.organizationName || "",
    }
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || "",
        organizationName: user.organizationName || "",
      });
    }
  }, [user, form]);

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  const onSubmit = async (data: ProfileFormData) => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved."
    });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen" data-testid="profile-page">
      <Header />
      <main className="pt-24 pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold" data-testid="text-profile-title">Account Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your LiJOBS account information</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Account Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-12 h-12 text-primary" />
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-semibold text-lg">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.isDemo && (
                      <Badge variant="outline" className="mt-2">Demo Account</Badge>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Role:</span>
                      <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                    </div>
                    
                    {user.sector && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Sector:</span>
                        <span>{getSectorLabel(user.sector)}</span>
                      </div>
                    )}
                    
                    {user.county && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">County:</span>
                        <span>{user.county}</span>
                      </div>
                    )}

                    <Separator />
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="text-xs">{formatDate(user.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Login:</span>
                      <span className="text-xs">{formatDate(user.lastLogin)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Edit Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="md:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <FormLabel>Email Address</FormLabel>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            value={user.email} 
                            disabled 
                            className="pl-10 bg-muted"
                            data-testid="input-email"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                  className="pl-10"
                                  placeholder="+231 XXX XXX XXX"
                                  {...field} 
                                  data-testid="input-phone"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {user.role === "employer" && (
                        <FormField
                          control={form.control}
                          name="organizationName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input 
                                    className="pl-10"
                                    {...field} 
                                    data-testid="input-organization"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <Button type="submit" className="gap-2" data-testid="button-save-profile">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your account security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed: Never</p>
                    </div>
                    <Button variant="outline" data-testid="button-change-password">
                      Change Password
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" disabled data-testid="button-enable-2fa">
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
