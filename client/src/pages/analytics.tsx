import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { ArrowLeft, TrendingUp, BarChart3, Car, MapPin, Hash, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AnalyticsData {
  totalComparisons: number;
  recentComparisons: any[];
  topParameters: Array<{
    parameter: string;
    count: number;
    avgMagnitude: number | null;
    hasNumericData: boolean;
  }>;
  carDistribution: Record<string, number>;
  trackDistribution: Record<string, number>;
  temporalData: Array<{
    date: string;
    id: string;
    car: string;
    track: string;
    setupA: string;
    setupB: string;
  }>;
  uniqueSetups: number;
}

export default function Analytics() {
  const [, setLocation] = useLocation();

  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics'],
  });

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-7xl mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error loading analytics</CardTitle>
            <CardDescription>Unable to fetch analytics data. Please try again later.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              data-testid="button-back"
              onClick={() => setLocation("/")} 
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatParameterName = (param: string) => {
    const parts = param.split('.');
    return parts.length > 1 ? `${parts[0]} - ${parts[1]}` : param;
  };

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button 
            data-testid="button-back"
            onClick={() => setLocation("/")} 
            variant="ghost" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Insights from your setup comparisons</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Comparisons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-comparisons">
              {analytics?.totalComparisons || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unique Setups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-unique-setups">
              {analytics?.uniqueSetups || 0}
            </div>
            <p className="text-xs text-muted-foreground">Different setup files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Most Used Car</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-most-used-car">
              {Object.entries(analytics?.carDistribution || {}).length > 0
                ? Object.entries(analytics!.carDistribution).reduce((a, b) =>
                    a[1] > b[1] ? a : b
                  )[0]
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(analytics?.carDistribution || {}).length > 0
                ? `${Object.entries(analytics!.carDistribution).reduce((a, b) =>
                    a[1] > b[1] ? a : b
                  )[1]} comparisons`
                : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Most Used Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-most-used-track">
              {Object.entries(analytics?.trackDistribution || {}).length > 0
                ? Object.entries(analytics!.trackDistribution).reduce((a, b) =>
                    a[1] > b[1] ? a : b
                  )[0]
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {Object.entries(analytics?.trackDistribution || {}).length > 0
                ? `${Object.entries(analytics!.trackDistribution).reduce((a, b) =>
                    a[1] > b[1] ? a : b
                  )[1]} comparisons`
                : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Top Changed Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Most Changed Parameters
            </CardTitle>
            <CardDescription>
              Parameters you adjust most frequently
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.topParameters && analytics.topParameters.length > 0 ? (
              <div className="space-y-3">
                {analytics.topParameters.map((param, index) => (
                  <div 
                    key={param.parameter} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    data-testid={`parameter-item-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {formatParameterName(param.parameter)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {param.hasNumericData && param.avgMagnitude !== null 
                            ? `Avg change: ${param.avgMagnitude.toFixed(2)}` 
                            : 'Non-numeric change'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{param.count}</p>
                      <p className="text-xs text-muted-foreground">changes</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No parameter changes recorded yet</p>
            )}
          </CardContent>
        </Card>

        {/* Car Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Car Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of comparisons by car
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(analytics?.carDistribution || {}).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics!.carDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([car, count]) => (
                    <div 
                      key={car} 
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      data-testid={`car-item-${car}`}
                    >
                      <span className="text-sm font-medium">{car}</span>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-2 bg-primary rounded-full" 
                          style={{ 
                            width: `${(count / analytics!.totalComparisons) * 100}px` 
                          }}
                        />
                        <span className="text-sm font-bold">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No car data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Comparisons
          </CardTitle>
          <CardDescription>
            Your latest setup comparison activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.recentComparisons && analytics.recentComparisons.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentComparisons.map((comp) => (
                <div 
                  key={comp.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                  data-testid={`recent-comparison-${comp.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {comp.setupAName} vs {comp.setupBName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {comp.carName && (
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {comp.carName}
                        </span>
                      )}
                      {comp.trackName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {comp.trackName}
                        </span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(comp.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button 
                    data-testid={`button-view-${comp.id}`}
                    onClick={() => setLocation(`/comparison/${comp.id}`)}
                    variant="ghost"
                    size="sm"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No comparisons yet</p>
          )}
        </CardContent>
      </Card>

      {/* Insights Panel */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Setup Insights
          </CardTitle>
          <CardDescription>
            Recommendations based on your comparison patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.topParameters && analytics.topParameters.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-primary">
                <h4 className="font-medium mb-1">Focus Area</h4>
                <p className="text-sm text-muted-foreground">
                  You frequently adjust {formatParameterName(analytics.topParameters[0].parameter)} 
                  (changed {analytics.topParameters[0].count} times). Consider creating baseline 
                  setups with different {formatParameterName(analytics.topParameters[0].parameter)} 
                  values for quick comparisons.
                </p>
              </div>
            )}
            
            {Object.keys(analytics?.carDistribution || {}).length > 3 && (
              <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-primary">
                <h4 className="font-medium mb-1">Car Diversity</h4>
                <p className="text-sm text-muted-foreground">
                  You work with {Object.keys(analytics!.carDistribution).length} different cars. 
                  Consider creating car-specific setup templates to speed up your workflow.
                </p>
              </div>
            )}
            
            {analytics?.totalComparisons && analytics.totalComparisons > 10 && (
              <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-l-primary">
                <h4 className="font-medium mb-1">Trend Analysis Available</h4>
                <p className="text-sm text-muted-foreground">
                  With {analytics.totalComparisons} comparisons, you have enough data to identify 
                  setup trends. Look for patterns in your most successful setups.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}