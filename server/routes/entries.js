const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../utils/database');
const auth = require('../middleware/auth');
const puppeteer = require('puppeteer');

const router = express.Router();

// Test PDF generation (no auth required)
router.get('/test-pdf', async (req, res) => {
  let browser = null;
  try {
    console.log('Testing PDF generation...');
    
    browser = await puppeteer.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    console.log('Browser launched successfully');
    const page = await browser.newPage();
    
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Test PDF</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            p { line-height: 1.6; }
            .content p { margin-bottom: 15px; }
            .content br { display: block; margin-bottom: 8px; }
            .content strong { font-weight: bold; }
            .content em { font-style: italic; }
          </style>
        </head>
        <body>
          <h1>Test PDF Generation</h1>
          <div class="content">
            <p>This is a test PDF to verify that Puppeteer is working correctly.</p>
            <p><strong>This text should be bold.</strong></p>
            <p><em>This text should be italic.</em></p>
            <p>This is a paragraph with a line break.<br>This is on the next line.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    
    await page.setContent(testHtml, { waitUntil: 'domcontentloaded' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: false
    });
    
    console.log('Test PDF generated, size:', pdf.length, 'bytes');
    
    // Only check PDF size
    if (pdf.length < 1000) {
      throw new Error('Generated PDF is too small');
    }
    
    // Ensure we're sending the buffer correctly
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
    res.setHeader('Content-Length', pdf.length);
    
    // Send the buffer directly
    res.end(pdf);
    
  } catch (error) {
    console.error('Test PDF error:', error);
    res.status(500).json({ error: 'Test PDF failed: ' + error.message });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing test browser:', closeError);
      }
    }
  }
});

// Apply auth middleware to all routes
router.use(auth);

// Get all entries for the authenticated user (case-insensitive search and tag filter)
router.get('/', async (req, res) => {
  try {
    const { search, tags, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let where = `WHERE userId = ?`;
    let params = [req.user.id];

    if (search) {
      where += ` AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ?)`;
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
      if (tagArray.length > 0) {
        const tagConditions = tagArray.map(() => `LOWER(tags) LIKE ?`).join(' OR ');
        where += ` AND (${tagConditions})`;
        params.push(...tagArray.map(tag => `%${tag}%`));
      }
    }

    // Main query
    const sql = `SELECT id, title, content, tags, mood, createdAt, updatedAt\n       FROM diary_entries\n       ${where}\n       ORDER BY ${sortBy} ${sortOrder.toUpperCase()}\n       LIMIT ${Number(limit)} OFFSET ${Number(skip)}`;
    const countSql = `SELECT COUNT(*) as total FROM diary_entries ${where}`;
    try {
      const entries = await prisma.$queryRawUnsafe(
        sql,
        ...params
      );
      const countResult = await prisma.$queryRawUnsafe(
        countSql,
        ...params
      );
      const total = Number(countResult[0]?.total || 0);
      res.json({
        entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Get entries error:', error);
      console.error('SQL:', sql);
      console.error('Params:', params);
      console.error('Stack:', error.stack);
      res.status(500).json({ error: 'Server error while fetching entries', details: error.message });
    }
  } catch (error) {
    console.error('Get entries outer error:', error);
    res.status(500).json({ error: 'Server error while fetching entries' });
  }
});

// Get a single entry by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await prisma.diaryEntry.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json({ entry });
  } catch (error) {
    console.error('Get entry error:', error);
    res.status(500).json({ error: 'Server error while fetching entry' });
  }
});

// Create a new entry
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('content').trim().isLength({ min: 1 }),
  body('tags').optional().trim(),
  body('mood').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, tags, mood } = req.body;

    const entry = await prisma.diaryEntry.create({
      data: {
        title,
        content,
        tags: tags || null,
        mood: mood || null,
        userId: req.user.id
      },
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        mood: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      message: 'Entry created successfully',
      entry
    });
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ error: 'Server error while creating entry' });
  }
});

// Update an entry
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('content').optional().trim().isLength({ min: 1 }),
  body('tags').optional().trim(),
  body('mood').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content, tags, mood } = req.body;

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.diaryEntry.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Update entry
    const updatedEntry = await prisma.diaryEntry.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(tags !== undefined && { tags }),
        ...(mood !== undefined && { mood })
      },
      select: {
        id: true,
        title: true,
        content: true,
        tags: true,
        mood: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Entry updated successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ error: 'Server error while updating entry' });
  }
});

// Delete an entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if entry exists and belongs to user
    const existingEntry = await prisma.diaryEntry.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Delete entry
    await prisma.diaryEntry.delete({
      where: { id }
    });

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Server error while deleting entry' });
  }
});

