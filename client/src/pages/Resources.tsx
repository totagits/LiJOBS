import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Search,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  ExternalLink,
  Download,
  Play,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

const faqs = [
  {
    question: "What is LiJOBS?",
    answer: "LiJOBS (Liberia Jobs Observatory System) is the official National Job Creation Data Platform for the Republic of Liberia. It provides real-time, trustworthy, and privacy-safe employment statistics across all sectors including public, private, NGO/projects, informal, and seasonal work."
  },
  {
    question: "How is employment data collected?",
    answer: "Employment data is collected through multiple channels: employer self-reporting through the Employer Portal, field enumeration using the mobile app, county office reporting, and bulk data uploads from partner organizations. All data goes through a rigorous verification process."
  },
  {
    question: "How do I register as an employer?",
    answer: "To register as an employer, click the 'Register' button in the header and select 'Employer Registration'. You'll need to provide your business details, tax identification number, and contact information. Once verified, you can start reporting employment data through the Employer Portal."
  },
  {
    question: "What types of employment are tracked?",
    answer: "LiJOBS tracks all forms of employment including: full-time positions, part-time work, contract/temporary employment, seasonal work, informal sector jobs, and self-employment. Each employment record is treated as a time-bound 'spell' with start and end dates."
  },
  {
    question: "How is data privacy protected?",
    answer: "LiJOBS employs strict privacy protections including data anonymization for public statistics, encrypted storage, role-based access controls, and compliance with Liberian data protection regulations. Individual employee data is never publicly disclosed."
  },
  {
    question: "Can I access raw employment data?",
    answer: "Aggregated and anonymized data is available through the Data Portal. For more detailed data access, researchers and government agencies can apply for API access. Individual-level data is not available to protect privacy."
  },
  {
    question: "How often is the data updated?",
    answer: "The platform receives real-time updates from employers and enumerators. Summary statistics are refreshed daily, while detailed reports are published monthly and quarterly."
  },
  {
    question: "What counties are covered?",
    answer: "LiJOBS provides complete coverage across all 15 Liberian counties: Bomi, Bong, Gbarpolu, Grand Bassa, Grand Cape Mount, Grand Gedeh, Grand Kru, Lofa, Margibi, Maryland, Montserrado, Nimba, River Cess, River Gee, and Sinoe."
  }
];

const staticGuides = [
  {
    id: "employer-guide",
    title: "Employer Portal User Guide",
    description: "Complete guide to registering and reporting employment data as an employer",
    type: "PDF Guide",
    icon: FileText,
    videoUrl: null,
    trainingVideoKey: null
  },
  {
    id: "getting-started-video",
    title: "Video: Getting Started with LiJOBS",
    description: "Step-by-step video tutorial for new users",
    type: "Video",
    icon: Video,
    videoUrl: null,
    trainingVideoKey: "How to Register on LiJOBS"
  },
  {
    id: "enumerator-manual",
    title: "Enumerator Mobile App Manual",
    description: "Instructions for field data collection using the mobile app",
    type: "PDF Manual",
    icon: FileText,
    videoUrl: null,
    trainingVideoKey: null
  },
  {
    id: "data-interpretation",
    title: "Data Interpretation Guide",
    description: "Understanding employment statistics and methodology",
    type: "PDF Guide",
    icon: BookOpen,
    videoUrl: null,
    trainingVideoKey: null
  },
  {
    id: "api-docs",
    title: "API Documentation",
    description: "Technical documentation for developers accessing LiJOBS data",
    type: "Online Docs",
    icon: FileText,
    videoUrl: null,
    trainingVideoKey: null
  },
  {
    id: "bulk-upload-video",
    title: "Video: Bulk Data Upload Tutorial",
    description: "How to upload employment data in bulk using Excel templates",
    type: "Video",
    icon: Video,
    videoUrl: null,
    trainingVideoKey: "Bulk Upload"
  }
];

const quickDownloads = [
  { name: "Employer Registration Form", size: "PDF - 245 KB", id: "employer-form" },
  { name: "Data Template (Excel)", size: "XLSX - 120 KB", id: "data-template" },
  { name: "API Quick Start Guide", size: "PDF - 890 KB", id: "api-guide" }
];

