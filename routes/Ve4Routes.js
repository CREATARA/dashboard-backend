const express = require('express');
const pool = require('../db/index');
const router = express.Router();

router.post('/', async (req, res) => {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No data provided for ve4.' });
    }
    
    // ** THE FIX IS HERE: 'motor_status' is removed **
    const {
        vehicle_on = null, steer_lock = null, bat_lock = null, sstand = null,
        bat_dock = null, brake = null, kill = null, pbutton = null, rpm = null, vmode = null, odometer = null,
        charging = null, soc = null, btemp = null, mtemp = null, DIAGNOSTICS = null, timestamp = null,
        amp = null, volt = null
    } = data;

    // ** THE FIX IS HERE: 'motor_status' is removed from the column list **
    const sql = `
        INSERT INTO ve4_data (
            vehicle_on, steer_lock, bat_lock, sstand, bat_dock, 
            brake, \`kill\`, pbutton, rpm, vmode, odometer, charging, 
            soc, btemp, mtemp, diagnostics, \`timestamp\`, amp, volt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        // ** THE FIX IS HERE: 'motor_status' is removed from the values array **
        await pool.execute(sql, [
            vehicle_on, steer_lock, bat_lock, sstand,
            bat_dock, brake, kill, pbutton, rpm, vmode, odometer,
            charging, soc, btemp, mtemp, JSON.stringify(DIAGNOSTICS), timestamp,
            amp, volt
        ]);
        console.log('Successfully saved ve4_data.');
        res.status(201).json({ message: 've4 data saved successfully.' });
    } catch (dbError) {
        console.error('Database Error for ve4:', dbError);
        res.status(500).json({ error: 'Failed to save ve4 data.' });
    }
});









// Route to GET ve4 data for the graph
router.get('/analytics/rpm-vs-soc', async (req, res) => {
    try {
        const sql = `
            SELECT rpm, soc, received_at 
            FROM ve4_data 
            WHERE rpm IS NOT NULL AND soc IS NOT NULL
            ORDER BY received_at ASC 
            LIMIT 200
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (dbError) {
        console.error('Database Error fetching ve4 analytics data:', dbError);
        res.status(500).json({ error: 'Failed to fetch ve4 analytics data.' });
    }
});




router.get('/analytics/battery-health', async (req, res) => {
    try {
        // Get the last 100 data points for SOC and battery temperature.
        const sql = `
            SELECT soc, btemp, received_at 
            FROM ve4_data
            WHERE soc IS NOT NULL AND btemp IS NOT NULL
            ORDER BY received_at DESC 
            LIMIT 100
        `;
        const [rows] = await pool.query(sql);
        // Reverse the data to show time moving forward on the chart.
        res.json(rows.reverse());

    } catch (dbError) {
        console.error('Database Error fetching ve4 battery data:', dbError);
        res.status(500).json({ error: 'Failed to fetch ve4 battery data.' });
    }
});



// power consumption analytics


router.get('/analytics/power', async (req, res) => {
    try {
        // Get the last 100 data points for voltage and amperage.
        const sql = `
            SELECT volt, amp, received_at 
            FROM ve4_data
            WHERE volt IS NOT NULL AND amp IS NOT NULL
            ORDER BY received_at DESC 
            LIMIT 100
        `;
        const [rows] = await pool.query(sql);
        // Reverse the data to show time moving forward on the chart.
        res.json(rows.reverse());

    } catch (dbError) {
        console.error('Database Error fetching ve4 power data:', dbError);
        res.status(500).json({ error: 'Failed to fetch ve4 power data.' });
    }
});


// thermal analytics  
router.get('/analytics/thermal', async (req, res) => {
    try {
        // Get the last 100 data points for temperature and power components.
        const sql = `
            SELECT btemp, mtemp, volt, amp, received_at 
            FROM ve4_data
            WHERE btemp IS NOT NULL AND mtemp IS NOT NULL AND volt IS NOT NULL AND amp IS NOT NULL
            ORDER BY received_at DESC 
            LIMIT 100
        `;
        const [rows] = await pool.query(sql);
        // Reverse the data to show time moving forward on the chart.
        res.json(rows.reverse());

    } catch (dbError) {
        console.error('Database Error fetching ve4 thermal data:', dbError);
        res.status(500).json({ error: 'Failed to fetch ve4 thermal data.' });
    }
});




// ** NEW ROUTE FOR ACCELERATION GRAPH **
router.get('/analytics/acceleration', async (req, res) => {
    try {
        // Get the last 100 data points for RPM and SOC to calculate acceleration.
        const sql = `
            SELECT rpm, soc, received_at 
            FROM ve4_data 
            WHERE rpm IS NOT NULL AND soc IS NOT NULL
            ORDER BY received_at DESC 
            LIMIT 100
        `;
        const [rows] = await pool.query(sql);
        // Reverse the data to show time moving forward.
        res.json(rows.reverse());

    } catch (dbError) {
        console.error('Database Error fetching ve4 acceleration data:', dbError);
        res.status(500).json({ error: 'Failed to fetch ve4 acceleration data.' });
    }
});




// ** NEW ROUTE FOR RIDING MODE PIE CHART **
router.get('/analytics/mode-distribution', async (req, res) => {
    try {
        // This query counts how many records exist for each vmode
        const sql = `
            SELECT vmode, COUNT(*) as count 
            FROM ve4_data 
            WHERE vmode IS NOT NULL AND vmode > 0
            GROUP BY vmode
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);

    } catch (dbError) {
        console.error('Database Error fetching ve4 mode data:', dbError);
        res.status(500).json({ error: 'Failed to fetch ve4 mode data.' });
    }
});





module.exports = router;
