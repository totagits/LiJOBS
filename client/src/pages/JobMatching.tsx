import { Header } from "@/components/Header";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Briefcase, Building2, MapPin, CheckCircle2, ArrowRight, TrendingUp, Users, Target } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface MatchScore {
  vacancyId: string;
  vacancyTitle: string;
  employerName: string;
  sector: string;
  county: string | null;
  contractType: string;
  score: number;
  matchReasons: string[];
}

export default function JobMatching() {
  const { user } = useAuth();

  const { data: matches, isLoading } = useQuery<MatchScore[]>({
    queryKey: ["/api/matching/my-matches"],
    enabled: !!user,
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-blue-100";
    if (score >= 40) return "bg-yellow-100";
    return "bg-muted";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Potential Match";
    return "Partial Match";
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BackButton />

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold" data-testid="text-page-title">
                AI Job Matching
              </h1>
            </div>
            <p className="text-muted-foreground">
              Personalized job recommendations based on your skills, experience, and preferences
            </p>
          </div>

          {!user ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Target className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sign In to See Your Matches</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Our AI matching algorithm analyzes your profile to find the best job opportunities for you.
                </p>
                <Button asChild data-testid="button-login">
                  <Link href="/login">Sign In</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Matches</p>
                        <p className="text-2xl font-bold" data-testid="text-total-matches">
                          {matches?.length || 0}
                        </p>
                      </div>
                      <Target className="w-8 h-8 text-primary/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Excellent Matches</p>
                        <p className="text-2xl font-bold text-green-600">
                          {matches?.filter(m => m.score >= 80).length || 0}
                        </p>
                      </div>
                      <CheckCircle2 className="w-8 h-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Average Score</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {matches && matches.length > 0
                            ? Math.round(matches.reduce((a, b) => a + b.score, 0) / matches.length)
                            : 0}%
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {isLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="pt-6">
                        <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : !matches || matches.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Matches Found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Complete your profile with skills, education, and preferences to get personalized job recommendations.
                    </p>
                    <Button asChild data-testid="button-update-profile">
                      <Link href="/profile">Update Profile</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {matches.map((match, index) => (
                    <Card key={match.vacancyId} className="hover-elevate" data-testid={`card-match-${match.vacancyId}`}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-muted-foreground">#{index + 1}</span>
                              <h3 className="text-lg font-semibold">{match.vacancyTitle}</h3>
                              <Badge variant="outline">{match.sector}</Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {match.employerName}
                              </span>
                              {match.county && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {match.county}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {match.contractType}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {match.matchReasons.map((reason, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className={`text-3xl font-bold ${getScoreColor(match.score)}`}>
                                {match.score}%
                              </div>
                              <div className={`text-xs px-2 py-1 rounded ${getScoreBg(match.score)}`}>
                                {getScoreLabel(match.score)}
                              </div>
                              <Progress value={match.score} className="w-24 h-2 mt-2" />
                            </div>
                            <Button asChild data-testid={`button-view-${match.vacancyId}`}>
                              <Link href="/jobs">
                                View Job
                                <ArrowRight className="w-4 h-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    How Matching Works
                  </CardTitle>
                  <CardDescription>
                    Our AI algorithm scores job matches based on multiple factors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary mb-1">25%</div>
                      <div className="text-sm font-medium">Sector Preference</div>
                      <p className="text-xs text-muted-foreground">
                        Matching your preferred sectors
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary mb-1">20%</div>
                      <div className="text-sm font-medium">Location</div>
                      <p className="text-xs text-muted-foreground">
                        County and relocation preferences
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary mb-1">20%</div>
                      <div className="text-sm font-medium">Education</div>
                      <p className="text-xs text-muted-foreground">
                        Meeting education requirements
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary mb-1">35%</div>
                      <div className="text-sm font-medium">Skills & Experience</div>
                      <p className="text-xs text-muted-foreground">
                        Skills and years of experience
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
