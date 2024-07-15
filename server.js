const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const port = 3000;

// Set up MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'data'
});

db.connect((err) => {
  if (err) {
    console.error('Could not connect to database:', err);
    return;
  }
  console.log('Connected to database');
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `image-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// Use CORS middleware
app.use(cors());

// Parse application/json requests
app.use(bodyParser.json());

// Parse application/x-www-form-urlencoded requests
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// Handle POST requests to /upload/image
app.post('/upload/image', upload.single('imageFile'), (req, res) => {
  const imagePath = req.file.path;

  const query = 'INSERT INTO ImageData (image_path) VALUES (?)';
  db.query(query, [imagePath], (err, result) => {
    if (err) {
      console.error('Error saving to database:', err);
      res.status(500).send('Error saving to database');
      return;
    }
    res.status(200).send('Image uploaded and saved to database');

    // Notify clients of the new image
    broadcastMessage({ type: 'new_image', imagePath });
  });
});

// Handle POST requests to /saveSensor for sensor data
app.post('/saveSensor', (req, res) => {
  const { s1, s2, temp, hum } = req.body;

  // Insert sensor data into database
  const query = 'INSERT INTO SensorData (soil1, soil2, temperature, humidity) VALUES (?, ?, ?, ?)';
  db.query(query, [s1, s2, temp, hum], (err, result) => {
    if (err) {
      console.error('Error saving sensor data:', err);
      res.status(500).send('Error saving sensor data');
      return;
    }
    res.status(200).send('Sensor data saved successfully');

    // Notify clients if soil moisture level is high
    if (s1 > 900 || s2 > 900) {
      broadcastMessage({ type: 'high_moisture', soil1: s1, soil2: s2 });
    }
  });
});

// Handle GET request to fetch latest image path and sensor data
app.get('/latestData', (req, res) => {
  const getImageQuery = 'SELECT image_path FROM ImageData ORDER BY id DESC LIMIT 1';
  const getSensorDataQuery = 'SELECT id, soil1, soil2, temperature, humidity, timestamp FROM SensorData ORDER BY id DESC LIMIT 10';

  db.query(getImageQuery, (errImage, resultsImage) => {
    if (errImage) {
      console.error('Error fetching image path:', errImage);
      res.status(500).send('Error fetching image path');
      return;
    }

    db.query(getSensorDataQuery, (errSensor, resultsSensor) => {
      if (errSensor) {
        console.error('Error fetching sensor data:', errSensor);
        res.status(500).send('Error fetching sensor data');
        return;
      }

      const latestData = {
        imagePath: resultsImage.length > 0 ? resultsImage[0].image_path : '',
        sensorData: resultsSensor
      };

      res.json(latestData);
    });
  });
});

// Handle DELETE request to delete sensor data
app.delete('/deleteSensor/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM SensorData WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting sensor data:', err);
      res.status(500).send('Error deleting sensor data');
      return;
    }
    res.status(200).send('Sensor data deleted successfully');
  });
});

// Set up WebSocket server
const wss = new WebSocket.Server({ server: app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
}) });

// Broadcast message to all connected clients
const broadcastMessage = (message) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

wss.on('connection', ws => {
  console.log('New WebSocket connection');
});
