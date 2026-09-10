import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  Building2,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(3, "Subject is required"),
  category: z.string().min(1, "Please select a category"),
  message: z.string().min(10, "Message must be at least 10 characters")
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      category: "",
      message: ""
    }
  });

  const onSubmit = (data: ContactFormData) => {
    toast({
      title: "Message Sent",
      description: "Thank you for contacting us. We'll respond within 2 business days."
    });
    form.reset();
  };

  return (
    <div className="min-h-screen" data-testid="contact-page">
      <Header />
      <main className="pt-24">
        <section className="relative py-16 bg-primary text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <BackButton />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4">Get in Touch</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-contact-title">
                Contact Us
              </h1>
              <p className="text-xl text-white/80 max-w-3xl">
                Have questions about LiJOBS? Need support with the platform? 
                We're here to help.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle>Send us a Message</CardTitle>
                        <CardDescription>Fill out the form and we'll get back to you</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} data-testid="input-name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="you@example.com" {...field} data-testid="input-email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                  <Input placeholder="What's this about?" {...field} data-testid="input-subject" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-category">
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="general">General Inquiry</SelectItem>
                                    <SelectItem value="technical">Technical Support</SelectItem>
                                    <SelectItem value="employer">Employer Registration</SelectItem>
                                    <SelectItem value="data">Data Access Request</SelectItem>
                                    <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us how we can help..."
                                  rows={6}
                                  {...field}
                                  data-testid="input-message"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" size="lg" className="gap-2" data-testid="button-submit-contact">
                          <Send className="w-4 h-4" />
                          Send Message
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Email</p>
                        <a href="mailto:info@ljobs.gov.lr" className="text-sm text-muted-foreground" data-testid="link-contact-email">
                          info@ljobs.gov.lr
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Phone</p>
                        <a href="tel:+231777000000" className="text-sm text-muted-foreground" data-testid="link-contact-phone">
                          +231 777 000 000
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-contact-address">
                          Ministry of Labor Building<br />
                          Capitol Hill, Monrovia<br />
                          Republic of Liberia
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Office Hours</p>
                        <p className="text-sm text-muted-foreground" data-testid="text-contact-hours">
                          Monday - Friday<br />
                          8:00 AM - 5:00 PM (GMT)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-secondary/30 bg-secondary/5">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-secondary" />
                      <CardTitle className="text-lg">Employer Support</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Need help with employer registration or job reporting? Our dedicated employer support team is available.
                    </p>
                    <Button variant="secondary" className="w-full" asChild data-testid="button-employer-support">
                      <a href="tel:+231777000001">
                        <Phone className="w-4 h-4 mr-2" />
                        Employer Hotline: +231 777 000 001
                      </a>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <iframe
                        title="Ministry of Labor, Capitol Hill, Monrovia"
                        src="https://www.openstreetmap.org/export/embed.html?bbox=-10.812%2C6.305%2C-10.798%2C6.315&layer=mapnik&marker=6.3105%2C-10.8048"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        data-testid="map-capitol-hill"
                      />
                    </div>
                    <a
                      href="https://www.openstreetmap.org/?mlat=6.3105&mlon=-10.8048#map=16/6.3105/-10.8048"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 mt-3 text-sm text-primary hover:underline"
                      data-testid="link-open-map"
                    >
                      <MapPin className="w-4 h-4" />
                      View larger map
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
