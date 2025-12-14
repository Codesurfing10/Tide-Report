# Tide-Report

A web application for viewing tide predictions, weather, and ocean conditions.

## Features

- Real-time tide predictions from NOAA
- Weather forecasts using Open-Meteo API
- Marine conditions (swell, waves, water temperature)
- **Location Widget**: Search for any place worldwide or enter coordinates directly

## Location Widget

The location widget allows users to search for any place globally using OpenStreetMap Nominatim geocoding.

### Usage

See [examples/add-widget-snippet.html](examples/add-widget-snippet.html) for a complete example.

```html
<!-- Include CSS and JS -->
<link rel="stylesheet" href="public/location-widget.css">
<script src="public/location-widget.js"></script>

<!-- Add container element -->
<div id="location-widget"></div>

<!-- Optional: Configure User-Agent for Nominatim -->
<script>
  window.LOCATION_WIDGET_USER_AGENT = 'YourApp/1.0';
</script>

<!-- Listen for location selection -->
<script>
  window.addEventListener('location-selected', (event) => {
    const { display_name, lat, lon } = event.detail;
    console.log('Selected:', display_name, lat, lon);
    // Update your app with the new location
  });
</script>
```

### Features

- Free-text place search (e.g., "San Francisco", "London")
- Direct coordinate input (e.g., "37.7749, -122.4194")
- Autocomplete suggestions
- No API key required
- No external dependencies
- Mobile-responsive

### Notes

- Nominatim has rate limits (1 request/second)
- For production use with high traffic, consider a paid geocoding service or self-hosting Nominatim
