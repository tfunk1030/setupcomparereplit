import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Comparison } from "@shared/schema";
import { Files, Plus, Search, LogOut, Eye, Share2, Trash2, Calendar, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: comparisons, isLoading: comparisonsLoading } = useQuery<Comparison[]>({
    queryKey: ["/api/comparisons"],
    enabled: isAuthenticated,
  });

  const filteredComparisons = comparisons?.filter((comp) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      comp.setupAName.toLowerCase().includes(query) ||
      comp.setupBName.toLowerCase().includes(query) ||
      comp.carName?.toLowerCase().includes(query) ||
      comp.trackName?.toLowerCase().includes(query)
    );
  });

  const totalComparisons = comparisons?.length || 0;
  const publicComparisons = comparisons?.filter(c => c.isPublic).length || 0;
  const recentComparisons = comparisons?.filter(c => {
    const createdAt = new Date(c.createdAt!);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return createdAt > dayAgo;
  }).length || 0;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <Files className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">SetupComparer</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.profileImageUrl && (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || "User"}
                  className="h-8 w-8 rounded-full object-cover"
                  data-testid="img-user-avatar"
                />
              )}
              <span className="text-sm font-medium hidden sm:inline" data-testid="text-user-name">
                {user?.firstName || user?.email}
              </span>
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild data-testid="button-logout">
              <a href="/api/logout" title="Log out">
                <LogOut className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">Manage your setup comparisons</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" data-testid="button-analytics">
                <Link href="/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button asChild data-testid="button-new-comparison">
                <Link href="/compare">
                  <Plus className="h-4 w-4 mr-2" />
                  New Comparison
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comparisons</CardTitle>
                <Files className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {comparisonsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="text-total-comparisons">{totalComparisons}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {comparisonsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="text-recent-activity">{recentComparisons}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shared Links</CardTitle>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {comparisonsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="text-shared-links">{publicComparisons}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by setup name, car, or track..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-comparisons"
            />
          </div>
        </div>

        <div className="space-y-4">
          {comparisonsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
            ))
          ) : filteredComparisons && filteredComparisons.length > 0 ? (
            filteredComparisons.map((comparison) => (
              <Card key={comparison.id} className="hover-elevate">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg" data-testid={`text-comparison-title-${comparison.id}`}>
                          {comparison.setupAName} vs {comparison.setupBName}
                        </CardTitle>
                        {comparison.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            <Share2 className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="space-y-1">
                        {comparison.carName && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Car:</span>
                            <span data-testid={`text-car-${comparison.id}`}>{comparison.carName}</span>
                          </div>
                        )}
                        {comparison.trackName && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">Track:</span>
                            <span data-testid={`text-track-${comparison.id}`}>{comparison.trackName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {comparison.createdAt && format(new Date(comparison.createdAt), 'PPp')}
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        data-testid={`button-view-${comparison.id}`}
                      >
                        <Link href={`/comparison/${comparison.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Files className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "No comparisons found" : "No comparisons yet"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Upload your first setup comparison to get started"}
                </p>
                {!searchQuery && (
                  <Button asChild data-testid="button-create-first-comparison">
                    <Link href="/compare">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Comparison
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
