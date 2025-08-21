const express = require('express');
const pool = require('../db/index');
const router = express.Router();

router.post('/', async (req, res) => {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No data provided for IN40.' });
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
        INSERT INTO in40_data (
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
        console.log('Successfully saved IN40 data.');
        res.status(201).json({ message: 'IN40 data saved successfully.' });
    } catch (dbError) {
        console.error('Database Error for IN40:', dbError);
        res.status(500).json({ error: 'Failed to save IN40 data.' });
    }
});

module.exports = router;