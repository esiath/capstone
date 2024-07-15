// src/components/SensorGraph.js

import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SensorGraph = ({ sensorData }) => {
  const labels = sensorData.map((data) => new Date(data.timestamp).toLocaleString());
  const soil1Data = sensorData.map((data) => data.soil1);
 
  const temperatureData = sensorData.map((data) => data.temperature);
  const humidityData = sensorData.map((data) => data.humidity);

  const data = {
    labels,
    datasets: [
      {
        label: 'Moisture',
        data: soil1Data,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        pointRadius: 4,
      },
    
      {
        label: 'Temperature',
        data: temperatureData,
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        pointRadius: 4,
      },
      {
        label: 'Humidity',
        data: humidityData,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: 'Sensor Data Trends',
        font: {
          size: 16,
        },
      },
      tooltip: {
        bodyFont: {
          size: 12,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 10,
          },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default SensorGraph;
