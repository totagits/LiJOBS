import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Briefcase,
  Building2,
  Users
} from "lucide-react";

type UploadType = "employment-spells" | "employers" | "vacancies";

interface UploadResult {
  success: boolean;
  imported: number;
  errors: string[];
  totalRows: number;
}

const uploadTypes = [
  {
    id: "employment-spells" as UploadType,
    title: "Employment Spells",
    description: "Bulk import employment records with job history, salaries, and verification data",
    icon: Briefcase,
    color: "text-blue-600",
    allowedRoles: ["admin", "ministry", "employer", "enumerator"]
  },
  {
    id: "employers" as UploadType,
    title: "Employers",
    description: "Import employer/company records with contact info and sector classification",
    icon: Building2,
    color: "text-green-600",
    allowedRoles: ["admin", "ministry"]
  },
  {
    id: "vacancies" as UploadType,
    title: "Job Vacancies",
    description: "Import job vacancy listings with salary ranges, requirements, and positions",
    icon: Users,
    color: "text-purple-600",
    allowedRoles: ["admin", "ministry", "employer"]
  }
];

export default function BulkUpload() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<UploadType | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = uploadTypes.filter(type => 
    type.allowedRoles.includes(user?.role || "")
  );

  const downloadTemplate = async (type: UploadType) => {
    try {
      const response = await fetch(`/api/bulk-upload/template/${type}`, {
        credentials: "include"
      });
      if (!response.ok) throw new Error("Failed to download template");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `template_${type}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Template downloaded successfully" });
    } catch (error) {
      toast({ title: "Failed to download template", variant: "destructive" });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({ title: "Please upload an Excel file (.xlsx or .xls)", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/bulk-upload/${selectedType}`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadResult(result);
      
      if (result.success && result.imported > 0) {
        toast({ title: `Successfully imported ${result.imported} records` });
        queryClient.invalidateQueries({ queryKey: ["/api/employment-spells"] });
        queryClient.invalidateQueries({ queryKey: ["/api/employers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/vacancies"] });
      }
    } catch (error: any) {
      toast({ title: error.message || "Upload failed", variant: "destructive" });
      setUploadResult({
        success: false,
        imported: 0,
        errors: [error.message],
        totalRows: 0
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BackButton />
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>Please log in to access bulk upload features.</AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  if (allowedTypes.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BackButton />
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>Access Restricted</AlertTitle>
              <AlertDescription>Your role does not have permission to use bulk upload features.</AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Upload className="w-8 h-8 text-primary" />
              Bulk Data Upload
            </h1>
            <p className="text-muted-foreground mt-1">
              Import large datasets from Excel files to quickly populate the system
            </p>
          </div>

      {/* Upload Type Selection */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {allowedTypes.map(type => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <div
              key={type.id}
              role="button"
              tabIndex={0}
              className={`cursor-pointer transition-all rounded-lg border bg-card text-card-foreground shadow-sm p-0 ${isSelected ? "ring-2 ring-primary" : "hover:shadow-md"}`}
              onClick={() => {
                setSelectedType(type.id);
                setUploadResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedType(type.id);
                  setUploadResult(null);
                }
              }}
              data-testid={`card-type-${type.id}`}
            >
              <div className="p-6 pb-2">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                  <Icon className={`w-5 h-5 ${type.color}`} />
                  {type.title}
                  {isSelected && <Badge variant="default" className="ml-auto">Selected</Badge>}
                </h3>
              </div>
              <div className="p-6 pt-0">
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Section */}
      {selectedType && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload {uploadTypes.find(t => t.id === selectedType)?.title}</CardTitle>
            <CardDescription>
              Download the template, fill in your data, then upload the completed file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Step 1: Download Template */}
              <div className="flex-1 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Step 1</Badge>
                  <span className="font-medium">Download Template</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Get the Excel template with the correct column headers and sample data
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => downloadTemplate(selectedType)}
                  data-testid="button-download-template"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {/* Step 2: Upload File */}
              <div className="flex-1 p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Step 2</Badge>
                  <span className="font-medium">Upload Completed File</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Upload your filled Excel file (max 10MB, .xlsx or .xls)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-file"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-upload"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Select File"}
                </Button>
              </div>
            </div>

            {isUploading && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Processing file...</p>
                <Progress value={undefined} className="animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.imported > 0 ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-2xl font-bold">{uploadResult.totalRows}</p>
                <p className="text-sm text-muted-foreground">Total Rows</p>
              </div>
              <div className="p-4 bg-green-100 dark:bg-green-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{uploadResult.imported}</p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
              <div className="p-4 bg-red-100 dark:bg-red-950 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Import Errors</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 space-y-1">
                    {uploadResult.errors.map((error, i) => (
                      <li key={i} className="text-sm">{error}</li>
                    ))}
                  </ul>
                  {uploadResult.errors.length === 10 && (
                    <p className="mt-2 text-sm opacity-80">Showing first 10 errors only.</p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {uploadResult.imported > 0 && uploadResult.errors.length === 0 && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  All {uploadResult.imported} records were imported successfully.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-4 space-y-2 text-sm text-muted-foreground">
            <li>Select the type of data you want to import (Employment Spells, Employers, or Vacancies)</li>
            <li>Download the template file to ensure your data has the correct format</li>
            <li>Fill in your data following the sample row in the template</li>
            <li>Remove the sample row before uploading</li>
            <li>Upload the completed Excel file</li>
            <li>Review the results and fix any errors if needed</li>
          </ol>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Important Notes:</p>
            <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
              <li>Maximum file size: 10MB</li>
              <li>Supported formats: .xlsx, .xls</li>
              <li>First row must contain column headers</li>
              <li>Required fields must not be empty</li>
              <li>Dates should be in YYYY-MM-DD format</li>
            </ul>
          </div>
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  );
}
