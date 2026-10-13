const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

let pool = null;
let isLocalFallback = false;
let localStore = [];
let nextId = 1;
const LOCAL_DB_PATH = path.join(__dirname, 'research_portal_local.json');

// Default Seed Data
const initialSeedData = [
  {
    id: 1,
    title: 'Deep Learning for Medical Image Segmentation',
    description: 'Investigating multi-modal vision transformers for early detection of brain tumors in MRI scans.',
    research_area: 'Artificial Intelligence',
    faculty_name: 'Dr. Tariq Ahmad',
    department: 'Computer Science',
    required_skills: 'Python, PyTorch, OpenCV, Computer Vision',
    available_positions: 3,
    application_deadline: '2026-11-30',
    status: 'Open',
    created_at: '2026-10-06 10:00:00',
    updated_at: '2026-10-06 10:00:00'
  },
  {
    id: 2,
    title: 'Software-Defined Networking in Edge Computing',
    description: 'Analyzing latency optimization algorithms in SDN-enabled IoT networks.',
    research_area: 'Computer Networks',
    faculty_name: 'Dr. Sara Khan',
    department: 'Computer Science',
    required_skills: 'Mininet, C++, Python, Wireshark, OpenFlow',
    available_positions: 2,
    application_deadline: '2026-12-15',
    status: 'Open',
    created_at: '2026-10-06 10:30:00',
    updated_at: '2026-10-06 10:30:00'
  },
  {
    id: 3,
    title: 'Post-Quantum Cryptography Protocols',
    description: 'Evaluating lattice-based cryptographic algorithms for securing lightweight IoT sensor nodes.',
    research_area: 'Cyber Security',
    faculty_name: 'Dr. Muhammad Bilal',
    department: 'Cyber Security',
    required_skills: 'C, Cryptography, SageMath, Linux',
    available_positions: 1,
    application_deadline: '2026-10-25',
    status: 'Closed',
    created_at: '2026-10-06 11:00:00',
    updated_at: '2026-10-06 11:00:00'
  }
];

function saveLocalStore() {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify({ nextId, data: localStore }, null, 2), 'utf8');
  } catch (e) {
    console.error('[DB Error] Failed to write local store file:', e);
  }
}

function loadLocalStore() {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      localStore = parsed.data || [];
      nextId = parsed.nextId || (localStore.length ? Math.max(...localStore.map(o => o.id)) + 1 : 1);
      return;
    } catch (e) {
      console.warn('[DB Warning] Corrupted local DB file, re-initializing seed data...');
    }
  }
  localStore = [...initialSeedData];
  nextId = 4;
  saveLocalStore();
}

// Initialize database connection
async function initDb() {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'research_portal_db';
  const allowFallback = process.env.USE_SQLITE_FALLBACK !== 'false';

  try {
    // Attempt MySQL Connection
    pool = mysql.createPool({
      host,
      port: Number(port),
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log(`[DB] Successfully connected to MySQL database '${database}' on ${host}:${port}`);
    connection.release();
  } catch (err) {
    console.warn(`[DB Warning] Could not connect to MySQL server (${err.message}).`);

    if (allowFallback) {
      console.log('[DB] Switching to zero-dependency local persistent database fallback...');
      isLocalFallback = true;
      loadLocalStore();
      console.log(`[DB] Local database initialized with ${localStore.length} opportunities.`);
    } else {
      throw err;
    }
  }
}

// Unified query wrapper supporting both MySQL and Local Fallback
async function query(sql, params = []) {
  if (!isLocalFallback) {
    return await pool.query(sql, params);
  }

  const cleanSql = sql.trim();
  const lowerSql = cleanSql.toLowerCase();

  // 1. SELECT query handling
  if (lowerSql.startsWith('select')) {
    let results = [...localStore];

    // Check if ID single lookup SELECT * FROM research_opportunities WHERE id = ?
    if (lowerSql.includes('where id = ?')) {
      const targetId = Number(params[0]);
      results = results.filter(item => item.id === targetId);
      return [results];
    }

    // Dynamic filtering for GET /api/opportunities
    let paramIndex = 0;
    if (lowerSql.includes('status = ?')) {
      const statusVal = params[paramIndex++];
      results = results.filter(item => item.status === statusVal);
    }

    if (lowerSql.includes('department like ?')) {
      const deptVal = String(params[paramIndex++]).replace(/%/g, '').toLowerCase();
      results = results.filter(item => item.department.toLowerCase().includes(deptVal));
    }

    if (lowerSql.includes('research_area like ?')) {
      const areaVal = String(params[paramIndex++]).replace(/%/g, '').toLowerCase();
      results = results.filter(item => item.research_area.toLowerCase().includes(areaVal));
    }

    if (lowerSql.includes('title like ?')) {
      const term = String(params[paramIndex++]).replace(/%/g, '').toLowerCase();
      // Skip duplicate params passed for multi-column search
      paramIndex += 3;
      results = results.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.required_skills.toLowerCase().includes(term) ||
        item.faculty_name.toLowerCase().includes(term)
      );
    }

    // Sort by id DESC
    results.sort((a, b) => b.id - a.id);
    return [results];
  }

  // 2. INSERT query handling
  if (lowerSql.startsWith('insert')) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newOpportunity = {
      id: nextId++,
      title: params[0],
      description: params[1],
      research_area: params[2],
      faculty_name: params[3],
      department: params[4],
      required_skills: params[5],
      available_positions: Number(params[6]),
      application_deadline: params[7],
      status: params[8] || 'Open',
      created_at: now,
      updated_at: now
    };

    localStore.push(newOpportunity);
    saveLocalStore();
    return [{ insertId: newOpportunity.id, affectedRows: 1 }];
  }

  // 3. UPDATE query handling
  if (lowerSql.startsWith('update')) {
    const targetId = Number(params[params.length - 1]);
    const index = localStore.findIndex(item => item.id === targetId);

    if (index !== -1) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      localStore[index] = {
        ...localStore[index],
        title: params[0],
        description: params[1],
        research_area: params[2],
        faculty_name: params[3],
        department: params[4],
        required_skills: params[5],
        available_positions: Number(params[6]),
        application_deadline: params[7],
        status: params[8],
        updated_at: now
      };
      saveLocalStore();
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 4. DELETE query handling
  if (lowerSql.startsWith('delete')) {
    const targetId = Number(params[0]);
    const initialLen = localStore.length;
    localStore = localStore.filter(item => item.id !== targetId);
    const affected = initialLen - localStore.length;

    if (affected > 0) {
      saveLocalStore();
    }
    return [{ affectedRows: affected }];
  }

  return [[]];
}

module.exports = {
  initDb,
  query,
  getIsSQLite: () => isLocalFallback
};
