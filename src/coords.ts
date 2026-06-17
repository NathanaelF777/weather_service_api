export type ParsedCoords =
  | { ok: true; lat: number; lon: number }
  | { ok: false; error: string };

// Parse and validate lat/lon inputs.
export function parseCoords(rawLat: unknown, rawLon: unknown): ParsedCoords {
  if (rawLat == null || rawLat === '' || rawLon == null || rawLon === '') {
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
