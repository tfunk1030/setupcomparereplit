// Telemetry data parser for CSV format
// Supports lap time data and performance metrics

export interface TelemetryData {
  lapTimes: LapTime[];
  bestLap?: LapTime;
  averageLapTime?: number;
  consistency?: number;
  fuelUsage?: number;
  tireWear?: TireWear;
  trackConditions?: string;
  sessionType?: string;
  totalLaps?: number;
}

export interface LapTime {
  lapNumber: number;
  lapTime: string;
  sector1?: string;
  sector2?: string;
  sector3?: string;
  valid: boolean;
  fuelLevel?: number;
  tireTemp?: {
    lf?: number;
    rf?: number;
    lr?: number;
    rr?: number;
  };
}

export interface TireWear {
  leftFront: number;
  rightFront: number;
  leftRear: number;
  rightRear: number;
}

export function parseTelemetryCSV(csvContent: string): TelemetryData {
  // Handle both CRLF and LF line endings
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\r/g, ''));
  const lapTimes: LapTime[] = [];
  
  // Expected headers: lap_number, lap_time, sector1, sector2, sector3, valid, fuel_level
  const requiredHeaders = ['lap_number', 'lap_time'];
  const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
  
  if (!hasRequiredHeaders) {
    throw new Error('CSV must contain at least lap_number and lap_time columns');
  }

  // Parse each data row
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;

    const lap: LapTime = {
      lapNumber: parseInt(values[headers.indexOf('lap_number')]) || i,
      lapTime: values[headers.indexOf('lap_time')] || '',
      valid: true
    };

    // Optional fields
    const sector1Index = headers.indexOf('sector1');
    if (sector1Index >= 0) lap.sector1 = values[sector1Index];
    
    const sector2Index = headers.indexOf('sector2');
    if (sector2Index >= 0) lap.sector2 = values[sector2Index];
    
    const sector3Index = headers.indexOf('sector3');
    if (sector3Index >= 0) lap.sector3 = values[sector3Index];
    
    const validIndex = headers.indexOf('valid');
    if (validIndex >= 0) {
      lap.valid = values[validIndex]?.toLowerCase() !== 'false' && values[validIndex] !== '0';
    }
    
    const fuelIndex = headers.indexOf('fuel_level');
    if (fuelIndex >= 0) {
      lap.fuelLevel = parseFloat(values[fuelIndex]);
    }

    // Parse tire temps if available
    const lfTempIndex = headers.indexOf('tire_temp_lf');
    const rfTempIndex = headers.indexOf('tire_temp_rf');
    const lrTempIndex = headers.indexOf('tire_temp_lr');
    const rrTempIndex = headers.indexOf('tire_temp_rr');
    
    if (lfTempIndex >= 0 || rfTempIndex >= 0 || lrTempIndex >= 0 || rrTempIndex >= 0) {
      lap.tireTemp = {};
      if (lfTempIndex >= 0) lap.tireTemp.lf = parseFloat(values[lfTempIndex]);
      if (rfTempIndex >= 0) lap.tireTemp.rf = parseFloat(values[rfTempIndex]);
      if (lrTempIndex >= 0) lap.tireTemp.lr = parseFloat(values[lrTempIndex]);
      if (rrTempIndex >= 0) lap.tireTemp.rr = parseFloat(values[rrTempIndex]);
    }

    lapTimes.push(lap);
  }

  // Calculate statistics
  const validLaps = lapTimes.filter(lap => lap.valid);
  let bestLap: LapTime | undefined;
  let averageLapTime: number | undefined;
  let consistency: number | undefined;

  if (validLaps.length > 0) {
    // Find best lap
    bestLap = validLaps.reduce((best, current) => {
      return timeToSeconds(current.lapTime) < timeToSeconds(best.lapTime) ? current : best;
    });

    // Calculate average lap time (excluding outliers)
    const lapSeconds = validLaps.map(lap => timeToSeconds(lap.lapTime));
    const sortedTimes = [...lapSeconds].sort((a, b) => a - b);
    
    // Remove top and bottom 10% as outliers if we have enough laps
    let trimmedTimes = sortedTimes;
    if (sortedTimes.length > 10) {
      const trimCount = Math.floor(sortedTimes.length * 0.1);
      trimmedTimes = sortedTimes.slice(trimCount, -trimCount);
    }
    
    const avgSeconds = trimmedTimes.reduce((sum, time) => sum + time, 0) / trimmedTimes.length;
    averageLapTime = avgSeconds;

    // Calculate consistency (standard deviation of lap times)
    if (trimmedTimes.length > 1) {
      const variance = trimmedTimes.reduce((sum, time) => {
        const diff = time - avgSeconds;
        return sum + (diff * diff);
      }, 0) / trimmedTimes.length;
      consistency = Math.sqrt(variance);
    }
  }

  // Calculate fuel usage if data available
  let fuelUsage: number | undefined;
  const lapsWithFuel = lapTimes.filter(lap => lap.fuelLevel !== undefined);
  if (lapsWithFuel.length >= 2) {
    const firstFuel = lapsWithFuel[0].fuelLevel!;
    const lastFuel = lapsWithFuel[lapsWithFuel.length - 1].fuelLevel!;
    const lapsCompleted = lapsWithFuel[lapsWithFuel.length - 1].lapNumber - lapsWithFuel[0].lapNumber;
    if (lapsCompleted > 0) {
      fuelUsage = (firstFuel - lastFuel) / lapsCompleted;
    }
  }

  return {
    lapTimes,
    bestLap,
    averageLapTime,
    consistency,
    fuelUsage,
    totalLaps: lapTimes.length
  };
}

// Convert lap time string (mm:ss.sss or ss.sss) to seconds
function timeToSeconds(timeStr: string): number {
  if (!timeStr) return Infinity;
  
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    // Format: mm:ss.sss
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else {
    // Format: ss.sss
    return parseFloat(timeStr) || Infinity;
  }
}

// Format seconds back to lap time string
export function secondsToTime(seconds: number): string {
  if (!isFinite(seconds)) return '--:--';
  
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}:${secs.toFixed(3).padStart(6, '0')}`;
  }
  return secs.toFixed(3);
}