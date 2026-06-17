import { describe, it, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import axios from 'axios';
import { app } from '../src/app';

let server: Server;
let baseUrl: string;

const POINTS = {
  data: { properties: { forecast: 'https://api.weather.gov/gridpoints/TOP/1,1/forecast' } },
};

// Stub axios.get so the route runs end-to-end without real HTTP.
function stubAxios(impl: (url: string) => Promise<unknown>) {
  mock.method(axios, 'get', impl as any);
}

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => server.close());
afterEach(() => mock.restoreAll());

describe('GET /forecast', () => {
  it('returns shaped forecast data with a characterization (200)', async () => {
    stubAxios(async (url) =>
      url.includes('/points/')
        ? POINTS
        : { data: { properties: { periods: [{ shortForecast: 'Sunny', temperature: 88 }] } } },
    );
    const res = await fetch(`${baseUrl}/forecast?lat=38.8977&lon=-77.0365`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), {
      shortForecast: 'Sunny',
      temperature: 88,
      characterization: 'hot',
    });
  });

  it('returns 400 when coordinates are missing', async () => {
    const res = await fetch(`${baseUrl}/forecast`);
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.match(body.error, /required/);
  });

  it('returns 400 for non-numeric coordinates', async () => {
    const res = await fetch(`${baseUrl}/forecast?lat=abc&lon=0`);
    assert.equal(res.status, 400);
  });

  it('returns 400 for out-of-range coordinates', async () => {
    const res = await fetch(`${baseUrl}/forecast?lat=200&lon=0`);
    assert.equal(res.status, 400);
  });

  it('maps an upstream 404 to 404', async () => {
    stubAxios(async () => {
      throw { isAxiosError: true, response: { status: 404 } };
    });
    const res = await fetch(`${baseUrl}/forecast?lat=48.85&lon=2.35`);
    assert.equal(res.status, 404);
  });

  it('maps other upstream failures to 502', async () => {
    stubAxios(async () => {
      throw { isAxiosError: true, response: { status: 500 } };
    });
    const res = await fetch(`${baseUrl}/forecast?lat=1&lon=1`);
    assert.equal(res.status, 502);
  });

  it('maps an unusable payload (no periods) to 502', async () => {
    stubAxios(async (url) =>
      url.includes('/points/') ? POINTS : { data: { properties: { periods: [] } } },
    );
    const res = await fetch(`${baseUrl}/forecast?lat=1&lon=1`);
    assert.equal(res.status, 502);
  });
});
