const express = require('express');
const pool = require('../db/index');
const router = express.Router();

router.post('/', async (req, res) => {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
        return res.status(400).json({ error: 'No data provided for Ve4.' });
    }

    // ** THE FIX IS HERE **
    // Provide a default value of 'null' for every field.
    // If a field is missing from the 'data' object, its variable will be 'null' instead of 'undefined'.
    const {
        vehicle_on = null, motor_status = null, steer_lock = null, bat_lock = null, sstand = null,
        bat_dock = null, brake = null, kill = null, pbutton = null, speed = null, vmode = null, odometer = null,
        charging = null, soc = null, btemp = null, mtemp = null, DIAGNOSTICS = null, timestamp = null,
        amp = null, volt = null
    } = data;

    const sql = `
        INSERT INTO ve4_data (
            vehicle_on, motor_status, steer_lock, bat_lock, sstand, bat_dock, 
            brake, \`kill\`, pbutton, speed, vmode, odometer, charging, 
            soc, btemp, mtemp, diagnostics, \`timestamp\`, amp, volt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        await pool.execute(sql, [
            vehicle_on, motor_status, steer_lock, bat_lock, sstand,
            bat_dock, brake, kill, pbutton, speed, vmode, odometer,
            charging, soc, btemp, mtemp, JSON.stringify(DIAGNOSTICS), timestamp,
            amp, volt
        ]);
        console.log('Successfully saved Ve4 data.');
        res.status(201).json({ message: 'Ve4 data saved successfully.' });
    } catch (dbError) {
        console.error('Database Error for Ve4:', dbError);
        res.status(500).json({ error: 'Failed to save Ve4 data.' });
    }
});

module.exports = router;
