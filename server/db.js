const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'data.db');

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      // 1. Employees table
      db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL
      )`);

      // 2. Projects table
      db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        segment TEXT NOT NULL,
        revenue REAL DEFAULT 0,
        cost REAL DEFAULT 0,
        hardware_revenue REAL DEFAULT 0,
        hardware_cost REAL DEFAULT 0,
        service_revenue REAL DEFAULT 0,
        service_cost REAL DEFAULT 0,
        gross_profit REAL DEFAULT 0,
        hardware_gp REAL DEFAULT 0,
        service_gp REAL DEFAULT 0,
        total_gp REAL DEFAULT 0,
        margin REAL DEFAULT 0,
        sales_role TEXT,
        sales_owner INTEGER,
        commission_rate REAL DEFAULT 0,
        sale_commission REAL DEFAULT 0,
        distributable_profit REAL DEFAULT 0,
        responsible_technical INTEGER,
        month TEXT,
        recognition_date TEXT,
        status TEXT DEFAULT 'Draft'
      )`);

      // Ensure new columns exist for existing databases
      const addColumn = (colDef) => {
        db.run(`ALTER TABLE projects ADD COLUMN ${colDef}`, (err) => {
          if (err && !err.message.includes("duplicate column name")) { }
        });
      };
      addColumn('recognition_date TEXT');
      addColumn('hardware_revenue REAL DEFAULT 0');
      addColumn('hardware_cost REAL DEFAULT 0');
      addColumn('service_revenue REAL DEFAULT 0');
      addColumn('service_cost REAL DEFAULT 0');
      addColumn('hardware_gp REAL DEFAULT 0');
      addColumn('service_gp REAL DEFAULT 0');
      addColumn('total_gp REAL DEFAULT 0');

      // 3. KPI Results table
      db.run(`CREATE TABLE IF NOT EXISTS kpi_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        month TEXT NOT NULL,
        actual_LNG REAL DEFAULT 0,
        carry_over_last_month REAL DEFAULT 0,
        effective_target REAL DEFAULT 0,
        completion_percent REAL DEFAULT 0,
        lhq_rate REAL DEFAULT 0,
        carry_over_next REAL DEFAULT 0,
        final_salary REAL DEFAULT 0
      )`);

      // 4. Settings tables
      db.run(`CREATE TABLE IF NOT EXISTS settings_kpi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT UNIQUE,
        monthly_kpi REAL DEFAULT 0
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS settings_kpi_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        completion_from REAL,
        completion_to REAL,
        lhq_rate REAL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS settings_commission_inbound (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commission_rate REAL DEFAULT 0
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS settings_commission_outbound (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        margin_from REAL,
        margin_to REAL,
        commission_rate REAL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS settings_salary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT UNIQUE,
        base_salary REAL DEFAULT 0,
        salary_cap REAL DEFAULT 0
      )`);

      // 5. Financial Inputs table
      db.run(`CREATE TABLE IF NOT EXISTS financial_inputs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT UNIQUE,
        fixed_cost REAL DEFAULT 0,
        financial_profit REAL DEFAULT 0,
        other_profit REAL DEFAULT 0
      )`);

      // Initialize default data if empty
      initDefaultData();
    });
  }
});

function initDefaultData() {
  db.get('SELECT COUNT(*) as count FROM employees', (err, row) => {
    if (row && row.count === 0) {
      console.log('Inserting default sample data...');

      const stmtEmp = db.prepare('INSERT INTO employees (name, role) VALUES (?, ?)');
      stmtEmp.run('CEO Name', 'CEO');
      stmtEmp.run('Deputy Name', 'Deputy Director');
      stmtEmp.run('Tech 1', 'Technical Staff');
      stmtEmp.run('Tech 2', 'Technical Staff');
      stmtEmp.run('Inbound 1', 'Inbound Sales');
      stmtEmp.run('Outbound 1', 'Outbound Sales');
      stmtEmp.finalize();

      const stmtKpi = db.prepare('INSERT INTO settings_kpi (role, monthly_kpi) VALUES (?, ?)');
      stmtKpi.run('CEO', 1000000000);
      stmtKpi.run('Deputy Director', 500000000);
      stmtKpi.run('Technical Staff', 200000000);
      stmtKpi.finalize();

      const stmtKpiRules = db.prepare('INSERT INTO settings_kpi_rules (completion_from, completion_to, lhq_rate) VALUES (?, ?, ?)');
      stmtKpiRules.run(0, 0.5, 0.5);
      stmtKpiRules.run(0.5, 0.8, 0.8);
      stmtKpiRules.run(0.8, 1.0, 1.0);
      stmtKpiRules.run(1.0, 1.2, 1.2);
      stmtKpiRules.run(1.2, 999, 1.5);
      stmtKpiRules.finalize();

      const stmtInbound = db.prepare('INSERT INTO settings_commission_inbound (commission_rate) VALUES (?)');
      stmtInbound.run(0.02); // 2%
      stmtInbound.finalize();

      const stmtOutbound = db.prepare('INSERT INTO settings_commission_outbound (margin_from, margin_to, commission_rate) VALUES (?, ?, ?)');
      stmtOutbound.run(0, 0.2, 0.05);
      stmtOutbound.run(0.2, 0.4, 0.10);
      stmtOutbound.run(0.4, 1.0, 0.15);
      stmtOutbound.finalize();

      const stmtSalary = db.prepare('INSERT INTO settings_salary (role, base_salary, salary_cap) VALUES (?, ?, ?)');
      stmtSalary.run('CEO', 50000000, 100000000);
      stmtSalary.run('Deputy Director', 30000000, 60000000);
      stmtSalary.run('Technical Staff', 15000000, 30000000);
      stmtSalary.run('Inbound Sales', 10000000, 50000000);
      stmtSalary.run('Outbound Sales', 8000000, 50000000);
      stmtSalary.finalize();

      const currentMonth = new Date().toISOString().slice(0, 7);
      const stmtFin = db.prepare('INSERT INTO financial_inputs (month, fixed_cost, financial_profit, other_profit) VALUES (?, ?, ?, ?)');
      stmtFin.run(currentMonth, 100000000, 0, 0);
      stmtFin.finalize();

      console.log('Default sample data inserted successfully.');
    }
  });
}

module.exports = db;
