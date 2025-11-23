import type { ParsedSetup, SetupParameter, ParameterDelta, Interpretation } from "@shared/schema";

export function calculateDeltas(setupA: ParsedSetup, setupB: ParsedSetup): Record<string, Record<string, ParameterDelta>> {
  const deltas: Record<string, Record<string, ParameterDelta>> = {};
  
  const allSections = new Set([...Object.keys(setupA), ...Object.keys(setupB)]);
  
  for (const section of allSections) {
    const sectionA = setupA[section] || {};
    const sectionB = setupB[section] || {};
    
    deltas[section] = {};
    
    const allParams = new Set([
      ...Object.keys(sectionA),
      ...Object.keys(sectionB)
    ]);
    
    for (const param of allParams) {
      const valueA = sectionA[param];
      const valueB = sectionB[param];
      
      if (isSetupParameter(valueA) && isSetupParameter(valueB)) {
        deltas[section][param] = calculateParameterDelta(valueA, valueB);
      } else if (typeof valueA === 'object' && typeof valueB === 'object') {
        const subDeltas = calculateSubGroupDeltas(param, valueA, valueB);
        for (const [subKey, subDelta] of Object.entries(subDeltas)) {
          deltas[section][subKey] = subDelta;
        }
      }
    }
  }
  
  return deltas;
}

function isSetupParameter(obj: any): obj is SetupParameter {
  return obj && typeof obj === 'object' && 'value' in obj;
}

function calculateSubGroupDeltas(groupName: string, groupA: any, groupB: any): Record<string, ParameterDelta> {
  const deltas: Record<string, ParameterDelta> = {};
  
  const allParams = new Set([
    ...Object.keys(groupA || {}),
    ...Object.keys(groupB || {})
  ]);
  
  for (const param of allParams) {
    const valueA = groupA?.[param];
    const valueB = groupB?.[param];
    
    if (isSetupParameter(valueA) && isSetupParameter(valueB)) {
      const compositeKey = `${groupName} - ${param}`;
      deltas[compositeKey] = calculateParameterDelta(valueA, valueB);
    }
  }
  
  return deltas;
}

function calculateParameterDelta(paramA: SetupParameter, paramB: SetupParameter): ParameterDelta {
  const oldVal = typeof paramA.value === 'number' ? paramA.value : 0;
  const newVal = typeof paramB.value === 'number' ? paramB.value : 0;
  
  const delta = newVal - oldVal;
  const percentChange = oldVal !== 0 ? (delta / oldVal) * 100 : 0;
  
  const magnitude = calculateMagnitude(delta, percentChange, paramA.unit);
  
  return {
    oldValue: paramA.value,
    newValue: paramB.value,
    delta: typeof delta === 'number' ? parseFloat(delta.toFixed(3)) : delta,
    percentChange: parseFloat(percentChange.toFixed(2)),
    unit: paramA.unit || paramB.unit,
    magnitude,
  };
}

function calculateMagnitude(delta: number, percentChange: number, unit?: string): 'none' | 'minor' | 'moderate' | 'major' {
  const absDelta = Math.abs(delta);
  const absPercent = Math.abs(percentChange);
  
  if (absDelta === 0) return 'none';
  
  if (unit === 'psi' || unit === 'kPa') {
    if (absDelta > 2) return 'major';
    if (absDelta > 1) return 'moderate';
    return 'minor';
  }
  
  if (unit === 'mm' || unit === 'cm') {
    if (absDelta > 5) return 'major';
    if (absDelta > 2) return 'moderate';
    return 'minor';
  }
  
  if (unit === '°' || unit === 'deg') {
    if (absDelta > 1) return 'major';
    if (absDelta > 0.5) return 'moderate';
    return 'minor';
  }
  
  if (absPercent > 10) return 'major';
  if (absPercent > 5) return 'moderate';
  if (absPercent > 1) return 'minor';
  
  return 'none';
}

