import express from 'express';
import axios from 'axios';
import { parseCoords } from './coords';
import { getTodayForecast, UpstreamError } from './nws';
import { characterizeTemperature, Characterization } from './temp';

interface ForecastData {
  shortForecast: string;
  temperature: number;
  characterization: Characterization;
}

export const app = express();

app.get('/forecast', async (req: express.Request, res: express.Response) => {
  try {
    const coords = parseCoords(req.query.lat, req.query.lon);
    if (!coords.ok) {
      return res.status(400).json({ error: coords.error });
    }

    const current = await getTodayForecast(coords.lat, coords.lon);

    const forecastData: ForecastData = {
      shortForecast: current.shortForecast,
      temperature: current.temperature,
      characterization: characterizeTemperature(current.temperature),
    };

    // TODO: Add retry logic

    res.json(forecastData);
  } catch (err) {
    if (err instanceof UpstreamError) {
      return res.status(502).json({ error: err.message });
    }
    if (axios.isAxiosError(err) && err.response) {
      if (err.response.status === 404) {
        return res.status(404).json({
          error: 'No forecast available for these coordinates',
        });
      }
      return res.status(502).json({ error: 'Upstream weather service error.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// TODO: Expand functionality to include more forecast periods.
// TODO: Add caching for grid locations.
// TODO: Add option to convert temp units to celsius
// TODO: Add support for retrieving weather icon for potential frontend support.