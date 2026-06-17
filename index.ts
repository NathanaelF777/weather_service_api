import express from 'express';
import axios from 'axios';

const app = express();

app.get('/forecast', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    // Get the forecast URL from the points endpoint
    const pointsRes = await axios.get(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { 'User-Agent': 'weather-app' },
    });
    const forecastUrl = pointsRes.data.properties.forecast;

    // Return forecast data
    const forecastRes = await axios.get(forecastUrl, {
      headers: { 'User-Agent': 'weather-app' },
    });
    res.json(forecastRes.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
