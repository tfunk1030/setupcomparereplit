import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Timer, TrendingUp, Fuel, Gauge } from "lucide-react";

interface TelemetryData {
  lapTimes: LapTime[];
  bestLap?: LapTime;
  averageLapTime?: number;
  consistency?: number;
  fuelUsage?: number;
  totalLaps?: number;
}

interface LapTime {
  lapNumber: number;
  lapTime: string;
  sector1?: string;
  sector2?: string;
  sector3?: string;
  valid: boolean;
  fuelLevel?: number;
}

interface TelemetryVisualizationProps {
  telemetryData: TelemetryData;
}

export function TelemetryVisualization({ telemetryData }: TelemetryVisualizationProps) {
  if (!telemetryData || !telemetryData.lapTimes || telemetryData.lapTimes.length === 0) {
    return null;
  }

  const formatTime = (seconds: number | undefined): string => {
    if (!seconds || !isFinite(seconds)) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${secs.toFixed(3).padStart(6, '0')}`;
    }
    return secs.toFixed(3);
  };

  const validLaps = telemetryData.lapTimes.filter(lap => lap.valid);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Telemetry Analysis
        </CardTitle>
        <CardDescription>
          Lap time data and performance metrics from your session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              Best Lap
            </div>
            <div className="text-2xl font-bold font-mono">
              {telemetryData.bestLap ? telemetryData.bestLap.lapTime : '--:--'}
            </div>
            {telemetryData.bestLap && (
              <Badge variant="outline">Lap {telemetryData.bestLap.lapNumber}</Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Average Lap
            </div>
            <div className="text-2xl font-bold font-mono">
              {formatTime(telemetryData.averageLapTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              {validLaps.length} valid laps
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge className="h-4 w-4" />
              Consistency
            </div>
            <div className="text-2xl font-bold">
              {telemetryData.consistency 
                ? `±${telemetryData.consistency.toFixed(3)}s` 
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Standard deviation</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Fuel className="h-4 w-4" />
              Fuel Usage
            </div>
            <div className="text-2xl font-bold">
              {telemetryData.fuelUsage 
                ? `${telemetryData.fuelUsage.toFixed(2)}L/lap` 
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Average per lap</p>
          </div>
        </div>

        <Tabs defaultValue="laptimes" className="w-full">
          <TabsList>
            <TabsTrigger value="laptimes" data-testid="tab-laptimes">Lap Times</TabsTrigger>
            <TabsTrigger value="sectors" data-testid="tab-sectors">Sector Times</TabsTrigger>
          </TabsList>
          
          <TabsContent value="laptimes">
            <div className="relative">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Lap</th>
                      <th className="text-left py-2 px-3 font-medium">Time</th>
                      <th className="text-left py-2 px-3 font-medium">Delta to Best</th>
                      {telemetryData.lapTimes[0]?.fuelLevel !== undefined && (
                        <th className="text-left py-2 px-3 font-medium">Fuel</th>
                      )}
                      <th className="text-left py-2 px-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetryData.lapTimes.slice(0, 20).map((lap) => {
                      const isBestLap = lap.lapNumber === telemetryData.bestLap?.lapNumber;
                      const deltaToBest = telemetryData.bestLap 
                        ? timeToSeconds(lap.lapTime) - timeToSeconds(telemetryData.bestLap.lapTime)
                        : 0;
                      
                      return (
                        <tr 
                          key={lap.lapNumber} 
                          className={`border-b ${isBestLap ? 'bg-chart-3/10' : ''}`}
                        >
                          <td className="py-2 px-3">{lap.lapNumber}</td>
                          <td className="py-2 px-3 font-mono">
                            {lap.lapTime}
                            {isBestLap && (
                              <Badge className="ml-2" variant="outline">Best</Badge>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono">
                            {lap.valid && deltaToBest !== 0
                              ? `+${deltaToBest.toFixed(3)}`
                              : '--'}
                          </td>
                          {telemetryData.lapTimes[0]?.fuelLevel !== undefined && (
                            <td className="py-2 px-3">{lap.fuelLevel?.toFixed(1)}L</td>
                          )}
                          <td className="py-2 px-3">
                            {lap.valid ? (
                              <Badge variant="outline" className="text-chart-3">Valid</Badge>
                            ) : (
                              <Badge variant="outline" className="text-destructive">Invalid</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {telemetryData.lapTimes.length > 20 && (
                <p className="text-sm text-muted-foreground mt-2 px-3">
                  Showing first 20 laps of {telemetryData.totalLaps} total
                </p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="sectors">
            <div className="relative">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Lap</th>
                      <th className="text-left py-2 px-3 font-medium">Sector 1</th>
                      <th className="text-left py-2 px-3 font-medium">Sector 2</th>
                      <th className="text-left py-2 px-3 font-medium">Sector 3</th>
                      <th className="text-left py-2 px-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetryData.lapTimes
                      .filter(lap => lap.sector1 || lap.sector2 || lap.sector3)
                      .slice(0, 20)
                      .map((lap) => {
                        const isBestLap = lap.lapNumber === telemetryData.bestLap?.lapNumber;
                        
                        return (
                          <tr 
                            key={lap.lapNumber} 
                            className={`border-b ${isBestLap ? 'bg-chart-3/10' : ''}`}
                          >
                            <td className="py-2 px-3">{lap.lapNumber}</td>
                            <td className="py-2 px-3 font-mono">{lap.sector1 || '--'}</td>
                            <td className="py-2 px-3 font-mono">{lap.sector2 || '--'}</td>
                            <td className="py-2 px-3 font-mono">{lap.sector3 || '--'}</td>
                            <td className="py-2 px-3 font-mono">
                              {lap.lapTime}
                              {isBestLap && (
                                <Badge className="ml-2" variant="outline">Best</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {!telemetryData.lapTimes.some(lap => lap.sector1 || lap.sector2 || lap.sector3) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sector data available in telemetry
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to convert time string to seconds
function timeToSeconds(timeStr: string | undefined): number {
  if (!timeStr) return Infinity;
  
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else {
    const parsed = parseFloat(timeStr);
    return isNaN(parsed) ? Infinity : parsed;
  }
}