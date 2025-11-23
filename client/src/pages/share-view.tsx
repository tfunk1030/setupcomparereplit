import { useQuery } from "@tanstack/react-query";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Comparison, ParameterDelta, Interpretation } from "@shared/schema";
import { Files, TrendingUp, TrendingDown, Minus, Lightbulb, AlertCircle, CheckCircle2, Calendar, Home } from "lucide-react";
import { Link, useRoute } from "wouter";
import { format } from "date-fns";

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
      <div className="text-right font-mono text-sm">
        {valueA} {delta.unit || ''}
      </div>
      <div className="text-right font-mono text-sm">
        {valueB} {delta.unit || ''}
      </div>
      <div className="flex items-center justify-end gap-2">
        {getDeltaIcon()}
        <span className="font-mono text-sm font-medium">
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

export default function ShareView() {
  const [, params] = useRoute("/share/:token");
  const shareToken = params?.token;

  const { data: comparison, isLoading, error } = useQuery<Comparison>({
    queryKey: ["/api/share", shareToken],
    enabled: !!shareToken,
    retry: false,
  });

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
              <AccordionTrigger className="text-lg font-semibold capitalize">
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading shared comparison...</p>
        </div>
      </div>
    );
  }

  if (error || !comparison) {
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
            <ThemeToggle />
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Comparison not found</CardTitle>
              <CardDescription>
                This shared comparison link is invalid or has been disabled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const interpretations = (comparison.interpretations as Interpretation[]) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <Files className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">SetupComparer</h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">Shared View</Badge>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Homepage
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            {comparison.setupAName} vs {comparison.setupBName}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {comparison.carName && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Car:</span>
                <span>{comparison.carName}</span>
              </div>
            )}
            {comparison.trackName && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Track:</span>
                <span>{comparison.trackName}</span>
              </div>
            )}
            {comparison.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {format(new Date(comparison.createdAt), 'PPp')}
              </div>
            )}
          </div>
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

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Want to create your own setup comparisons?
          </p>
          <Button asChild>
            <Link href="/">Try SetupComparer</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
