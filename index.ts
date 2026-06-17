import express from 'express';
import axios, { AxiosResponse } from 'axios';

interface ForecastData {
  shortForecast: string;
  temperature: number;
  characterization: 'hot' | 'cold' | 'moderate';
}

// Parse and validate lat/lon query values.
function parseCoords(
  rawLat: unknown,
  rawLon: unknown,
): { ok: true; lat: number; lon: number } | { ok: false; error: string } {
  if (rawLat == null || rawLon == null) {
    return { ok: false, error: 'lat and lon are required' };
  }
  const lat = Number(rawLat);
  const lon = Number(rawLon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, error: 'lat and lon must be valid numbers' };
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { ok: false, error: 'lat must be between -90 and 90, lon between -180 and 180' };
  }
  return { ok: true, lat, lon };
}

const app = express();

app.get('/forecast', async (req: express.Request, res: express.Response) => {
  try {
    const coords = parseCoords(req.query.lat, req.query.lon);
    if (!coords.ok) {
      return res.status(400).json({ error: coords.error });
    }
    const { lat, lon } = coords;

    // Resolve the forecast URL from the points endpoint.
    const pointsRes: AxiosResponse = await axios.get(
      `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
      { headers: { 'User-Agent': 'weather-app' } },
    );

    if (!pointsRes.data.properties || !pointsRes.data.properties.forecast) {
      return res
        .status(502)
        .json({ error: 'Weather service did not return a forecast URL for these coordinates.' });
    }

    const forecastUrl: string = pointsRes.data.properties.forecast;

    const forecastRes: AxiosResponse = await axios.get(forecastUrl, {
      headers: { 'User-Agent': 'weather-app' },
    });

    const periods = forecastRes.data.properties?.periods;
    if (!periods || periods.length === 0) {
      return res.status(502).json({ error: 'Weather service returned no forecast periods.' });
    }

    const current = periods[0];

    if (typeof current.temperature !== 'number') {
      return res.status(502).json({ error: 'Weather service returned an invalid temperature value.' });
    }

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
      characterization,
    };

    res.json(forecastData);
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      if (err.response.status === 404) {
        return res.status(404).json({
          error: 'No forecast available for these coordinates (the NWS API only covers the United States).',
        });
      }
      return res.status(502).json({ error: 'Upstream weather service error.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
