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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Comparison } from "@shared/schema";
import { Files, Plus, Search, LogOut, Eye, Share2, Trash2, Calendar, BarChart3, Filter, X } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedConditions, setSelectedConditions] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        comp.setupAName.toLowerCase().includes(query) ||
        comp.setupBName.toLowerCase().includes(query) ||
        comp.carName?.toLowerCase().includes(query) ||
        comp.trackName?.toLowerCase().includes(query) ||
        (comp as any).tags?.some((tag: string) => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    
    // Category filter
    if (selectedCategory && selectedCategory !== "all" && (comp as any).category !== selectedCategory) {
      return false;
    }
    
    // Conditions filter
    if (selectedConditions && selectedConditions !== "all" && (comp as any).conditions !== selectedConditions) {
      return false;
    }
    
    // Tags filter
    if (selectedTags.length > 0) {
      const compTags = (comp as any).tags || [];
      const hasAllTags = selectedTags.every(tag => compTags.includes(tag));
      if (!hasAllTags) return false;
    }
    
    return true;
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger data-testid="select-filter-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectGroup>
                <SelectLabel>Session Type</SelectLabel>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="qualifying">Qualifying</SelectItem>
                <SelectItem value="race">Race</SelectItem>
                <SelectItem value="endurance">Endurance</SelectItem>
                <SelectItem value="time-trial">Time Trial</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={selectedConditions} onValueChange={setSelectedConditions}>
            <SelectTrigger data-testid="select-filter-conditions">
              <SelectValue placeholder="All Conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              <SelectGroup>
                <SelectLabel>Weather Conditions</SelectLabel>
                <SelectItem value="dry">Dry</SelectItem>
                <SelectItem value="wet">Wet</SelectItem>
                <SelectItem value="damp">Damp</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="variable">Variable</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            {(selectedCategory && selectedCategory !== "all") || 
             (selectedConditions && selectedConditions !== "all") || 
             selectedTags.length > 0 ? (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedCategory("");
                  setSelectedConditions("");
                  setSelectedTags([]);
                }}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            ) : null}
          </div>
        </div>

        {/* Tags filter section */}
        {comparisons && comparisons.length > 0 && (() => {
          // Extract all unique tags from comparisons
          const allTags = new Set<string>();
          comparisons.forEach(comp => {
            const tags = (comp as any).tags || [];
            tags.forEach((tag: string) => allTags.add(tag));
          });
          const availableTags = Array.from(allTags).sort();

          if (availableTags.length > 0) {
            return (
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm font-medium">Filter by tags:</span>
                  {availableTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      data-testid={`badge-tag-filter-${tag}`}
                    >
                      {tag}
                      {selectedTags.includes(tag) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}

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
                        
                        {/* Tags, Category, and Conditions display */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(comparison as any).category && (
                            <Badge variant="outline" className="text-xs">
                              {(comparison as any).category}
                            </Badge>
                          )}
                          {(comparison as any).conditions && (
                            <Badge variant="outline" className="text-xs">
                              {(comparison as any).conditions}
                            </Badge>
                          )}
                          {(comparison as any).tags?.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
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
