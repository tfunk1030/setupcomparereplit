import type { ParsedSetup, SetupParameter, SetupGroup } from "@shared/schema";

export function parseIRacingSetup(fileContent: string): ParsedSetup {
  const lines = fileContent.split('\n').map(line => line.trim());
  const setup: ParsedSetup = {};
  
  let currentSection: string | null = null;
  let currentSubSection: string | null = null;
  
  for (const line of lines) {
    if (!line || line.startsWith(';') || line.startsWith('#')) continue;
    
    if (line.startsWith('[') && line.endsWith(']')) {
      const sectionName = line.slice(1, -1).toLowerCase();
      
      if (sectionName.includes('front') || sectionName.includes('rear') || 
          sectionName.includes('left') || sectionName.includes('right')) {
        currentSubSection = sectionName;
      } else {
        currentSection = normalizeSectionName(sectionName);
        currentSubSection = null;
        
        if (!setup[currentSection]) {
          setup[currentSection] = {};
        }
      }
      continue;
    }
    
    if (line.includes('=')) {
      const [key, value] = line.split('=').map(s => s.trim());
      if (!key || value === undefined) continue;
      
      const paramName = normalizeParameterName(key);
      const parsedValue = parseValue(value);
      
      if (currentSection) {
        if (currentSubSection) {
          if (!setup[currentSection]![currentSubSection]) {
            setup[currentSection]![currentSubSection] = {};
          }
          (setup[currentSection]![currentSubSection] as SetupGroup)[paramName] = parsedValue;
        } else {
          setup[currentSection]![paramName] = parsedValue;
        }
      }
    }
  }
  
  return setup;
}

function normalizeSectionName(section: string): string {
  const mapping: Record<string, string> = {
    'suspension': 'suspension',
    'chassis': 'suspension',
    'aero': 'aero',
    'aerodynamics': 'aero',
    'tire': 'tires',
    'tires': 'tires',
    'tyres': 'tires',
    'damper': 'dampers',
    'dampers': 'dampers',
    'shock': 'dampers',
    'shocks': 'dampers',
    'arb': 'arb',
    'antiroll': 'arb',
    'anti-roll': 'arb',
    'brake': 'brakes',
    'brakes': 'brakes',
    'diff': 'differential',
    'differential': 'differential',
  };
  
  for (const [key, value] of Object.entries(mapping)) {
    if (section.includes(key)) return value;
  }
  
  return section;
}

function normalizeParameterName(param: string): string {
  return param
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function parseValue(value: string): SetupParameter {
  value = value.trim();
  
  const unitMatch = value.match(/^([-+]?[\d.]+)\s*([a-zA-Z°%]+)$/);
  if (unitMatch) {
    const [, numStr, unit] = unitMatch;
    return {
      value: parseFloat(numStr),
      unit: unit,
    };
  }
  
  const numValue = parseFloat(value);
  if (!isNaN(numValue)) {
    return { value: numValue };
  }
  
  return { value };
}
