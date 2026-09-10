import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { BookOpen, Search, Plus, Edit, Trash2, ExternalLink, FileText, Calendar, User } from "lucide-react";
import type { KnowledgeBaseItem } from "@shared/schema";

const CATEGORIES = [
  "All",
  "Policy Documents",
  "Research Reports",
  "Statistical Bulletins",
  "Legal Framework",
  "Training Materials",
  "International Standards",
];

const CATEGORY_VALUES = CATEGORIES.filter((c) => c !== "All");

const defaultFormData = {
  title: "",
  description: "",
  category: "",
  author: "",
  publishDate: "",
  url: "",
  tags: "",
  isPublished: true,
};

export default function KnowledgeBase() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeBaseItem | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: items = [], isLoading } = useQuery<KnowledgeBaseItem[]>({
    queryKey: ["/api/knowledge-base"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiRequest("POST", "/api/knowledge-base", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({ title: "Publication added successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to add publication", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, unknown> }) => {
      return apiRequest("PUT", `/api/knowledge-base/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({ title: "Publication updated successfully" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update publication", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/knowledge-base/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-base"] });
      toast({ title: "Publication deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete publication", variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData(defaultFormData);
  };

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (item: KnowledgeBaseItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      category: item.category,
      author: item.author || "",
      publishDate: item.publishDate || "",
      url: item.url || "",
      tags: item.tags ? item.tags.join(", ") : "",
      isPublished: item.isPublished,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!formData.category) {
      toast({ title: "Category is required", variant: "destructive" });
      return;
    }

    const payload: Record<string, unknown> = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      category: formData.category,
      author: formData.author.trim() || null,
      publishDate: formData.publishDate || null,
      url: formData.url.trim() || null,
      tags: formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : null,
      isPublished: formData.isPublished,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="pt-28 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-28 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />

          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-primary" />
                Knowledge Base & Research Library
              </h1>
              <p className="text-muted-foreground mt-1">
                Labour market research, reports, and publications
              </p>
            </div>
            {isAdmin && (
              <Button data-testid="button-add-publication" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Publication
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="input-search"
                placeholder="Search publications by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer toggle-elevate"
                  onClick={() => setSelectedCategory(category)}
                  data-testid={`filter-category-${category.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium" data-testid="text-empty-state">
                  No publications available yet
                </h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery || selectedCategory !== "All"
                    ? "Try adjusting your search or category filter."
                    : "Check back later for new publications."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} data-testid={`card-publication-${item.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className="mb-2" data-testid={`badge-category-${item.id}`}>
                          {item.category}
                        </Badge>
                        <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 flex-shrink-0" style={{ visibility: "visible" }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                            data-testid={`button-edit-${item.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this publication?")) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            data-testid={`button-delete-${item.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {item.description && (
                      <CardDescription className="line-clamp-2">
                        {item.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        {item.author && (
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{item.author}</span>
                          </div>
                        )}
                        {item.publishDate && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{new Date(item.publishDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-tag-${item.id}-${idx}`}>
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {item.url ? (
                        <Button variant="outline" size="sm" asChild className="w-full" data-testid={`button-view-${item.id}`}>
                          <a href={item.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View
                          </a>
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center" data-testid={`text-no-link-${item.id}`}>
                          No link available
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Publication" : "Add Publication"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="kb-title">Title *</Label>
              <Input
                id="kb-title"
                data-testid="input-kb-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter publication title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kb-description">Description</Label>
              <Textarea
                id="kb-description"
                data-testid="input-kb-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the publication"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kb-category">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger data-testid="select-kb-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_VALUES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kb-author">Author</Label>
                <Input
                  id="kb-author"
                  data-testid="input-kb-author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="kb-date">Publish Date</Label>
                <Input
                  id="kb-date"
                  data-testid="input-kb-date"
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kb-url">URL</Label>
                <Input
                  id="kb-url"
                  data-testid="input-kb-url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kb-tags">Tags (comma-separated)</Label>
              <Input
                id="kb-tags"
                data-testid="input-kb-tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="labour market, employment, statistics"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="kb-published"
                data-testid="checkbox-kb-published"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="kb-published" className="cursor-pointer">Published</Label>
            </div>
            <Button
              data-testid="button-submit-publication"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full"
            >
              {editingItem ? "Update Publication" : "Add Publication"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
