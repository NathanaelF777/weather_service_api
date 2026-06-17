import axios, { AxiosResponse } from 'axios';

// Custom error type for upstream failures, so we can distinguish them from other errors.
export class UpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpstreamError';
  }
}

// Interface for data from NWS API
export interface ForecastPeriod {
  shortForecast: string;
  temperature: number;
}

const NWS_BASE = 'https://api.weather.gov';
const USER_AGENT = 'weather-app';
//TODO: Add custom user agent

// Fetch the current forecast for the given coordinates. 
export async function getTodayForecast(lat: number, lon: number): Promise<ForecastPeriod> {
  // NWS requires coordinates rounded to at most 4 decimal places.
  const pointsRes: AxiosResponse = await axios.get(
    `${NWS_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    { headers: { 'User-Agent': USER_AGENT } },
  );

  const forecastUrl: string | undefined = pointsRes.data?.properties?.forecast;
  if (!forecastUrl) {
    throw new UpstreamError('Weather service did not return a forecast URL for these coordinates.');
  }

  const forecastRes: AxiosResponse = await axios.get(forecastUrl, {
    headers: { 'User-Agent': USER_AGENT },
  });

  const periods = forecastRes.data?.properties?.periods;
  if (!periods || periods.length === 0) {
    throw new UpstreamError('Weather service returned no forecast periods.');
  }

  const current = periods[0];
  if (typeof current.temperature !== 'number') {
    throw new UpstreamError('Weather service returned an invalid temperature value.');
  }

  return current;
}
