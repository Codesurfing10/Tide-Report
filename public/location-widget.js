/**
 * Location Widget - OpenStreetMap Nominatim Autocomplete
 * 
 * A lightweight location input widget that supports:
 * - Free-text place search with autocomplete suggestions
 * - Direct coordinate input (format: "lat, lon")
 * - Emits 'location-selected' custom event with location details
 * 
 * Usage:
 * 1. Include location-widget.css and location-widget.js in your HTML
 * 2. Call createLocationWidget() to initialize
 * 3. Listen for 'location-selected' event on window
 * 
 * Note: This widget uses the free OpenStreetMap Nominatim API which has rate limits.
 * For production/high-traffic applications, consider:
 * - Self-hosting a Nominatim instance
 * - Using a commercial geocoding provider
 * - Implementing additional caching/throttling
 */

(function() {
    'use strict';

    // Debounce utility to limit API calls
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Parse coordinate input (format: "lat, lon")
    function parseCoordinates(text) {
        const coordPattern = /^(-?\d+\.?\d+)\s*,\s*(-?\d+\.?\d+)$/;
        const match = text.trim().match(coordPattern);
        if (match) {
            const lat = parseFloat(match[1]);
            const lon = parseFloat(match[2]);
            if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                return { lat, lon };
            }
        }
        return null;
    }

    // Search location using Nominatim API
    async function searchLocation(query) {
        if (!query || query.trim().length < 2) {
            return [];
        }

        // Validate query input
        const trimmedQuery = query.trim();
        if (trimmedQuery.length > 200) {
            console.warn('Query too long, truncating');
            return [];
        }

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}&limit=5`;
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'TideReport/1.0'
                }
            });
            
            if (!response.ok) {
                console.error('Nominatim API error:', response.status);
                return [];
            }

            const results = await response.json();
            
            // Validate response data
            if (!Array.isArray(results)) {
                console.error('Invalid API response format');
                return [];
            }

            return results;
        } catch (error) {
            console.error('Location search error:', error);
            return [];
        }
    }

    // Create and inject the location widget
    window.createLocationWidget = function(options = {}) {
        const defaults = {
            placeholder: 'Enter location or lat, lon...',
            position: 'top-left'
        };
        const config = { ...defaults, ...options };

        // Create widget container
        const container = document.createElement('div');
        container.className = 'location-widget-container';
        container.id = 'location-widget';

        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'location-widget-input';
        input.placeholder = config.placeholder;
        input.autocomplete = 'off';

        // Create suggestions dropdown
        const suggestions = document.createElement('div');
        suggestions.className = 'location-widget-suggestions';
        suggestions.style.display = 'none';

        // Assemble widget
        container.appendChild(input);
        container.appendChild(suggestions);
        document.body.appendChild(container);

        // Handle location selection
        function selectLocation(location) {
            // Validate location data
            const lat = parseFloat(location.lat);
            const lon = parseFloat(location.lon);
            
            if (isNaN(lat) || isNaN(lon)) {
                console.error('Invalid location coordinates');
                return;
            }
            
            input.value = location.display_name || `${lat}, ${lon}`;
            suggestions.style.display = 'none';
            
            // Emit custom event
            const event = new CustomEvent('location-selected', {
                detail: {
                    display_name: location.display_name || `Coordinates: ${lat}, ${lon}`,
                    lat: lat,
                    lon: lon
                }
            });
            window.dispatchEvent(event);
        }

        // Handle input changes with debounce
        const handleInput = debounce(async function() {
            const query = input.value.trim();
            
            if (!query) {
                suggestions.style.display = 'none';
                return;
            }

            // Check if input is coordinates
            const coords = parseCoordinates(query);
            if (coords) {
                suggestions.innerHTML = '';
                const item = document.createElement('div');
                item.className = 'location-widget-suggestion-item';
                item.textContent = `Use coordinates: ${coords.lat}, ${coords.lon}`;
                item.addEventListener('click', () => selectLocation({
                    lat: coords.lat,
                    lon: coords.lon,
                    display_name: `Coordinates: ${coords.lat}, ${coords.lon}`
                }));
                suggestions.appendChild(item);
                suggestions.style.display = 'block';
                return;
            }

            // Search for location
            const results = await searchLocation(query);
            
            if (results.length === 0) {
                suggestions.style.display = 'none';
                return;
            }

            // Display suggestions
            suggestions.innerHTML = '';
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'location-widget-suggestion-item';
                item.textContent = result.display_name;
                item.addEventListener('click', () => selectLocation(result));
                suggestions.appendChild(item);
            });
            suggestions.style.display = 'block';
        }, 300);

        input.addEventListener('input', handleInput);

        // Close suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                suggestions.style.display = 'none';
            }
        });

        // Handle Enter key
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const firstSuggestion = suggestions.querySelector('.location-widget-suggestion-item');
                if (firstSuggestion) {
                    firstSuggestion.click();
                }
            }
        });

        return container;
    };
})();
