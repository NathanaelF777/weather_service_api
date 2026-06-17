export type Characterization = 'hot' | 'cold' | 'moderate';

//Set characterization based on temperature
export function characterizeTemperature(temp: number): Characterization {
  if (temp < 50) return 'cold';
  if (temp > 80) return 'hot';
  return 'moderate';
}

//TODO: add tests for this function
//TODO: add support for Celsius
