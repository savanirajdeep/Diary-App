const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../utils/database');
const auth = require('../middleware/auth');

const router = express.Router();

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

module.exports = router; 