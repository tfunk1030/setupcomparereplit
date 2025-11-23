import * as cheerio from 'cheerio';
import type { ParsedSetup, SetupParameter } from "@shared/schema";

export function parseIRacingHTMLExport(htmlContent: string): ParsedSetup {
  const $ = cheerio.load(htmlContent);
  const setup: ParsedSetup = {};

  // Process each section (h2) in the document
  $('h2').each((_, element) => {
    const sectionTitle = $(element).text().trim().toLowerCase();
    const sectionName = normalizeSectionName(sectionTitle);
    
    // Find the next table after this heading
    const table = $(element).next('table');
    if (table.length === 0) return;

    if (!setup[sectionName]) {
      setup[sectionName] = {};
    }

    // Parse table rows
    table.find('tr').each((_, row) => {
      const cells = $(row).find('td');
      
      if (cells.length === 2) {
        // Simple key-value pair (like ARB, Brakes, Diff)
        const key = $(cells[0]).text().trim();
        const value = $(cells[1]).text().trim();
        const paramName = normalizeParameterName(key);
        setup[sectionName]![paramName] = parseValue(value);
      } else if (cells.length === 3) {
        // Left/Right pairs (like Front/Rear Suspension)
        const paramName = normalizeParameterName($(cells[0]).text().trim());
        const leftValue = $(cells[1]).text().trim();
        const rightValue = $(cells[2]).text().trim();
        
        // Create subsections for left/right
        if (!setup[sectionName]!['left']) {
          setup[sectionName]!['left'] = {};
        }
        if (!setup[sectionName]!['right']) {
          setup[sectionName]!['right'] = {};
        }
        
        (setup[sectionName]!['left'] as Record<string, SetupParameter>)[paramName] = parseValue(leftValue);
        (setup[sectionName]!['right'] as Record<string, SetupParameter>)[paramName] = parseValue(rightValue);
      } else if (cells.length === 4) {
        // Corner-specific data (like Tires, Dampers)
        const position = $(cells[0]).text().trim().toLowerCase();
        const positionKey = normalizeCornerPosition(position);
        
        if (!setup[sectionName]![positionKey]) {
          setup[sectionName]![positionKey] = {};
        }
        
        // Get the column headers to know what the values represent
        const headerRow = table.find('tr').first();
        const headers = headerRow.find('th');
        
        for (let i = 1; i < cells.length; i++) {
          const headerText = $(headers[i]).text().trim();
          const paramName = normalizeParameterName(headerText);
          const value = $(cells[i]).text().trim();
          (setup[sectionName]![positionKey] as Record<string, SetupParameter>)[paramName] = parseValue(value);
        }
      }
    });
  });

  return setup;
}

function normalizeSectionName(section: string): string {
  const mapping: Record<string, string> = {
    'tires': 'tires',
    'tire': 'tires',
    'front suspension': 'suspension',
    'rear suspension': 'suspension',
    'suspension': 'suspension',
    'dampers': 'dampers',
    'shocks': 'dampers',
    'aerodynamics': 'aero',
    'aero': 'aero',
    'anti-roll bars': 'arb',
    'arb': 'arb',
    'sway bars': 'arb',
    'brakes': 'brakes',
    'brake': 'brakes',
    'differential': 'diff',
    'diff': 'diff',
    'gearing': 'gearing',
    'transmission': 'gearing',
    'alignment': 'alignment',
  };

  const normalized = section.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  return mapping[normalized] || normalized.replace(/\s+/g, '_');
}

function normalizeCornerPosition(position: string): string {
  const mapping: Record<string, string> = {
    'left front': 'left_front',
    'lf': 'left_front',
    'right front': 'right_front',
    'rf': 'right_front',
    'left rear': 'left_rear',
    'lr': 'left_rear',
    'right rear': 'right_rear',
    'rr': 'right_rear',
    'front': 'front',
    'rear': 'rear',
    'left': 'left',
    'right': 'right',
  };

  const normalized = position.toLowerCase().trim();
  return mapping[normalized] || normalized.replace(/\s+/g, '_');
}

function normalizeParameterName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseValue(value: string): SetupParameter {
  // Remove units and extract numeric value
  const cleanValue = value.replace(/[^\d\-\.]+/g, '').trim();
  const numericValue = parseFloat(cleanValue);
  
  if (!isNaN(numericValue)) {
    return {
      value: numericValue,
      unit: extractUnit(value),
    };
  }

  return {
    value: value.trim(),
    unit: '',
  };
}

function extractUnit(value: string): string {
  const unitMatch = value.match(/([a-zA-Z%]+)\s*$/);
  return unitMatch ? unitMatch[1] : '';
}
