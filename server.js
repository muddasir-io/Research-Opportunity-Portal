const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Helper validator function
function validateOpportunityData(data, isUpdate = false) {
  const errors = [];
  const requiredFields = [
    'title',
    'description',
    'research_area',
    'faculty_name',
    'department',
    'required_skills',
    'available_positions',
    'application_deadline'
  ];

  if (!isUpdate) {
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || String(data[field]).trim() === '') {
        errors.push(`Field '${field}' is required.`);
      }
    }
  }

  if (data.available_positions !== undefined) {
    const pos = Number(data.available_positions);
    if (isNaN(pos) || pos < 1) {
      errors.push(`'available_positions' must be a positive integer greater than zero.`);
    }
  }

  if (data.status !== undefined && !['Open', 'Closed'].includes(data.status)) {
    errors.push(`'status' must be either 'Open' or 'Closed'.`);
  }

  if (data.application_deadline !== undefined && String(data.application_deadline).trim() !== '') {
    const date = new Date(data.application_deadline);
    if (isNaN(date.getTime())) {
      errors.push(`'application_deadline' must be a valid date string (e.g., YYYY-MM-DD).`);
    }
  }

  return errors;
}

// -------------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------------

// 1. CREATE a Research Opportunity
// POST /api/opportunities
app.post('/api/opportunities', async (req, res) => {
  try {
    const validationErrors = validateOpportunityData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validationErrors
      });
    }

    const {
      title,
      description,
      research_area,
      faculty_name,
      department,
      required_skills,
      available_positions,
      application_deadline,
      status = 'Open'
    } = req.body;

    const sql = `
      INSERT INTO research_opportunities 
        (title, description, research_area, faculty_name, department, required_skills, available_positions, application_deadline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      title.trim(),
      description.trim(),
      research_area.trim(),
      faculty_name.trim(),
      department.trim(),
      required_skills.trim(),
      Number(available_positions),
      application_deadline.substring(0, 10),
      status
    ];

    const [result] = await db.query(sql, params);
    const newId = result.insertId;

    // Fetch created record
    const [rows] = await db.query('SELECT * FROM research_opportunities WHERE id = ?', [newId]);

    return res.status(201).json({
      message: 'Research opportunity created successfully',
      data: rows[0]
    });
  } catch (err) {
    console.error('Error creating research opportunity:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create research opportunity in database'
    });
  }
});

// 2. RETRIEVE ALL Research Opportunities
// GET /api/opportunities
app.get('/api/opportunities', async (req, res) => {
  try {
    const { search, status, department, area } = req.query;
    let sql = 'SELECT * FROM research_opportunities WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (department) {
      sql += ' AND department LIKE ?';
      params.push(`%${department}%`);
    }

    if (area) {
      sql += ' AND research_area LIKE ?';
      params.push(`%${area}%`);
    }

    if (search) {
      sql += ' AND (title LIKE ? OR description LIKE ? OR required_skills LIKE ? OR faculty_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY created_at DESC, id DESC';

    const [rows] = await db.query(sql, params);
    return res.status(200).json({
      count: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('Error retrieving research opportunities:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve research opportunities'
    });
  }
});

// 3. RETRIEVE ONE Research Opportunity by ID
// GET /api/opportunities/:id
app.get('/api/opportunities/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Opportunity ID must be a valid positive integer'
      });
    }

    const [rows] = await db.query('SELECT * FROM research_opportunities WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Research opportunity with ID ${id} was not found`
      });
    }

    return res.status(200).json({
      data: rows[0]
    });
  } catch (err) {
    console.error(`Error retrieving opportunity ID ${req.params.id}:`, err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve research opportunity'
    });
  }
});

// 4. UPDATE a Research Opportunity
// PUT /api/opportunities/:id
app.put('/api/opportunities/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Opportunity ID must be a valid positive integer'
      });
    }

    // Check if opportunity exists
    const [existing] = await db.query('SELECT * FROM research_opportunities WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Research opportunity with ID ${id} was not found`
      });
    }

    const validationErrors = validateOpportunityData(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validationErrors
      });
    }

    const current = existing[0];
    const {
      title = current.title,
      description = current.description,
      research_area = current.research_area,
      faculty_name = current.faculty_name,
      department = current.department,
      required_skills = current.required_skills,
      available_positions = current.available_positions,
      application_deadline = current.application_deadline,
      status = current.status
    } = req.body;

    const sql = `
      UPDATE research_opportunities 
      SET title = ?, 
          description = ?, 
          research_area = ?, 
          faculty_name = ?, 
          department = ?, 
          required_skills = ?, 
          available_positions = ?, 
          application_deadline = ?, 
          status = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const params = [
      String(title).trim(),
      String(description).trim(),
      String(research_area).trim(),
      String(faculty_name).trim(),
      String(department).trim(),
      String(required_skills).trim(),
      Number(available_positions),
      String(application_deadline).substring(0, 10),
      status,
      id
    ];

    await db.query(sql, params);

    const [updatedRows] = await db.query('SELECT * FROM research_opportunities WHERE id = ?', [id]);
    return res.status(200).json({
      message: 'Research opportunity updated successfully',
      data: updatedRows[0]
    });
  } catch (err) {
    console.error(`Error updating opportunity ID ${req.params.id}:`, err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update research opportunity'
    });
  }
});

// 5. DELETE a Research Opportunity
// DELETE /api/opportunities/:id
app.delete('/api/opportunities/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Opportunity ID must be a valid positive integer'
      });
    }

    // Check if opportunity exists
    const [existing] = await db.query('SELECT * FROM research_opportunities WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Research opportunity with ID ${id} was not found`
      });
    }

    await db.query('DELETE FROM research_opportunities WHERE id = ?', [id]);

    return res.status(200).json({
      message: 'Research opportunity deleted successfully',
      id: id
    });
  } catch (err) {
    console.error(`Error deleting opportunity ID ${req.params.id}:`, err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete research opportunity'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    db_mode: db.getIsSQLite() ? 'SQLite Fallback' : 'MySQL',
    timestamp: new Date().toISOString()
  });
});

// Fallback route to index.html for SPA behavior
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not Found', message: 'API Route Not Found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server after Database Initialization
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 Research Opportunity Portal Backend API Running`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📡 REST API Base: http://localhost:${PORT}/api/opportunities`);
    console.log(`===================================================`);
  });
}).catch(err => {
  console.error('Failed to initialize database server:', err);
  process.exit(1);
});
