import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Video, Play, RefreshCw, CheckCircle, XCircle, Clock, Loader2, Settings, FileText, Sparkles, AlertCircle, AlertTriangle, UserPlus, Upload, Trash2, Image, Copy, BookOpen, ChevronDown, ChevronUp, Globe, Lock } from "lucide-react";
import { Link, Redirect } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ObjectUploader } from "@/components/ObjectUploader";
import { videoThumbnails } from "@/lib/videoThumbnails";

interface TrainingVideo {
  id: string;
  scriptId: string;
  title: string;
  description: string | null;
  targetAudience: string;
  heygenVideoId: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  duration: string | null;
  errorMessage: string | null;
  isPublic: boolean;
}

interface VideoScene {
  text: string;
  background: string;
}

interface VideoScript {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  duration: string;
  script: string;
  scenes?: VideoScene[];
  courseSlug?: string;
}

interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  gender: string;
  preview_image_url: string;
}

interface HeyGenVoice {
  voice_id: string;
  language: string;
  gender: string;
  name: string;
}

interface CustomAvatar {
  id: string;
  name: string;
  heygenAvatarId: string | null;
  previewImageUrl: string | null;
  status: string;
  gender: string | null;
  ethnicity: string | null;
  errorMessage: string | null;
}

const audienceLabels: Record<string, string> = {
  public: "Public",
  admin: "Administrator",
  ministry: "Ministry Verifier",
  employer: "Employer",
  enumerator: "Enumerator",
  individual: "Individual",
  course: "Course Training"
};

const statusColors: Record<string, string> = {
  pending: "secondary",
  processing: "default",
  completed: "default",
  failed: "destructive"
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle,
  failed: XCircle
};

