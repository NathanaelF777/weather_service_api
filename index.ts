import express from 'express';
import axios, { AxiosResponse } from 'axios';

interface ForecastData {
  shortForecast: string;
  temperature: number;
  characterization: 'hot' | 'cold' | 'moderate';
}

const app = express();

app.get('/forecast', async (req: express.Request, res: express.Response) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon are required' });
    }

    // Get the forecast URL from the points endpoint
    const pointsRes: AxiosResponse = await axios.get(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { 'User-Agent': 'weather-app' },
    });
    const forecastUrl: string = pointsRes.data.properties.forecast;

    // Return forecast data
    const forecastRes: AxiosResponse = await axios.get(forecastUrl, {
      headers: { 'User-Agent': 'weather-app' },
    });
    const current = forecastRes.data.properties.periods[0];

    // Figure out temp characterization
    const temp: number = current.temperature;

    let characterization: 'hot' | 'cold' | 'moderate';
    if (temp < 50) {
      characterization = 'cold';
    } else if (temp > 80) {
      characterization = 'hot';
    } else {
      characterization = 'moderate';
    }

    const forecastData: ForecastData = {
      shortForecast: current.shortForecast,
      temperature: current.temperature,
      characterization: characterization,
    };

    res.json(forecastData);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
