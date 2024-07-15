import React, { useState, useEffect } from 'react';
import './LatestData.css';
import SensorGraph from './SensorGraph';

const LatestData = () => {
  const [latestData, setLatestData] = useState({
    imagePath: '',
    sensorData: []
  });
  const [showDrySoilAlert, setShowDrySoilAlert] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchLatestData();
    const ws = new WebSocket('ws://localhost:3000');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'high_moisture') {
        setShowDrySoilAlert(true);
        setNotification('Soil moisture level is high (above 900) indicating dry soil.');
      }

      if (message.type === 'new_image') {
        setNotification('A new image has been uploaded.');
        fetchLatestData();
      }
    };

    return () => ws.close();
  }, []);

  const fetchLatestData = async () => {
    try {
      const response = await fetch('http://localhost:3000/latestData');
      if (!response.ok) {
        throw new Error('Failed to fetch latest data');
      }
      const data = await response.json();
      setLatestData({
        imagePath: data.imagePath,
        sensorData: data.sensorData
      });
    } catch (error) {
      console.error('Error fetching latest data:', error);
    }
  };

  useEffect(() => {
    const checkDrySoilAlert = () => {
      const isDry = latestData.sensorData.some(sensor => sensor.soil1 > 900 || sensor.soil2 > 900);
      setShowDrySoilAlert(isDry);
    };

    checkDrySoilAlert();
  }, [latestData]);

  const handleDelete = async (id) => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this sensor data?');
      if (!confirmed) {
        return;
      }

      const response = await fetch(`http://localhost:3000/deleteSensor/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete sensor data');
      }
      fetchLatestData();
    } catch (error) {
      console.error('Error deleting sensor data:', error);
    }
  };

  return (
    <div className="latest-data-container">
      {notification && (
        <div className="notification-item">
          {notification}
        </div>
      )}

      <div className="top-container">
        <div className="image-container">
          <h2>Latest Image</h2>
          {latestData.imagePath && (
            <img src={`http://localhost:3000/${latestData.imagePath}`} alt="Latest Capture" className="latest-image" />
          )}
        </div>
        <div className="sensor-graph-container">
          <h2>Sensor Data Trends</h2>
          <SensorGraph sensorData={latestData.sensorData} />
        </div>
      </div>

      <div className="sensor-data-container">
        <h2>Sensor Data History</h2>
        <div className="sensor-data-list">
          <table className="sensor-data-table">
            <thead>
              <tr>
                <th>Soil Moisture </th>
                <th>Temperature (°C)</th>
                <th>Humidity (%)</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {latestData.sensorData.map((data) => (
                <tr key={data.id}>
                  <td>{data.soil1}</td>
                  <td>{data.temperature}</td> 
                  <td>{data.humidity}</td>
                  <td>{new Date(data.timestamp).toLocaleString()}</td>
                  <td><button className="delete-button" onClick={() => handleDelete(data.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LatestData;
