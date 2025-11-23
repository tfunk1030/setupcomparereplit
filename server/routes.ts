import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { parseIRacingSetup } from "./setupParser";
import { calculateDeltas, generateInterpretations } from "./comparisonEngine";
import { generateComparisonPDF } from "./pdfGenerator";
import { parseTelemetryCSV, type TelemetryData } from "./telemetryParser";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/comparisons/upload', isAuthenticated, upload.fields([
    { name: 'setupA', maxCount: 1 },
    { name: 'setupB', maxCount: 1 },
    { name: 'telemetry', maxCount: 1 }
  ]), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { carName, trackName } = req.body;

      if (!files?.setupA?.[0] || !files?.setupB?.[0]) {
        return res.status(400).json({ message: "Both setup files are required" });
      }

      const setupAFile = files.setupA[0];
      const setupBFile = files.setupB[0];
      const telemetryFile = files.telemetry?.[0];

      const setupAContent = setupAFile.buffer.toString('utf-8');
      const setupBContent = setupBFile.buffer.toString('utf-8');

      const setupAData = parseIRacingSetup(setupAContent);
      const setupBData = parseIRacingSetup(setupBContent);

      const deltaData = calculateDeltas(setupAData, setupBData);
      const interpretations = generateInterpretations(deltaData, carName, trackName);

      // Parse telemetry data if provided
      let telemetryData: TelemetryData | null = null;
      if (telemetryFile) {
        try {
          const telemetryContent = telemetryFile.buffer.toString('utf-8');
          telemetryData = parseTelemetryCSV(telemetryContent);
        } catch (error) {
          console.error("Error parsing telemetry:", error);
          // Continue without telemetry data if parsing fails
        }
      }

      const comparison = await storage.createComparison({
        userId,
        setupAName: setupAFile.originalname.replace('.sto', ''),
        setupBName: setupBFile.originalname.replace('.sto', ''),
        setupAData: setupAData as any,
        setupBData: setupBData as any,
        deltaData: deltaData as any,
        interpretations: interpretations as any,
        telemetryData: telemetryData as any,
        carName: carName || null,
        trackName: trackName || null,
        isPublic: false,
        shareToken: null,
      });

      res.json(comparison);
    } catch (error) {
      console.error("Error creating comparison:", error);
      res.status(500).json({ message: "Failed to create comparison" });
    }
  });

  app.get('/api/comparisons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const comparisons = await storage.getUserComparisons(userId);
      res.json(comparisons);
    } catch (error) {
      console.error("Error fetching comparisons:", error);
      res.status(500).json({ message: "Failed to fetch comparisons" });
    }
  });

  // Analytics endpoint
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userComparisons = await storage.getUserComparisons(userId);
      
      // Sort comparisons by date (newest first), filtering out invalid dates
      const sortedComparisons = [...userComparisons]
        .filter(comp => comp.createdAt) // Only include comparisons with valid dates
        .sort((a, b) => {
          const dateA = new Date(a.createdAt!).getTime();
          const dateB = new Date(b.createdAt!).getTime();
          return dateB - dateA;
        });
      
      // Calculate analytics
      const analytics = {
        totalComparisons: sortedComparisons.length,
        recentComparisons: sortedComparisons.slice(0, 5),
        parameterFrequency: {} as Record<string, number>,
        parameterChangeCounts: {} as Record<string, { count: number, magnitudeSum: number }>,
        carDistribution: {} as Record<string, number>,
        trackDistribution: {} as Record<string, number>,
        temporalData: [] as any[],
        setupNamesUsed: new Set<string>(),
      };
      
      // Analyze each comparison
      sortedComparisons.forEach((comp) => {
        // Track car and track distribution (normalized)
        if (comp.carName) {
          const normalizedCar = comp.carName.trim().toLowerCase();
          analytics.carDistribution[normalizedCar] = (analytics.carDistribution[normalizedCar] || 0) + 1;
        }
        if (comp.trackName) {
          const normalizedTrack = comp.trackName.trim().toLowerCase();
          analytics.trackDistribution[normalizedTrack] = (analytics.trackDistribution[normalizedTrack] || 0) + 1;
        }
        
        // Track setup names
        analytics.setupNamesUsed.add(comp.setupAName);
        analytics.setupNamesUsed.add(comp.setupBName);
        
        // Analyze delta data
        const deltas = comp.deltaData as any;
        if (deltas && typeof deltas === 'object') {
          Object.entries(deltas).forEach(([category, params]) => {
            if (typeof params === 'object' && params !== null) {
              Object.entries(params as any).forEach(([param, values]) => {
                const fullParam = `${category}.${param}`;
                
                // Track parameter change frequency (include all changes, not just numeric)
                const hasChange = (values as any)?.oldValue !== (values as any)?.newValue;
                if (hasChange) {
                  analytics.parameterFrequency[fullParam] = (analytics.parameterFrequency[fullParam] || 0) + 1;
                  
                  // Track numeric deltas for average magnitude calculation
                  const delta = (values as any).delta;
                  if (typeof delta === 'number' && !isNaN(delta) && delta !== 0) {
                    if (!analytics.parameterChangeCounts[fullParam]) {
                      analytics.parameterChangeCounts[fullParam] = { count: 0, magnitudeSum: 0 };
                    }
                    analytics.parameterChangeCounts[fullParam].count++;
                    analytics.parameterChangeCounts[fullParam].magnitudeSum += Math.abs(delta);
                  }
                }
              });
            }
          });
        }
        
        // Add temporal data point with formatted car/track names
        analytics.temporalData.push({
          date: comp.createdAt,
          id: comp.id,
          car: comp.carName ? comp.carName.trim() : 'Unknown',
          track: comp.trackName ? comp.trackName.trim() : 'Unknown',
          setupA: comp.setupAName,
          setupB: comp.setupBName,
        });
      });
      
      // Sort parameter frequency and get top 10
      const topParameters = Object.entries(analytics.parameterFrequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([param, count]) => {
          const changeData = analytics.parameterChangeCounts[param];
          // Only calculate average if we have numeric changes
          const avgMagnitude = changeData && changeData.count > 0 
            ? changeData.magnitudeSum / changeData.count 
            : null; // Use null for non-numeric changes
          return {
            parameter: param,
            count,
            avgMagnitude,
            hasNumericData: changeData && changeData.count > 0,
          };
        });
      
      // Format car distribution (capitalize first letter for display)
      const formattedCarDistribution: Record<string, number> = {};
      Object.entries(analytics.carDistribution).forEach(([car, count]) => {
        const displayName = car.charAt(0).toUpperCase() + car.slice(1);
        formattedCarDistribution[displayName] = count;
      });
      
      // Format track distribution 
      const formattedTrackDistribution: Record<string, number> = {};
      Object.entries(analytics.trackDistribution).forEach(([track, count]) => {
        const displayName = track.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        formattedTrackDistribution[displayName] = count;
      });
      
      // Sort temporal data chronologically (oldest first for timeline)
      const sortedTemporalData = [...analytics.temporalData].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateA - dateB; // Ascending order for timeline
      });
      
      // Format recent comparisons with normalized names
      const formattedRecentComparisons = analytics.recentComparisons.map(comp => ({
        ...comp,
        carName: comp.carName ? comp.carName.trim() : null,
        trackName: comp.trackName ? comp.trackName.trim() : null,
      }));
      
      res.json({
        totalComparisons: analytics.totalComparisons,
        recentComparisons: formattedRecentComparisons,
        topParameters,
        carDistribution: formattedCarDistribution,
        trackDistribution: formattedTrackDistribution,
        temporalData: sortedTemporalData,
        uniqueSetups: analytics.setupNamesUsed.size,
        parameterFrequency: analytics.parameterFrequency,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.get('/api/comparisons/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const comparison = await storage.getComparison(id);
      
      if (!comparison) {
        return res.status(404).json({ message: "Comparison not found" });
      }

      if (comparison.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(comparison);
    } catch (error) {
      console.error("Error fetching comparison:", error);
      res.status(500).json({ message: "Failed to fetch comparison" });
    }
  });

  app.patch('/api/comparisons/:id/public', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { isPublic } = req.body;

      const comparison = await storage.getComparison(id);
      
      if (!comparison) {
        return res.status(404).json({ message: "Comparison not found" });
      }

      if (comparison.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updated = await storage.updateComparisonPublic(id, isPublic);
      res.json(updated);
    } catch (error) {
      console.error("Error updating comparison:", error);
      res.status(500).json({ message: "Failed to update comparison" });
    }
  });

  app.get('/api/comparisons/:id/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const comparison = await storage.getComparison(id);
      
      if (!comparison) {
        return res.status(404).json({ message: "Comparison not found" });
      }

      if (comparison.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const deltaData = comparison.deltaData as Record<string, any>;
      const interpretations = comparison.interpretations as any[];

      const csvRows: string[] = [];
      csvRows.push('Section,Parameter,Setup A,Setup B,Delta,Unit,Magnitude');

      for (const [section, params] of Object.entries(deltaData)) {
        for (const [paramName, delta] of Object.entries(params as Record<string, any>)) {
          csvRows.push(
            `"${section}","${paramName}","${delta.oldValue}","${delta.newValue}","${delta.delta}","${delta.unit || ''}","${delta.magnitude}"`
          );
        }
      }

      csvRows.push('');
      csvRows.push('Interpretations');
      csvRows.push('Category,Summary,Explanation,Impact');
      
      for (const interp of interpretations) {
        csvRows.push(
          `"${interp.category}","${interp.summary}","${interp.explanation}","${interp.impact}"`
        );
      }

      const csv = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="comparison-${id}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting comparison:", error);
      res.status(500).json({ message: "Failed to export comparison" });
    }
  });

  app.get('/api/comparisons/:id/export/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;

      const comparison = await storage.getComparison(id);
      
      if (!comparison) {
        return res.status(404).json({ message: "Comparison not found" });
      }

      if (comparison.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const pdfBuffer = await generateComparisonPDF(comparison);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="comparison-${comparison.setupAName}-vs-${comparison.setupBName}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.get('/api/share/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      const comparison = await storage.getComparisonByShareToken(token);
      
      if (!comparison || !comparison.isPublic) {
        return res.status(404).json({ message: "Shared comparison not found" });
      }

      res.json(comparison);
    } catch (error) {
      console.error("Error fetching shared comparison:", error);
      res.status(500).json({ message: "Failed to fetch shared comparison" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
