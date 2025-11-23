import PDFDocument from 'pdfkit';
import type { Comparison } from '@shared/schema';

export function generateComparisonPDF(comparison: Comparison): Promise<Buffer> {
  return new Promise((resolve, reject) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Setup Comparison: ${comparison.setupAName} vs ${comparison.setupBName}`,
      Author: 'SetupComparer',
      Subject: 'iRacing Setup Comparison Report',
    }
  });

  const buffers: Buffer[] = [];
  doc.on('data', buffers.push.bind(buffers));

  // Color scheme
  const colors = {
    primary: '#2563EB', // Blue
    minor: '#10B981',   // Green
    moderate: '#F59E0B', // Yellow
    major: '#EF4444',    // Red
    text: '#1F2937',
    lightGray: '#F3F4F6',
    borderGray: '#E5E7EB'
  };

  // Helper functions
  const drawHeader = () => {
    doc.fontSize(24)
       .fillColor(colors.primary)
       .text('SetupComparer', { align: 'center' });
    
    doc.fontSize(16)
       .fillColor(colors.text)
       .text('iRacing Setup Comparison Report', { align: 'center' });
    
    doc.moveDown(0.5);
    doc.fontSize(10)
       .fillColor('#6B7280')
       .text(comparison.createdAt ? new Date(comparison.createdAt).toLocaleString() : 'Generated Report', { align: 'center' });
    
    doc.moveDown();
  };

  const drawComparisonInfo = () => {
    doc.fontSize(14)
       .fillColor(colors.primary)
       .text('Comparison Details', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(11)
       .fillColor(colors.text);

    // Setup A
    doc.font('Helvetica-Bold')
       .text('Setup A (Baseline): ', { continued: true })
       .font('Helvetica')
       .text(comparison.setupAName);

    // Setup B
    doc.font('Helvetica-Bold')
       .text('Setup B (Comparison): ', { continued: true })
       .font('Helvetica')
       .text(comparison.setupBName);

    if (comparison.carName) {
      doc.font('Helvetica-Bold')
         .text('Car: ', { continued: true })
         .font('Helvetica')
         .text(comparison.carName);
    }

    if (comparison.trackName) {
      doc.font('Helvetica-Bold')
         .text('Track: ', { continued: true })
         .font('Helvetica')
         .text(comparison.trackName);
    }

    doc.moveDown();
  };

  const getMagnitudeColor = (magnitude: string) => {
    switch (magnitude) {
      case 'minor': return colors.minor;
      case 'moderate': return colors.moderate;
      case 'major': return colors.major;
      default: return colors.text;
    }
  };

  const drawDeltaTable = () => {
    const deltaData = comparison.deltaData as Record<string, any>;
    
    doc.fontSize(14)
       .fillColor(colors.primary)
       .text('Parameter Changes', { underline: true });
    
    doc.moveDown(0.5);

    for (const [section, params] of Object.entries(deltaData)) {
      // Section header
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(colors.text)
         .text(section);
      
      doc.moveDown(0.3);

      // Table header
      const startX = doc.x;
      const startY = doc.y;
      const colWidths = [180, 80, 80, 60, 70];
      
      // Draw header background
      doc.rect(startX, startY, 470, 20)
         .fillAndStroke(colors.lightGray, colors.borderGray);

      // Header text
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(colors.text);

      doc.text('Parameter', startX + 5, startY + 5, { width: colWidths[0] - 10 });
      doc.text('Setup A', startX + colWidths[0], startY + 5, { width: colWidths[1] - 10 });
      doc.text('Setup B', startX + colWidths[0] + colWidths[1], startY + 5, { width: colWidths[2] - 10 });
      doc.text('Delta', startX + colWidths[0] + colWidths[1] + colWidths[2], startY + 5, { width: colWidths[3] - 10 });
      doc.text('Change', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], startY + 5, { width: colWidths[4] - 10 });

      let currentY = startY + 20;

      // Table rows
      for (const [paramName, delta] of Object.entries(params as Record<string, any>)) {
        const magnitudeColor = getMagnitudeColor(delta.magnitude);
        
        // Alternate row background
        if (Object.keys(params).indexOf(paramName) % 2 === 0) {
          doc.rect(startX, currentY, 470, 20)
             .fill('#FAFAFA');
        }

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor(colors.text);

        // Parameter name
        doc.text(paramName, startX + 5, currentY + 5, { width: colWidths[0] - 10 });
        
        // Old value
        doc.text(
          `${delta.oldValue}${delta.unit || ''}`, 
          startX + colWidths[0], 
          currentY + 5, 
          { width: colWidths[1] - 10 }
        );
        
        // New value
        doc.text(
          `${delta.newValue}${delta.unit || ''}`, 
          startX + colWidths[0] + colWidths[1], 
          currentY + 5, 
          { width: colWidths[2] - 10 }
        );
        
        // Delta
        const deltaText = delta.delta > 0 ? `+${delta.delta}` : `${delta.delta}`;
        doc.fillColor(magnitudeColor)
           .text(
             deltaText, 
             startX + colWidths[0] + colWidths[1] + colWidths[2], 
             currentY + 5, 
             { width: colWidths[3] - 10 }
           );
        
        // Magnitude
        doc.font('Helvetica-Bold')
           .fillColor(magnitudeColor)
           .text(
             delta.magnitude.toUpperCase(), 
             startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], 
             currentY + 5, 
             { width: colWidths[4] - 10 }
           );

        currentY += 20;

        // Check if we need a new page
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
      }

      doc.moveDown();
      doc.y = currentY + 10;
    }
  };

  const drawInterpretations = () => {
    const interpretations = comparison.interpretations as any[];
    
    if (!interpretations || interpretations.length === 0) return;

    // Check if we need a new page
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.fontSize(14)
       .fillColor(colors.primary)
       .font('Helvetica-Bold')
       .text('Setup Change Interpretations', { underline: true });
    
    doc.moveDown(0.5);

    // Group interpretations by category
    const groupedInterpretations: Record<string, any[]> = {};
    interpretations.forEach((interp) => {
      if (!groupedInterpretations[interp.category]) {
        groupedInterpretations[interp.category] = [];
      }
      groupedInterpretations[interp.category].push(interp);
    });

    // Draw each category group
    Object.entries(groupedInterpretations).forEach(([category, interps]) => {
      // Category header
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(colors.primary)
         .text(category);
      
      doc.moveDown(0.3);

      // Interpretations for this category
      interps.forEach((interp) => {
        // Parameter and summary
        doc.fontSize(10)
           .font('Helvetica-Bold')
           .fillColor(colors.text)
           .text(`• ${interp.parameter}: ${interp.summary}`, { indent: 20 });
        
        doc.moveDown(0.2);
        
        // Explanation
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#6B7280')
           .text(interp.explanation, { indent: 30, width: 440 });
        
        doc.moveDown(0.3);
      });

      doc.moveDown(0.5);

      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }
    });
  };

  const drawFooter = () => {
    const pageCount = (doc as any).bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.moveTo(50, 750)
         .lineTo(545, 750)
         .stroke(colors.borderGray);
      
      // Footer text
      doc.fontSize(8)
         .fillColor('#9CA3AF')
         .text(
           `Page ${i + 1} of ${pageCount} | Generated by SetupComparer | ${new Date().toLocaleDateString()}`,
           50,
           760,
           { align: 'center', width: 495 }
         );
    }
  };

  // Generate PDF content
  drawHeader();
  drawComparisonInfo();
  drawDeltaTable();
  drawInterpretations();
  
  doc.on('end', () => {
    resolve(Buffer.concat(buffers));
  });
  
  doc.on('error', reject);
  
  doc.end();
  });
}