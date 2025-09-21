const express = require('express');
const pool = require('../db/index');
const router = express.Router();


// Helper function for date-filtered queries
const getAnalyticsData = async (res, fields, table, body) => {
    try {
        const { startDate, endDate } = body;
        let sql, params;

        if (startDate && endDate) {
            const endOfDay = endDate.substring(0, 10) + ' 23:59:59';
            sql = `
                SELECT ${fields}, received_at 
                FROM ${table} 
                WHERE ${fields.split(',').map(f => `${f.trim()} IS NOT NULL`).join(' AND ')}
                  AND received_at BETWEEN ? AND ?
                ORDER BY received_at ASC 
                LIMIT 500
            `;
            params = [startDate, endOfDay];
        } else {
            sql = `
                SELECT ${fields}, received_at 
                FROM ${table} 
                WHERE ${fields.split(',').map(f => `${f.trim()} IS NOT NULL`).join(' AND ')}
                ORDER BY received_at DESC 
                LIMIT 200
            `;
            params = [];
        }

        const [rows] = await pool.query(sql, params);
        if (!startDate) rows.reverse();
        res.json(rows);
    } catch (dbError) {
        console.error(`Database Error fetching analytics data from ${table}:`, dbError);
        res.status(500).json({ error: `Failed to fetch analytics data from ${table}.` });
    }
};




// --- Analytics Routes ---
router.post('/analytics/rpm-vs-soc', (req, res) => getAnalyticsData(res, 'rpm, soc', 'in40_data', req.body));
router.post('/analytics/battery-health', (req, res) => getAnalyticsData(res, 'soc, btemp', 'in40_data', req.body));
// router.post('/analytics/power', (req, res) => getAnalyticsData(res, 'volt, amp', 'in40_data', req.body));
router.post('/analytics/thermal', (req, res) => getAnalyticsData(res, 'btemp, mtemp, volt, amp', 'in40_data', req.body));
router.post('/analytics/acceleration', (req, res) => getAnalyticsData(res, 'rpm, soc', 'in40_data', req.body));




router.post('/analytics/mode-distribution', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        let sql, params;

        if (startDate && endDate) {
            const endOfDay = endDate.substring(0, 10) + ' 23:59:59';
            sql = `
                SELECT vmode, COUNT(*) as count FROM in40_data
                WHERE vmode IS NOT NULL AND vmode > 0 AND received_at BETWEEN ? AND ?
                GROUP BY vmode
            `;
            params = [startDate, endOfDay];
        } else {
             sql = `
                SELECT vmode, COUNT(*) as count FROM in40_data
                WHERE vmode IS NOT NULL AND vmode > 0 GROUP BY vmode
            `;
            params = [];
        }
        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (dbError) {
        res.status(500).json({ error: 'Failed to fetch mode data.' });
    }
});



router.post('/analytics/power', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        let sql, params;

        // Base WHERE clause to get only positive power consumption data
        const baseWhere = `volt > 0 AND amp > 0`;

        if (startDate && endDate) {
            const endOfDay = endDate.substring(0, 10) + ' 23:59:59';
            sql = `
                SELECT volt, amp, received_at 
                FROM in40_data 
                WHERE ${baseWhere}
                  AND received_at BETWEEN ? AND ?
                ORDER BY received_at ASC 
                LIMIT 500
            `;
            params = [startDate, endOfDay];
        } else {
            sql = `
                SELECT volt, amp, received_at 
                FROM in40_data 
                WHERE ${baseWhere}
                ORDER BY received_at DESC 
                LIMIT 200
            `;
            params = [];
        }

        const [rows] = await pool.query(sql, params);
        if (!startDate) rows.reverse();
        res.json(rows);

    } catch (dbError) {
        console.error('Database Error fetching IN40 power data:', dbError);
        res.status(500).json({ error: 'Failed to fetch IN40 power data.' });
    }
});






module.exports = router;







