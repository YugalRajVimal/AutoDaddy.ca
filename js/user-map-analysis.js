/**
 * Map & Analysis - Full UI: map, boundary, layers, Run Analysis → results with charts and full details
 */
(function () {
    'use strict';

    var defaultStart = new Date();
    defaultStart.setMonth(defaultStart.getMonth() - 1);
    var defaultEnd = new Date();
    function formatDate(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    var map = null, drawnLayer = null, boundaryLayer = null;
    var rectangle = null, circle = null, polygon = null;
    var chartNDVI = null, chartIndices = null;

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

    function initMap() {
        if (!mapEl) return;
        map = L.map('map', { center: [19.8762, 75.3433], zoom: 12, zoomControl: false });
        L.control.zoom({ position: 'topright' }).addTo(map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM', maxZoom: 19 }).addTo(map);
        drawnLayer = L.layerGroup().addTo(map);
        boundaryLayer = L.layerGroup().addTo(map);
        map.on('moveend', function () { if (mapScale) mapScale.textContent = 'Zoom: ' + map.getZoom(); });
        map.on('mousemove', function (e) { if (mapCoords && e.latlng) mapCoords.textContent = e.latlng.lat.toFixed(5) + ', ' + e.latlng.lng.toFixed(5); });
        if (mapScale) mapScale.textContent = 'Zoom: ' + map.getZoom();
    }

    if (dateStart) dateStart.value = formatDate(defaultStart);
    if (dateEnd) dateEnd.value = formatDate(defaultEnd);

    function setAreaMode(mode) {
        if (tabBoundary) tabBoundary.classList.toggle('active', mode === 'boundary');
        if (tabCustom) tabCustom.classList.toggle('active', mode === 'custom');
        if (areaBlockBoundary) areaBlockBoundary.classList.toggle('d-none', mode !== 'boundary');
        if (areaBlockCustom) areaBlockCustom.classList.toggle('d-none', mode !== 'custom');
    }
    if (tabBoundary) tabBoundary.addEventListener('click', function () { setAreaMode('boundary'); });
    if (tabCustom) tabCustom.addEventListener('click', function () { setAreaMode('custom'); });

    var tehsilsByDistrict = { 1: [{ id: 101, name: 'Sambhajinagar Tehsil' }, { id: 102, name: 'Kannad' }], 2: [{ id: 201, name: 'Bhopal Tehsil' }], 3: [{ id: 301, name: 'Jabalpur Tehsil' }] };
    var villagesByTehsil = { 101: [{ id: 1001, name: 'Village A' }, { id: 1002, name: 'Village B' }], 102: [{ id: 1003, name: 'Village C' }], 201: [{ id: 2001, name: 'Village X' }], 301: [{ id: 3001, name: 'Village P' }] };
    function loadTehsils(districtId) {
        if (!selectTehsil) return;
        selectTehsil.innerHTML = '<option value="">-- Select --</option>';
        selectTehsil.disabled = !districtId;
        if (selectVillage) { selectVillage.innerHTML = '<option value="">-- Select --</option>'; selectVillage.disabled = true; }
        if (!districtId) return;
        (tehsilsByDistrict[districtId] || []).forEach(function (t) {
            var o = document.createElement('option'); o.value = t.id; o.textContent = t.name; selectTehsil.appendChild(o);
        });
    }
    function loadVillages(tehsilId) {
        if (!selectVillage) return;
        selectVillage.innerHTML = '<option value="">-- Select --</option>';
        selectVillage.disabled = !tehsilId;
        if (!tehsilId) return;
        (villagesByTehsil[tehsilId] || []).forEach(function (v) {
            var o = document.createElement('option'); o.value = v.id; o.textContent = v.name; selectVillage.appendChild(o);
        });
    }
    if (selectDistrict) selectDistrict.addEventListener('change', function () { loadTehsils(this.value); });
    if (selectTehsil) selectTehsil.addEventListener('change', function () { loadVillages(this.value); });

    function applyBoundaryOnMap() {
        var districtId = selectDistrict && selectDistrict.value;
        if (!districtId) { alert('Select a district.'); return; }
        if (boundaryLayer) boundaryLayer.clearLayers();
        var centers = [[19.8762, 75.3433], [23.2599, 77.4126], [23.1815, 79.9865]];
        var center = centers[Number(districtId) - 1] || [19.8762, 75.3433];
        var bounds = L.latLng(center).toBounds(8000);
        var rect = L.rectangle(bounds, { color: '#58a6ff', weight: 2, fillOpacity: 0.1 });
        rect.addTo(boundaryLayer);
        if (map) map.fitBounds(bounds, { padding: [20, 20] });
    }
    if (btnApplyBoundary) btnApplyBoundary.addEventListener('click', applyBoundaryOnMap);

    function handleBoundaryFile(file) {
        if (!file || !drawnLayer || !map) return;
        var reader = new FileReader();
        reader.onload = function (e) {
            try {
                var text = e.target.result;
                var geojson = null;
                if (file.name.toLowerCase().endsWith('.kml') || file.name.toLowerCase().endsWith('.kmz')) {
                    var m = text.match(/<coordinates>([^<]+)<\/coordinates>/);
                    if (m) {
                        var parts = m[1].trim().split(/[\s,]+/).filter(Boolean);
                        var coords = [];
                        for (var i = 0; i < parts.length; i += 2) { if (parts[i + 1]) coords.push([parseFloat(parts[i + 1]), parseFloat(parts[i])]); }
                        if (coords.length >= 3) { coords.push(coords[0]); geojson = { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] } }; }
                    }
                } else { geojson = JSON.parse(text); }
                if (geojson && drawnLayer) {
                    drawnLayer.clearLayers();
                    var layer = L.geoJSON(geojson, { style: { color: '#238636', weight: 2, fillOpacity: 0.2 } }).addTo(drawnLayer);
                    if (layer.getBounds) map.fitBounds(layer.getBounds(), { padding: [20, 20] });
                }
            } catch (err) { alert('Could not read file.'); }
        };
        reader.readAsText(file);
    }
    if (inputBoundaryFile) inputBoundaryFile.addEventListener('change', function () { if (this.files[0]) handleBoundaryFile(this.files[0]); });
    if (btnUploadBoundary) btnUploadBoundary.addEventListener('click', function () { if (inputBoundaryFile && inputBoundaryFile.files[0]) handleBoundaryFile(inputBoundaryFile.files[0]); });

    function getSelectedBounds() {
        if (rectangle && rectangle.getBounds) return rectangle.getBounds();
        if (circle && circle.getBounds) return circle.getBounds();
        if (polygon && polygon.getBounds) return polygon.getBounds();
        if (boundaryLayer && boundaryLayer.getBounds && boundaryLayer.getBounds().isValid()) return boundaryLayer.getBounds();
        return map ? map.getBounds() : null;
    }

    if (btnSaveCustomBoundary) btnSaveCustomBoundary.addEventListener('click', function () {
        var name = inputBoundaryName && inputBoundaryName.value.trim();
        if (!name) { alert('Enter a name.'); return; }
        alert('Boundary "' + name + '" ready to save. Connect API: POST /userpanel/boundaries/custom');
    });

    function setDrawMode(mode) {
        [btnSelect, btnDrawPolygon, btnDrawRect, btnDrawCircle].forEach(function (btn) {
            if (btn) btn.classList.toggle('active', btn.id === 'btn' + mode);
        });
        if (map) {
            map.dragging.enable();
            if (rectangle) map.removeLayer(rectangle);
            if (circle) map.removeLayer(circle);
            if (polygon) map.removeLayer(polygon);
            rectangle = circle = polygon = null;
        }
    }
    function clearDrawn() { if (drawnLayer) drawnLayer.clearLayers(); rectangle = circle = polygon = null; setDrawMode('Select'); }
    if (btnSelect) btnSelect.addEventListener('click', function () { setDrawMode('Select'); });
    if (btnDrawPolygon) btnDrawPolygon.addEventListener('click', function () { setDrawMode('DrawPolygon'); });
    if (btnDrawRect) btnDrawRect.addEventListener('click', function () { setDrawMode('DrawRect'); });
    if (btnDrawCircle) btnDrawCircle.addEventListener('click', function () { setDrawMode('DrawCircle'); });
    if (btnClearDraw) btnClearDraw.addEventListener('click', clearDrawn);

    function getActiveLayers() {
        var active = [];
        if (layerList) layerList.querySelectorAll('.gis-layer-check:checked').forEach(function (cb) { active.push(cb.getAttribute('data-layer')); });
        return active;
    }

    function setEl(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function initCharts(start, end) {
        var labels = [];
        var d = new Date(start);
        var endD = new Date(end);
        while (d <= endD) {
            labels.push(d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));
            d.setDate(d.getDate() + 7);
        }
        if (labels.length === 0) labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        var ctxNDVI = document.getElementById('chartNDVI');
        if (ctxNDVI && typeof Chart !== 'undefined') {
            if (chartNDVI) chartNDVI.destroy();
            chartNDVI = new Chart(ctxNDVI.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'NDVI',
                        data: [0.52, 0.58, 0.64, 0.68, 0.71, 0.69],
                        borderColor: '#3fb950',
                        backgroundColor: 'rgba(63, 185, 80, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { min: 0, max: 1, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#8b949e' } },
                        x: { grid: { display: false }, ticks: { color: '#8b949e', maxTicksLimit: 8 } }
                    }
                }
            });
        }

        var ctxIndices = document.getElementById('chartIndices');
        if (ctxIndices && typeof Chart !== 'undefined') {
            if (chartIndices) chartIndices.destroy();
            chartIndices = new Chart(ctxIndices.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['NDVI', 'Green cover', 'Water', 'Built-up', 'LST'],
                    datasets: [{
                        label: 'Value',
                        data: [0.68, 42, 2.1, 18, 32],
                        backgroundColor: ['#3fb950', '#58a6ff', '#06b6d4', '#d29922', '#f85149']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#8b949e' } },
                        x: { grid: { display: false }, ticks: { color: '#8b949e' } }
                    }
                }
            });
        }
    }

    function runAnalysis() {
        var start = dateStart && dateStart.value ? dateStart.value : formatDate(defaultStart);
        var end = dateEnd && dateEnd.value ? dateEnd.value : formatDate(defaultEnd);
        var layers = getActiveLayers();

        if (resultsPlaceholder) resultsPlaceholder.classList.add('d-none');
        if (resultsContent) resultsContent.classList.remove('d-none');

        setEl('resultNDVI', '0.68');
        setEl('resultGreenCover', '42%');
        setEl('resultArea', '25.4');
        setEl('resultDateRange', start + ' – ' + end);
        setEl('dArea', '25.4 km²');
        setEl('dNDVI', '0.68');
        setEl('dGreenCover', '42%');
        setEl('dNO2', '—');
        setEl('dWater', '—');
        setEl('dLST', '—');
        setEl('dDateRange', start + ' – ' + end);

        initCharts(start, end);

        if (panelResults) panelResults.classList.remove('closed');
        if (mapWrap) mapWrap.classList.remove('panel-results-closed');
        if (btnToggleResults) btnToggleResults.classList.remove('show');
    }

    if (btnRunAnalysis) btnRunAnalysis.addEventListener('click', runAnalysis);

    if (btnToggleLayers && panelLayers && mapWrap) {
        btnToggleLayers.addEventListener('click', function () {
            panelLayers.classList.toggle('closed');
            mapWrap.classList.toggle('panel-layers-closed', panelLayers.classList.contains('closed'));
        });
    }
    if (btnCloseLayers && panelLayers && mapWrap) {
        btnCloseLayers.addEventListener('click', function () { panelLayers.classList.add('closed'); mapWrap.classList.add('panel-layers-closed'); });
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

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMap);
    else initMap();
})();
