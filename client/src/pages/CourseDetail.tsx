import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PageLoadingSpinner } from "@/components/LoadingSpinner";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, BookOpen, Clock, DollarSign, Building2, Tag,
  CheckCircle2, XCircle, Award, GraduationCap, FileText,
  ChevronRight, ChevronDown, Loader2, Printer, Download,
  Video, PlayCircle
} from "lucide-react";

type CourseWithDetails = {
  id: string;
  title: string;
  description: string | null;
  durationWeeks: number | null;
  cost: number | null;
  currency: string | null;
  skillsCovered: string[] | null;
  iscoCode: string | null;
  providerName?: string;
  providerId: string;
  lessons: { id: string; title: string; content: string; orderIndex: number; durationMinutes: number | null }[];
  quizQuestionCount: number;
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  orderIndex: number;
};

type Enrollment = {
  id: string;
  courseId: string;
  enrolleeName: string;
  enrolleeEmail: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  attempts: { id: string; score: number; totalQuestions: number; passed: boolean; completedAt: string }[];
  certificate: { id: string; certificateNumber: string; recipientName: string; courseName: string; providerName: string | null; score: number; issuedAt: string } | null;
};

type QuizResult = {
  score: number;
  passed: boolean;
  graded: { questionId: string; userAnswer: number; correctIndex: number; isCorrect: boolean; explanation: string | null }[];
  certificate: { id: string; certificateNumber: string; recipientName: string; courseName: string; providerName: string | null; score: number; issuedAt: string } | null;
};

type CourseVideo = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  duration: string | null;
};