function CreateAvatarDialog({ 
  onCreated 
}: { 
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"photo" | "generate">("photo");
  const [inputMode, setInputMode] = useState<"url" | "upload">("upload");
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [gender, setGender] = useState("Woman");
  const [ethnicity, setEthnicity] = useState("African");
  const [age, setAge] = useState("Adult");
  const [appearance, setAppearance] = useState("Professional business attire, confident and warm expression");
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "Image must be less than 10MB", variant: "destructive" });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateFromPhoto = async () => {
    if (!name) {
      toast({ title: "Error", description: "Please provide a name", variant: "destructive" });
      return;
    }
    
    if (inputMode === "url" && !photoUrl) {
      toast({ title: "Error", description: "Please provide a photo URL", variant: "destructive" });
      return;
    }
    
    if (inputMode === "upload" && !photoFile) {
      toast({ title: "Error", description: "Please upload a photo", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      let finalPhotoUrl = photoUrl;
      
      // If uploading a file, upload it first
      if (inputMode === "upload" && photoFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("photo", photoFile);
        
        const uploadResponse = await fetch("/api/training/upload-photo", {
          method: "POST",
          body: formData,
          credentials: "include"
        });
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Failed to upload photo");
        }
        
        const uploadResult = await uploadResponse.json();
        finalPhotoUrl = uploadResult.url;
        setIsUploading(false);
      }
      
      await apiRequest("POST", "/api/training/custom-avatars/from-photo", { name, photoUrl: finalPhotoUrl, gender });
      toast({ title: "Success", description: "Avatar created successfully!" });
      onCreated();
      setOpen(false);
      setName("");
      setPhotoUrl("");
      setPhotoFile(null);
      setPhotoPreview("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create avatar", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!name) {
      toast({ title: "Error", description: "Please provide a name", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      await apiRequest("POST", "/api/training/custom-avatars/generate", { 
        name, 
        gender, 
        ethnicity, 
        age,
        appearance 
      });
      toast({ title: "Success", description: "Avatar generated successfully!" });
      onCreated();
      setOpen(false);
      setName("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate avatar", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-create-avatar">
          <UserPlus className="w-4 h-4" />
          Create Custom Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Custom Avatar</DialogTitle>
          <DialogDescription>
            Create a custom avatar that represents Liberian professionals
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as "photo" | "generate")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photo" className="gap-2">
              <Upload className="w-4 h-4" />
              From Photo
            </TabsTrigger>
            <TabsTrigger value="generate" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Generate
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="photo" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="photo-name">Avatar Name</Label>
              <Input
                id="photo-name"
                placeholder="e.g., Dr. Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-avatar-name"
              />
            </div>
            
            <div className="flex gap-2 mb-2">
              <Button 
                type="button"
                variant={inputMode === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("upload")}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload Photo
              </Button>
              <Button 
                type="button"
                variant={inputMode === "url" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("url")}
                className="flex-1"
              >
                <Image className="w-4 h-4 mr-1" />
                Use URL
              </Button>
            </div>

            {inputMode === "upload" ? (
              <div className="space-y-3">
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover-elevate transition-colors"
                  onClick={() => document.getElementById("photo-upload")?.click()}
                >
                  {photoPreview ? (
                    <div className="space-y-2">
                      <img 
                        src={photoPreview} 
                        alt="Preview" 
                        className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-primary/20"
                      />
                      <p className="text-sm text-muted-foreground">{photoFile?.name}</p>
                      <p className="text-xs text-primary">Click to change photo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload a photo</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-photo-upload"
                />
                <p className="text-xs text-muted-foreground">
                  Use a clear, front-facing photo with good lighting. The photo should show the face clearly.
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="photo-url">Photo URL</Label>
                <Input
                  id="photo-url"
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  data-testid="input-photo-url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use a clear, front-facing photo with good lighting. The photo should show the face clearly.
                </p>
              </div>
            )}

            <div>
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger data-testid="select-photo-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Woman">Woman</SelectItem>
                  <SelectItem value="Man">Man</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full gap-2" 
              onClick={handleCreateFromPhoto}
              disabled={isCreating || !name || (inputMode === "url" ? !photoUrl : !photoFile)}
              data-testid="button-create-from-photo"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isUploading ? "Uploading..." : "Creating..."}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Create From Photo
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="generate" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="gen-name">Avatar Name</Label>
              <Input
                id="gen-name"
                placeholder="e.g., Ministry Spokesperson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="input-gen-avatar-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger data-testid="select-gen-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Woman">Woman</SelectItem>
                    <SelectItem value="Man">Man</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Age</Label>
                <Select value={age} onValueChange={setAge}>
                  <SelectTrigger data-testid="select-gen-age">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Young Adult">Young Adult</SelectItem>
                    <SelectItem value="Adult">Adult</SelectItem>
                    <SelectItem value="Middle Aged">Middle Aged</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Ethnicity</Label>
              <Select value={ethnicity} onValueChange={setEthnicity}>
                <SelectTrigger data-testid="select-gen-ethnicity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="African">African</SelectItem>
                  <SelectItem value="African American">African American</SelectItem>
                  <SelectItem value="Black">Black</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="appearance">Appearance Description</Label>
              <Input
                id="appearance"
                placeholder="Professional business attire..."
                value={appearance}
                onChange={(e) => setAppearance(e.target.value)}
                data-testid="input-appearance"
              />
            </div>
            <Button 
              className="w-full gap-2" 
              onClick={handleGenerateAvatar}
              disabled={isCreating || !name}
              data-testid="button-generate-avatar"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generate AI Avatar
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function CustomAvatarCard({ avatar, onDelete }: { avatar: CustomAvatar; onDelete: (id: string) => void }) {
  const statusColors: Record<string, string> = {
    ready: "default",
    processing: "secondary",
    generating: "secondary",
    failed: "destructive"
  };

  return (
    <Card className="hover-elevate relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10"
        onClick={() => onDelete(avatar.id)}
        data-testid={`button-delete-avatar-${avatar.id}`}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {avatar.previewImageUrl ? (
            <img 
              src={avatar.previewImageUrl} 
              alt={avatar.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Image className="w-8 h-8 text-primary/50" />
            </div>
          )}
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="font-medium truncate">{avatar.name}</h4>
            <p className="text-sm text-muted-foreground">
              {avatar.gender} • {avatar.ethnicity}
            </p>
            <Badge variant={statusColors[avatar.status] as any} className="mt-1">
              {avatar.status}
            </Badge>
            {avatar.errorMessage && (
              <p className="text-xs text-destructive mt-1 truncate">{avatar.errorMessage}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScriptPreviewDialog({ script }: { script: VideoScript }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <FileText className="w-4 h-4" />
          View Script
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{script.title}</DialogTitle>
          <DialogDescription>{script.description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] mt-4">
          {script.scenes && script.scenes.length > 0 ? (
            <div className="space-y-4 pr-4">
              {script.scenes.map((scene, index) => (
                <div key={index} className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">Scene {index + 1}</Badge>
                    <Badge variant="secondary" className="text-xs capitalize">{scene.background}</Badge>
                  </div>
                  <p className="text-sm leading-relaxed">{scene.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed p-4 bg-muted rounded-lg">
              {script.script}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function CourseScriptFullCard({ 
  script,
  video,
  onUpload,
  isUploading
}: { 
  script: VideoScript;
  video?: TrainingVideo;
  onUpload: (scriptId: string, videoUrl: string, thumbnailUrl?: string) => void;
  isUploading: boolean;
}) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const getFullScriptText = () => {
    if (script.scenes && script.scenes.length > 0) {
      return script.scenes.map((scene, i) => `[Scene ${i + 1}]\n${scene.text}`).join('\n\n');
    }
    return script.script;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFullScriptText());
      toast({ title: "Copied!", description: "Script copied to clipboard. Paste it in HeyGen or your video tool." });
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = getFullScriptText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast({ title: "Copied!", description: "Script copied to clipboard." });
    }
  };

  const hasVideo = video?.status === "completed" && video.videoUrl;

  return (
    <Card className={`${hasVideo ? 'border-green-500/30 bg-green-500/5' : ''}`} data-testid={`course-script-card-${script.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-xs">{script.courseSlug?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || script.title}</Badge>
              <Badge variant="secondary" className="text-xs">{script.duration}</Badge>
              {hasVideo && (
                <Badge className="bg-green-600 text-white text-xs gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Video Ready
                </Badge>
              )}
              {video && video.status === "processing" && (
                <Badge variant="default" className="text-xs gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing
                </Badge>
              )}
              {!video && (
                <Badge variant="secondary" className="text-xs text-amber-600">
                  No Video Yet
                </Badge>
              )}
            </div>
            <CardTitle className="text-base">{script.title}</CardTitle>
            <CardDescription className="text-sm mt-1">{script.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button 
            size="sm" 
            onClick={handleCopy}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700"
            data-testid={`button-copy-script-${script.id}`}
          >
            <Copy className="w-4 h-4" />
            Copy Script
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
            className="gap-1.5"
            data-testid={`button-toggle-script-${script.id}`}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? "Hide Script" : "View Script"}
          </Button>
          <ManualUploadDialog
            script={script}
            existingVideo={video}
            onUpload={onUpload}
            isUploading={isUploading}
          />
          {hasVideo && video?.videoUrl && (
            <VideoPlayerDialog title={script.title} videoUrl={video.videoUrl} />
          )}
        </div>

        {expanded && (
          <div className="mt-3 border rounded-lg bg-muted/50">
            <div className="p-3 border-b bg-muted/80 flex items-center justify-between">
              <span className="text-sm font-medium">Full Script Text</span>
              <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1 h-7 text-xs">
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            </div>
            <ScrollArea className="max-h-[400px]">
              <div className="p-4 space-y-4">
                {script.scenes && script.scenes.length > 0 ? (
                  script.scenes.map((scene, index) => (
                    <div key={index} className="p-3 bg-background rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">Scene {index + 1}</Badge>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{scene.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{script.script}</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VideoPlayerDialog({ title, videoUrl }: { title: string; videoUrl: string }) {
  const [open, setOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const getPlayableUrl = (url: string): string => {
    if (url.includes('storage.googleapis.com') && url.includes('/.private/uploads/')) {
      const match = url.match(/\/\.private\/uploads\/([^?]+)/);
      if (match && match[1]) {
        return `/api/training/stream/${match[1]}`;
      }
    }
    return url;
  };

  const playableUrl = getPlayableUrl(videoUrl);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setVideoError(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" data-testid="button-watch-video">
          <Play className="w-4 h-4" />
          Watch
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Training Video</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {videoError && (
            <div className="mb-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300" data-testid="video-error">
              {videoError}
            </div>
          )}
          {open && (
            <video
              key={playableUrl}
              src={playableUrl}
              controls
              autoPlay
              playsInline
              preload="metadata"
              className="w-full rounded-lg bg-black"
              data-testid="video-player"
              onError={(e) => {
                const vid = e.currentTarget;
                const err = vid.error;
                setVideoError(
                  err ? `Playback error: ${err.message || 'Unknown error'} (code ${err.code})` : 'Could not load video. The file may be corrupted or in an unsupported format.'
                );
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManualUploadDialog({ 
  script, 
  existingVideo,
  onUpload,
  isUploading 
}: { 
  script: VideoScript;
  existingVideo?: TrainingVideo;
  onUpload: (scriptId: string, videoUrl: string, thumbnailUrl?: string) => void;
  isUploading: boolean;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [inputMode, setInputMode] = useState<"url" | "upload">("upload");
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState("");
  // Use ref to store objectId synchronously (state updates are async and won't be ready in time)
  const pendingObjectIdRef = useRef("");

  const handleSubmit = () => {
    let finalVideoUrl = inputMode === "url" ? videoUrl : uploadedVideoUrl;
    
    if (!finalVideoUrl) {
      toast({ title: "Error", description: "Please provide a video URL or upload a file", variant: "destructive" });
      return;
    }
    onUpload(script.id, finalVideoUrl, thumbnailUrl || undefined);
    setOpen(false);
    setVideoUrl("");
    setThumbnailUrl("");
    setUploadedVideoUrl("");
    pendingObjectIdRef.current = "";
  };

  const handleVideoUploadComplete = (result: any) => {
    // Use the stored object ID to create the streaming URL
    if (pendingObjectIdRef.current) {
      // Use the streaming proxy which redirects to signed URLs
      const streamUrl = `/api/training/stream/${pendingObjectIdRef.current}`;
      setUploadedVideoUrl(streamUrl);
      toast({ title: "Video uploaded", description: "Video file ready to save" });
    } else {
      toast({ title: "Upload issue", description: "Could not determine video location", variant: "destructive" });
    }
  };

  const getUploadParameters = async (file: any) => {
    const response = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get upload URL");
    }
    const data = await response.json();
    // Store the object ID for creating the streaming URL when upload completes
    const objectId = data.objectPath?.replace('/objects/uploads/', '') || '';
    pendingObjectIdRef.current = objectId;
    return { method: "PUT" as const, url: data.uploadURL, headers: { "Content-Type": file.type || "video/mp4" } };
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1" data-testid={`button-upload-${script.id}`}>
          <Upload className="w-4 h-4" />
          {existingVideo ? "Replace" : "Upload"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
          <DialogDescription>
            Upload a pre-recorded video for "{script.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as "url" | "upload")}>
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="flex-1">Upload File</TabsTrigger>
              <TabsTrigger value="url" className="flex-1">Video URL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4 mt-4">
              <div>
                <Label>Video File</Label>
                <div className="mt-2">
                  <ObjectUploader
                    maxFileSize={500 * 1024 * 1024}
                    maxNumberOfFiles={1}
                    onGetUploadParameters={getUploadParameters}
                    onComplete={handleVideoUploadComplete}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Video File
                  </ObjectUploader>
                </div>
                {uploadedVideoUrl && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Video uploaded successfully
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  data-testid="input-video-url"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Direct link to an MP4, WebM, or other video file
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div>
            <Label htmlFor="thumbnailUrl">Thumbnail URL (optional)</Label>
            <Input
              id="thumbnailUrl"
              placeholder="https://example.com/thumbnail.jpg"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              data-testid="input-thumbnail-url"
            />
          </div>
          
          <Button 
            className="w-full gap-2" 
            disabled={isUploading || (!videoUrl && !uploadedVideoUrl)}
            onClick={handleSubmit}
            data-testid="button-confirm-upload"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Save Video
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GenerateVideoDialog({ 
  script, 
  avatars, 
  customAvatars,
  voices, 
  onGenerate,
  isGenerating 
}: { 
  script: VideoScript;
  avatars: HeyGenAvatar[];
  customAvatars: CustomAvatar[];
  voices: HeyGenVoice[];
  onGenerate: (scriptId: string, avatarId: string, voiceId: string, test: boolean, backgroundMusic: string, avatarType: string) => void;
  isGenerating: boolean;
}) {
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [selectedMusic, setSelectedMusic] = useState<string>("corporate");
  const [avatarType, setAvatarType] = useState<string>("regular");
  const [testMode, setTestMode] = useState(false);
  const [open, setOpen] = useState(false);

  const musicOptions = [
    { value: "corporate", label: "Corporate (Professional)", description: "Uplifting business music" },
    { value: "inspiring", label: "Inspiring", description: "Motivational background" },
    { value: "ambient", label: "Ambient", description: "Soft atmospheric tones" },
    { value: "calm", label: "Calm", description: "Relaxing background" },
    { value: "none", label: "No Music", description: "Voice only" },
  ];

  const englishVoices = voices.filter(v => v.language.toLowerCase().includes("english"));
  const readyCustomAvatars = customAvatars.filter(a => a.status === "ready" && a.heygenAvatarId);
  
  // Limit to first 50 avatars to improve performance
  const limitedAvatars = avatars.slice(0, 50);

  // Check if selected avatar is a custom avatar (talking photo)
  const isCustomAvatarSelected = readyCustomAvatars.some(a => a.heygenAvatarId === selectedAvatar);

  const handleGenerate = () => {
    if (selectedAvatar && selectedVoice) {
      onGenerate(script.id, selectedAvatar, selectedVoice, testMode, selectedMusic, avatarType);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1" data-testid={`button-generate-${script.id}`}>
          <Sparkles className="w-4 h-4" />
          Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Video</DialogTitle>
          <DialogDescription>
            Select an avatar and voice to generate "{script.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {limitedAvatars.length === 0 && (
            <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
              Loading avatars from HeyGen... If this persists, please refresh the page.
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">Avatar ({limitedAvatars.length} available)</label>
            <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
              <SelectTrigger data-testid="select-avatar">
                <SelectValue placeholder="Select an avatar" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {readyCustomAvatars.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Custom Avatars</div>
                    {readyCustomAvatars.map(avatar => (
                      <SelectItem key={`custom-${avatar.id}`} value={avatar.heygenAvatarId!}>
                        {avatar.name} ({avatar.gender || "Custom"})
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1 pt-1">HeyGen Stock Avatars (showing first 50)</div>
                  </>
                )}
                {limitedAvatars.map(avatar => (
                  <SelectItem key={avatar.avatar_id} value={avatar.avatar_id}>
                    {avatar.avatar_name} ({avatar.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isCustomAvatarSelected && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Custom avatars (talking photos) use Avatar IV technology and are limited to 30 seconds on your current HeyGen plan. For longer videos, please select a HeyGen Stock Avatar instead.
              </div>
            )}
          </div>
          {!isCustomAvatarSelected && (
          <div>
            <label className="text-sm font-medium mb-2 block">Avatar Technology</label>
            <Select value={avatarType} onValueChange={setAvatarType}>
              <SelectTrigger data-testid="select-avatar-type">
                <SelectValue placeholder="Select avatar type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">
                  Regular Avatar (up to 30 min)
                </SelectItem>
                <SelectItem value="avatar_iv">
                  Avatar IV (up to 30 sec, more realistic)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {avatarType === "avatar_iv" 
                ? "Avatar IV is more realistic but limited to 30 seconds on your plan" 
                : "Regular avatars support longer videos up to 30 minutes"}
            </p>
          </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">Voice ({englishVoices.length} English voices)</label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger data-testid="select-voice">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {englishVoices.map(voice => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} ({voice.gender})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Background Music</label>
            <Select value={selectedMusic} onValueChange={setSelectedMusic}>
              <SelectTrigger data-testid="select-music">
                <SelectValue placeholder="Select background music" />
              </SelectTrigger>
              <SelectContent>
                {musicOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {musicOptions.find(m => m.value === selectedMusic)?.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="testMode" 
              checked={testMode} 
              onChange={(e) => setTestMode(e.target.checked)}
              className="rounded border-input"
            />
            <label htmlFor="testMode" className="text-sm text-muted-foreground">
              Test mode (shorter video for testing)
            </label>
          </div>
          <Button 
            className="w-full gap-2" 
            disabled={!selectedAvatar || !selectedVoice || isGenerating}
            onClick={handleGenerate}
            data-testid="button-confirm-generate"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Video
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ScriptCard({ 
  script, 
  video,
  avatars,
  customAvatars,
  voices,
  onGenerate,
  onCheckStatus,
  onUploadVideo,
  onDeleteVideo,
  onTogglePublic,
  isGenerating,
  isChecking,
  isUploading
}: { 
  script: VideoScript;
  video?: TrainingVideo;
  avatars: HeyGenAvatar[];
  customAvatars: CustomAvatar[];
  voices: HeyGenVoice[];
  onGenerate: (scriptId: string, avatarId: string, voiceId: string, test: boolean, backgroundMusic: string, avatarType: string) => void;
  onCheckStatus: (videoId: string) => void;
  onUploadVideo: (scriptId: string, videoUrl: string, thumbnailUrl?: string) => void;
  onDeleteVideo: (videoId: string) => void;
  onTogglePublic: (videoId: string, isPublic: boolean) => void;
  isGenerating: boolean;
  isChecking: boolean;
  isUploading: boolean;
}) {
  const StatusIcon = video ? statusIcons[video.status] || Clock : Clock;
  const canGenerate = !video || video.status === "failed" || video.status === "pending";
  const canUpload = !video || video.status === "failed" || video.status === "pending" || video.status === "completed";

  const thumbnail = videoThumbnails[script.id];

  return (
    <Card className="hover-elevate overflow-hidden">
      {thumbnail && (
        <div className="relative w-full h-36 overflow-hidden">
          <img src={thumbnail} alt={script.title} className="w-full h-full object-cover" />
          {video?.isPublic && (
            <Badge className="absolute top-2 right-2 gap-1 bg-primary/90">
              <Globe className="w-3 h-3" />
              Public
            </Badge>
          )}
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <Badge variant="outline">{audienceLabels[script.targetAudience]}</Badge>
          {video && (
            <Badge variant={statusColors[video.status] as any} className="gap-1">
              <StatusIcon className={`w-3 h-3 ${video.status === "processing" ? "animate-spin" : ""}`} />
              {video.status}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base mt-2">{script.title}</CardTitle>
        <CardDescription className="text-sm">{script.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock className="w-4 h-4" />
          <span>{script.duration}</span>
        </div>
        
        {video?.errorMessage && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-md mb-4 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <span className="text-destructive">{video.errorMessage}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <ScriptPreviewDialog script={script} />
          
          {video?.status === "completed" && video.videoUrl && (
            <VideoPlayerDialog title={script.title} videoUrl={video.videoUrl} />
          )}
          
          {video?.status === "processing" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => onCheckStatus(video.id)}
              disabled={isChecking}
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
              Check Status
            </Button>
          )}
          
          {canGenerate && (avatars.length > 0 || customAvatars.length > 0) && voices.length > 0 && (
            <GenerateVideoDialog 
              script={script} 
              avatars={avatars} 
              customAvatars={customAvatars}
              voices={voices} 
              onGenerate={onGenerate}
              isGenerating={isGenerating}
            />
          )}

          {canUpload && (
            <ManualUploadDialog
              script={script}
              existingVideo={video}
              onUpload={onUploadVideo}
              isUploading={isUploading}
            />
          )}

          {video?.status === "completed" && (
            <Button 
              variant={video.isPublic ? "default" : "outline"}
              size="sm" 
              className="gap-1"
              onClick={() => onTogglePublic(video.id, !video.isPublic)}
              data-testid={`button-toggle-public-${video.id}`}
            >
              {video.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {video.isPublic ? "Public" : "Make Public"}
            </Button>
          )}

          {video && (video.status === "failed" || video.status === "completed") && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 text-destructive hover:text-destructive"
              onClick={() => onDeleteVideo(video.id)}
              data-testid={`button-delete-video-${video.id}`}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VideoManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [generatingScript, setGeneratingScript] = useState<string | null>(null);
  const [checkingVideo, setCheckingVideo] = useState<string | null>(null);
  const [uploadingScript, setUploadingScript] = useState<string | null>(null);

  const { data: heygenStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/training/heygen/status"],
    enabled: user?.role === "admin"
  });

  const { data: scripts = [] } = useQuery<VideoScript[]>({
    queryKey: ["/api/training/scripts"],
    enabled: user?.role === "admin"
  });

  const { data: videos = [], refetch: refetchVideos } = useQuery<TrainingVideo[]>({
    queryKey: ["/api/training/videos"],
    enabled: user?.role === "admin"
  });

  const { data: avatars = [] } = useQuery<HeyGenAvatar[]>({
    queryKey: ["/api/training/heygen/avatars"],
    enabled: user?.role === "admin" && heygenStatus?.configured
  });

  const { data: voices = [] } = useQuery<HeyGenVoice[]>({
    queryKey: ["/api/training/heygen/voices"],
    enabled: user?.role === "admin" && heygenStatus?.configured
  });

  const { data: customAvatars = [], refetch: refetchCustomAvatars } = useQuery<CustomAvatar[]>({
    queryKey: ["/api/training/custom-avatars"],
    enabled: user?.role === "admin"
  });

  const generateMutation = useMutation({
    mutationFn: async ({ scriptId, avatarId, voiceId, test, backgroundMusic, avatarType }: { scriptId: string; avatarId: string; voiceId: string; test: boolean; backgroundMusic: string; avatarType: string }) => {
      const res = await apiRequest("POST", "/api/training/generate", { scriptId, avatarId, voiceId, test, backgroundMusic, avatarType });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Video generation started", description: "The video is being generated. This may take a few minutes." });
      queryClient.invalidateQueries({ queryKey: ["/api/training/videos"] });
      setGeneratingScript(null);
    },
    onError: (error: any) => {
      toast({ title: "Generation failed", description: error.message, variant: "destructive" });
      setGeneratingScript(null);
    }
  });

  const checkStatusMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const res = await apiRequest("POST", `/api/training/check-status/${videoId}`);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Status updated", description: `Video status: ${data.status}` });
      queryClient.invalidateQueries({ queryKey: ["/api/training/videos"] });
      setCheckingVideo(null);
    },
    onError: (error: any) => {
      toast({ title: "Status check failed", description: error.message, variant: "destructive" });
      setCheckingVideo(null);
    }
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const res = await apiRequest("DELETE", `/api/training/videos/${videoId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Video deleted", description: "The failed video has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/training/videos"] });
    },
    onError: (error: any) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ videoId, isPublic }: { videoId: string; isPublic: boolean }) => {
      const res = await apiRequest("PATCH", `/api/training/videos/${videoId}/visibility`, { isPublic });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: data.isPublic ? "Video is now public" : "Video is now private", description: data.isPublic ? "This video is visible in the public Training Center." : "This video is only visible to its target audience." });
      queryClient.invalidateQueries({ queryKey: ["/api/training/videos"] });
    },
    onError: (error: any) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: async (avatarId: string) => {
      const res = await apiRequest("DELETE", `/api/training/custom-avatars/${avatarId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Avatar deleted", description: "The avatar has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/training/custom-avatars"] });
    },
    onError: (error: any) => {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    }
  });

  const uploadVideoMutation = useMutation({
    mutationFn: async ({ scriptId, videoUrl, thumbnailUrl }: { scriptId: string; videoUrl: string; thumbnailUrl?: string }) => {
      const res = await apiRequest("POST", "/api/training/videos/upload", { scriptId, videoUrl, thumbnailUrl });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Video uploaded", description: "The training video has been saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/training/videos"] });
      setUploadingScript(null);
    },
    onError: (error: any) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploadingScript(null);
    }
  });

  if (authLoading) {
    return <PageLoadingSpinner />;
  }

  if (!user || user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  const videoMap = new Map(videos.map(v => [v.scriptId, v]));
  const audiences = ["public", "admin", "ministry", "employer", "enumerator", "individual", "course"];

  const handleGenerate = (scriptId: string, avatarId: string, voiceId: string, test: boolean, backgroundMusic: string, avatarType: string) => {
    setGeneratingScript(scriptId);
    generateMutation.mutate({ scriptId, avatarId, voiceId, test, backgroundMusic, avatarType });
  };

  const handleCheckStatus = (videoId: string) => {
    setCheckingVideo(videoId);
    checkStatusMutation.mutate(videoId);
  };

  const handleDeleteVideo = (videoId: string) => {
    deleteVideoMutation.mutate(videoId);
  };

  const handleTogglePublic = (videoId: string, isPublic: boolean) => {
    togglePublicMutation.mutate({ videoId, isPublic });
  };

  const handleDeleteAvatar = (avatarId: string) => {
    deleteAvatarMutation.mutate(avatarId);
  };

  const handleUploadVideo = (scriptId: string, videoUrl: string, thumbnailUrl?: string) => {
    setUploadingScript(scriptId);
    uploadVideoMutation.mutate({ scriptId, videoUrl, thumbnailUrl });
  };

  const completedCount = videos.filter(v => v.status === "completed").length;
  const processingCount = videos.filter(v => v.status === "processing").length;

  return (
    <div className="min-h-screen" data-testid="video-management-page">
      <Header />
      <main className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Video className="w-8 h-8" />
                  Video Management
                </h1>
                <p className="text-muted-foreground mt-1">
                  Generate AI videos with HeyGen or upload pre-recorded training videos
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Videos: </span>
                  <Badge variant="outline" className="ml-1">{completedCount} completed</Badge>
                  {processingCount > 0 && (
                    <Badge variant="default" className="ml-1">{processingCount} processing</Badge>
                  )}
                </div>
                <Link href="/training">
                  <Button variant="outline" className="gap-2">
                    <Play className="w-4 h-4" />
                    View Training Center
                  </Button>
                </Link>
              </div>
            </div>

            {!heygenStatus?.configured && (
              <Card className="mb-8 border-yellow-500/50 bg-yellow-500/5">
                <CardContent className="flex items-center gap-4 py-4">
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                  <div>
                    <h3 className="font-semibold">HeyGen API Not Configured</h3>
                    <p className="text-sm text-muted-foreground">
                      Please add your HEYGEN_API_KEY to the secrets to enable video generation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Custom Avatars Section */}
            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Custom Avatars
                  </CardTitle>
                  <CardDescription>
                    Create avatars from photos of Liberian professionals or generate AI avatars
                  </CardDescription>
                </div>
                {heygenStatus?.configured && (
                  <CreateAvatarDialog onCreated={() => refetchCustomAvatars()} />
                )}
              </CardHeader>
              <CardContent>
                {customAvatars.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No custom avatars yet</p>
                    <p className="text-sm">Create your first avatar to use in training videos</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {customAvatars.map(avatar => (
                      <CustomAvatarCard key={avatar.id} avatar={avatar} onDelete={handleDeleteAvatar} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>


            <Tabs defaultValue="course-scripts" className="space-y-6">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="course-scripts" className="gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  Course Video Scripts ({scripts.filter(s => s.targetAudience === 'course').length})
                </TabsTrigger>
                <TabsTrigger value="all">All Scripts ({scripts.length})</TabsTrigger>
                {audiences.map(audience => {
                  const count = scripts.filter(s => s.targetAudience === audience).length;
                  return (
                    <TabsTrigger key={audience} value={audience}>
                      {audienceLabels[audience]} ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <TabsContent value="course-scripts">
                <Card className="mb-6 border-blue-500/30 bg-blue-500/5">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">How to Create Course Videos</h3>
                        <ol className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1.5 list-decimal list-inside">
                          <li><strong>Copy the script</strong> - Click "Copy Script" on any course below</li>
                          <li><strong>Create the video</strong> - Go to <a href="https://app.heygen.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">HeyGen.com</a> (or any video tool), paste the script, choose an avatar, and generate</li>
                          <li><strong>Download the video</strong> - Once generated, download the MP4 file</li>
                          <li><strong>Upload here</strong> - Click "Upload" next to the course and upload the video file</li>
                        </ol>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                          Videos will automatically appear on the course page for learners to watch.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                  {scripts.filter(s => s.targetAudience === 'course').map(script => (
                    <CourseScriptFullCard
                      key={script.id}
                      script={script}
                      video={videoMap.get(script.id)}
                      onUpload={handleUploadVideo}
                      isUploading={uploadingScript === script.id}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="all">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scripts.map(script => (
                    <ScriptCard 
                      key={script.id}
                      script={script}
                      video={videoMap.get(script.id)}
                      avatars={avatars}
                      customAvatars={customAvatars}
                      voices={voices}
                      onGenerate={handleGenerate}
                      onCheckStatus={handleCheckStatus}
                      onUploadVideo={handleUploadVideo}
                      onDeleteVideo={handleDeleteVideo}
                      onTogglePublic={handleTogglePublic}
                      isGenerating={generatingScript === script.id}
                      isChecking={checkingVideo === videoMap.get(script.id)?.id}
                      isUploading={uploadingScript === script.id}
                    />
                  ))}
                </div>
              </TabsContent>

              {audiences.map(audience => (
                <TabsContent key={audience} value={audience}>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {scripts.filter(s => s.targetAudience === audience).map(script => (
                      <ScriptCard 
                        key={script.id}
                        script={script}
                        video={videoMap.get(script.id)}
                        avatars={avatars}
                        customAvatars={customAvatars}
                        voices={voices}
                        onGenerate={handleGenerate}
                        onCheckStatus={handleCheckStatus}
                        onUploadVideo={handleUploadVideo}
                        onDeleteVideo={handleDeleteVideo}
                        onTogglePublic={handleTogglePublic}
                        isGenerating={generatingScript === script.id}
                        isChecking={checkingVideo === videoMap.get(script.id)?.id}
                        isUploading={uploadingScript === script.id}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
