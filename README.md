# University Research Opportunity Portal

## 📌 Project Overview
The **University Research Opportunity Portal** is a full-stack web application developed to centralize and streamline research openings for faculty and students. Previously scattered across emails, WhatsApp groups, and noticeboards, faculty members can now post, update, manage, and close research opportunities, while students can search, filter, and view detailed project requirements.

---

## 🚀 Features
- **Backend REST API**: Full CRUD capabilities built with Node.js & Express.
- **MySQL Database Integration**: Relational database storage with schema definitions (`schema.sql`).
- **Seamless SQLite Fallback**: Automatic fallback mode for local testing without requiring pre-configured MySQL services.
- **Modern Responsive Frontend**: Built with HTML5, CSS3, JavaScript, featuring glassmorphism design, real-time filtering, search, and dynamic modal dialogs.
- **Input Validation & Error Handling**: Server-side and client-side validation with standard HTTP status codes (`200`, `201`, `400`, `404`, `500`).
- **Postman API Suite**: Complete exported Postman collection (`postman_collection.json`) covering all 8 testing requirements.

---

## 🛠️ Technology Stack
- **Backend**: Node.js, Express.js
- **Database**: MySQL (`mysql2` package) with SQLite fallback (`better-sqlite3`)
- **Frontend**: Vanilla HTML5, Modern CSS3, JavaScript (Fetch API)
- **API Testing**: Postman / Bruno Collection v2.1

---

## 📁 Directory Structure
```
research-opportunity-portal/
├── public/
│   ├── index.html         # Frontend Single-Page Interface
│   ├── styles.css         # Modern Design System & CSS Styles
│   └── app.js             # Client-side JavaScript & API Handler
├── .env.example           # Environment variables template
├── .env                   # Local Environment configuration
├── db.js                  # Database Connection (MySQL / SQLite fallback)
├── package.json           # Node.js Dependencies & Scripts
├── postman_collection.json# Exported Postman Test Collection
├── README.md              # Documentation & Guide
├── schema.sql             # MySQL Database Creation & Seed Script
└── server.js              # Express REST API Server
```

---

## 💾 Database Setup Instructions (MySQL)

1. Open your MySQL client (MySQL Workbench, Command Line, or phpMyAdmin).
2. Execute the provided `schema.sql` script:
   ```sql
   SOURCE schema.sql;
   ```
   *This creates the `research_portal_db` database, the `research_opportunities` table, and inserts seed records.*

3. Configure your database credentials in the `.env` file:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=research_portal_db
   USE_SQLITE_FALLBACK=true
   ```

---

## ⚡ Quick Start & Run Instructions

### 1. Install Dependencies
Run the following command in the project root directory:
```bash
npm install
```

### 2. Start the Application Server
Run the application server:
```bash
npm start
```
Or with auto-reload during development:
```bash
npm run dev
```

### 3. Open Frontend in Web Browser
Open your browser and visit:
```text
http://localhost:5000
```

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description | Expected Status Codes |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/opportunities` | Create a new research opportunity | `201 Created`, `400 Bad Request` |
| **GET** | `/api/opportunities` | Retrieve all research opportunities | `200 OK`, `500 Server Error` |
| **GET** | `/api/opportunities/:id` | Retrieve single opportunity by ID | `200 OK`, `404 Not Found` |
| **PUT** | `/api/opportunities/:id` | Update an existing opportunity | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/api/opportunities/:id` | Delete an opportunity by ID | `200 OK`, `404 Not Found` |

---

## 🧪 API Testing with Postman / Bruno

An exported collection file is included: `postman_collection.json`.

### How to Import & Run in Postman:
1. Open **Postman**.
2. Click **Import** (top left) -> Select `postman_collection.json`.
3. Ensure your Node.js server is running (`http://localhost:5000`).
4. Run the requests in numerical order:
   - **Req 1-3**: Create 3 research opportunities (`POST`)
   - **Req 4**: Retrieve all opportunities (`GET`)
   - **Req 5**: Retrieve opportunity by ID (`GET`)
   - **Req 6**: Update opportunity details (`PUT`)
   - **Req 7**: Change status to `Closed` (`PUT`)
   - **Req 8**: Delete opportunity (`DELETE`)
   - **Req 9**: Retrieve deleted ID (verifies `404 Not Found`)
   - **Req 10**: Send missing fields (verifies `400 Bad Request`)
