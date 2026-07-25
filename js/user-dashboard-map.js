/**
 * GIS User Dashboard - Map-centric, all modules as layers on one map.
 * No fake data: results show "—" until API returns real values.
 * Easy to bind: result element IDs match what backend can populate.
 */

(function () {
    'use strict';

    // ----- Config: use real defaults for dev (GEE needs dates) -----
    var defaultStart = new Date();
    defaultStart.setMonth(defaultStart.getMonth() - 1);
    var defaultEnd = new Date();
    var formatDate = function (d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    };

    // ----- State -----
    var map = null;
    var drawnLayer = null;
    var boundaryLayer = null;
    var currentDrawMode = null;
    var rectangle = null;
    var circle = null;
    var polygon = null;
    var areaMode = 'boundary';

    // ----- DOM -----
    var mapEl = document.getElementById('map');
    var mapWrap = document.getElementById('mapWrap');
    var panelLayers = document.getElementById('panelLayers');
    var panelResults = document.getElementById('panelResults');
    var resultsPlaceholder = document.getElementById('resultsPlaceholder');
    var resultsContent = document.getElementById('resultsContent');
    var layerList = document.getElementById('layerList');
    var btnToggleLayers = document.getElementById('btnToggleLayers');
    var btnCloseLayers = document.getElementById('btnCloseLayers');
    var btnToggleResults = document.getElementById('btnToggleResults');
    var btnCloseResults = document.getElementById('btnCloseResults');
    var btnRunAnalysis = document.getElementById('btnRunAnalysis');
    var btnSelect = document.getElementById('btnSelect');
    var btnDrawPolygon = document.getElementById('btnDrawPolygon');
    var btnDrawRect = document.getElementById('btnDrawRect');
    var btnDrawCircle = document.getElementById('btnDrawCircle');
    var btnClearDraw = document.getElementById('btnClearDraw');
    var tabBoundary = document.getElementById('tabBoundary');
    var tabCustom = document.getElementById('tabCustom');
    var areaBlockBoundary = document.getElementById('areaBlockBoundary');
    var areaBlockCustom = document.getElementById('areaBlockCustom');
    var selectDistrict = document.getElementById('selectDistrict');
    var selectTehsil = document.getElementById('selectTehsil');
    var selectVillage = document.getElementById('selectVillage');
    var btnApplyBoundary = document.getElementById('btnApplyBoundary');
    var inputBoundaryFile = document.getElementById('inputBoundaryFile');
    var btnUploadBoundary = document.getElementById('btnUploadBoundary');
    var inputBoundaryName = document.getElementById('inputBoundaryName');
    var btnSaveCustomBoundary = document.getElementById('btnSaveCustomBoundary');
    var dateStart = document.getElementById('dateStart');
    var dateEnd = document.getElementById('dateEnd');
    var mapScale = document.getElementById('mapScale');
    var mapCoords = document.getElementById('mapCoords');

    // ----- Map init -----
    function initMap() {
        if (!mapEl) return;
        // Default: Sambhajinagar; can be overridden by company/city from backend
        map = L.map('map', {
            center: [19.8762, 75.3433],
            zoom: 12,
            zoomControl: false
        });
        L.control.zoom({ position: 'topright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19
        }).addTo(map);

        drawnLayer = L.layerGroup().addTo(map);
        boundaryLayer = L.layerGroup().addTo(map);

        map.on('moveend', updateScale);
        map.on('mousemove', updateCoords);
        updateScale();
    }

    function updateScale() {
        if (!map || !mapScale) return;
        var zoom = map.getZoom();
        mapScale.textContent = 'Zoom: ' + zoom;
    }

    function updateCoords(e) {
        if (!mapCoords || !e.latlng) return;
        mapCoords.textContent = e.latlng.lat.toFixed(5) + ', ' + e.latlng.lng.toFixed(5);
    }

    // ----- Panels: close = panel slides off, map expands -----
    if (btnToggleLayers && panelLayers && mapWrap) {
        btnToggleLayers.addEventListener('click', function () {
            panelLayers.classList.toggle('closed');
            mapWrap.classList.toggle('panel-layers-closed', panelLayers.classList.contains('closed'));
        });
    }
    if (btnCloseLayers && panelLayers && mapWrap) {
        btnCloseLayers.addEventListener('click', function () {
            panelLayers.classList.add('closed');
            mapWrap.classList.add('panel-layers-closed');
        });
    }
    if (btnToggleResults && panelResults && mapWrap) {
        btnToggleResults.addEventListener('click', function () {
            panelResults.classList.remove('closed');
            mapWrap.classList.remove('panel-results-closed');
            if (btnToggleResults) btnToggleResults.classList.remove('show');
        });
    }
    if (btnCloseResults && panelResults && mapWrap) {
        btnCloseResults.addEventListener('click', function () {
            panelResults.classList.add('closed');
            mapWrap.classList.add('panel-results-closed');
            if (btnToggleResults) btnToggleResults.classList.add('show');
        });
    }

    // ----- Default dates (for API: GEE filter) -----
    if (dateStart) dateStart.value = formatDate(defaultStart);
    if (dateEnd) dateEnd.value = formatDate(defaultEnd);

    // ----- Choose area: tabs (Boundary vs Custom / Field) -----
    function setAreaMode(mode) {
        areaMode = mode;
        if (tabBoundary) tabBoundary.classList.toggle('active', mode === 'boundary');
        if (tabCustom) tabCustom.classList.toggle('active', mode === 'custom');
        if (areaBlockBoundary) areaBlockBoundary.classList.toggle('d-none', mode !== 'boundary');
        if (areaBlockCustom) areaBlockCustom.classList.toggle('d-none', mode !== 'custom');
    }
    if (tabBoundary) tabBoundary.addEventListener('click', function () { setAreaMode('boundary'); });
    if (tabCustom) tabCustom.addEventListener('click', function () { setAreaMode('custom'); });

    // ----- Boundaries: District → Tehsil → Village (placeholder options; replace with API) -----
    var tehsilsByDistrict = {
        1: [{ id: 101, name: 'Sambhajinagar Tehsil' }, { id: 102, name: 'Kannad' }, { id: 103, name: 'Soegaon' }],
        2: [{ id: 201, name: 'Bhopal Tehsil' }, { id: 202, name: 'Huzur' }, { id: 203, name: 'Berasia' }],
        3: [{ id: 301, name: 'Jabalpur Tehsil' }, { id: 302, name: 'Sihora' }, { id: 303, name: 'Patan' }]
    };
    var villagesByTehsil = {
        101: [{ id: 1001, name: 'Village A' }, { id: 1002, name: 'Village B' }],
        102: [{ id: 1003, name: 'Village C' }, { id: 1004, name: 'Village D' }],
        103: [{ id: 1005, name: 'Village E' }],
        201: [{ id: 2001, name: 'Village X' }, { id: 2002, name: 'Village Y' }],
        202: [{ id: 2003, name: 'Village Z' }],
        301: [{ id: 3001, name: 'Village P' }, { id: 3002, name: 'Village Q' }]
    };
    function loadTehsils(districtId) {
        if (!selectTehsil) return;
        selectTehsil.innerHTML = '<option value="">-- Select Tehsil --</option>';
        selectTehsil.disabled = !districtId;
        if (selectVillage) { selectVillage.innerHTML = '<option value="">-- Select Village --</option>'; selectVillage.disabled = true; }
        if (!districtId) return;
        var list = tehsilsByDistrict[districtId] || [];
        list.forEach(function (t) {
            var opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            selectTehsil.appendChild(opt);
        });
    }
    function loadVillages(tehsilId) {
        if (!selectVillage) return;
        selectVillage.innerHTML = '<option value="">-- Select Village --</option>';
        selectVillage.disabled = !tehsilId;
        if (!tehsilId) return;
        var list = villagesByTehsil[tehsilId] || [];
        list.forEach(function (v) {
            var opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = v.name;
            selectVillage.appendChild(opt);
        });
    }
    if (selectDistrict) selectDistrict.addEventListener('change', function () { loadTehsils(this.value); });
    if (selectTehsil) selectTehsil.addEventListener('change', function () { loadVillages(this.value); });

    // Apply boundary on map: fetch geometry from API or show placeholder
    function applyBoundaryOnMap() {
        var districtId = selectDistrict && selectDistrict.value;
        var tehsilId = selectTehsil && selectTehsil.value;
        var villageId = selectVillage && selectVillage.value;
        if (!districtId) {
            if (typeof alert !== 'undefined') alert('Please select a district.');
            return;
        }
        if (boundaryLayer) boundaryLayer.clearLayers();
        // When API is ready: GET /userpanel/boundaries/geometry/district|tehsil|village/:id and add GeoJSON to boundaryLayer
        var type = villageId ? 'village' : (tehsilId ? 'tehsil' : 'district');
        var id = villageId || tehsilId || districtId;
        // Placeholder: show a simple rectangle; replace with: fetch('/userpanel/boundaries/geometry/' + type + '/' + id).then(r=>r.json()).then(geojson => L.geoJSON(geojson).addTo(boundaryLayer))
        var center = [[19.8762, 75.3433], [23.2599, 77.4126], [23.1815, 79.9865]][Number(districtId) - 1] || [19.8762, 75.3433];
        var bounds = L.latLng(center).toBounds(8000);
        var rect = L.rectangle(bounds, { color: '#58a6ff', weight: 2, fillOpacity: 0.1 });
        rect.addTo(boundaryLayer);
        if (map) map.fitBounds(bounds, { padding: [20, 20] });
    }
    if (btnApplyBoundary) btnApplyBoundary.addEventListener('click', applyBoundaryOnMap);

    // Upload boundary file (GeoJSON/KML) and show on map
    function handleBoundaryFile(file) {
        if (!file || !drawnLayer || !map) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var text = e.target.result;
                var geojson = null;
                if (file.name.toLowerCase().endsWith('.kml') || file.name.toLowerCase().endsWith('.kmz')) {
                    // Simple KML: look for <coordinates>; for full KML use a parser library
                    var coordMatch = text.match(/<coordinates>([^<]+)<\/coordinates>/);
                    if (coordMatch) {
                        var parts = coordMatch[1].trim().split(/[\s,]+/).filter(Boolean);
                        var coords = [];
                        for (var i = 0; i < parts.length; i += 2) {
                            if (parts[i + 1]) coords.push([parseFloat(parts[i + 1]), parseFloat(parts[i])]);
                        }
                        if (coords.length >= 3) {
                            coords.push(coords[0]);
                            geojson = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } };
                        }
                    }
                } else {
                    geojson = JSON.parse(text);
                }
                if (geojson && drawnLayer) {
                    drawnLayer.clearLayers();
                    var layer = L.geoJSON(geojson, { style: { color: '#238636', weight: 2, fillOpacity: 0.2 } }).addTo(drawnLayer);
                    if (layer.getBounds) map.fitBounds(layer.getBounds(), { padding: [20, 20] });
                }
            } catch (err) {
                if (typeof alert !== 'undefined') alert('Could not read file. Use valid GeoJSON or KML.');
            }
        };
        reader.readAsText(file);
    }
    if (inputBoundaryFile) inputBoundaryFile.addEventListener('change', function () { if (this.files[0]) handleBoundaryFile(this.files[0]); });
    if (btnUploadBoundary) btnUploadBoundary.addEventListener('click', function () { if (inputBoundaryFile && inputBoundaryFile.files[0]) handleBoundaryFile(inputBoundaryFile.files[0]); });

    // Save custom boundary (name + current drawn/uploaded geometry) — API: POST /userpanel/boundaries/custom
    function saveCustomBoundary() {
        var name = inputBoundaryName && inputBoundaryName.value.trim();
        if (!name) {
            if (typeof alert !== 'undefined') alert('Enter a name for the boundary (e.g. My Farm).');
            return;
        }
        var geo = getSelectedGeoJSON();
        if (!geo) {
            if (typeof alert !== 'undefined') alert('Draw an area on the map or upload a file first.');
            return;
        }
        // When API ready: fetch('/userpanel/boundaries/custom', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ boundary_name: name, boundary_geojson: geo }) })
        if (typeof console !== 'undefined') console.log('Save custom boundary:', name, geo);
        if (typeof alert !== 'undefined') alert('Boundary "' + name + '" ready to save. Connect API: POST /userpanel/boundaries/custom');
    }
    if (btnSaveCustomBoundary) btnSaveCustomBoundary.addEventListener('click', saveCustomBoundary);

    // ----- Draw tools -----
    function setDrawMode(mode) {
        currentDrawMode = mode;
        [btnSelect, btnDrawPolygon, btnDrawRect, btnDrawCircle].forEach(function (btn) {
            if (btn) btn.classList.toggle('active', btn.id === 'btn' + mode);
        });
        if (map) {
            map.dragging.enable();
            map.removeLayer(rectangle);
            map.removeLayer(circle);
            map.removeLayer(polygon);
            rectangle = circle = polygon = null;
        }
    }

    function clearDrawn() {
        drawnLayer.clearLayers();
        rectangle = null;
        circle = null;
        polygon = null;
        setDrawMode('Select');
    }

    if (btnSelect) btnSelect.addEventListener('click', function () { setDrawMode('Select'); });
    if (btnDrawPolygon) btnDrawPolygon.addEventListener('click', function () { setDrawMode('DrawPolygon'); });
    if (btnDrawRect) btnDrawRect.addEventListener('click', function () { setDrawMode('DrawRect'); });
    if (btnDrawCircle) btnDrawCircle.addEventListener('click', function () { setDrawMode('DrawCircle'); });
    if (btnClearDraw) btnClearDraw.addEventListener('click', clearDrawn);

    // Selected area: from drawn layer, or boundary layer (when "From boundaries" was applied), or map bounds
    function getSelectedBounds() {
        if (rectangle && rectangle.getBounds) return rectangle.getBounds();
        if (circle && circle.getBounds) return circle.getBounds();
        if (polygon && polygon.getBounds) return polygon.getBounds();
        if (boundaryLayer && boundaryLayer.getBounds && boundaryLayer.getBounds().isValid()) return boundaryLayer.getBounds();
        return map ? map.getBounds() : null;
    }

    function getSelectedGeoJSON() {
        var bounds = getSelectedBounds();
        if (!bounds) return null;
        var ne = bounds.getNorthEast();
        var sw = bounds.getSouthWest();
        return {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [sw.lng, sw.lat], [ne.lng, sw.lat], [ne.lng, ne.lat], [sw.lng, ne.lat], [sw.lng, sw.lat]
                ]]
            }
        };
    }

    // ----- Layers: which are on (for API) -----
    function getActiveLayers() {
        var active = [];
        if (!layerList) return active;
        layerList.querySelectorAll('.gis-layer-check:checked').forEach(function (cb) {
            active.push(cb.getAttribute('data-layer'));
        });
        return active;
    }

    // ----- Run Analysis: show results panel with placeholders only -----
    function runAnalysis() {
        var start = dateStart && dateStart.value ? dateStart.value : formatDate(defaultStart);
        var end = dateEnd && dateEnd.value ? dateEnd.value : formatDate(defaultEnd);
        var layers = getActiveLayers();
        var bounds = map ? getSelectedBounds() : null;

        // Show results panel
        if (resultsPlaceholder) resultsPlaceholder.classList.add('d-none');
        if (resultsContent) resultsContent.classList.remove('d-none');

        // Hide all layer-specific rows, then show only active
        var rowMap = {
            'ndvi': 'gis-result-ndvi',
            'air-quality': 'gis-result-air',
            'water-body': 'gis-result-water',
            'urban-change': 'gis-result-urban',
            'flood': 'gis-result-flood',
            'heat-island': 'gis-result-lst',
            'solar': 'gis-result-solar',
            'dumping': 'gis-result-dumping'
        };
        Object.keys(rowMap).forEach(function (k) {
            var el = document.querySelector('.' + rowMap[k]);
            if (el) el.classList.add('d-none');
        });
        layers.forEach(function (id) {
            var cls = rowMap[id];
            if (cls) {
                var el = document.querySelector('.' + cls);
                if (el) el.classList.remove('d-none');
            }
        });

        // Set placeholder values: no fake data. API will replace these.
        setResult('resultArea', bounds ? '—' : '—');
        setResult('resultDateRange', start + ' to ' + end);
        setResult('resultNDVI', '—');
        setResult('resultNO2', '—');
        setResult('resultWaterArea', '—');
        setResult('resultUrbanChange', '—');
        setResult('resultFlood', '—');
        setResult('resultLST', '—');
        setResult('resultSolar', '—');
        setResult('resultDumping', '—');

        // Example API call (comment out until backend ready):
        // fetch('/api/gis/analyze', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     startDate: start,
        //     endDate: end,
        //     layers: layers,
        //     geometry: getSelectedGeoJSON()
        //   })
        // }).then(function(r) { return r.json(); }).then(function(data) {
        //   if (data.area_km2 != null) setResult('resultArea', data.area_km2);
        //   if (data.ndvi_mean != null) setResult('resultNDVI', data.ndvi_mean);
        //   ...
        // });
    }

    function setResult(id, value) {
        var el = document.getElementById(id);
        if (!el) return;
        el.textContent = value;
        el.classList.toggle('empty', value === '—' || value === '');
    }

    if (btnRunAnalysis) btnRunAnalysis.addEventListener('click', runAnalysis);

    // ----- Init -----
    function onReady() {
        initMap();
        if (window.innerWidth < 993) {
            if (panelLayers) panelLayers.classList.add('closed');
            if (panelResults) panelResults.classList.add('closed');
            if (mapWrap) mapWrap.classList.add('panel-layers-closed', 'panel-results-closed');
            if (btnToggleResults) btnToggleResults.classList.add('show');
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onReady);
    } else {
        onReady();
    }
})();
