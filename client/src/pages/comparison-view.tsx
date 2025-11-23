import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import type { Comparison, ParameterDelta, Interpretation } from "@shared/schema";
import { Files, ArrowLeft, LogOut, Share2, Download, TrendingUp, TrendingDown, Minus, Lightbulb, AlertCircle, CheckCircle2, Calendar, FileText, FileSpreadsheet } from "lucide-react";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TelemetryVisualization } from "@/components/telemetry-visualization";

interface ParameterRowProps {
  label: string;
  valueA: string | number;
  valueB: string | number;
  delta: ParameterDelta;
}

function ParameterRow({ label, valueA, valueB, delta }: ParameterRowProps) {
  const getDeltaIcon = () => {
    if (delta.magnitude === 'none') return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (typeof delta.delta === 'number' && delta.delta > 0) return <TrendingUp className="h-4 w-4 text-chart-1" />;
    if (typeof delta.delta === 'number' && delta.delta < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getMagnitudeBorder = () => {
    switch (delta.magnitude) {
      case 'major': return 'border-l-4 border-l-destructive';
      case 'moderate': return 'border-l-2 border-l-chart-2';
      case 'minor': return 'border-l border-l-chart-3';
      default: return '';
    }
  };

  return (
    <div className={`grid grid-cols-4 gap-4 p-3 rounded-md hover-elevate ${getMagnitudeBorder()}`}>
      <div className="font-medium text-sm">{label}</div>
      <div className="text-right font-mono text-sm" data-testid={`value-a-${label}`}>
        {valueA} {delta.unit || ''}
      </div>
      <div className="text-right font-mono text-sm" data-testid={`value-b-${label}`}>
        {valueB} {delta.unit || ''}
      </div>
      <div className="flex items-center justify-end gap-2">
        {getDeltaIcon()}
        <span className="font-mono text-sm font-medium" data-testid={`delta-${label}`}>
          {typeof delta.delta === 'number' && delta.delta > 0 ? '+' : ''}
          {delta.delta}
          {delta.unit ? ` ${delta.unit}` : ''}
        </span>
        {delta.percentChange !== undefined && Math.abs(delta.percentChange) >= 1 && (
          <span className="text-xs text-muted-foreground">
            ({delta.percentChange > 0 ? '+' : ''}{delta.percentChange.toFixed(1)}%)
          </span>
        )}
      </div>
    </div>
  );
}

interface InterpretationCardProps {
  interpretation: Interpretation;
}

function InterpretationCard({ interpretation }: InterpretationCardProps) {
  const getImpactBadge = () => {
    switch (interpretation.impact) {
      case 'positive':
        return <Badge variant="secondary" className="bg-chart-3/20 text-chart-3"><CheckCircle2 className="h-3 w-3 mr-1" />Positive</Badge>;
      case 'negative':
        return <Badge variant="secondary" className="bg-destructive/20 text-destructive"><AlertCircle className="h-3 w-3 mr-1" />Caution</Badge>;
      default:
        return <Badge variant="secondary">Neutral</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary flex-shrink-0" />
            <CardTitle className="text-base">{interpretation.summary}</CardTitle>
          </div>
          {getImpactBadge()}
        </div>
        <CardDescription className="text-xs uppercase tracking-wide">
          {interpretation.category}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">{interpretation.explanation}</p>
      </CardContent>
    </Card>
  );
}

export default function ComparisonView() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, params] = useRoute("/comparison/:id");
  const comparisonId = params?.id;
  const [isPublic, setIsPublic] = useState(false);

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

  const { data: comparison, isLoading } = useQuery<Comparison>({
    queryKey: ["/api/comparisons", comparisonId],
    enabled: isAuthenticated && !!comparisonId,
  });

  useEffect(() => {
    if (comparison) {
      setIsPublic(comparison.isPublic || false);
    }
  }, [comparison]);

  const togglePublicMutation = useMutation({
    mutationFn: async (makePublic: boolean) => {
      return await apiRequest("PATCH", `/api/comparisons/${comparisonId}/public`, { isPublic: makePublic });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/comparisons", comparisonId] });
      toast({
        title: makePublic ? "Link created" : "Link disabled",
        description: makePublic
          ? "Your comparison is now publicly accessible"
          : "Public access has been disabled",
      });
      if (data.shareToken) {
        const shareUrl = `${window.location.origin}/share/${data.shareToken}`;
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "Share link copied to clipboard",
        });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update sharing settings",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (format: 'csv' | 'pdf') => {
      const endpoint = format === 'pdf' 
        ? `/api/comparisons/${comparisonId}/export/pdf`
        : `/api/comparisons/${comparisonId}/export`;
      const response = await fetch(endpoint, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Export failed');
      return { blob: await response.blob(), format };
    },
    onSuccess: ({ blob, format }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'pdf' ? 'pdf' : 'csv';
      a.download = `comparison-${comparison?.setupAName}-vs-${comparison?.setupBName}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export successful",
        description: `${format.toUpperCase()} file has been downloaded`,
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export comparison data",
        variant: "destructive",
      });
    },
  });

  const handleTogglePublic = (checked: boolean) => {
    setIsPublic(checked);
    togglePublicMutation.mutate(checked);
  };

  const renderParameterGroups = () => {
    if (!comparison?.deltaData) return null;

    const deltaData = comparison.deltaData as Record<string, any>;
    const groups = Object.keys(deltaData);

    return (
      <Accordion type="multiple" defaultValue={groups} className="w-full">
        {groups.map((groupName) => {
          const groupData = deltaData[groupName];
          const parameters = Object.entries(groupData);
          
          return (
            <AccordionItem key={groupName} value={groupName}>
              <AccordionTrigger className="text-lg font-semibold capitalize" data-testid={`accordion-${groupName}`}>
                <div className="flex items-center gap-2">
                  {groupName}
                  <Badge variant="secondary" className="ml-2">{parameters.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-4 gap-4 p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <div>Parameter</div>
                    <div className="text-right">Setup A</div>
                    <div className="text-right">Setup B</div>
                    <div className="text-right">Delta</div>
                  </div>
                  {parameters.map(([paramName, delta]) => {
                    const deltaObj = delta as ParameterDelta;
                    return (
                      <ParameterRow
                        key={paramName}
                        label={paramName}
                        valueA={deltaObj.oldValue}
                        valueB={deltaObj.newValue}
                        delta={deltaObj}
                      />
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Comparison not found</CardTitle>
            <CardDescription>The comparison you're looking for doesn't exist or has been deleted.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const interpretations = (comparison.interpretations as Interpretation[]) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild data-testid="button-back">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <Files className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold hidden sm:inline">SetupComparer</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user?.profileImageUrl && (
                <img
                  src={user.profileImageUrl}
                  alt={user.firstName || "User"}
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <span className="text-sm font-medium hidden sm:inline">
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
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2" data-testid="text-comparison-title">
                {comparison.setupAName} vs {comparison.setupBName}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {comparison.carName && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Car:</span>
                    <span data-testid="text-car-name">{comparison.carName}</span>
                  </div>
                )}
                {comparison.trackName && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Track:</span>
                    <span data-testid="text-track-name">{comparison.trackName}</span>
                  </div>
                )}
                {(comparison as any).category && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Category:</span>
                    <Badge variant="outline" className="text-xs">
                      {(comparison as any).category}
                    </Badge>
                  </div>
                )}
                {(comparison as any).conditions && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Conditions:</span>
                    <Badge variant="outline" className="text-xs">
                      {(comparison as any).conditions}
                    </Badge>
                  </div>
                )}
                {comparison.createdAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(comparison.createdAt), 'PPp')}
                  </div>
                )}
              </div>
              {(comparison as any).tags && (comparison as any).tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(comparison as any).tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" data-testid={`tag-${index}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={exportMutation.isPending}
                    data-testid="button-export"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => exportMutation.mutate('csv')}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportMutation.mutate('pdf')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="public-toggle" className="font-medium">Public Sharing</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate a shareable link for this comparison
                  </p>
                </div>
                <Switch
                  id="public-toggle"
                  checked={isPublic}
                  onCheckedChange={handleTogglePublic}
                  disabled={togglePublicMutation.isPending}
                  data-testid="switch-public-toggle"
                />
              </div>
              {isPublic && comparison.shareToken && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-mono break-all" data-testid="text-share-link">
                    {`${window.location.origin}/share/${comparison.shareToken}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Parameter Comparison</CardTitle>
                <CardDescription>Detailed breakdown of setup differences</CardDescription>
              </CardHeader>
              <CardContent>
                {renderParameterGroups()}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20">
              {comparison.telemetryData && (
                <div className="mb-6">
                  <TelemetryVisualization telemetryData={comparison.telemetryData} />
                </div>
              )}
              <h3 className="text-lg font-semibold mb-4">Interpretations</h3>
              {interpretations.length > 0 ? (
                <div className="space-y-4">
                  {interpretations.map((interpretation, index) => (
                    <InterpretationCard key={index} interpretation={interpretation} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No significant changes detected
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
