import { describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { getTodayForecast, UpstreamError } from '../src/nws';

const POINTS = {
  data: { properties: { forecast: 'https://api.weather.gov/gridpoints/TOP/1,1/forecast' } },
};
const FORECAST = {
  data: { properties: { periods: [{ shortForecast: 'Sunny', temperature: 75 }] } },
};

// Stub axios.get so no real HTTP happens. `as any` because the real overloaded
// signature is far stricter than our fake needs to be.
function stubAxios(impl: (url: string) => Promise<unknown>) {
  return mock.method(axios, 'get', impl as any);
}

afterEach(() => mock.restoreAll());

describe('getTodayForecast', () => {
  it('returns the first period from the two-step lookup', async () => {
    stubAxios(async (url) => (url.includes('/points/') ? POINTS : FORECAST));
    const period = await getTodayForecast(38.8977, -77.0365);
    assert.deepEqual(period, { shortForecast: 'Sunny', temperature: 75 });
  });

  it('rounds coordinates to 4 decimals in the points request', async () => {
    const get = stubAxios(async (url) => (url.includes('/points/') ? POINTS : FORECAST));
    await getTodayForecast(38.897700123, -77.036500987);
    assert.equal(get.mock.calls[0].arguments[0], 'https://api.weather.gov/points/38.8977,-77.0365');
  });

  it('throws UpstreamError when no forecast URL is returned', async () => {
    stubAxios(async () => ({ data: { properties: {} } }));
    await assert.rejects(() => getTodayForecast(0, 0), UpstreamError);
  });

  it('throws UpstreamError when there are no periods', async () => {
    stubAxios(async (url) =>
      url.includes('/points/') ? POINTS : { data: { properties: { periods: [] } } },
    );
    await assert.rejects(() => getTodayForecast(0, 0), /no forecast periods/);
  });

  it('throws UpstreamError on a non-numeric temperature', async () => {
    stubAxios(async (url) =>
      url.includes('/points/')
        ? POINTS
        : { data: { properties: { periods: [{ shortForecast: 'x', temperature: 'NaN' }] } } },
    );
    await assert.rejects(() => getTodayForecast(0, 0), UpstreamError);
  });
});