interface TrainingVideo {
  id: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: string | null;
  category: string;
  targetAudience: string;
  isPublished: boolean;
}

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{ title: string; videoUrl: string } | null>(null);
  const { toast } = useToast();

  // Fetch training videos from admin dashboard
  const { data: trainingVideos = [] } = useQuery<TrainingVideo[]>({
    queryKey: ["/api/training/videos"],
  });

  // Build guides with actual video URLs from training videos
  const guides = staticGuides.map(guide => {
    if (guide.trainingVideoKey) {
      const matchingVideo = trainingVideos.find(
        v => v.title.toLowerCase().includes(guide.trainingVideoKey!.toLowerCase()) ||
             guide.trainingVideoKey!.toLowerCase().includes(v.title.toLowerCase())
      );
      if (matchingVideo && matchingVideo.videoUrl) {
        return {
          ...guide,
          videoUrl: matchingVideo.videoUrl
        };
      }
    }
    return guide;
  });

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateEmployerRegistrationForm = async () => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("LiJOBS - Employer Registration Form", 14, 15);
    doc.setFontSize(10);
    doc.text("Ministry of Labor | Republic of Liberia", 14, 25);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("Please complete all fields and submit to your local County Labor Office", 14, 45);
    
    doc.setFontSize(11);
    let y = 60;
    
    // Section 1: Organization Details
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y, 182, 8, "F");
    doc.setFontSize(12);
    doc.text("Section 1: Organization Details", 16, y + 6);
    y += 15;
    
    const fields1 = [
      "Organization Name: _________________________________________________",
      "Tax Identification Number (TIN): ____________________________________",
      "Business Registration Number: ______________________________________",
      "Physical Address: __________________________________________________",
      "County: ________________________  District: ________________________",
      "Phone Number: ____________________  Email: _________________________"
    ];
    
    doc.setFontSize(10);
    fields1.forEach(field => {
      doc.text(field, 16, y);
      y += 10;
    });
    
    y += 5;
    
    // Section 2: Contact Person
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y, 182, 8, "F");
    doc.setFontSize(12);
    doc.text("Section 2: Authorized Contact Person", 16, y + 6);
    y += 15;
    
    const fields2 = [
      "Full Name: ________________________________________________________",
      "Position/Title: ____________________________________________________",
      "Phone: ________________________  Email: ____________________________"
    ];
    
    doc.setFontSize(10);
    fields2.forEach(field => {
      doc.text(field, 16, y);
      y += 10;
    });
    
    y += 5;
    
    // Section 3: Sector
    doc.setFillColor(240, 240, 240);
    doc.rect(14, y, 182, 8, "F");
    doc.setFontSize(12);
    doc.text("Section 3: Sector Classification", 16, y + 6);
    y += 15;
    
    doc.setFontSize(10);
    doc.text("Select your primary sector (check one):", 16, y);
    y += 8;
    
    const sectors = ["[ ] Private Sector", "[ ] Public Sector", "[ ] NGO/Projects", "[ ] Informal Sector", "[ ] Seasonal"];
    sectors.forEach(sector => {
      doc.text(sector, 20, y);
      y += 7;
    });
    
    y += 10;
    
    // Signature
    doc.text("Authorized Signature: ____________________  Date: ________________", 16, y);
    y += 15;
    doc.text("Official Stamp:", 16, y);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("LiJOBS Employer Registration Form | Version 1.0 | For official use only", 105, 285, { align: "center" });
    
    doc.save("LiJOBS_Employer_Registration_Form.pdf");
  };

  const generateDataTemplate = async () => {
    const XLSX = await import("xlsx");
    // Create Excel template for bulk upload
    const templateData = [
      ["First Name", "Last Name", "Job Title", "Sector", "County", "Start Date", "End Date", "Wage Amount", "Wage Period", "Currency", "Contract Type", "Notes"],
      ["John", "Doe", "Farm Worker", "Private", "Montserrado", "2025-01-15", "", "15000", "Monthly", "LRD", "Permanent", "Sample entry"],
      ["Jane", "Smith", "Office Assistant", "Public", "Nimba", "2025-02-01", "2025-12-31", "250", "Monthly", "USD", "Contract", "Sample entry"],
      ["", "", "", "", "", "", "", "", "", "", "", ""],
      ["INSTRUCTIONS:", "", "", "", "", "", "", "", "", "", "", ""],
      ["1. Fill in employee data starting from row 2", "", "", "", "", "", "", "", "", "", "", ""],
      ["2. Sector options: Private, Public, NGO/Projects, Informal, Seasonal", "", "", "", "", "", "", "", "", "", "", ""],
      ["3. Wage Period options: Daily, Weekly, Monthly", "", "", "", "", "", "", "", "", "", "", ""],
      ["4. Currency options: LRD, USD, LRD_USD (for dual currency)", "", "", "", "", "", "", "", "", "", "", ""],
      ["5. Contract Type options: Permanent, Contract, Seasonal, Casual", "", "", "", "", "", "", "", "", "", "", ""],
      ["6. Leave End Date empty for ongoing employment", "", "", "", "", "", "", "", "", "", "", ""]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 14 }, { wch: 20 }
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employee Data");
    
    XLSX.writeFile(wb, "LiJOBS_Bulk_Upload_Template.xlsx");
  };

  const generateAPIGuide = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("LiJOBS API Quick Start Guide", 14, 15);
    doc.setFontSize(10);
    doc.text("Developer Documentation | Version 1.0", 14, 25);
    
    doc.setTextColor(0, 51, 102);
    doc.setFontSize(14);
    doc.text("Getting Started with the LiJOBS API", 14, 50);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    let y = 60;
    
    const content = [
      "1. AUTHENTICATION",
      "   All API requests require authentication using an API key.",
      "   Include your key in the request header: Authorization: Bearer YOUR_API_KEY",
      "",
      "2. BASE URL",
      "   Production: https://api.lijobs.gov.lr/v1",
      "   Sandbox: https://sandbox-api.lijobs.gov.lr/v1",
      "",
      "3. AVAILABLE ENDPOINTS",
      "",
    ];
    
    content.forEach(line => {
      doc.text(line, 14, y);
      y += 6;
    });
    
    autoTable(doc, {
      startY: y,
      head: [["Endpoint", "Method", "Description"]],
      body: [
        ["/stats", "GET", "Get national employment statistics"],
        ["/counties", "GET", "List all counties with job data"],
        ["/counties/:id", "GET", "Get specific county details"],
        ["/sectors", "GET", "List employment by sector"],
        ["/employers", "GET", "List registered employers"],
        ["/jobs", "POST", "Submit new job record"],
        ["/jobs/:id", "PUT", "Update existing job record"],
      ],
      theme: "striped",
      headStyles: { fillColor: [0, 51, 102] },
    });
    
    y = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(10);
    const moreContent = [
      "4. RATE LIMITS",
      "   - Standard tier: 100 requests per minute",
      "   - Premium tier: 1000 requests per minute",
      "",
      "5. RESPONSE FORMAT",
      "   All responses are in JSON format with the structure:",
      '   { "success": true, "data": {...}, "meta": {...} }',
      "",
      "6. ERROR HANDLING",
      '   Errors return: { "success": false, "error": { "code": "...", "message": "..." } }',
      "",
      "For full documentation, visit: https://docs.lijobs.gov.lr"
    ];
    
    moreContent.forEach(line => {
      doc.text(line, 14, y);
      y += 6;
    });
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("LiJOBS API Documentation | Ministry of Labor | Republic of Liberia", 105, 285, { align: "center" });
    
    doc.save("LiJOBS_API_Quick_Start_Guide.pdf");
  };

  const handleQuickDownload = (item: typeof quickDownloads[0]) => {
    if (item.id === "employer-form") {
      generateEmployerRegistrationForm();
    } else if (item.id === "data-template") {
      generateDataTemplate();
    } else if (item.id === "api-guide") {
      generateAPIGuide();
    }
    
    toast({
      title: "Download Complete",
      description: `"${item.name}" has been downloaded.`,
    });
  };

  const generateGuideDocument = async (guide: typeof guides[0]) => {
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(0, 51, 102);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(guide.title, 14, 15);
    doc.setFontSize(10);
    doc.text("LiJOBS Official Documentation", 14, 25);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    const descLines = doc.splitTextToSize(guide.description, 180);
    doc.text(descLines, 14, 50);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text("Table of Contents", 14, 70);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    const toc = [
      "1. Introduction",
      "2. Getting Started",
      "3. Key Features",
      "4. Step-by-Step Instructions",
      "5. Troubleshooting",
      "6. Contact & Support"
    ];
    
    let y = 80;
    toc.forEach(item => {
      doc.text(item, 20, y);
      y += 8;
    });
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`LiJOBS ${guide.type} | Generated ${new Date().toLocaleDateString()}`, 105, 285, { align: "center" });
    
    doc.save(`LiJOBS_${guide.id.replace(/-/g, '_')}.pdf`);
  };

  const handleGuideClick = (guide: { id: string; title: string; description: string; type: string; videoUrl: string | null }) => {
    if (guide.type === "Video" && guide.videoUrl) {
      // Open video in modal from training videos
      setCurrentVideo({ title: guide.title, videoUrl: guide.videoUrl });
      setVideoModalOpen(true);
    } else if (guide.type === "Video" && !guide.videoUrl) {
      // Video not yet available - redirect to Training Center
      toast({
        title: "Video Coming Soon",
        description: "This video is being prepared. Check the Training Center for available videos.",
      });
    } else if (guide.type === "Online Docs") {
      // Open API docs in preview
      generateAPIGuide();
      toast({
        title: "Download Complete",
        description: "API documentation has been downloaded.",
      });
    } else {
      generateGuideDocument(guide as any);
      toast({
        title: "Download Complete",
        description: `"${guide.title}" has been downloaded.`,
      });
    }
  };

  const handleContactSupport = () => {
    // Open email client
    window.location.href = "mailto:support@lijobs.gov.lr?subject=LiJOBS Support Request&body=Please describe your issue or question:";
    toast({
      title: "Opening Email Client",
      description: "Your email client will open to contact support@lijobs.gov.lr",
    });
  };

  const externalLinks: Record<string, string> = {
    "Ministry of Labor Website": "https://mol.gov.lr",
    "Liberia Institute of Statistics": "https://lisgis.gov.lr",
    "Government Portal": "https://emansion.gov.lr"
  };

  const handleExternalLink = (name: string) => {
    const url = externalLinks[name];
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      toast({
        title: "Opening External Link",
        description: `Opening ${name} in a new tab.`,
      });
    }
  };

  return (
    <div className="min-h-screen" data-testid="resources-page">
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
              <Badge variant="secondary" className="mb-4">Help & Resources</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-resources-title">
                Resources & FAQs
              </h1>
              <p className="text-xl text-white/80 max-w-3xl">
                Find guides, tutorials, and answers to frequently asked questions about the 
                Liberia Jobs Observatory System.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="mb-8">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle>Frequently Asked Questions</CardTitle>
                        <CardDescription>Find quick answers to common questions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative mb-6">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search FAQs..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        data-testid="input-search-faqs"
                      />
                    </div>
                    <Accordion type="single" collapsible className="space-y-2">
                      {filteredFaqs.map((faq, index) => (
                        <AccordionItem key={index} value={`faq-${index}`} className="border rounded-lg px-4">
                          <AccordionTrigger className="text-left py-4" data-testid={`faq-question-${index}`}>
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="pb-4 text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-6 h-6 text-primary" />
                      <div>
                        <CardTitle>User Guides & Tutorials</CardTitle>
                        <CardDescription>Learn how to use LiJOBS effectively</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {guides.map((guide, index) => (
                        <motion.div
                          key={guide.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card 
                            className="hover-elevate cursor-pointer h-full"
                            onClick={() => handleGuideClick(guide as any)}
                            data-testid={`button-guide-${guide.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  guide.type === "Video" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                }`}>
                                  {guide.type === "Video" ? (
                                    <Play className="w-5 h-5" />
                                  ) : (
                                    <guide.icon className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-sm mb-1">{guide.title}</h3>
                                  <p className="text-xs text-muted-foreground mb-2">{guide.description}</p>
                                  <Badge variant="outline" className="text-xs">{guide.type}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Need More Help?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Can't find what you're looking for? Our support team is here to help.
                    </p>
                    <Button className="w-full gap-2" onClick={handleContactSupport} data-testid="button-contact-support">
                      Contact Support
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Downloads</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quickDownloads.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => handleQuickDownload(item)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors hover-elevate"
                        data-testid={`button-download-${item.id}`}
                      >
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.size}</p>
                        </div>
                        <Download className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">External Resources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: "Ministry of Labor Website", id: "mol" },
                      { name: "Liberia Institute of Statistics", id: "lisgis" },
                      { name: "Government Portal", id: "gov" }
                    ].map((link) => (
                      <button
                        key={link.id}
                        onClick={() => handleExternalLink(link.name)}
                        className="w-full flex items-center justify-between p-3 rounded-lg border transition-colors hover-elevate text-left"
                        data-testid={`button-external-${link.id}`}
                      >
                        <span className="text-sm font-medium">{link.name}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={(open) => {
        setVideoModalOpen(open);
        if (!open) setCurrentVideo(null);
      }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{currentVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black flex items-center justify-center">
            {currentVideo?.videoUrl && (
              <video
                key={currentVideo.videoUrl}
                src={currentVideo.videoUrl}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
