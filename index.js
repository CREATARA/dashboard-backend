// server/index.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Ve4router = require('./routes/Ve4Routes');
const In40Router = require('./routes/In40Routes');
const { startMqttLogger } = require('./services/mqtt-logger');

const app = express();
const PORT = process.env.PORT ;

// --- Middleware ---
app.use(cors()); // Allows your React app (on a different port) to talk to this server.
app.use(express.json()); // Allows the server to understand incoming JSON data.
app.use("/api/data/ve4", Ve4router);
app.use("/api/data/in40", In40Router);


app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  startMqttLogger();   
});
