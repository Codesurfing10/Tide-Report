/**
 * Location Widget - Lightweight geocoding widget using OpenStreetMap Nominatim
 * No dependencies, no API key required
 * 
 * Emits 'location-selected' CustomEvent on window with detail: { display_name, lat, lon }
 */

(function() {
    'use strict';

    // Configuration
    const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
    const DEBOUNCE_DELAY = 300; // ms
    const MIN_QUERY_LENGTH = 2;

    class LocationWidget {
        constructor(containerId = 'location-widget') {
            this.container = document.getElementById(containerId);
            if (!this.container) {
                console.error('Location widget container not found:', containerId);
                return;
            }

            this.input = null;
            this.suggestionsContainer = null;
            this.debounceTimer = null;
            this.currentQuery = '';
            
            this.init();
        }

        init() {
            this.render();
            this.attachEventListeners();
        }

        render() {
            this.container.className = 'location-widget-container';
            this.container.innerHTML = `
                <input 
                    type="text" 
                    class="location-widget-input" 
                    placeholder="Enter city or coordinates (lat, lon)"
                    autocomplete="off"
                    spellcheck="false"
                />
                <div class="location-widget-suggestions"></div>
            `;

            this.input = this.container.querySelector('.location-widget-input');
            this.suggestionsContainer = this.container.querySelector('.location-widget-suggestions');
        }

        attachEventListeners() {
            // Input event with debouncing
            this.input.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                
                clearTimeout(this.debounceTimer);
                
                if (query.length < MIN_QUERY_LENGTH) {
                    this.hideSuggestions();
                    return;
                }

                this.debounceTimer = setTimeout(() => {
                    this.handleSearch(query);
                }, DEBOUNCE_DELAY);
            });

            // Close suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.container.contains(e.target)) {
                    this.hideSuggestions();
                }
            });

            // Handle keyboard navigation
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.hideSuggestions();
                }
            });
        }

        async handleSearch(query) {
            this.currentQuery = query;

            // Check if input looks like coordinates (lat, lon)
            const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
            const coordMatch = query.match(coordPattern);

            if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lon = parseFloat(coordMatch[2]);

                // Validate coordinate ranges
                if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    this.showSuggestions([{
                        display_name: `Coordinates: ${lat}, ${lon}`,
                        lat: lat.toString(),
                        lon: lon.toString()
                    }]);
                    return;
                }
            }

            // Perform geocoding search
            try {
                this.showLoading();
                const results = await this.geocode(query);
                
                // Only show results if this is still the current query
                if (query === this.currentQuery) {
                    if (results && results.length > 0) {
                        this.showSuggestions(results);
                    } else {
                        this.showError('No locations found');
                    }
                }
            } catch (error) {
                console.error('Geocoding error:', error);
                if (query === this.currentQuery) {
                    this.showError('Search failed. Please try again.');
                }
            }
        }

        async geocode(query) {
            const params = new URLSearchParams({
                q: query,
                format: 'json',
                limit: '5',
                addressdetails: '1'
            });

            const response = await fetch(`${NOMINATIM_URL}?${params}`, {
                headers: {
                    'User-Agent': 'TideReport/1.0' // Nominatim requires a User-Agent
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        }

        showSuggestions(results) {
            this.suggestionsContainer.innerHTML = '';
            
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'location-widget-suggestion';
                item.textContent = result.display_name;
                
                item.addEventListener('click', () => {
                    this.selectLocation(result);
                });
                
                this.suggestionsContainer.appendChild(item);
            });

            this.suggestionsContainer.classList.add('visible');
        }

        showLoading() {
            this.suggestionsContainer.innerHTML = '<div class="location-widget-loading">Searching...</div>';
            this.suggestionsContainer.classList.add('visible');
        }

        showError(message) {
            this.suggestionsContainer.innerHTML = `<div class="location-widget-error">${message}</div>`;
            this.suggestionsContainer.classList.add('visible');
        }

        hideSuggestions() {
            this.suggestionsContainer.classList.remove('visible');
        }

        selectLocation(location) {
            // Update input field
            this.input.value = location.display_name;
            
            // Hide suggestions
            this.hideSuggestions();
            
            // Emit custom event with location data
            const event = new CustomEvent('location-selected', {
                detail: {
                    display_name: location.display_name,
                    lat: parseFloat(location.lat),
                    lon: parseFloat(location.lon)
                },
                bubbles: true
            });
            
            window.dispatchEvent(event);
            
            console.log('Location selected:', {
                display_name: location.display_name,
                lat: location.lat,
                lon: location.lon
            });
        }
    }

    // Auto-initialize if container exists when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.getElementById('location-widget')) {
                new LocationWidget();
            }
        });
    } else {
        if (document.getElementById('location-widget')) {
            new LocationWidget();
        }
    }

    // Export for manual initialization
    window.LocationWidget = LocationWidget;
})();
