const mqtt = require('mqtt');
const pool = require('../db/index'); // Ensure this path is correct for your structure

// --- Buffer to hold the latest data for the vehicle ---
let latestIn40Data = {};

// This is your existing insert function, which is perfect.
const insertIn40Data = async (data) => {
    const {
        rpm = null, vmode = null, 
        soc = null, btemp = null, mtemp = null,
        amp = null, volt = null
    } = data;

    const sql = `INSERT INTO in40_data ( rpm, vmode,  soc, btemp, mtemp, amp, volt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [ rpm, vmode, soc, btemp, mtemp, amp, volt];

    try {
        await pool.execute(sql, params);
        console.log(`[Backend Logger] Successfully saved throttled data to in40_data`);
    } catch (dbError) {
        console.error(`[Backend Logger] Database Error for in40_data:`, dbError);
    }
};

const startMqttLogger = () => {
    // --- IN40 Connection ---
    const in40Options = {
        username: process.env.MQTT_USERNAME_IN40,
        password: process.env.MQTT_PASSWORD_IN40,
        clientId: `backend_in40_${Math.random().toString(16).substr(2, 8)}`, // More robust client ID
    };
    const in40Client = mqtt.connect(process.env.MQTT_URL_IN40, in40Options);

    in40Client.on('connect', () => {
        console.log('✅ Backend Logger connected to IN40 MQTT broker.');
        in40Client.subscribe(process.env.MQTT_TOPIC_IN40 || 'can/data');
    });

    // The 'message' event now ONLY updates the buffer. It does not save to the DB.
    in40Client.on('message', (topic, message) => {
        try {
            const payload = JSON.parse(message.toString());
            // Merge the new data into the buffer, overwriting old values with new ones
            latestIn40Data = { ...latestIn40Data, ...payload };
        } catch (e) { console.error('[Backend Logger] Error parsing IN40 message:', e); }
    });

    in40Client.on('error', (err) => console.error('[Backend Logger] IN40 MQTT Connection Error:', err));

    // --- The Throttling Logic: A single timer to save data periodically ---
    const SAVE_INTERVAL = 10000; // Save data every 10 seconds (10,000 ms)

    setInterval(() => {
        // Only save if the buffer has content
        if (Object.keys(latestIn40Data).length > 0) {
            // We make a copy to avoid race conditions
            const dataToSave = { ...latestIn40Data };
            // Immediately clear the buffer for the next interval
            latestIn40Data = {}; 

            // Now, save the copied data
            insertIn40Data(dataToSave);
        }
    }, SAVE_INTERVAL);
};

module.exports = { startMqttLogger };

