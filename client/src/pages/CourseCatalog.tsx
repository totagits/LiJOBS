import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  BookOpen, 
  GraduationCap, 
  Clock, 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Building2,
  Tag,
  Search,
  Filter
} from "lucide-react";
import type { TrainingProvider, Course } from "@shared/schema";

export default function CourseCatalog() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    providerId: "",
    title: "",
    description: "",
    durationWeeks: 0,
    cost: 0,
    currency: "LRD",
    skillsCovered: "",
    iscoCode: ""
  });

  const canManage = user?.role === "admin" || user?.role === "ministry";

  const { data: providers = [] } = useQuery<TrainingProvider[]>({
    queryKey: ["/api/training-providers"]
  });

  const { data: courses = [], isLoading } = useQuery<(Course & { providerName?: string })[]>({
    queryKey: ["/api/courses"]
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        skillsCovered: data.skillsCovered ? data.skillsCovered.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        durationWeeks: parseInt(data.durationWeeks) || null,
        cost: parseInt(data.cost) || null
      };
      return apiRequest("POST", "/api/courses", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course created successfully" });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to create course", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload = {
        ...data,
        skillsCovered: data.skillsCovered ? data.skillsCovered.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        durationWeeks: parseInt(data.durationWeeks) || null,
        cost: parseInt(data.cost) || null
      };
      return apiRequest("PATCH", `/api/courses/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course updated successfully" });
      setEditCourse(null);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to update course", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Course deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete course", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      providerId: "",
      title: "",
      description: "",
      durationWeeks: 0,
      cost: 0,
      currency: "LRD",
      skillsCovered: "",
      iscoCode: ""
    });
  };

  const handleEdit = (course: Course) => {
    setEditCourse(course);
    setFormData({
      providerId: course.providerId,
      title: course.title,
      description: course.description || "",
      durationWeeks: course.durationWeeks || 0,
      cost: course.cost || 0,
      currency: course.currency || "LRD",
      skillsCovered: course.skillsCovered?.join(", ") || "",
      iscoCode: course.iscoCode || ""
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.providerId) {
      toast({ title: "Provider is required", variant: "destructive" });
      return;
    }
    if (editCourse) {
      updateMutation.mutate({ id: editCourse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchQuery || 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.skillsCovered?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProvider = selectedProvider === "all" || course.providerId === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  const stats = {
    total: courses.length,
    providers: new Set(courses.map(c => c.providerId)).size,
    avgDuration: courses.length > 0 
      ? Math.round(courses.reduce((acc, c) => acc + (c.durationWeeks || 0), 0) / courses.filter(c => c.durationWeeks).length) || 0
      : 0
  };

  const CourseForm = () => (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="providerId">Training Provider *</Label>
        <Select value={formData.providerId} onValueChange={(v) => setFormData({ ...formData, providerId: v })}>
          <SelectTrigger data-testid="select-provider">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.filter(p => p.accreditationStatus === "accredited").map(provider => (
              <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="title">Course Title *</Label>
        <Input
          id="title"
          data-testid="input-course-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter course title"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          data-testid="input-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Course description"
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="durationWeeks">Duration (weeks)</Label>
          <Input
            id="durationWeeks"
            data-testid="input-duration"
            type="number"
            value={formData.durationWeeks || ""}
            onChange={(e) => setFormData({ ...formData, durationWeeks: parseInt(e.target.value) || 0 })}
            placeholder="12"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="cost">Cost</Label>
          <Input
            id="cost"
            data-testid="input-cost"
            type="number"
            value={formData.cost || ""}
            onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
            placeholder="50000"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
            <SelectTrigger data-testid="select-currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LRD">LRD</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="skillsCovered">Skills Covered (comma-separated)</Label>
        <Input
          id="skillsCovered"
          data-testid="input-skills"
          value={formData.skillsCovered}
          onChange={(e) => setFormData({ ...formData, skillsCovered: e.target.value })}
          placeholder="Welding, Safety, Blueprint Reading"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="iscoCode">ISCO-08 Occupation Code</Label>
        <Input
          id="iscoCode"
          data-testid="input-isco"
          value={formData.iscoCode}
          onChange={(e) => setFormData({ ...formData, iscoCode: e.target.value })}
          placeholder="7212"
        />
      </div>
      <Button 
        data-testid="button-submit-course"
        onClick={handleSubmit} 
        disabled={createMutation.isPending || updateMutation.isPending}
        className="w-full"
      >
        {editCourse ? "Update Course" : "Create Course"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-primary" />
                Course Catalog
              </h1>
              <p className="text-muted-foreground mt-1">
                Browse skills training courses from accredited providers
              </p>
            </div>
        {canManage && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-course">
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
              </DialogHeader>
              <CourseForm />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.providers}</p>
                <p className="text-sm text-muted-foreground">Active Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgDuration || "N/A"}</p>
                <p className="text-sm text-muted-foreground">Avg. Weeks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-search-courses"
                placeholder="Search courses by title, description, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-64" data-testid="filter-provider">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Course List */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No courses found</h3>
            <p className="text-muted-foreground mt-1">
              {courses.length === 0 
                ? "No courses have been added yet."
                : "No courses match your search criteria."}
            </p>
            {canManage && courses.length === 0 && (
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Course
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => (
            <Card key={course.id} data-testid={`card-course-${course.id}`} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  {canManage && (
                    <div className="flex gap-1 shrink-0">
                      <Dialog open={editCourse?.id === course.id} onOpenChange={(open) => {
                        if (!open) {
                          setEditCourse(null);
                          resetForm();
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(course)} data-testid={`button-edit-${course.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Edit Course</DialogTitle>
                          </DialogHeader>
                          <CourseForm />
                        </DialogContent>
                      </Dialog>
                      {user?.role === "admin" && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this course?")) {
                              deleteMutation.mutate(course.id);
                            }
                          }}
                          data-testid={`button-delete-${course.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {course.providerName && (
                  <CardDescription className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {course.providerName}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {course.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{course.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  {course.durationWeeks && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {course.durationWeeks} weeks
                    </Badge>
                  )}
                  {course.cost && course.cost > 0 && (
                    <Badge variant="outline">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {course.cost.toLocaleString()} {course.currency}
                    </Badge>
                  )}
                  {course.iscoCode && (
                    <Badge variant="secondary">ISCO: {course.iscoCode}</Badge>
                  )}
                </div>
                {course.skillsCovered && course.skillsCovered.length > 0 && (
                  <div>
                    <div className="flex flex-wrap gap-1">
                      {course.skillsCovered.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          <Tag className="w-2 h-2 mr-1" />
                          {skill}
                        </Badge>
                      ))}
                      {course.skillsCovered.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{course.skillsCovered.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <div className="mt-auto pt-3">
                  <Link href={`/courses/${course.id}`}>
                    <Button className="w-full" size="sm" data-testid={`button-start-course-${course.id}`}>
                      <GraduationCap className="w-4 h-4 mr-2" />Start Learning
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
        </div>
      </main>
    </div>
  );
}