// Get entry statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalEntries = await prisma.diaryEntry.count({
      where: { userId: req.user.id }
    });

    const thisMonthEntries = await prisma.diaryEntry.count({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    const todayEntries = await prisma.diaryEntry.count({
      where: {
        userId: req.user.id,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const lastEntry = await prisma.diaryEntry.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    res.json({
      totalEntries,
      thisMonthEntries,
      todayEntries,
      lastEntryDate: lastEntry?.createdAt || null
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error while fetching statistics' });
  }
});

// Export entry as PDF
router.get('/:id/export', async (req, res) => {
  let browser = null;
  try {
    const { id } = req.params;
    console.log('Starting PDF export for entry:', id);

    // Get the entry
    const entry = await prisma.diaryEntry.findFirst({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!entry) {
      console.log('Entry not found:', id);
      return res.status(404).json({ error: 'Entry not found' });
    }

    console.log('Entry found, starting PDF generation...');

    // Sanitize content function - preserve HTML formatting but remove dangerous elements
    const sanitizeContent = (content) => {
      if (!content) return '';
      return content
        // Remove dangerous scripts and iframes
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove event handlers
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        // Remove javascript: and data: URLs
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        // Remove style and class attributes (we'll use our own CSS)
        .replace(/style="[^"]*"/gi, '')
        .replace(/class="[^"]*"/gi, '')
        // Remove images (optional - comment out if you want to keep them)
        .replace(/<img[^>]*>/gi, '')
        // Clean up empty paragraphs and line breaks
        .replace(/<p><br><\/p>/gi, '<br>')
        .replace(/<p><\/p>/gi, '')
        // Ensure proper HTML structure
        .trim();
    };

    const sanitizedContent = sanitizeContent(entry.content);
    console.log('Content sanitized, creating HTML...');

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${entry.title.replace(/[<>]/g, '')}</title>
          <style>
            @page {
              margin: 20mm;
              size: A4;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 100%;
              margin: 0;
              padding: 0;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .title {
              font-size: 2.5em;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
              word-wrap: break-word;
            }
            .meta {
              display: flex;
              justify-content: center;
              gap: 20px;
              color: #6b7280;
              font-size: 0.9em;
              flex-wrap: wrap;
            }
            .mood {
              font-size: 1.5em;
            }
            .tags {
              color: #6b7280;
              font-style: italic;
            }
            .content {
              font-size: 1em;
              line-height: 1.6;
            }
            .content p { 
              margin-bottom: 15px; 
              page-break-inside: avoid;
            }
            .content br {
              display: block;
              margin-bottom: 8px;
            }
            .content strong { 
              font-weight: bold; 
            }
            .content em { 
              font-style: italic; 
            }
            .content u { 
              text-decoration: underline; 
            }
            .content s { 
              text-decoration: line-through; 
            }
            .content h1, .content h2, .content h3 {
              color: #1f2937;
              margin-top: 20px;
              margin-bottom: 10px;
              page-break-after: avoid;
            }
            .content h1 { font-size: 1.5em; }
            .content h2 { font-size: 1.3em; }
            .content h3 { font-size: 1.1em; }
            .content ul, .content ol { 
              margin-bottom: 15px; 
              padding-left: 20px; 
              page-break-inside: avoid;
            }
            .content li { 
              margin-bottom: 5px; 
            }
            .content blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 15px;
              margin: 15px 0;
              font-style: italic;
              color: #6b7280;
              page-break-inside: avoid;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 0.9em;
            }
            @media print {
              body { margin: 0; }
              .header { page-break-after: avoid; }
              .content { page-break-inside: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${entry.title.replace(/[<>]/g, '')}</div>
            <div class="meta">
              <span>📅 ${new Date(entry.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              ${entry.mood ? `<span class="mood">${entry.mood}</span>` : ''}
              ${entry.tags ? `<span class="tags">🏷️ ${entry.tags.replace(/[<>]/g, '')}</span>` : ''}
            </div>
          </div>
          <div class="content">
            ${sanitizedContent}
          </div>
          <div class="footer">
            <p>Exported from Diary App on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </body>
      </html>
    `;

    console.log('HTML created, launching browser...');

    // Launch browser and generate PDF
    browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    console.log('Browser launched, creating page...');
    const page = await browser.newPage();
    
    // Set viewport and content
    await page.setViewport({ width: 1200, height: 800 });
    console.log('Setting content...');
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait a bit for content to render properly
    console.log('Waiting for content to render...');
    await new Promise(res => setTimeout(res, 1000));
    
    console.log('Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      preferCSSPageSize: true
    });

    console.log('PDF generated, size:', pdf.length, 'bytes');

    // Only check PDF size
    if (pdf.length < 1000) {
      throw new Error('Generated PDF is too small, likely corrupted');
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');
    
    console.log('Sending PDF to client...');
    res.end(pdf);
    console.log('PDF sent successfully');
  } catch (error) {
    console.error('PDF export error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
});

// Export multiple entries as PDF
router.post('/export-bulk', async (req, res) => {
  let browser = null;
  try {
    const { entryIds } = req.body;
    console.log('Starting bulk PDF export for entries:', entryIds);

    if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
      console.log('Invalid entryIds provided:', entryIds);
      return res.status(400).json({ error: 'Entry IDs are required' });
    }

    // Get the entries
    const entries = await prisma.diaryEntry.findMany({
      where: {
        id: { in: entryIds },
        userId: req.user.id
      },
      orderBy: { createdAt: 'desc' }
    });

    if (entries.length === 0) {
      console.log('No entries found for IDs:', entryIds);
      return res.status(404).json({ error: 'No entries found' });
    }

    console.log('Found entries, starting PDF generation...');

    // Sanitize content function - preserve HTML formatting but remove dangerous elements
    const sanitizeContent = (content) => {
      if (!content) return '';
      return content
        // Remove dangerous scripts and iframes
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        // Remove event handlers
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/on\w+='[^']*'/gi, '')
        // Remove javascript: and data: URLs
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        // Remove style and class attributes (we'll use our own CSS)
        .replace(/style="[^"]*"/gi, '')
        .replace(/class="[^"]*"/gi, '')
        // Remove images (optional - comment out if you want to keep them)
        .replace(/<img[^>]*>/gi, '')
        // Clean up empty paragraphs and line breaks
        .replace(/<p><br><\/p>/gi, '<br>')
        .replace(/<p><\/p>/gi, '')
        // Ensure proper HTML structure
        .trim();
    };

    // Create HTML content for PDF with footer at the end of each note
    const entriesHtml = entries.map(entry => `
      <div class="entry" style="page-break-after: always; margin-bottom: 40px;">
        <div class="header">
          <div class="title">${entry.title ? entry.title.replace(/[<>]/g, '') : 'Untitled Entry'}</div>
          <div class="meta">
            <span>📅 ${new Date(entry.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
            ${entry.mood ? `<span class="mood">${entry.mood.replace(/[<>]/g, '')}</span>` : ''}
            ${entry.tags ? `<span class="tags">🏷️ ${entry.tags.replace(/[<>]/g, '')}</span>` : ''}
          </div>
        </div>
        <div class="content">
          ${sanitizeContent(entry.content)}
        </div>
        <div class="footer" style="page-break-after: avoid;">
          <p>Exported from Diary App on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      </div>
    `).join('');

    console.log('HTML created, launching browser...');

    // Simplified HTML with basic styling
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Diary Entries Export</title>
          <style>
            @page {
              margin: 20mm;
              size: A4;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background: white;
            }
            .cover-page {
              text-align: center;
              margin-bottom: 60px;
              page-break-after: always;
            }
            .cover-title {
              font-size: 2.5em;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 20px;
            }
            .cover-subtitle {
              font-size: 1.2em;
              color: #6b7280;
              margin-bottom: 40px;
            }
            .entry {
              margin-bottom: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 2px solid #e5e7eb;
            }
            .title {
              font-size: 2em;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 10px;
            }
            .meta {
              color: #6b7280;
              font-size: 0.9em;
            }
            .content {
              font-size: 1em;
              line-height: 1.6;
            }
            .content p { 
              margin-bottom: 15px; 
              page-break-inside: avoid;
            }
            .content br {
              display: block;
              margin-bottom: 8px;
            }
            .content strong { 
              font-weight: bold; 
            }
            .content em { 
              font-style: italic; 
            }
            .content u { 
              text-decoration: underline; 
            }
            .content s { 
              text-decoration: line-through; 
            }
            .content h1, .content h2, .content h3 {
              color: #1f2937;
              margin-top: 20px;
              margin-bottom: 10px;
              page-break-after: avoid;
            }
            .content h1 { font-size: 1.5em; }
            .content h2 { font-size: 1.3em; }
            .content h3 { font-size: 1.1em; }
            .content ul, .content ol { 
              margin-bottom: 15px; 
              padding-left: 20px; 
              page-break-inside: avoid;
            }
            .content li { 
              margin-bottom: 5px; 
            }
            .content blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 15px;
              margin: 15px 0;
              font-style: italic;
              color: #6b7280;
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="cover-page">
            <div class="cover-title">Diary Entries</div>
            <div class="cover-subtitle">${entries.length} entries exported</div>
            <div class="cover-subtitle">${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
          ${entriesHtml}
        </body>
      </html>
    `;

    // Launch browser with minimal options for better compatibility
    const launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    };

    console.log('Launching browser...');
    browser = await puppeteer.launch(launchOptions);
    
    console.log('Browser launched, creating page...');
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('Setting content...');
    await page.setContent(htmlContent, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait for content to render
    console.log('Waiting for content to render...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: false,
      preferCSSPageSize: false
    });

    console.log('PDF generated, size:', pdf.length, 'bytes');

    // Only check PDF size
    if (pdf.length < 1000) {
      throw new Error('Generated PDF is too small, likely corrupted');
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="diary_entries_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log('Sending PDF to client...');
    res.end(pdf);
    console.log('PDF sent successfully');
    
  } catch (error) {
    console.error('Bulk PDF export error:', error);
    console.error('Error stack:', error.stack);
    
    let errorMessage = 'Failed to generate PDF';
    if (error.message.includes('Generated PDF is too small')) {
      errorMessage = 'PDF generation failed - file corrupted';
    } else if (error.message.includes('Invalid PDF header')) {
      errorMessage = 'PDF generation failed - invalid format';
    } else if (error.message.includes('Failed to launch')) {
      errorMessage = 'Failed to launch browser. Please try again.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'PDF generation timed out. Please try with fewer entries.';
    } else {
      errorMessage = 'Failed to generate PDF: ' + error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
});

module.exports = router; 