export function generateInterpretations(
  deltas: Record<string, Record<string, ParameterDelta>>,
  carClass?: string,
  track?: string
): Interpretation[] {
  const interpretations: Interpretation[] = [];
  
  for (const [section, params] of Object.entries(deltas)) {
    for (const [paramName, delta] of Object.entries(params)) {
      if (delta.magnitude === 'none' || delta.magnitude === 'minor') continue;
      
      const interpretation = interpretParameter(section, paramName, delta, carClass, track);
      if (interpretation) {
        interpretations.push(interpretation);
      }
    }
  }
  
  return interpretations;
}

function interpretParameter(
  section: string,
  paramName: string,
  delta: ParameterDelta,
  carClass?: string,
  track?: string
): Interpretation | null {
  const paramLower = paramName.toLowerCase();
  const deltaNum = typeof delta.delta === 'number' ? delta.delta : 0;
  const isIncrease = deltaNum > 0;
  
  // Determine track characteristics
  const isOval = track?.toLowerCase().includes('oval') || 
                 track?.toLowerCase().includes('speedway') ||
                 track?.toLowerCase().includes('motor speedway') ||
                 track?.toLowerCase().includes('superspeedway');
  
  const isStreetCircuit = track?.toLowerCase().includes('street') ||
                          track?.toLowerCase().includes('monaco') ||
                          track?.toLowerCase().includes('detroit') ||
                          track?.toLowerCase().includes('long beach');
  
  const isHighSpeed = track?.toLowerCase().includes('monza') ||
                      track?.toLowerCase().includes('spa') ||
                      track?.toLowerCase().includes('silverstone') ||
                      isOval;
  
  // Determine car characteristics
  const isFormula = carClass?.toLowerCase().includes('formula') ||
                    carClass?.toLowerCase().includes('f1') ||
                    carClass?.toLowerCase().includes('f2') ||
                    carClass?.toLowerCase().includes('f3') ||
                    carClass?.toLowerCase().includes('indycar');
  
  const isGT = carClass?.toLowerCase().includes('gt3') ||
               carClass?.toLowerCase().includes('gte') ||
               carClass?.toLowerCase().includes('gtd') ||
               carClass?.toLowerCase().includes('gt4');
  
  const isStockCar = carClass?.toLowerCase().includes('nascar') ||
                     carClass?.toLowerCase().includes('xfinity') ||
                     carClass?.toLowerCase().includes('truck');
  
  if (section === 'aero') {
    if (paramLower.includes('front') && (paramLower.includes('wing') || paramLower.includes('flap'))) {
      let trackNote = '';
      if (isOval) {
        trackNote = ' On oval tracks, front downforce is crucial for stability through banking.';
      } else if (isHighSpeed) {
        trackNote = ' On high-speed tracks, this will significantly affect straight-line speed.';
      } else if (isStreetCircuit) {
        trackNote = ' On street circuits, front downforce helps with the many slow corners.';
      }
      
      let carNote = '';
      if (isFormula) {
        carNote = ' Formula cars are highly sensitive to aerodynamic changes.';
      } else if (isStockCar) {
        carNote = ' Stock cars rely heavily on aerodynamic balance for close racing.';
      }
      
      return {
        parameter: paramName,
        category: 'Aerodynamics',
        icon: 'wind',
        summary: `Front downforce ${isIncrease ? 'increased' : 'decreased'}`,
        explanation: `${isIncrease ? 'Increasing' : 'Decreasing'} front wing angle by ${Math.abs(deltaNum)}${delta.unit || ''} will ${isIncrease ? 'add more front downforce, improving front-end grip and potentially causing understeer' : 'reduce front downforce, making the car more prone to oversteer on turn-in'}.${trackNote}${carNote}`,
        impact: isIncrease ? 'neutral' : 'negative',
      };
    }
    
    if (paramLower.includes('rear') && (paramLower.includes('wing') || paramLower.includes('flap'))) {
      let trackNote = '';
      if (isOval) {
        trackNote = ' Critical for oval stability - less wing needed on superspeedways, more on shorter ovals.';
      } else if (isHighSpeed) {
        trackNote = ' Balance drag vs downforce carefully for long straights.';
      } else if (isStreetCircuit) {
        trackNote = ' Higher rear wing helps with traction out of slow corners.';
      }
      
      let carNote = '';
      if (isFormula) {
        carNote = ' DRS zones make rear wing setting even more critical.';
      } else if (isGT) {
        carNote = ' GT cars need rear stability for amateur drivers.';
      }
      
      return {
        parameter: paramName,
        category: 'Aerodynamics',
        icon: 'wind',
        summary: `Rear downforce ${isIncrease ? 'increased' : 'decreased'}`,
        explanation: `${isIncrease ? 'Increasing' : 'Decreasing'} rear wing by ${Math.abs(deltaNum)}${delta.unit || ''} will ${isIncrease ? 'improve rear stability and traction, especially in high-speed corners, but may increase drag' : 'reduce drag and improve top speed, but may make the rear unstable in fast corners'}.${trackNote}${carNote}`,
        impact: isIncrease ? 'positive' : 'negative',
      };
    }
    
    if (paramLower.includes('ride') && paramLower.includes('height')) {
      const location = paramLower.includes('front') ? 'front' : paramLower.includes('rear') ? 'rear' : '';
      return {
        parameter: paramName,
        category: 'Aerodynamics',
        icon: 'height',
        summary: `${location ? location.charAt(0).toUpperCase() + location.slice(1) + ' r' : 'R'}ide height ${isIncrease ? 'raised' : 'lowered'}`,
        explanation: `${isIncrease ? 'Raising' : 'Lowering'} ${location} ride height by ${Math.abs(deltaNum)}${delta.unit || ''} will ${isIncrease ? 'reduce downforce and mechanical grip, but improve ride over kerbs' : 'increase downforce and reduce drag, improving cornering speed but making the car stiffer'}.`,
        impact: isIncrease ? 'negative' : 'positive',
      };
    }
  }
  
  if (section === 'tires' || section === 'tyres') {
    if (paramLower.includes('pressure')) {
      const location = paramLower.includes('front') ? 'front' : paramLower.includes('rear') ? 'rear' : paramLower.includes('left') ? 'left' : paramLower.includes('right') ? 'right' : '';
      return {
        parameter: paramName,
        category: 'Tire Pressure',
        icon: 'gauge',
        summary: `${location ? location.charAt(0).toUpperCase() + location.slice(1) + ' t' : 'T'}ire pressure ${isIncrease ? 'increased' : 'decreased'}`,
        explanation: `${isIncrease ? 'Increasing' : 'Decreasing'} ${location} tire pressure by ${Math.abs(deltaNum)}${delta.unit || ''} will ${isIncrease ? 'make the tire stiffer, improving response but reducing contact patch and mechanical grip' : 'increase the contact patch and mechanical grip, but may make the tire feel sluggish'}.`,
        impact: 'neutral',
      };
    }
    
    if (paramLower.includes('camber')) {
      const location = paramLower.includes('front') ? 'front' : paramLower.includes('rear') ? 'rear' : '';
      return {
        parameter: paramName,
        category: 'Suspension Geometry',
        icon: 'rotate',
        summary: `${location ? location.charAt(0).toUpperCase() + location.slice(1) + ' c' : 'C'}amber ${Math.abs(deltaNum) > Math.abs(typeof delta.oldValue === 'number' ? delta.oldValue : 0) ? 'increased' : 'decreased'}`,
        explanation: `Adjusting ${location} camber by ${Math.abs(deltaNum)}${delta.unit || ''} will affect tire contact patch in corners. More negative camber improves cornering grip but may reduce straight-line grip.`,
        impact: 'neutral',
      };
    }
    
    if (paramLower.includes('toe')) {
      const location = paramLower.includes('front') ? 'front' : paramLower.includes('rear') ? 'rear' : '';
      return {
        parameter: paramName,
        category: 'Suspension Geometry',
        icon: 'rotate',
        summary: `${location ? location.charAt(0).toUpperCase() + location.slice(1) + ' t' : 'T'}oe adjusted`,
        explanation: `Changing ${location} toe by ${Math.abs(deltaNum)}${delta.unit || ''} will affect straight-line stability and turn-in response. Toe-in improves stability, toe-out improves turn-in but may cause instability.`,
        impact: 'neutral',
      };
    }
  }
  
  if (section === 'dampers' || section === 'shocks') {
    if (paramLower.includes('bump') || paramLower.includes('compression')) {
      const location = paramLower.includes('front') ? 'front' : paramLower.includes('rear') ? 'rear' : '';
      return {
        parameter: paramName,
        category: 'Damping',
        icon: 'spring',
        summary: `${location ? location.charAt(0).toUpperCase() + location.slice(1) + ' c' : 'C'}ompression damping ${isIncrease ? 'stiffened' : 'softened'}`,
        explanation: `${isIncrease ? 'Increasing' : 'Decreasing'} ${location} compression damping will ${isIncrease ? 'slow down weight transfer during braking and corner entry, improving stability but potentially reducing grip' : 'allow faster weight transfer, improving mechanical grip but may cause instability'}.`,
        impact: isIncrease ? 'neutral' : 'positive',
      };
    }
    
    if (paramLower.includes('rebound') || paramLower.includes('extension')) {
      const location = paramLower.includes('front') ? 'front' : paramLower.includes('rear') ? 'rear' : '';
      return {
        parameter: paramName,
        category: 'Damping',
        icon: 'spring',
        summary: `${location ? location.charAt(0).toUpperCase() + location.slice(1) + ' r' : 'R'}ebound damping ${isIncrease ? 'stiffened' : 'softened'}`,
        explanation: `${isIncrease ? 'Increasing' : 'Decreasing'} ${location} rebound damping will ${isIncrease ? 'slow down the suspension extension, keeping the tire planted longer but may cause the car to sit lower' : 'allow faster suspension extension, improving ride quality but may cause the car to be bouncy'}.`,
        impact: 'neutral',
      };
    }
  }
  
  if (section === 'arb' || section === 'antiroll') {
    const location = paramLower.includes('front') ? 'front' : paramLower.includes('rear') ? 'rear' : '';
    return {
      parameter: paramName,
      category: 'Anti-Roll Bar',
      icon: 'bar',
      summary: `${location ? location.charAt(0).toUpperCase() + location.slice(1) + ' A' : 'A'}RB ${isIncrease ? 'stiffened' : 'softened'}`,
      explanation: `${isIncrease ? 'Stiffening' : 'Softening'} the ${location} anti-roll bar will ${isIncrease ? 'reduce body roll and improve response, but may reduce mechanical grip in that end of the car' : 'increase mechanical grip and improve ride quality, but may increase body roll and reduce response'}.`,
      impact: isIncrease ? 'neutral' : 'positive',
    };
  }
  
  if (section === 'brakes') {
    if (paramLower.includes('bias') || paramLower.includes('balance')) {
      return {
        parameter: paramName,
        category: 'Braking',
        icon: 'brake',
        summary: `Brake bias ${isIncrease ? 'moved forward' : 'moved rearward'}`,
        explanation: `Adjusting brake bias by ${Math.abs(deltaNum)}${delta.unit || ''} will ${isIncrease ? 'put more braking force on the front, reducing the risk of rear lockup but increasing front tire wear' : 'shift more braking to the rear, improving front tire life but increasing risk of rear instability under braking'}.`,
        impact: 'neutral',
      };
    }
  }
  
  if (section === 'differential' || section === 'diff') {
    if (paramLower.includes('preload')) {
      return {
        parameter: paramName,
        category: 'Differential',
        icon: 'gear',
        summary: `Differential preload ${isIncrease ? 'increased' : 'decreased'}`,
        explanation: `${isIncrease ? 'Increasing' : 'Decreasing'} diff preload will ${isIncrease ? 'make the differential lock more aggressively, improving traction but may cause understeer' : 'allow more wheel speed difference, improving turn-in but may cause wheelspin'}.`,
        impact: 'neutral',
      };
    }
  }
  
  return null;
}
