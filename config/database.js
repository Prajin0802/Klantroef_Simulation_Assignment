const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database file in the project directory
const dbPath = path.join(__dirname, '..', 'media_platform.db');
const db = new sqlite3.Database(dbPath);

// Function to setup all database tables
function setupDatabase() {
  return new Promise((resolve, reject) => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err);
        reject(err);
        return;
      }

      // Create AdminUser table
      const createAdminUserTable = `
        CREATE TABLE IF NOT EXISTS AdminUser (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          hashed_password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create MediaAsset table
      const createMediaAssetTable = `
        CREATE TABLE IF NOT EXISTS MediaAsset (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('video', 'audio')),
          file_url TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create MediaViewLog table
      const createMediaViewLogTable = `
        CREATE TABLE IF NOT EXISTS MediaViewLog (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          media_id INTEGER NOT NULL,
          viewed_by_ip TEXT NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (media_id) REFERENCES MediaAsset (id)
        )
      `;

      // Execute table creation queries
      db.serialize(() => {
        db.run(createAdminUserTable, (err) => {
          if (err) {
            console.error('Error creating AdminUser table:', err);
            reject(err);
            return;
          }
          console.log('AdminUser table created/verified');
        });

        db.run(createMediaAssetTable, (err) => {
          if (err) {
            console.error('Error creating MediaAsset table:', err);
            reject(err);
            return;
          }
          console.log('MediaAsset table created/verified');
        });

        db.run(createMediaViewLogTable, (err) => {
          if (err) {
            console.error('Error creating MediaViewLog table:', err);
            reject(err);
            return;
          }
          console.log('MediaViewLog table created/verified');
        });

        // All tables created successfully
        resolve();
      });
    });
  });
}

// Helper function to run queries with promises
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Helper function to get single row
function getRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Helper function to get multiple rows
function getAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  setupDatabase,
  runQuery,
  getRow,
  getAll,
  db
}; 