type ViewState = "overview" | "video" | "lessons" | "quiz" | "results" | "certificate";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [view, setView] = useState<ViewState>("overview");
  const [enrollName, setEnrollName] = useState(user?.fullName || "");
  const [enrollEmail, setEnrollEmail] = useState(user?.email || "");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [expandedLesson, setExpandedLesson] = useState<number | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  const { data: course, isLoading } = useQuery<CourseWithDetails>({
    queryKey: ["/api/courses", id],
  });

  const { data: courseVideos } = useQuery<CourseVideo[]>({
    queryKey: ["/api/courses", id, "videos"],
  });

  const { data: quizQuestions } = useQuery<QuizQuestion[]>({
    queryKey: ["/api/courses", id, "quiz"],
    enabled: view === "quiz",
  });

  const enrollMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const res = await apiRequest("POST", `/api/courses/${id}/enroll`, data);
      return res.json();
    },
    onSuccess: (data) => {
      setEnrollment(data);
      setView("lessons");
      toast({ title: "Enrolled!", description: "You are now enrolled in this course." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async (answers: number[]) => {
      const res = await apiRequest("POST", `/api/enrollments/${enrollment!.id}/quiz`, { answers });
      return res.json();
    },
    onSuccess: (data: QuizResult) => {
      setQuizResult(data);
      setView("results");
      if (data.passed) {
        toast({ title: "Congratulations!", description: `You passed with ${data.score}%!` });
      } else {
        toast({ title: "Not quite", description: `You scored ${data.score}%. You need 70% to pass. Try again!`, variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollName.trim() || !enrollEmail.trim()) {
      toast({ title: "Required", description: "Please enter your name and email", variant: "destructive" });
      return;
    }
    enrollMutation.mutate({ name: enrollName.trim(), email: enrollEmail.trim() });
  };

  const handleSubmitQuiz = () => {
    if (!quizQuestions) return;
    const answers = quizQuestions.map((_, i) => quizAnswers[i] ?? -1);
    const unanswered = answers.filter(a => a === -1).length;
    if (unanswered > 0) {
      toast({ title: "Incomplete", description: `Please answer all ${unanswered} remaining question(s)`, variant: "destructive" });
      return;
    }
    submitQuizMutation.mutate(answers);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center pt-24 py-20">
          <PageLoadingSpinner />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-4xl mx-auto px-4 pt-28 pb-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <Link href="/courses">
            <Button data-testid="button-back-courses"><ArrowLeft className="w-4 h-4 mr-2" />Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-28 pb-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/courses">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-courses">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Courses
          </Button>
        </Link>

        {view === "overview" && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold" data-testid="text-course-title">{course.title}</h1>
                  {course.providerName && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="w-4 h-4" />{course.providerName}
                    </p>
                  )}
                </div>
                {course.description && (
                  <p className="text-lg text-muted-foreground">{course.description}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {course.durationWeeks && (
                    <Badge variant="outline" className="text-sm py-1 px-3">
                      <Clock className="w-4 h-4 mr-1" />{course.durationWeeks} weeks
                    </Badge>
                  )}
                  {course.cost && course.cost > 0 && (
                    <Badge variant="outline" className="text-sm py-1 px-3">
                      <DollarSign className="w-4 h-4 mr-1" />{course.cost.toLocaleString()} {course.currency}
                    </Badge>
                  )}
                  {course.iscoCode && (
                    <Badge variant="secondary" className="text-sm py-1 px-3">ISCO: {course.iscoCode}</Badge>
                  )}
                  <Badge className="text-sm py-1 px-3 bg-green-600">
                    <BookOpen className="w-4 h-4 mr-1" />{course.lessons.length} Lessons
                  </Badge>
                  {course.quizQuestionCount > 0 && (
                    <Badge className="text-sm py-1 px-3 bg-blue-600">
                      <FileText className="w-4 h-4 mr-1" />{course.quizQuestionCount} Quiz Questions
                    </Badge>
                  )}
                  <Badge className="text-sm py-1 px-3 bg-purple-600">
                    <Video className="w-4 h-4 mr-1" />Video Lesson
                  </Badge>
                </div>
                {course.skillsCovered && course.skillsCovered.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Skills You Will Learn</h3>
                    <div className="flex flex-wrap gap-2">
                      {course.skillsCovered.map((skill, i) => (
                        <Badge key={i} variant="outline">
                          <Tag className="w-3 h-3 mr-1" />{skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {course.lessons.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Course Content</h3>
                    <div className="space-y-1">
                      {course.lessons.map((lesson, i) => (
                        <div key={lesson.id} className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">{i + 1}</span>
                          {lesson.title}
                          {lesson.durationMinutes && <span className="ml-auto text-xs">~{lesson.durationMinutes} min</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:w-96 space-y-4">
                <Card data-testid="card-enrollment">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />Enroll for Free
                    </CardTitle>
                    <CardDescription>
                      Study the lessons, take the quiz, and earn your certificate
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleEnroll} className="space-y-4">
                      <div>
                        <Label htmlFor="enrollName">Full Name</Label>
                        <Input
                          id="enrollName"
                          value={enrollName}
                          onChange={(e) => setEnrollName(e.target.value)}
                          placeholder="Enter your full name"
                          required
                          data-testid="input-enroll-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="enrollEmail">Email Address</Label>
                        <Input
                          id="enrollEmail"
                          type="email"
                          value={enrollEmail}
                          onChange={(e) => setEnrollEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                          data-testid="input-enroll-email"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={enrollMutation.isPending}
                        data-testid="button-enroll"
                      >
                        {enrollMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enrolling...</>
                        ) : (
                          <><GraduationCap className="w-4 h-4 mr-2" />Start Learning</>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 dark:border-purple-800" data-testid="card-video-option">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Video className="w-5 h-5 text-purple-600" />Prefer to Watch?
                    </CardTitle>
                    <CardDescription>
                      Watch a video lesson covering the key topics of this course
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                      onClick={() => setView("video")}
                      data-testid="button-watch-video"
                    >
                      <PlayCircle className="w-4 h-4 mr-2 text-purple-600" />Watch Video Lesson
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {view === "video" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-6 h-6 text-purple-600" />Video Lesson
              </h2>
              <Button variant="outline" size="sm" onClick={() => setView("overview")} data-testid="button-back-overview">
                <ArrowLeft className="w-4 h-4 mr-2" />Back to Course
              </Button>
            </div>

            {courseVideos && courseVideos.length > 0 ? (
              <div className="space-y-4">
                {courseVideos.map((video) => (
                  <Card key={video.id} data-testid="card-video-player">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
                        <video
                          src={video.videoUrl || ""}
                          controls
                          className="w-full h-full"
                          poster={video.thumbnailUrl || undefined}
                          data-testid="video-player"
                        >
                          Your browser does not support video playback.
                        </video>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg" data-testid="text-video-title">{video.title}</h3>
                        {video.description && (
                          <p className="text-sm text-muted-foreground mt-1">{video.description}</p>
                        )}
                        {video.duration && (
                          <Badge variant="outline" className="mt-2">
                            <Clock className="w-3 h-3 mr-1" />{video.duration}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Ready to earn your certificate? Enroll in the full course with lessons and quiz.
                    </p>
                    <Button onClick={() => setView("overview")} data-testid="button-go-enroll">
                      <GraduationCap className="w-4 h-4 mr-2" />Enroll &amp; Start Learning
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card data-testid="card-video-coming-soon">
                <CardContent className="p-8 text-center">
                  <div className="mx-auto w-20 h-20 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                    <Video className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Video Lesson Coming Soon</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    Our team is preparing a professional video lesson for this course. In the meantime, 
                    you can start learning through the written lessons and earn your certificate right away.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setView("overview")} data-testid="button-start-text-lessons">
                      <BookOpen className="w-4 h-4 mr-2" />Start Written Lessons
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {view === "lessons" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6" />Course Lessons
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentLesson + 1} of {course.lessons.length}
                </span>
                {course.quizQuestionCount > 0 && (
                  <Button
                    onClick={() => { setView("quiz"); setQuizAnswers({}); setQuizResult(null); }}
                    variant={currentLesson === course.lessons.length - 1 ? "default" : "outline"}
                    size="sm"
                    data-testid="button-take-quiz"
                  >
                    <FileText className="w-4 h-4 mr-2" />Take Quiz
                  </Button>
                )}
              </div>
            </div>

            <Progress value={((currentLesson + 1) / course.lessons.length) * 100} className="h-2" />

            <div className="grid lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardContent className="p-2">
                    <nav className="space-y-0.5">
                      {course.lessons.map((lesson, i) => (
                        <button
                          key={lesson.id}
                          onClick={() => { setCurrentLesson(i); setExpandedLesson(null); }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                            i === currentLesson
                              ? "bg-primary text-primary-foreground"
                              : i <= currentLesson
                              ? "text-green-600 hover:bg-muted"
                              : "text-muted-foreground hover:bg-muted"
                          }`}
                          data-testid={`button-lesson-${i}`}
                        >
                          {i < currentLesson ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border text-xs flex items-center justify-center shrink-0">{i + 1}</span>
                          )}
                          <span className="truncate">{lesson.title}</span>
                        </button>
                      ))}
                    </nav>
                    <div className="mt-2 px-2 pb-1">
                      <button
                        onClick={() => setView("video")}
                        className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950 transition-colors"
                        data-testid="button-switch-to-video"
                      >
                        <Video className="w-4 h-4 shrink-0" />
                        <span className="truncate">Watch Video Instead</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Lesson {currentLesson + 1}: {course.lessons[currentLesson]?.title}
                    </CardTitle>
                    {course.lessons[currentLesson]?.durationMinutes && (
                      <CardDescription>
                        <Clock className="w-3 h-3 inline mr-1" />
                        Estimated reading time: {course.lessons[currentLesson].durationMinutes} minutes
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert" data-testid="text-lesson-content">
                      {course.lessons[currentLesson]?.content.split("\n").map((paragraph, i) => {
                        if (paragraph.startsWith("## ")) {
                          return <h2 key={i} className="text-lg font-bold mt-4 mb-2">{paragraph.replace("## ", "")}</h2>;
                        }
                        if (paragraph.startsWith("### ")) {
                          return <h3 key={i} className="text-md font-semibold mt-3 mb-1">{paragraph.replace("### ", "")}</h3>;
                        }
                        if (paragraph.startsWith("- ")) {
                          return <li key={i} className="ml-4">{paragraph.replace("- ", "")}</li>;
                        }
                        if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                          return <p key={i} className="font-bold my-2">{paragraph.replace(/\*\*/g, "")}</p>;
                        }
                        if (paragraph.trim() === "") return <br key={i} />;
                        return <p key={i} className="my-2 leading-relaxed">{paragraph}</p>;
                      })}
                    </div>

                    <div className="flex justify-between mt-8 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentLesson(Math.max(0, currentLesson - 1))}
                        disabled={currentLesson === 0}
                        data-testid="button-prev-lesson"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />Previous
                      </Button>
                      {currentLesson < course.lessons.length - 1 ? (
                        <Button
                          onClick={() => setCurrentLesson(currentLesson + 1)}
                          data-testid="button-next-lesson"
                        >
                          Next Lesson<ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : course.quizQuestionCount > 0 ? (
                        <Button
                          onClick={() => { setView("quiz"); setQuizAnswers({}); setQuizResult(null); }}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid="button-start-quiz"
                        >
                          <FileText className="w-4 h-4 mr-2" />Take the Quiz
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {view === "quiz" && quizQuestions && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="w-6 h-6" />Course Quiz
              </h2>
              <Button variant="outline" size="sm" onClick={() => setView("lessons")} data-testid="button-back-lessons">
                <ArrowLeft className="w-4 h-4 mr-2" />Back to Lessons
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{course.title} - Assessment</CardTitle>
                <CardDescription>
                  Answer all {quizQuestions.length} questions. You need 70% or higher to pass and receive your certificate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {quizQuestions.map((q, qi) => (
                  <div key={q.id} className="space-y-3" data-testid={`quiz-question-${qi}`}>
                    <p className="font-semibold text-base">
                      {qi + 1}. {q.question}
                    </p>
                    <RadioGroup
                      value={quizAnswers[qi]?.toString()}
                      onValueChange={(val) => setQuizAnswers(prev => ({ ...prev, [qi]: parseInt(val) }))}
                    >
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center space-x-2 py-1">
                          <RadioGroupItem value={oi.toString()} id={`q${qi}-o${oi}`} data-testid={`radio-q${qi}-o${oi}`} />
                          <Label htmlFor={`q${qi}-o${oi}`} className="cursor-pointer flex-1">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}

                <div className="pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(quizAnswers).length} of {quizQuestions.length} answered
                  </p>
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={submitQuizMutation.isPending}
                    size="lg"
                    data-testid="button-submit-quiz"
                  >
                    {submitQuizMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Grading...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4 mr-2" />Submit Quiz</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === "results" && quizResult && (
          <div className="space-y-6">
            <Card className={`border-2 ${quizResult.passed ? "border-green-500" : "border-red-500"}`}>
              <CardHeader className="text-center">
                {quizResult.passed ? (
                  <>
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
                      <Award className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl text-green-600">Congratulations! You Passed!</CardTitle>
                    <CardDescription className="text-lg">
                      You scored {quizResult.score}% - Certificate earned!
                    </CardDescription>
                  </>
                ) : (
                  <>
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-2">
                      <XCircle className="w-10 h-10 text-red-600" />
                    </div>
                    <CardTitle className="text-2xl text-red-600">Not Quite There Yet</CardTitle>
                    <CardDescription className="text-lg">
                      You scored {quizResult.score}% - You need 70% to pass. Review the lessons and try again!
                    </CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent>
                <Progress value={quizResult.score} className="h-4 mb-6" />

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Answer Review</h3>
                  {quizResult.graded.map((g, i) => (
                    <div key={i} className={`p-4 rounded-lg border ${g.isCorrect ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"}`}>
                      <div className="flex items-start gap-2">
                        {g.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-medium">Question {i + 1}: {g.isCorrect ? "Correct" : "Incorrect"}</p>
                          {g.explanation && (
                            <p className="text-sm text-muted-foreground mt-1">{g.explanation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  {quizResult.passed && quizResult.certificate ? (
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setView("certificate")}
                      data-testid="button-view-certificate"
                    >
                      <Award className="w-4 h-4 mr-2" />View Certificate
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setView("lessons")} data-testid="button-review-lessons">
                        <BookOpen className="w-4 h-4 mr-2" />Review Lessons
                      </Button>
                      <Button onClick={() => { setView("quiz"); setQuizAnswers({}); setQuizResult(null); }} data-testid="button-retry-quiz">
                        <FileText className="w-4 h-4 mr-2" />Try Again
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === "certificate" && quizResult?.certificate && (
          <div className="space-y-4">
            <div className="flex justify-between items-center print:hidden">
              <h2 className="text-2xl font-bold">Your Certificate</h2>
              <Button onClick={handlePrintCertificate} data-testid="button-print-certificate">
                <Printer className="w-4 h-4 mr-2" />Print Certificate
              </Button>
            </div>

            <div className="bg-white border-4 border-double border-amber-600 rounded-lg p-8 md:p-12 text-center max-w-3xl mx-auto" data-testid="certificate-display" id="certificate">
              <div className="border-2 border-amber-300 rounded-lg p-6 md:p-10">
                <div className="flex justify-center mb-4">
                  <Award className="w-16 h-16 text-amber-600" />
                </div>
                <p className="text-amber-700 text-sm uppercase tracking-widest mb-2">Republic of Liberia</p>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1">Certificate of Completion</h2>
                <p className="text-gray-500 text-sm mb-6">LiJOBS - Liberia Jobs Observatory System</p>

                <div className="my-8">
                  <p className="text-gray-600 text-lg">This is to certify that</p>
                  <p className="text-3xl font-serif font-bold text-gray-900 my-3 border-b-2 border-amber-300 inline-block px-8 pb-1" data-testid="text-cert-name">
                    {quizResult.certificate.recipientName}
                  </p>
                  <p className="text-gray-600 text-lg mt-4">has successfully completed the course</p>
                  <p className="text-2xl font-bold text-primary my-3" data-testid="text-cert-course">
                    {quizResult.certificate.courseName}
                  </p>
                  {quizResult.certificate.providerName && (
                    <p className="text-gray-500">provided by {quizResult.certificate.providerName}</p>
                  )}
                  <p className="text-lg text-gray-700 mt-4">
                    with a score of <span className="font-bold text-green-600">{quizResult.certificate.score}%</span>
                  </p>
                </div>

                <div className="mt-8 flex justify-between items-end text-sm text-gray-500 px-4">
                  <div className="text-left">
                    <p className="font-semibold">Certificate No.</p>
                    <p className="font-mono" data-testid="text-cert-number">{quizResult.certificate.certificateNumber}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-t border-gray-400 mx-auto mb-1"></div>
                    <p>Ministry of Labor</p>
                    <p>Republic of Liberia</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Date Issued</p>
                    <p>{new Date(quizResult.certificate.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center print:hidden">
              <Button variant="outline" onClick={() => setLocation("/courses")} data-testid="button-back-all-courses">
                <ArrowLeft className="w-4 h-4 mr-2" />Back to All Courses
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
