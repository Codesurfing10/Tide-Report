/* Location widget using OpenStreetMap Nominatim (no API key).
   - Autocomplete for free-text places
   - Accepts "lat, lon" input directly
   - Emits a CustomEvent 'location-selected' on window with detail {display_name, lat, lon}
   - Usage: include this script and call createLocationWidget({ containerId: 'location-root' })
*/

(function () {
  const NominatimURL = (q) =>
    `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`;

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function parseLatLon(text) {
    const m = text.trim().match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
    if (!m) return null;
    return { lat: m[1], lon: m[3] };
  }

  function createLocationWidget({ containerId = null, placeholder = 'Enter a place or "lat, lon"' } = {}) {
    const container = containerId ? document.getElementById(containerId) : document.body;
    if (!container) {
      console.warn('Location widget: container not found:', containerId);
      return;
    }

    // Root element (keeps UI isolated if repo already has CSS)
    const root = document.createElement('div');
    root.id = 'location-widget';
    root.innerHTML = `
      <div class="lw-inner">
        <input class="lw-input" type="text" placeholder="${placeholder}" aria-label="Location input" />
        <ul class="lw-suggestions" role="listbox" hidden></ul>
        <div class="lw-hint">Tip: type a city, region, or coordinates (lat, lon)</div>
      </div>
    `;
    container.appendChild(root);

    const input = root.querySelector('.lw-input');
    const sugg = root.querySelector('.lw-suggestions');

    function showSuggestions(list) {
      if (!list || list.length === 0) {
        sugg.hidden = true;
        sugg.innerHTML = '';
        return;
      }
      sugg.hidden = false;
      sugg.innerHTML = list
        .map((item, i) => `<li role="option" data-idx="${i}" data-lat="${item.lat}" data-lon="${item.lon}">${item.display_name}</li>`)
        .join('');
    }

    function selectSuggestion(li) {
      const display = li.textContent;
      const lat = li.dataset.lat;
      const lon = li.dataset.lon;
      input.value = display;
      sugg.hidden = true;
      dispatchSelected({ display_name: display, lat, lon });
    }

    function dispatchSelected(detail) {
      // Notify host app
      const ev = new CustomEvent('location-selected', { detail });
      window.dispatchEvent(ev);
    }

    sugg.addEventListener('click', (ev) => {
      const li = ev.target.closest('li');
      if (!li) return;
      selectSuggestion(li);
    });

    // keyboard support
    let selectedIndex = -1;
    input.addEventListener('keydown', (ev) => {
      const items = sugg.querySelectorAll('li');
      if (sugg.hidden || items.length === 0) return;
      if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateActive(items);
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateActive(items);
      } else if (ev.key === 'Enter') {
        ev.preventDefault();
        if (selectedIndex >= 0 && items[selectedIndex]) {
          selectSuggestion(items[selectedIndex]);
        } else {
          // If no selection, try to interpret input as lat,lon
          checkDirectLatLon(input.value);
        }
      } else if (ev.key === 'Escape') {
        sugg.hidden = true;
      }
    });

    function updateActive(items) {
      items.forEach((it, idx) => {
        it.classList.toggle('active', idx === selectedIndex);
      });
      if (items[selectedIndex]) items[selectedIndex].scrollIntoView({ block: 'nearest' });
    }

    function checkDirectLatLon(text) {
      const coords = parseLatLon(text);
      if (coords) {
        // no display_name for raw coords
        dispatchSelected({ display_name: `${coords.lat}, ${coords.lon}`, lat: coords.lat, lon: coords.lon });
      }
    }

    const doSearch = debounce(async () => {
      const text = input.value.trim();
      if (!text) {
        showSuggestions([]);
        return;
      }

      const coords = parseLatLon(text);
      if (coords) {
        // If typed coordinates, treat as immediate selection suggestion
        showSuggestions([
          { display_name: `${coords.lat}, ${coords.lon}`, lat: coords.lat, lon: coords.lon },
        ]);
        selectedIndex = 0;
        return;
      }

      try {
        // Nominatim free endpoint (no API key). Keep queries light / debounced.
        const resp = await fetch(NominatimURL(text), {
          headers: { 'Accept-Language': navigator.language || 'en' },
        });
        if (!resp.ok) {
          showSuggestions([]);
          return;
        }
        const results = await resp.json();
        const mapped = results.map((r) => ({ display_name: r.display_name, lat: r.lat, lon: r.lon }));
        showSuggestions(mapped);
        selectedIndex = -1;
      } catch (err) {
        console.warn('Location widget search failed', err);
        showSuggestions([]);
      }
    }, 350);

    input.addEventListener('input', () => {
      doSearch();
    });

    // close suggestions on outside click
    document.addEventListener('click', (ev) => {
      if (!root.contains(ev.target)) {
        sugg.hidden = true;
      }
    });

    return {
      root,
      input,
      focus: () => input.focus(),
      getValue: () => input.value,
    };
  }

  // Export to global namespace
  window.createLocationWidget = createLocationWidget;
})();
