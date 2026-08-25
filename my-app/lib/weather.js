/**
 * weather.js
 *
 * React Native (Expo) helper that:
 *  1. Requests location permission and gets an approximate GPS position
 *     using `expo-location`.
 *  2. Queries wttr.in (https://github.com/chubin/wttr.in) with those
 *     coordinates in JSON format.
 *  3. Returns a small, clean object with just the fields you asked for:
 *     area name, temperature, wind speed, humidity, and a weather summary.
 *
 * Requirements:
 *   expo install expo-location
 *
 * Usage:
 *   import { getWeather } from './weather';
 *
 *   const data = await getWeather();
 *   // {
 *   //   area: "Accra",
 *   //   temperatureC: 29,
 *   //   windSpeedKmph: 14,
 *   //   humidity: 78,
 *   //   summary: "Partly cloudy"
 *   // }
 */

import * as Location from 'expo-location';

/**
 * Requests foreground location permission and returns the device's
 * approximate coordinates.
 *
 * @returns {Promise<{ latitude: number, longitude: number }>}
 */
async function getApproximateLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Location permission was not granted.');
  }

  // Balanced accuracy is enough for a weather lookup and is
  // faster / more battery-friendly than high accuracy.
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

/**
 * Fetches weather data from wttr.in for the given coordinates and
 * extracts only the fields we care about.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{
 *   area: string,
 *   temperatureC: number,
 *   windSpeedKmph: number,
 *   humidity: number,
 *   summary: string
 * }>}
 */
async function fetchWeatherByCoords(latitude, longitude) {
  // wttr.in accepts "lat,lon" as the location and ?format=j1 for
  // full JSON output.
  const url = `https://wttr.in/${latitude},${longitude}?format=j1`;

  const response = await fetch(url, {
    headers: {
      // wttr.in sometimes tailors output based on User-Agent;
      // a plain UA keeps the response consistent/parseable.
      'User-Agent': 'curl',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`wttr.in request failed with status ${response.status}`);
  }

  const data = await response.json();

  const current = data?.current_condition?.[0];
  if (!current) {
    throw new Error('Unexpected response shape from wttr.in.');
  }

  // Area name: wttr.in usually echoes back a nearby area name,
  // falling back to the request query if unavailable.
  const area =
    data?.nearest_area?.[0]?.areaName?.[0]?.value ??
    data?.nearest_area?.[0]?.region?.[0]?.value ??
    'Unknown area';

  return {
    area,
    temperatureC: Number(current.temp_C),
    windSpeedKmph: Number(current.windspeedKmph),
    humidity: Number(current.humidity),
    summary: current?.weatherDesc?.[0]?.value ?? 'Unknown',
  };
}

/**
 * Convenience wrapper: gets the device's approximate location, then
 * fetches and returns the trimmed-down weather object.
 *
 * @returns {Promise<{
 *   area: string,
 *   temperatureC: number,
 *   windSpeedKmph: number,
 *   humidity: number,
 *   summary: string
 * }>}
 */
export async function getWeather() {
  const { latitude, longitude } = await getApproximateLocation();
  return fetchWeatherByCoords(latitude, longitude);
}

export { getApproximateLocation, fetchWeatherByCoords };