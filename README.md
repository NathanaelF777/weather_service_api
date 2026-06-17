# Weather Service API

An HTTP API that returns today's forecast for a latitude/longitude — the short
forecast (e.g. _"Partly Cloudy"_) plus a `hot` / `cold` / `moderate`
characterization of the temperature. Data comes from the
[National Weather Service (NWS) API](https://www.weather.gov/documentation/services-web-api).

## Requirements

- Node.js 18+ (uses the built-in test runner and `fetch` in tests)
- npm

## Setup & run

```bash
npm install
npm start          # starts on http://localhost:3000
```

Example:

```bash
curl "http://localhost:3000/forecast?lat=38.8977&lon=-77.0365"
```

```json
{
  "shortForecast": "Partly Cloudy",
  "temperature": 75,
  "characterization": "moderate"
}
```

> NWS only covers the United States and its territories. Coordinates outside
> that area return a `404`.

## API

### `GET /forecast`

| Query param | Type   | Description                          |
| ----------- | ------ | ------------------------------------ |
| `lat`       | number | Latitude, `-90`..`90`.               |
| `lon`       | number | Longitude, `-180`..`180`.            |

**`200 OK`**

| Field               | Description                                     |
| ------------------- | ----------------------------------------------- |
| `shortForecast`     | Short description for the current period.       |
| `temperature`       | Forecasted temperature (°F).                    |
| `characterization`  | `hot`, `cold`, or `moderate`.                   |

**Errors** are JSON of the form `{ "error": "message" }`:

| Status | When                                                              |
| ------ | ----------------------------------------------------------------- |
| `400`  | Missing, non-numeric, or out-of-range coordinates.                |
| `404`  | NWS has no forecast for those coordinates (e.g. outside the US).  |
| `502`  | NWS unreachable or returned an unusable response.                 |
| `500`  | Unexpected server error.                                          |

## Temperature characterization

Temperatures (°F) are bucketed with simple, exclusive boundaries:

| Characterization | Range            |
| ---------------- | ---------------- |
| `cold`           | `< 50°F`         |
| `moderate`       | `50°F – 80°F`    |
| `hot`            | `> 80°F`         |

## How it works

NWS resolves a forecast in two requests, both handled in `src/nws.ts`:

1. `GET /points/{lat},{lon}` → returns a grid-specific `forecast` URL
   (coordinates are rounded to the 4 decimals NWS requires).
2. `GET {forecast URL}` → returns the forecast periods; we use the first
   (current) period.

## Project structure

```
src/
  index.ts    # entry point — boots the HTTP server
  app.ts      # Express app + route + error mapping (exported for tests)
  nws.ts      # NWS client: getTodayForecast(lat, lon)
  coords.ts   # parseCoords — validation
  temp.ts     # characterizeTemperature
tests/
  app.test.ts     # endpoint behavior (axios stubbed)
  nws.test.ts     # NWS client + error cases (axios stubbed)
  coords.test.ts  # validation
  temp.test.ts    # classification + boundaries
```

## Tests

```bash
npm test          # runs the suite
npm run typecheck # type-checks without emitting
```

Tests use Node's built-in `node:test` runner and `node:assert` (no test
framework dependency), run through `ts-node`. HTTP calls are stubbed with the
runner's built-in `mock`, so the suite is fast and never touches the network.

## Shortcuts & trade-offs

This is a focused exercise, not a production service. Conscious omissions:

- **Generic `User-Agent`.** NWS recommends a descriptive agent identifying the
  app and a contact; this sends `weather-app`. (See the `TODO` in `nws.ts`.)
- **Fahrenheit only.** NWS returns °F by default; Celsius handling isn't
  implemented (`TODO` in `temp.ts`).
- **No caching / retries / timeouts** on the upstream call. A production client
  would add a request timeout and bounded retries for transient failures, and
  could cache forecasts (they change slowly).
- **"Today" = the first period.** Matches NWS's model, but in the evening that
  period is "Tonight"/"Overnight" rather than a daytime forecast.
- **Minimal observability** — errors are logged to the console; no structured
  logging or metrics.
