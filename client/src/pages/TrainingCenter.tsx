import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Play, Clock, BookOpen, Video, HelpCircle, AlertTriangle, Loader2, Globe } from "lucide-react";
import { videoThumbnails } from "@/lib/videoThumbnails";

interface TrainingVideo {
  id: string;
  scriptId: string;
  title: string;
  description: string | null;
  targetAudience: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  duration: string | null;
  isPublic: boolean;
}

interface VideoScript {
  id: string;
  title: string;
  description: string;
  targetAudience: string;
  duration: string;
  script: string;
}

// Convert GCS private URLs to proxy URLs for playback
function getPlayableUrl(url: string): string {
  if (url.includes('storage.googleapis.com') && url.includes('/.private/uploads/')) {
    const match = url.match(/\/\.private\/uploads\/([^?]+)/);
    if (match && match[1]) {
      return `/api/training/stream/${match[1]}`;
    }
  }
  return url;
}

function VideoPlayerButton({ title, videoUrl, scriptId }: { title: string; videoUrl: string; scriptId: string }) {
  const [open, setOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const playableUrl = getPlayableUrl(videoUrl);

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setVideoError(null); }}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2" data-testid={`button-play-${scriptId}`}>
          <Play className="w-4 h-4" />
          Watch Video
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

function VideoCard({ video, script }: { video?: TrainingVideo; script: VideoScript }) {
  const hasVideo = video?.status === "completed" && video.videoUrl;
  const thumbnail = videoThumbnails[script.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover-elevate overflow-hidden">
        {thumbnail && (
          <div className="relative w-full h-44 overflow-hidden">
            <img src={thumbnail} alt={script.title} className="w-full h-full object-cover" />
            <Badge variant={hasVideo ? "default" : "secondary"} className="absolute top-2 right-2">
              {hasVideo ? "Available" : "Coming Soon"}
            </Badge>
          </div>
        )}
        <CardHeader className="pb-3">
          {!thumbnail && (
            <div className="flex items-start justify-between gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <Badge variant={hasVideo ? "default" : "secondary"}>
                {hasVideo ? "Available" : "Coming Soon"}
              </Badge>
            </div>
          )}
          <CardTitle className="text-lg mt-3">{script.title}</CardTitle>
          <CardDescription>{script.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{script.duration}</span>
            </div>
          </div>
          {hasVideo ? (
            <VideoPlayerButton title={script.title} videoUrl={video.videoUrl!} scriptId={script.id} />
          ) : (
            <Button variant="secondary" className="w-full gap-2" disabled>
              <Video className="w-4 h-4" />
              Video Not Yet Available
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TrainingCenter() {
  const { data: scripts = [], isLoading: scriptsLoading } = useQuery<VideoScript[]>({
    queryKey: ["/api/training/scripts"],
  });

  const { data: videos = [], isLoading: videosLoading } = useQuery<TrainingVideo[]>({
    queryKey: ["/api/training/videos"],
  });

  const isLoading = scriptsLoading || videosLoading;

  if (isLoading) {
    return <PageLoadingSpinner />;
  }

  const videoMap = new Map(videos.map(v => [v.scriptId, v]));
  const publicVideoScriptIds = new Set(
    videos.filter(v => v.isPublic && v.status === "completed" && v.videoUrl).map(v => v.scriptId)
  );
  const publicScripts = scripts.filter(s => s.targetAudience === "public" || publicVideoScriptIds.has(s.id));

  return (
    <div className="min-h-screen" data-testid="training-center-page">
      <Header />
      
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">User Guide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Learn About LiJOBS
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Watch our video guides to understand how to use Liberia's National Job Creation Data Platform.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Platform Overview</h2>
            <p className="text-muted-foreground">
              General information about LiJOBS and how it serves Liberia
            </p>
          </div>
          
          {publicScripts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {publicScripts.map(script => (
                <VideoCard key={script.id} script={script} video={videoMap.get(script.id)} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Videos Coming Soon</h3>
              <p className="text-muted-foreground">
                We're preparing helpful video guides for you. Check back soon!
              </p>
            </Card>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12"
          >
            <Card className="p-8 bg-muted/50">
              <div className="max-w-2xl mx-auto text-center">
                <HelpCircle className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Need More Help?</h3>
                <p className="text-muted-foreground mb-4">
                  Registered users can access role-specific training videos in their dashboard. 
                  Contact our support team if you have questions about using LiJOBS.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a href="/contact">
                    <Button variant="outline">Contact Support</Button>
                  </a>
                  <a href="/resources">
                    <Button variant="outline">View Resources</Button>
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
