import React, { useState, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OPENWEATHER_API_KEY = "6f4137c11b25ada4fc16e63832c37da7";

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const groupForecastByDay = (data) => {
  const daily = {};
  data.forEach((item) => {
    const date = item.dt_txt.split(" ")[0];
    if (!daily[date]) {
      daily[date] = {
        temps: [],
        min: item.main.temp_min,
        max: item.main.temp_max,
        precip: 0,
        condition: item.weather[0].description,
      };
    }
    daily[date].temps.push(item.main.temp);
    daily[date].min = Math.min(daily[date].min, item.main.temp_min);
    daily[date].max = Math.max(daily[date].max, item.main.temp_max);
    daily[date].precip += item.rain?.["3h"] || 0;
  });

  return Object.entries(daily)
    .slice(0, 5)
    .map(([date, val]) => ({ date, ...val }));
};

const WeatherDashboard = () => {
  const [city, setCity] = useState("Kolkata");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setError("");
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      setWeather(res.data);

      const forecastRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`
      );
      setForecast(groupForecastByDay(forecastRes.data.list));
    } catch (err) {
      setError("City not found.");
      setWeather(null);
      setForecast([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const forecastChartData = {
    labels: forecast.map((d) => formatDate(d.date)),
    datasets: [
      {
        label: "Max Temp (°C)",
        data: forecast.map((d) => d.max),
        borderColor: "orange",
        backgroundColor: "orange",
        fill: false,
        yAxisID: "y1",
      },
      {
        label: "Precipitation (mm)",
        data: forecast.map((d) => d.precip),
        type: "bar",
        backgroundColor: "rgba(135, 206, 250, 0.7)",
        yAxisID: "y2",
      },
    ],
  };

  const forecastOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
    scales: {
      y1: {
        type: "linear",
        position: "left",
        title: { display: true, text: "Temperature (°C)" },
      },
      y2: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Rainfall (mm)" },
      },
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>🌤 Weather Dashboard</h1>
        <div style={styles.search}>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={styles.input}
            placeholder="Enter city name"
          />
          <button onClick={fetchData} style={styles.button}>
            Search
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {weather && (
          <div style={styles.weatherBox}>
            <h2 style={styles.city}>{weather.name}</h2>
            <p style={styles.temp}>{Math.round(weather.main.temp)}°C</p>
            <p style={styles.desc}>{weather.weather[0].description}</p>
          </div>
        )}

        {forecast.length > 0 && (
          <>
            <h3 style={styles.subtitle}>5-Day Forecast</h3>
            <div style={styles.chart}>
              <Line data={forecastChartData} options={forecastOptions} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    background: "linear-gradient(to right, #dceefb, #f5f7fa)",
    minHeight: "100vh",
    paddingTop: "40px",
  },
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Segoe UI, sans-serif",
    textAlign: "center",
  },
  title: {
    fontSize: "2.5rem",
    color: "#333",
    marginBottom: "20px",
  },
  subtitle: {
    fontSize: "1.8rem",
    marginTop: "40px",
    marginBottom: "10px",
    color: "#444",
  },
  search: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
  },
  input: {
    padding: "10px",
    width: "60%",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 18px",
    fontSize: "1rem",
    backgroundColor: "#0077b6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  error: {
    color: "red",
    marginTop: "10px",
  },
  weatherBox: {
    backgroundColor: "#ffffffdd",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginTop: "20px",
  },
  city: {
    fontSize: "1.6rem",
    color: "#333",
  },
  temp: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    margin: "10px 0",
    color: "#ff7b00",
  },
  desc: {
    fontSize: "1.2rem",
    color: "#555",
  },
  chart: {
    marginTop: "30px",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
};

export default WeatherDashboard;
