import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import ministryOfLaborLogo from "@/assets/images/ministry-of-labor-logo.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().default(false)
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false
    }
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast({
          title: "Login Successful",
          description: "Welcome back to LiJOBS!"
        });
        setLocation("/dashboard");
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid email or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="login-page">
      <Header />
      <main className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <BackButton />
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-white border mx-auto mb-4 overflow-hidden">
              <img src={ministryOfLaborLogo} alt="LiJOBS" className="w-full h-full object-contain p-1" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-login-title">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your LiJOBS account</p>
          </div>

          {/* Demo Account Info */}
          <Card className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-medium mb-2">Demo Accounts Available:</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p><strong>Admin:</strong> demo_admin@test.com</p>
                <p><strong>Ministry:</strong> demo_ministry@test.com</p>
                <p><strong>Director:</strong> demo_director@test.com</p>
                <p><strong>Employer:</strong> demo_private@test.com</p>
                <p><strong>Enumerator:</strong> demo_enumerator@test.com</p>
                <p><strong>Password:</strong> Demo@2025</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="pl-10"
                              disabled={isLoading}
                              {...field}
                              data-testid="input-login-email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <a href="#" className="text-sm text-primary" data-testid="link-forgot-password">Forgot password?</a>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              className="pl-10"
                              disabled={isLoading}
                              {...field}
                              data-testid="input-login-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remember"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                            data-testid="checkbox-remember"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          Remember me for 30 days
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full gap-2" 
                    size="lg" 
                    disabled={isLoading}
                    data-testid="button-login-submit"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full gap-2" disabled={isLoading} data-testid="button-sso">
                  Continue with Government SSO
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-medium" data-testid="link-register">
              Register here
            </Link>
          </p>

          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{" "}
              <a href="#" className="underline" data-testid="link-terms">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="underline" data-testid="link-privacy">Privacy Policy</a>
            </p>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
