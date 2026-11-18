const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to run promises
const dbAll = (query, params = []) => new Promise((resolve, reject) => db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows)));
const dbGet = (query, params = []) => new Promise((resolve, reject) => db.get(query, params, (err, row) => err ? reject(err) : resolve(row)));
const dbRun = (query, params = []) => new Promise((resolve, reject) => db.run(query, params, function (err) { err ? reject(err) : resolve(this) }));

// --- EMPLOYEES ---
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await dbAll('SELECT * FROM employees ORDER BY id DESC');
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/employees', async (req, res) => {
    try {
        const { name, role } = req.body;
        const result = await dbRun('INSERT INTO employees (name, role) VALUES (?, ?)', [name, role]);
        res.json({ id: result.lastID, name, role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/employees/:id', async (req, res) => {
    try {
        const { name, role } = req.body;
        await dbRun('UPDATE employees SET name = ?, role = ? WHERE id = ?', [name, role, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/employees/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM employees WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SETTINGS ---
app.get('/api/settings', async (req, res) => {
    try {
        const kpi = await dbAll('SELECT * FROM settings_kpi');
        const kpi_rules = await dbAll('SELECT * FROM settings_kpi_rules ORDER BY completion_from');
        const commission_inbound = await dbGet('SELECT * FROM settings_commission_inbound LIMIT 1');
        const commission_outbound = await dbAll('SELECT * FROM settings_commission_outbound ORDER BY margin_from');
        const salary = await dbAll('SELECT * FROM settings_salary');

        res.json({ kpi, kpi_rules, commission_inbound, commission_outbound, salary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/settings/kpi', async (req, res) => {
    try {
        const { role, monthly_kpi } = req.body;
        await dbRun('UPDATE settings_kpi SET monthly_kpi = ? WHERE role = ?', [monthly_kpi, role]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings/salary', async (req, res) => {
    try {
        const { role, base_salary, salary_cap } = req.body;
        await dbRun('UPDATE settings_salary SET base_salary = ?, salary_cap = ? WHERE role = ?', [base_salary, salary_cap, role]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings/kpi_rule/:id', async (req, res) => {
    try {
        const { completion_from, completion_to, lhq_rate } = req.body;
        await dbRun('UPDATE settings_kpi_rules SET completion_from = ?, completion_to = ?, lhq_rate = ? WHERE id = ?', [completion_from, completion_to, lhq_rate, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings/commission_inbound', async (req, res) => {
    try {
        const { commission_rate } = req.body;
        await dbRun('UPDATE settings_commission_inbound SET commission_rate = ?', [commission_rate]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/settings/commission_outbound/:id', async (req, res) => {
    try {
        const { margin_from, margin_to, commission_rate } = req.body;
        await dbRun('UPDATE settings_commission_outbound SET margin_from = ?, margin_to = ?, commission_rate = ? WHERE id = ?', [margin_from, margin_to, commission_rate, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- FINANCIAL INPUTS ---
app.get('/api/financial_inputs', async (req, res) => {
    try {
        const inputs = await dbAll('SELECT * FROM financial_inputs ORDER BY month DESC');
        res.json(inputs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/financial_inputs', async (req, res) => {
    try {
        const { month, fixed_cost, financial_profit, other_profit } = req.body;
        await dbRun(`INSERT INTO financial_inputs (month, fixed_cost, financial_profit, other_profit) 
      VALUES (?, ?, ?, ?) ON CONFLICT(month) DO UPDATE SET 
      fixed_cost = excluded.fixed_cost, financial_profit = excluded.financial_profit, other_profit = excluded.other_profit`,
            [month, fixed_cost, financial_profit, other_profit]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- PROJECTS ---
// Calculate project profits internally
async function calculateProjectProfits(project) {
    let { segment, hardware_revenue, hardware_cost, service_revenue, service_cost, sales_role } = project;

    hardware_revenue = typeof hardware_revenue === 'number' ? hardware_revenue : 0;
    hardware_cost = typeof hardware_cost === 'number' ? hardware_cost : 0;
    service_revenue = typeof service_revenue === 'number' ? service_revenue : 0;
    service_cost = typeof service_cost === 'number' ? service_cost : 0;

    if (segment === 'SERVICE') {
        hardware_revenue = 0;
        hardware_cost = 0;
    } else if (segment === 'COMMERCIAL') {
        service_revenue = 0;
        service_cost = 0;
    }

    let hardware_gp = hardware_revenue - hardware_cost;
    let service_gp = service_revenue - service_cost;
    let total_gp = hardware_gp + service_gp;

    let revenue = hardware_revenue + service_revenue;
    let cost = hardware_cost + service_cost;
    let gross_profit = total_gp;
    if (gross_profit <= 0) gross_profit = 0;

    let margin = revenue > 0 ? gross_profit / revenue : 0;
    margin = Math.round(margin * 10000) / 10000; // Round to 4 decimal places

    let commission_rate = 0;

    if (total_gp > 0 && sales_role === 'Inbound') {
        const inbound = await dbGet('SELECT * FROM settings_commission_inbound LIMIT 1');
        if (inbound) commission_rate = inbound.commission_rate;
    } else if (total_gp > 0 && sales_role === 'Outbound') {
        const outboundTiers = await dbAll('SELECT * FROM settings_commission_outbound ORDER BY margin_from DESC');
        const tier = outboundTiers.find(t => margin >= t.margin_from);
        if (tier) commission_rate = tier.commission_rate;
    }

    let sale_commission = total_gp * commission_rate;
    if (total_gp <= 0) sale_commission = 0;

    let distributable_profit = total_gp - sale_commission;
    if (total_gp <= 0) distributable_profit = 0;

    return { ...project, revenue, cost, hardware_revenue, hardware_cost, service_revenue, service_cost, hardware_gp, service_gp, total_gp, gross_profit, margin, commission_rate, sale_commission, distributable_profit };
}

app.get('/api/projects', async (req, res) => {
    try {
        const month = req.query.month;
        let query = 'SELECT * FROM projects';
        let params = [];
        if (month) {
            query += ' WHERE month = ?';
            params.push(month);
        }
        query += ' ORDER BY id DESC';
        const projects = await dbAll(query, params);
        res.json(projects);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/projects', async (req, res) => {
    try {
        const completedProject = await calculateProjectProfits(req.body);
        let { project_name, segment, revenue, cost, hardware_revenue, hardware_cost, service_revenue, service_cost, hardware_gp, service_gp, total_gp, gross_profit, margin, sales_role, sales_owner, commission_rate, sale_commission, distributable_profit, responsible_technical, month, recognition_date, status } = completedProject;

        // Derive month from recognition_date if available
        if (recognition_date) {
            month = recognition_date.slice(0, 7);
        }

        const result = await dbRun(`INSERT INTO projects 
      (project_name, segment, revenue, cost, hardware_revenue, hardware_cost, service_revenue, service_cost, hardware_gp, service_gp, total_gp, gross_profit, margin, sales_role, sales_owner, commission_rate, sale_commission, distributable_profit, responsible_technical, month, recognition_date, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [project_name, segment, revenue, cost, hardware_revenue, hardware_cost, service_revenue, service_cost, hardware_gp, service_gp, total_gp, gross_profit, margin, sales_role, sales_owner, commission_rate, sale_commission, distributable_profit, responsible_technical, month, recognition_date, status]);

        res.json({ success: true, id: result.lastID, ...completedProject, month });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/projects/:id', async (req, res) => {
    try {
        const completedProject = await calculateProjectProfits(req.body);
        let { project_name, segment, revenue, cost, hardware_revenue, hardware_cost, service_revenue, service_cost, hardware_gp, service_gp, total_gp, gross_profit, margin, sales_role, sales_owner, commission_rate, sale_commission, distributable_profit, responsible_technical, month, recognition_date, status } = completedProject;

        // Derive month from recognition_date if available
        if (recognition_date) {
            month = recognition_date.slice(0, 7);
        }

        await dbRun(`UPDATE projects SET 
      project_name = ?, segment = ?, revenue = ?, cost = ?, hardware_revenue = ?, hardware_cost = ?, service_revenue = ?, service_cost = ?, hardware_gp = ?, service_gp = ?, total_gp = ?, gross_profit = ?, margin = ?, sales_role = ?, sales_owner = ?, commission_rate = ?, sale_commission = ?, distributable_profit = ?, responsible_technical = ?, month = ?, recognition_date = ?, status = ?
      WHERE id = ?`,
            [project_name, segment, revenue, cost, hardware_revenue, hardware_cost, service_revenue, service_cost, hardware_gp, service_gp, total_gp, gross_profit, margin, sales_role, sales_owner, commission_rate, sale_commission, distributable_profit, responsible_technical, month, recognition_date, status, req.params.id]);

        res.json({ success: true, ...completedProject, month });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        await dbRun('DELETE FROM projects WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- DASHBOARD ---
app.get('/api/dashboard', async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7);
        const projects = await dbAll('SELECT * FROM projects WHERE month = ? AND status = "Closed"', [month]);
        const fin = await dbGet('SELECT * FROM financial_inputs WHERE month = ?', [month]) || { fixed_cost: 0, financial_profit: 0, other_profit: 0 };

        let operating_profit = 0, total_sales_commission = 0, distributable_profit = 0;
        let hardware_gp = 0, service_gp = 0;

        projects.forEach(p => {
            operating_profit += p.total_gp;
            total_sales_commission += p.sale_commission;
            distributable_profit += p.distributable_profit;
            hardware_gp += p.hardware_gp || 0;
            service_gp += p.service_gp || 0;
        });

        const profit_before_tax = operating_profit - fin.fixed_cost + fin.financial_profit + fin.other_profit;

        res.json({
            operating_profit,
            hardware_gp,
            service_gp,
            total_sales_commission,
            distributable_profit,
            fixed_cost: fin.fixed_cost,
            financial_profit: fin.financial_profit,
            other_profit: fin.other_profit,
            profit_before_tax
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- KPI AND SALARY LOGIC ---
app.get('/api/kpi_results', async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().slice(0, 7);

        // Parse previous month
        const [y, m] = month.split('-');
        const date = new Date(y, m - 1 - 1, 1);
        const prevMonthStr = date.toISOString().slice(0, 7);

        const employees = await dbAll('SELECT * FROM employees');
        const projects = await dbAll('SELECT * FROM projects WHERE month = ? AND status = "Closed"', [month]);

        const settingsKpi = await dbAll('SELECT * FROM settings_kpi');
        const settingsSalary = await dbAll('SELECT * FROM settings_salary');
        const kpiRules = await dbAll('SELECT * FROM settings_kpi_rules ORDER BY completion_from');

        const prevKpiResults = await dbAll('SELECT * FROM kpi_results WHERE month = ?', [prevMonthStr]);
        const currentKpiResults = await dbAll('SELECT * FROM kpi_results WHERE month = ?', [month]);

        const results = [];

        for (const emp of employees) {
            let actual_LNG = 0;

            // Calculate actual LNG based on role
            if (emp.role === 'CEO') {
                actual_LNG = projects.reduce((sum, p) => sum + p.total_gp, 0);
            } else if (emp.role === 'Deputy Director') {
                actual_LNG = projects.reduce((sum, p) => sum + p.service_gp, 0);
            } else if (emp.role === 'Technical Staff') {
                actual_LNG = projects.filter(p => p.responsible_technical === emp.id)
                    .reduce((sum, p) => sum + p.service_gp, 0);
            } else {
                // Sales gets commission, not strict KPI target vs Actual LNG like the others,
                // The requirements say: "Sales roles receive commission only." 
                // We'll calculate their total commission as their Actual LNG for display
                actual_LNG = projects.filter(p => p.sales_owner === emp.id)
                    .reduce((sum, p) => sum + p.sale_commission, 0);
            }

            const prevRes = prevKpiResults.find(k => k.employee_id === emp.id);
            const carry_over_last_month = prevRes ? prevRes.carry_over_next : 0;

            const roleKpiSetting = settingsKpi.find(s => s.role === emp.role);
            const kpi_target = roleKpiSetting ? roleKpiSetting.monthly_kpi : 0;

            const effective_target = kpi_target + carry_over_last_month;

            let completion_percent = 0;
            let carry_over_next = 0;
            let lhq_rate = 0;

            // Only non-sales have KPI completion
            if (kpi_target > 0) {
                completion_percent = effective_target > 0 ? actual_LNG / effective_target : 0;

                if (actual_LNG < effective_target) {
                    carry_over_next = effective_target - actual_LNG;
                }

                // Find LHQ rate
                const rule = kpiRules.find(r => completion_percent >= r.completion_from && completion_percent < r.completion_to);
                if (rule) {
                    lhq_rate = rule.lhq_rate;
                } else if (completion_percent >= kpiRules[kpiRules.length - 1].completion_to) {
                    // If exceeding the highest tier
                    lhq_rate = kpiRules[kpiRules.length - 1].lhq_rate;
                }
            } else if (emp.role.includes('Sales')) {
                // sales role logic: final_salary = base_salary + commission.
                // Requirements say: "final_salary = base_salary * LHQ_rate". Usually sales base salary is 100% LHQ + commissions.
                lhq_rate = 1;
            }

            // Calculate final salary
            const roleSalarySettings = settingsSalary.find(s => s.role === emp.role);
            const base_salary = roleSalarySettings ? roleSalarySettings.base_salary : 0;
            const salary_cap = roleSalarySettings ? roleSalarySettings.salary_cap : 0;

            let final_salary = 0;
            if (emp.role.includes('Sales')) {
                final_salary = base_salary * lhq_rate + actual_LNG; // actual_LNG holds total commission for sales
            } else {
                final_salary = base_salary * lhq_rate;
            }

            if (salary_cap > 0 && final_salary > salary_cap) {
                final_salary = salary_cap;
            }

            const resItem = {
                employee_id: emp.id,
                month,
                actual_LNG,
                carry_over_last_month,
                effective_target,
                completion_percent,
                lhq_rate,
                carry_over_next,
                final_salary
            };

            const existing = currentKpiResults.find(k => k.employee_id === emp.id);
            if (!existing) {
                await dbRun('INSERT INTO kpi_results (employee_id, month, actual_LNG, carry_over_last_month, effective_target, completion_percent, lhq_rate, carry_over_next, final_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [emp.id, month, actual_LNG, carry_over_last_month, effective_target, completion_percent, lhq_rate, carry_over_next, final_salary]);
            } else {
                await dbRun('UPDATE kpi_results SET actual_LNG = ?, carry_over_last_month = ?, effective_target = ?, completion_percent = ?, lhq_rate = ?, carry_over_next = ?, final_salary = ? WHERE id = ?',
                    [actual_LNG, carry_over_last_month, effective_target, completion_percent, lhq_rate, carry_over_next, final_salary, existing.id]);
            }

            results.push({ ...emp, ...resItem });
        }

        res.json(results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3000, () => {
    console.log('API Server running on http://localhost:3000');
});
