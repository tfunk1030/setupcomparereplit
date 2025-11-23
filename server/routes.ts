import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { parseIRacingSetup } from "./setupParser";
import { calculateDeltas, generateInterpretations } from "./comparisonEngine";
import { generateComparisonPDF } from "./pdfGenerator";

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
    { name: 'setupB', maxCount: 1 }
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

      const setupAContent = setupAFile.buffer.toString('utf-8');
      const setupBContent = setupBFile.buffer.toString('utf-8');

      const setupAData = parseIRacingSetup(setupAContent);
      const setupBData = parseIRacingSetup(setupBContent);

      const deltaData = calculateDeltas(setupAData, setupBData);
      const interpretations = generateInterpretations(deltaData);

      const comparison = await storage.createComparison({
        userId,
        setupAName: setupAFile.originalname.replace('.sto', ''),
        setupBName: setupBFile.originalname.replace('.sto', ''),
        setupAData: setupAData as any,
        setupBData: setupBData as any,
        deltaData: deltaData as any,
        interpretations: interpretations as any,
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
