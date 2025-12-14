# Tide-Report

A beautiful tide, weather, and swell report web application with dynamic location support.

## Features

- 🌊 **Tide Predictions**: 7-day tide forecasts from NOAA
- 🌤️ **Weather Data**: Current conditions and 7-day forecast
- 🌊 **Marine Data**: Swell, waves, and ocean temperature
- 📍 **Dynamic Location**: Search any place worldwide or enter coordinates
- 📱 **PWA Support**: Install as a mobile app for offline access

## Location Widget

The app includes a location input widget that allows users to search for any location worldwide:

### Usage

1. Click the location input in the top-left corner
2. Type a city name (e.g., "San Francisco") or coordinates (e.g., "37.7749, -122.4194")
3. Select from autocomplete suggestions
4. Weather and marine data automatically update for the new location

### Features

- Free-text place search with autocomplete
- Direct coordinate input support (format: "lat, lon")
- Uses OpenStreetMap Nominatim (no API key required)
- Mobile responsive design
- Keyboard navigation support

### API Credits

- Weather data: [Open-Meteo](https://open-meteo.com/)
- Marine data: [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api)
- Tide data: [NOAA Tides & Currents](https://tidesandcurrents.noaa.gov/)
- Location search: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)

### Note on Tide Data

Tide predictions currently use a fixed NOAA station (La Jolla, CA). The tide data does not change when selecting different locations via the location widget. Future enhancements could include dynamic NOAA station lookup based on the selected location.

## Development

The application is a static HTML page with no build process required.

### Local Testing

```bash
# Serve the application locally
python3 -m http.server 8080

# Or use any other static file server
npx http-server -p 8080
```

Then open http://localhost:8080 in your browser.

## Deployment

The repository uses GitHub Actions to automatically deploy to GitHub Pages when changes are pushed to the `main` branch. See `.github/workflows/deploy-pages.yml` for details.

## License

This project uses free and open APIs. Please respect their rate limits and terms of service.
