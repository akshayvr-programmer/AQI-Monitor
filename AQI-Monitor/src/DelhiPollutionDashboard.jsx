import React, { useState, useEffect, useRef } from 'react';
import * as turf from '@turf/turf';

const DelhiPollutionDashboard = () => {
  // State Management
  const [wardsGeo, setWardsGeo] = useState(null);
  const [aqiStations, setAqiStations] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFloatOpen, setIsFloatOpen] = useState(false);
  const [floatContent, setFloatContent] = useState({ title: '', body: '' });
  const [liveAQStatus, setLiveAQStatus] = useState('AQI: —');
  const [leftPanelData, setLeftPanelData] = useState({
    aqi: null,
    pm25: null,
    pm10: null,
    status: '---'
  });
  const [latestWardAQI, setLatestWardAQI] = useState(null);
  const [latestWardAI, setLatestWardAI] = useState(null);
  const [latestForecast24h, setLatestForecast24h] = useState([]);
  const [grievances, setGrievances] = useState([]);

  // Refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const wardsLayerRef = useRef(null);
  const stationLayerRef = useRef(null);
  const selectedHighlightRef = useRef(null);
  const tempSearchMarkerRef = useRef(null);
  const historyGraphRef = useRef(null);
  const forecastGraphRef = useRef(null);

  // Constants
  const REMOTE_SERVER_URL = 'https://vito-glabellar-semijudicially.ngrok-free.dev';
  const LOCAL_BACKEND_URL = 'http://localhost:3000';

  const PM25_BREAKPOINTS = [
    { bpLow: 0, bpHigh: 30, aqiLow: 0, aqiHigh: 50 },
    { bpLow: 31, bpHigh: 60, aqiLow: 51, aqiHigh: 100 },
    { bpLow: 61, bpHigh: 90, aqiLow: 101, aqiHigh: 200 },
    { bpLow: 91, bpHigh: 120, aqiLow: 201, aqiHigh: 300 },
    { bpLow: 121, bpHigh: 250, aqiLow: 301, aqiHigh: 400 },
    { bpLow: 251, bpHigh: 500, aqiLow: 401, aqiHigh: 500 },
  ];

  // Utility Functions
  const pm25ToAQI = (pm25) => {
    if (pm25 == null || isNaN(pm25)) return null;
    const c = Math.max(0, Number(pm25));
    let bp = PM25_BREAKPOINTS.find(b => c >= b.bpLow && c <= b.bpHigh) || PM25_BREAKPOINTS[PM25_BREAKPOINTS.length - 1];
    const { aqiLow: Ilo, aqiHigh: Ihi, bpLow: BPLo, bpHigh: BPhi } = bp;
    const I = ((Ihi - Ilo) / (BPhi - BPLo)) * (c - BPLo) + Ilo;
    return Math.round(I);
  };

  const clampAQI = (aqi) => {
    if (aqi == null || isNaN(aqi)) return null;
    const v = Number(aqi);
    return Math.min(Math.max(Math.round(v), 0), 500);
  };

  const getAQIColor = (aqi) => {
    if (aqi == null) return '#374151';
    if (aqi <= 50) return '#16a34a';
    if (aqi <= 100) return '#eab308';
    if (aqi <= 200) return '#f97316';
    if (aqi <= 300) return '#ef4444';
    if (aqi <= 400) return '#7c2d12';
    return '#5b0219';
  };

  const getAQILabel = (aqi) => {
    if (aqi == null) return 'No data';
    if (aqi > 400) return 'Severe';
    if (aqi > 300) return 'Very Poor';
    if (aqi > 200) return 'Poor';
    if (aqi > 100) return 'Moderate';
    if (aqi > 50) return 'Satisfactory';
    return 'Good';
  };

  const advisoryForAQI = (aqi) => {
    if (aqi == null) return 'No AQI data available.';
    const note = 'Note: Vulnerable populations include children (especially under 5 years), elderly people, pregnant women, and those with pre-existing respiratory, cardiovascular, or cerebrovascular conditions.';
    switch (true) {
      case aqi <= 50:
        return 'Low risk to health\nNo special precautions needed for anyone\nAll outdoor activities can be done normally';
      case aqi <= 100:
        return 'Minor breathing discomfort may occur in vulnerable populations\nGeneral population requires no special precautions\nVulnerable groups should do less prolonged or strenuous outdoor physical exertion\n' + note;
      case aqi <= 200:
        return 'Breathing or health-related discomfort may occur in vulnerable populations\nGeneral population should do less prolonged or strenuous outdoor physical exertion\nVulnerable groups should avoid prolonged or strenuous outdoor physical exertion\n' + note;
      case aqi <= 300:
        return 'Healthy people may experience breathing discomfort on prolonged exposure\nVulnerable populations experience breathing or health discomfort on short exposure\nGeneral population should avoid outdoor physical exertion\nVulnerable groups must avoid outdoor physical activities completely\n' + note;
      case aqi <= 400:
        return 'Healthy people develop respiratory illness on prolonged exposure\nVulnerable populations experience pronounced respiratory or other illnesses on short exposure\nGeneral population should avoid outdoor physical activities, especially during morning and late evening hours\nVulnerable groups must remain indoors and keep activity levels low\n' + note;
      default:
        return 'Healthy people develop respiratory illness even on prolonged exposure\nVulnerable populations experience serious respiratory or other illnesses on short exposure\nGeneral population should avoid outdoor physical activities completely\nVulnerable groups must remain indoors and keep activity levels low at all times\n' + note;
    }
  };

  const estimatePM25 = (aqi) => {
    if (aqi <= 50) return (aqi / 50) * 12;
    if (aqi <= 100) return 12 + ((aqi - 50) / 50) * 23;
    if (aqi <= 200) return 35 + ((aqi - 100) / 100) * 115;
    return (aqi / 500) * 250;
  };

  const estimatePM10 = (aqi) => {
    return estimatePM25(aqi) * 1.6;
  };

  const pointInsideFeature = (pt, feature) => {
    try {
      if (feature.geometry.type === 'Polygon') {
        return turf.booleanPointInPolygon(pt, feature);
      }
      if (feature.geometry.type === 'MultiPolygon') {
        return feature.geometry.coordinates.some(coords => {
          const poly = turf.polygon(coords);
          return turf.booleanPointInPolygon(pt, poly);
        });
      }
    } catch (e) {}
    return false;
  };

  const getInterpolatedAQI = (lat, lon, stations) => {
    if (!stations || stations.length === 0) return null;

    const stationData = stations.map(s => {
      const d = turf.distance(turf.point([lon, lat]), turf.point([s.lon, s.lat]), { units: 'kilometers' });
      const val = s.aqi ?? (s.pm25 ? pm25ToAQI(s.pm25) : null);
      return { val, dist: d };
    }).filter(s => s.val !== null);

    if (stationData.length === 0) return null;
    stationData.sort((a, b) => a.dist - b.dist);

    if (stationData[0].dist < 0.5) return { aqi: Math.round(stationData[0].val), method: 'Direct Reading' };

    const nearest = stationData.slice(0, 3);
    let sumWeight = 0, sumWeightedAQI = 0;

    nearest.forEach(s => {
      const weight = 1 / Math.pow(s.dist, 2);
      sumWeight += weight;
      sumWeightedAQI += s.val * weight;
    });

    return { 
      aqi: clampAQI(sumWeightedAQI / sumWeight), 
      method: 'Spatial Interpolation' 
    };
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const map = L.map(mapRef.current, {
      preferCanvas: true,
      zoomControl: false,
      zoomAnimation: true,
      zoomAnimationThreshold: 10,
      zoomSnap: 0,
      wheelPxPerZoomLevel: 10,
      wheelDelta: 1.5,
      inertia: true,
      inertiaDeceleration: 3000
    }).setView([28.6139, 77.2090], 11);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap & CARTO'
    }).addTo(map);

    stationLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Map click handler
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      handleMapClick(lat, lng);
    });

    loadWardShapes();
  }, []);

  const loadWardShapes = async () => {
    const urls = [
      'delhi_wards.geojson',
      'https://raw.githubusercontent.com/HindustanTimesLabs/shapefiles/master/city/delhi/ward/delhi_ward.kml'
    ];

    for (const url of urls) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        
        let geoJson;
        if (url.endsWith('.kml')) {
          const text = await r.text();
          geoJson = window.toGeoJSON.kml(new DOMParser().parseFromString(text, 'text/xml'));
        } else {
          geoJson = await r.json();
        }

        if (geoJson) {
          renderWardsGeoJSON(geoJson);
          return;
        }
      } catch (e) {
        console.error('Error loading ward shapes:', e);
      }
    }
    alert('Ward data not found.');
  };

  const renderWardsGeoJSON = (gj) => {
    setWardsGeo(gj);
    
    gj.features.forEach((f, i) => {
      if (!f.properties) f.properties = {};
      f.properties.name = f.properties.name || f.properties.WARD_NAME || `Ward ${i+1}`;
    });

    const L = window.L;
    const map = mapInstanceRef.current;

    wardsLayerRef.current = L.geoJSON(gj, {
      style: { 
        color: '#94a3b8', 
        weight: 1, 
        opacity: 0.5, 
        fillColor: '#374151', 
        fillOpacity: 0.1 
      },
      onEachFeature: (f, l) => {
        l.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleWardClick(f, l);
        });
      }
    }).addTo(map);

    map.fitBounds(wardsLayerRef.current.getBounds());
    integrateLiveAQIntoWards();
  };

  const fetchAQIFromBackend = async () => {
    const remoteBase = REMOTE_SERVER_URL.replace(/\/$/, '');
    const endpoints = [
      '/api/aqi',
      'http://localhost:3000/api/aqi',
      `${remoteBase}/api/aqi`
    ];

    for (const url of endpoints) {
      try {
        const r = await fetch(url, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Content-Type': 'application/json'
          }
        });

        if (r.ok) {
          const data = await r.json();
          return data;
        }
      } catch (err) {
        // Continue to next endpoint
      }
    }

    throw new Error('All backend endpoints failed to return AQI data.');
  };

  const normalizeToStationPoints = (payload) => {
    const points = [];
    const data = Array.isArray(payload) ? payload : [];
    
    data.forEach(item => {
      let lat = item.lat;
      let lon = item.lon;
      if (lat == null || lon == null) return;

      let aqiVal = item.aqi ? Number(item.aqi) : null;
      let pm25 = item.pm25 || (aqiVal ? estimatePM25(aqiVal) : null);
      let pm10 = item.pm10 || (aqiVal ? estimatePM10(aqiVal) : null);

      points.push({
        id: item.uid || `${lat},${lon}`,
        lat: Number(lat), 
        lon: Number(lon),
        aqi: aqiVal,
        pm25: pm25,
        pm10: pm10
      });
    });
    return points;
  };

  const filterStationsInsideDelhi = (stations) => {
    if (!wardsGeo?.features) return stations;
    return stations.filter(s => {
      const pt = turf.point([s.lon, s.lat]);
      return wardsGeo.features.some(f => pointInsideFeature(pt, f));
    });
  };

  const renderAQIStationsOnMap = (stationPoints) => {
    const L = window.L;
    stationLayerRef.current.clearLayers();
    
    stationPoints.forEach(st => {
      const aqi = st.aqi ?? pm25ToAQI(st.pm25);
      if (!aqi) return;
      
      L.circleMarker([st.lat, st.lon], {
        radius: 6, 
        fillColor: getAQIColor(aqi), 
        color: '#fff', 
        weight: 1, 
        fillOpacity: 0.9
      }).bindPopup(`Station AQI: ${aqi}`).addTo(stationLayerRef.current);
    });
  };

  const integrateLiveAQIntoWards = async () => {
    if (!wardsGeo) return;
    setIsLoading(true);
    setLoadingText('Syncing Delhi Air Quality...');

    try {
      const payload = await fetchAQIFromBackend();
      const allPoints = normalizeToStationPoints(payload);
      const filteredStations = filterStationsInsideDelhi(allPoints);
      setAqiStations(filteredStations);
      renderAQIStationsOnMap(filteredStations);

      let sumAQI = 0, sumPM25 = 0, sumPM10 = 0;
      let countAQI = 0, countPM25 = 0, countPM10 = 0;
      
      filteredStations.forEach(s => {
        const a = s.aqi ?? pm25ToAQI(s.pm25);
        if (a) { sumAQI += a; countAQI++; }
        if (s.pm25) { sumPM25 += s.pm25; countPM25++; }
        if (s.pm10) { sumPM10 += s.pm10; countPM10++; }
      });

      const avgAQI = countAQI ? Math.round(sumAQI / countAQI) : 0;
      const avgPM25 = countPM25 ? Math.round(sumPM25 / countPM25) : 0;
      const avgPM10 = countPM10 ? Math.round(sumPM10 / countPM10) : 0;

      updateLeftPanel({ aqi: avgAQI, pm25: avgPM25, pm10: avgPM10 });
      setLiveAQStatus(`Live: Delhi Avg AQI ${avgAQI}`);

      wardsGeo.features.forEach(f => {
        const centroid = turf.pointOnFeature(f).geometry.coordinates;
        const result = getInterpolatedAQI(centroid[1], centroid[0], filteredStations);
        
        if (result) {
          f.properties.aqi = result.aqi;
          f.properties.pm25 = estimatePM25(result.aqi);
          f.properties.pm10 = estimatePM10(result.aqi);
          f.properties._aqi_method = result.method;
        } else {
          f.properties.aqi = clampAQI(avgAQI);
          f.properties.pm25 = avgPM25;
          f.properties.pm10 = avgPM10;
          f.properties._aqi_method = 'City Average';
        }
      });

      if (wardsLayerRef.current) {
        wardsLayerRef.current.eachLayer(layer => {
          const a = layer.feature.properties.aqi;
          layer.setStyle({ fillColor: getAQIColor(a), fillOpacity: 0.4 });
        });
      }

      if (Array.isArray(payload?.history_24h)) {
        renderHistoryTrend(payload.history_24h);
      }
    } catch (err) {
      console.error(err);
      setLiveAQStatus('Live fetch failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWardClick = async (feature, layer) => {
    const L = window.L;
    const map = mapInstanceRef.current;

    if (selectedHighlightRef.current) {
      map.removeLayer(selectedHighlightRef.current);
    }

    selectedHighlightRef.current = L.geoJSON(feature, {
      style: { color: '#00eeff', weight: 4, fillOpacity: 0.3 }
    }).addTo(map);

    const bounds = layer ? layer.getBounds() : L.geoJSON(feature).getBounds();
    map.flyToBounds(bounds, { padding: [50, 50], duration: 1 });

    const wardId = feature.properties.Ward_No;
    const wardName = feature.properties.WardName || "Unknown Ward";
    
    const wardAQI = feature.properties.aqi || 0;
    setLatestWardAQI(wardAQI);
    setLatestWardAI(null);

    setSelectedWard({
      title: wardName,
      subtitle: `Ward Number: ${wardId} | AC: ${feature.properties.AC_Name}`,
      aqi: wardAQI,
      pm25: feature.properties.pm25 || 0,
      pm10: feature.properties.pm10 || 0
    });

    setIsPanelOpen(true);

    const localData = {
      aqi: wardAQI,
      pm25: feature.properties.pm25 || 0,
      pm10: feature.properties.pm10 || 0,
      analysis: null
    };

    updateWardUI(localData);

    if (wardId) {
      try {
        const baseUrl = REMOTE_SERVER_URL.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/api/ward-analysis/${wardId}`, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });

        const data = await response.json();

        if (data.success) {
          setLatestWardAI(data.analysis);
          setLatestForecast24h(data.forecast_24h || []);

          const mergedData = {
            aqi: wardAQI,
            pm25: data.raw_pollutants?.pm2_5 || localData.pm25,
            pm10: data.raw_pollutants?.pm10 || localData.pm10,
            analysis: data.analysis,
            history_24h: data.history_24h || []
          };

          updateWardUI(mergedData);

          if (data.history_24h) {
            renderHistoryTrend(data.history_24h);
          }
        }
      } catch (err) {
        console.error("Background fetch failed:", err);
      }
    }
  };

  const handleMapClick = (lat, lng) => {
    const L = window.L;
    const map = mapInstanceRef.current;

    if (tempSearchMarkerRef.current) {
      map.removeLayer(tempSearchMarkerRef.current);
    }

    tempSearchMarkerRef.current = L.circleMarker([lat, lng], {
      radius: 8,
      color: '#fff',
      fillColor: '#000',
      fillOpacity: 0.5
    }).addTo(map);

    const feat = findWardAtLatLng(lat, lng);
    
    if (feat) {
      const layer = findLayerForFeature(feat);
      handleWardClick(feat, layer);
    } else {
      map.flyTo([lat, lng], map.getZoom() < 12 ? 13 : map.getZoom(), {
        duration: 0.8
      });

      const res = getInterpolatedAQI(lat, lng, aqiStations);
      const a = res ? res.aqi : null;

      setSelectedWard({
        title: 'Outside Ward Boundary',
        subtitle: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        aqi: a,
        pm25: null,
        pm10: null
      });

      setIsPanelOpen(true);
    }
  };

  const findWardAtLatLng = (lat, lng) => {
    if (!wardsGeo) return null;
    const pt = turf.point([lng, lat]);
    return wardsGeo.features.find(f => pointInsideFeature(pt, f));
  };

  const findLayerForFeature = (feature) => {
    if (!wardsLayerRef.current) return null;
    let found = null;
    wardsLayerRef.current.eachLayer(l => {
      if (JSON.stringify(l.feature.geometry) === JSON.stringify(feature.geometry)) {
        found = l;
      }
    });
    return found;
  };

  const updateLeftPanel = (data) => {
    const aqi = data.aqi || 0;
    const pm25 = data.pm25 || 0;
    const pm10 = data.pm10 || 0;

    setLeftPanelData({
      aqi: aqi > 0 ? aqi : null,
      pm25: pm25 > 0 ? pm25 : null,
      pm10: pm10 > 0 ? pm10 : null,
      status: getAQILabel(aqi)
    });
  };

  const updateWardUI = (data) => {
    const aqi = data.current_aqi || data.aqi || 0;
    const pm25 = data.pm25 || (data.raw_pollutants ? data.raw_pollutants.pm2_5 : 0);
    const pm10 = data.pm10 || (data.raw_pollutants ? data.raw_pollutants.pm10 : 0);

    setSelectedWard(prev => ({
      ...prev,
      aqi,
      pm25,
      pm10,
      aiAnalysis: data.analysis || null,
      cigarettes: data.cigarettes_count || (aqi / 22).toFixed(1)
    }));

    if (Array.isArray(data.history_24h)) {
      setTimeout(() => {
        renderHistoryTrend(data.history_24h);
      }, 200);
    }
  };

  const renderHistoryTrend = (history24h) => {
    if (!historyGraphRef.current) return;
    
    const svg = historyGraphRef.current;
    const rect = svg.getBoundingClientRect();
    const w = Math.max(400, rect.width || 600);
    const h = Math.max(160, rect.height || 180);
    const pts = history24h.map(x => ({ aqi: Number(x.aqi || 0), time: x.time }));
    
    renderColoredLine(svg, pts, w, h);
  };

  const renderForecastTrend = (forecast24h) => {
    if (!forecastGraphRef.current) return;
    
    const svg = forecastGraphRef.current;
    const rect = svg.getBoundingClientRect();
    const w = Math.max(400, rect.width || 600);
    const h = Math.max(160, rect.height || 180);
    const pts = forecast24h.map(x => ({ aqi: Number(x.aqi || 0), time: x.time }));
    
    renderColoredLine(svg, pts, w, h);
  };

  const aqiToY = (aqi, h) => {
    const minY = 20, maxY = h - 20;
    const v = Math.max(0, Math.min(500, Number(aqi || 0)));
    const pct = v / 500;
    return maxY - pct * (maxY - minY);
  };

  const hourLabel = (ts) => {
    try {
      return new Date(ts * 1000).getHours().toString().padStart(2, '0');
    } catch {
      return '--';
    }
  };

  const renderColoredLine = (svgEl, points, w, h) => {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    
    const padL = 30, padR = 10;
    const n = points.length;
    if (!n) return;
    
    const stepX = (w - padL - padR) / Math.max(1, n - 1);
    
    for (let i = 0; i < n - 1; i++) {
      const p1 = points[i], p2 = points[i + 1];
      const x1 = padL + i * stepX, x2 = padL + (i + 1) * stepX;
      const y1 = aqiToY(p1.aqi, h), y2 = aqiToY(p2.aqi, h);
      const stroke = getAQIColor(Math.round((p1.aqi + p2.aqi) / 2));
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", stroke);
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-linecap", "round");
      svgEl.appendChild(line);
    }
    
    for (let i = 0; i < n; i += 6) {
      const x = padL + i * stepX;
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", x);
      t.setAttribute("y", h - 4);
      t.setAttribute("fill", "#9CA3AF");
      t.setAttribute("font-size", "10");
      t.setAttribute("text-anchor", "middle");
      t.textContent = points[i].label || hourLabel(points[i].time || 0);
      svgEl.appendChild(t);
    }
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    
    const ql = q.toLowerCase();
    const local = wardsGeo?.features.find(f => 
      (f.properties.name || '').toLowerCase().includes(ql)
    );
    
    if (local) {
      const layer = findLayerForFeature(local);
      if (layer) mapInstanceRef.current.fitBounds(layer.getBounds());
      handleWardClick(local, null);
    } else {
      setIsLoading(true);
      setLoadingText('Searching...');
      
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ', Delhi')}`
        );
        const res = await resp.json();
        
        if (res.length) {
          const { lat, lon } = res[0];
          const plat = parseFloat(lat), plon = parseFloat(lon);
          
          mapInstanceRef.current.flyTo([plat, plon], 13, {
            animate: true,
            duration: 0.8,
            easeLinearity: 0.1
          });
          
          const ward = findWardAtLatLng(plat, plon);
          if (ward) handleWardClick(ward, null);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTabClick = (key) => {
    const tabData = {
      staySafe: {
        title: "Health Advisory",
        body: () => {
          const a = latestWardAQI;
          const ai = latestWardAI;
          
          if (ai && !ai.error) {
            return `
              <div class="space-y-4 text-slate-300">
                <div class="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                  <p class="text-emerald-400 font-bold mb-1">⚠️ Cigarette Equivalent</p>
                  <p class="text-2xl font-bold text-white">Breathing this air is like smoking <strong>${ai.cigarettes}</strong> cigarettes today.</p>
                </div>
                <div class="space-y-2">
                  <p class="font-semibold text-emerald-400">Health Impact Summary:</p>
                  <p class="text-sm leading-relaxed">${ai.impact_summary}</p>
                </div>
              </div>`;
          } else {
            const label = getAQILabel(a);
            const advice = advisoryForAQI(a);
            return `
              <div class="space-y-3 text-slate-300">
                <p><strong class="text-emerald-400">Status:</strong> ${a != null ? `${a} - ${label}` : 'No data'}</p>
                <p>${advice}</p>
              </div>`;
          }
        }
      },
      forecast: {
        title: "AQI Forecast",
        body: () => `
          <div class="space-y-3 text-slate-300">
            <div class="glass rounded-lg p-3">
              <svg id="forecastGraphFloat" width="100%" height="180"></svg>
            </div>
            <div id="forecastSummary" class="grid grid-cols-2 gap-3">
              <div class="glass rounded-lg p-3">
                <div class="text-sm font-semibold text-emerald-400 mb-1">Minimum AQI</div>
                <div id="minAqiPacket" class="text-black text-sm bg-white rounded px-2 py-1 inline-block"></div>
              </div>
              <div class="glass rounded-lg p-3">
                <div class="text-sm font-semibold text-emerald-400 mb-1">Maximum AQI</div>
                <div id="maxAqiPacket" class="text-black text-sm bg-white rounded px-2 py-1 inline-block"></div>
              </div>
            </div>
          </div>`
      },
      actions: {
        title: "Public Directives",
        body: () => {
          const ai = latestWardAI;
          const list = ai?.source_breakdown || [];

          if (list.length) {
            return `
              <p class="text-slate-400 mb-4 text-sm">Official directives based on primary pollution sources in this ward:</p>
              ${list.map(src => `
                <div class="glass p-4 rounded-xl mb-3 border border-white/5">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-emerald-400">${src.source}</span>
                    <span class="bg-emerald-500/20 px-2 py-1 rounded text-xs text-emerald-300">${src.contribution_percent}% Contribution</span>
                  </div>
                  <div class="text-sm text-white mb-2"><strong>Directive:</strong> ${src.actionable_mitigation}</div>
                  <div class="text-xs text-emerald-500/70 italic">Expected Impact: ${src.impact_if_removed}</div>
                </div>
              `).join('')}`;
          } else {
            return '<div class="text-slate-300">No specific directives available for this ward yet.</div>';
          }
        }
      },
      complaint: {
        title: "Grievance Redressal",
        body: () => `
          <div class="space-y-3 text-slate-300">
            <form id="grievForm" class="space-y-2">
              <input id="grievText" type="text" class="w-full px-3 py-2 rounded border border-white/20 bg-black/40" placeholder="Describe the non-compliance">
              <input id="grievImage" type="file" accept="image/*" class="w-full text-xs">
              <button id="grievSubmit" type="button" class="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white">Submit Complaint</button>
            </form>
            <div id="grievStatus" class="text-xs text-slate-400"></div>
            <div class="mt-4">
              <h4 class="font-semibold mb-2 text-emerald-400">Submitted Complaints</h4>
              <div id="grievList" class="space-y-2"></div>
            </div>
          </div>`
      },
      policies: {
        title: "Regulatory Measures (GRAP)",
        body: () => `
          <div class="space-y-3 text-slate-300">
            <p><strong class="text-emerald-400">Active Stage: GRAP Stage-IV (Severe+)</strong></p>
            <ul class="list-disc pl-5 space-y-1 text-slate-400 marker:text-emerald-500">
              <li><strong class="text-emerald-400">Transport:</strong> Entry of heavy goods vehicles (except essentials) is prohibited.</li>
              <li><strong class="text-emerald-400">Construction:</strong> Total ban on C&D activities, including linear public projects.</li>
              <li><strong class="text-emerald-400">Institutions:</strong> Schools closed for physical classes (up to Class IX).</li>
              <li><strong class="text-emerald-400">Workforce:</strong> 50% capacity for public/private offices recommended.</li>
            </ul>
          </div>`
      },
      govTask: {
        title: "Municipal Deployment Status",
        body: () => `
          <div class="space-y-3 text-slate-300">
            <p><strong class="text-emerald-400">Real-time Action Report (Daily):</strong></p>
            <div class="grid grid-cols-2 gap-2 text-center">
              <div class="bg-slate-900/50 p-2 rounded border border-emerald-500/30">
                <div class="text-lg font-bold text-emerald-400">450</div>
                <div class="text-xs text-slate-400">Water Sprinklers</div>
              </div>
              <div class="bg-slate-900/50 p-2 rounded border border-emerald-500/30">
                <div class="text-lg font-bold text-emerald-400">12</div>
                <div class="text-xs text-slate-400">Anti-Smog Guns</div>
              </div>
            </div>
            <p class="text-xs text-emerald-500/70 mt-2">Data updated: 08:00 AM IST</p>
          </div>`
      }
    };

    const data = tabData[key];
    if (!data) return;

    const bodyContent = typeof data.body === 'function' ? data.body() : data.body;
    setFloatContent({ title: data.title, body: bodyContent });
    setIsFloatOpen(true);

    if (key === 'forecast') {
      setTimeout(() => {
        const svg = document.getElementById('forecastGraphFloat');
        if (svg && latestForecast24h.length) {
          renderColoredLine(svg, latestForecast24h.map(x => ({ 
            aqi: Number(x.aqi || 0), 
            time: x.time 
          })), svg.getBoundingClientRect().width, 180);
        }
      }, 100);
    }
  };

  return (
    <>
      <style>{`
        html, body { 
          height: 100%; 
          margin: 0; 
          background: #000; 
          color: #fff; 
          font-family: "Trebuchet MS", Helvetica, sans-serif; 
        }
        
        .glass { 
          background: rgba(255,255,255,0.06); 
          backdrop-filter: blur(12px); 
          -webkit-backdrop-filter: blur(12px); 
          border: 1px solid rgba(255,255,255,0.06); 
          color: #fff; 
        }
        
        .spinner { 
          border: 3px solid rgba(255,255,255,0.12); 
          border-top: 3px solid rgba(255,255,255,0.95); 
          border-radius: 50%; 
          width: 16px; 
          height: 16px; 
          animation: spin 1s linear infinite; 
          display: inline-block; 
        }
        
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
        
        @keyframes pulse-red {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        
        .live-indicator {
          background-color: #ef4444;
          border-radius: 50%;
          animation: pulse-red 2s infinite;
        }
        
        .neon-text { 
          text-shadow: none; 
          color: #f8fafc;
          letter-spacing: -0.02em;
        }
        
        .tab-btn-active { 
          background: rgba(52, 211, 153, 0.15); 
          border-bottom: 2px solid #34d399; 
          color: #34d399; 
        }
        
        .tab-btn { 
          transition: all 0.2s ease; 
        }
        
        .tab-btn:hover { 
          background: rgba(255,255,255,0.05); 
        }
        
        .ui-tab-btn {
          background: rgba(255, 255, 255, 0.03);
          color: #cbd5e1;
          padding: 12px;
          font-size: 0.85rem;
          font-weight: 500;
          border-radius: 8px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .ui-tab-btn:hover {
          background: rgba(52, 211, 153, 0.1);
          color: #34d399;
          border-color: rgba(52, 211, 153, 0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .leaflet-tooltip.my-tooltip { 
          background: rgba(0,0,0,0.7); 
          border-radius: 6px; 
          color: #fff; 
          padding: 6px 8px; 
          border: 0; 
          font-size: 13px; 
        }
      `}</style>

      {/* Back to Landing Button */}
      <button 
        onClick={() => window.location.href = 'index.html'}
        className="absolute top-6 left-6 z-[1400] px-4 py-2 rounded-full border border-white/30 hover:bg-white hover:text-black transition"
      >
        ← Back to Home
      </button>

      {/* Left Stats Panel */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 z-[1500] flex flex-col gap-4">
        <div className="w-80 glass p-7 rounded-3xl border-none shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-3 h-3 live-indicator"></span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Live Delhi Avg
            </span>
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <h1 
              className="text-7xl font-black leading-none tracking-tighter transition-colors duration-500"
              style={{ color: getAQIColor(leftPanelData.aqi) }}
            >
              {leftPanelData.aqi || '---'}
            </h1>
            <span className="text-[10px] text-gray-500 font-bold uppercase">AQI (US)</span>
          </div>

          <div 
            className="inline-block px-4 py-1.5 rounded-lg text-lg font-bold mb-8 transition-colors duration-500"
            style={{
              color: getAQIColor(leftPanelData.aqi),
              backgroundColor: `${getAQIColor(leftPanelData.aqi)}22`,
              borderColor: `${getAQIColor(leftPanelData.aqi)}44`
            }}
          >
            {leftPanelData.status}
          </div>

          <div className="space-y-5 mb-8 border-t border-white/5 pt-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                  PM10 Particle
                </p>
                <p className="text-2xl font-medium text-slate-200">
                  {leftPanelData.pm10 || '---'}
                </p>
              </div>
              <span className="text-[10px] text-gray-600 font-bold mb-1">µg/m³</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                  PM2.5 Particle
                </p>
                <p className="text-2xl font-medium text-slate-200">
                  {leftPanelData.pm25 || '---'}
                </p>
              </div>
              <span className="text-[10px] text-gray-600 font-bold mb-1">µg/m³</span>
            </div>
          </div>

          <div className="relative w-full pb-2">
            <div className="h-1.5 w-full rounded-full flex overflow-hidden bg-white/10">
              <div className="h-full bg-emerald-500" style={{ width: '10%' }}></div>
              <div className="h-full bg-yellow-400" style={{ width: '10%' }}></div>
              <div className="h-full bg-orange-500" style={{ width: '20%' }}></div>
              <div className="h-full bg-red-500" style={{ width: '20%' }}></div>
              <div className="h-full bg-purple-600" style={{ width: '20%' }}></div>
              <div className="h-full bg-rose-900" style={{ width: '20%' }}></div>
            </div>
            <div 
              className="absolute top-[-3px] w-3 h-3 bg-white rounded-full border-2 border-black shadow-[0_0_10px_white] transition-all duration-1000"
              style={{ 
                left: `${Math.max(0, Math.min((leftPanelData.aqi / 500) * 100, 100))}%`,
                transform: 'translateX(-50%)'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1400] w-[92%] max-w-xl">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search ward / locality (Enter) — e.g. Rohini, Connaught Place, IGI Airport"
            className="w-full px-5 py-3 rounded-full glass placeholder-gray-300 focus:outline-none pr-28 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-full bg-white/8 hover:bg-white/12 text-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} style={{ height: '100vh', width: '100vw' }}></div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none">
          <div className="glass flex items-center gap-3 p-3 pointer-events-auto">
            <div className="spinner" aria-hidden="true"></div>
            <div className="text-sm">{loadingText}</div>
          </div>
        </div>
      )}

      {/* Info Side Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[92%] max-w-sm glass p-6 transition-transform duration-500 z-[2000] overflow-auto ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedWard && (
          <>
            <h2 className="text-3xl font-semibold mb-1 neon-text">{selectedWard.title}</h2>
            <p className="text-xs text-gray-300 mb-4">{selectedWard.subtitle || '--'}</p>

            <p 
              className="text-4xl font-black mb-4"
              style={{ color: getAQIColor(selectedWard.aqi) }}
            >
              AQI: {selectedWard.aqi || '--'}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div className="glass p-3 rounded-lg text-center">
                PM₂.₅ <br />
                <span className="text-xl font-semibold">
                  {selectedWard.pm25 > 0 ? Number(selectedWard.pm25).toFixed(1) : '--'}
                </span>
              </div>
              <div className="glass p-3 rounded-lg text-center">
                PM₁₀ <br />
                <span className="text-xl font-semibold">
                  {selectedWard.pm10 > 0 ? Number(selectedWard.pm10).toFixed(1) : '--'}
                </span>
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="ui-tab-btn" onClick={() => handleTabClick('staySafe')}>
                Health Advisory
              </button>
              <button className="ui-tab-btn" onClick={() => handleTabClick('forecast')}>
                AQI Forecast
              </button>
              <button className="ui-tab-btn" onClick={() => handleTabClick('actions')}>
                Directives
              </button>
              <button className="ui-tab-btn" onClick={() => handleTabClick('complaint')}>
                Grievances
              </button>
              <button className="ui-tab-btn" onClick={() => handleTabClick('policies')}>
                Policy (GRAP)
              </button>
              <button className="ui-tab-btn" onClick={() => handleTabClick('govTask')}>
                MCD Actions
              </button>
            </div>

            {/* Trend Graph */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">AQI Trend (24h)</h3>
              <div className="glass rounded-lg p-3">
                <svg ref={historyGraphRef} width="100%" height="180"></svg>
              </div>
              {selectedWard.cigarettes && (
                <div className="text-xs text-gray-300 mt-2">
                  Air in the selected ward is equivalent to smoking {selectedWard.cigarettes} cigarettes a day.
                </div>
              )}
            </div>

            {/* Health Advisory */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Health Advisory</h3>
              <p className="text-gray-200 text-sm whitespace-pre-line">
                {selectedWard.aiAnalysis && !selectedWard.aiAnalysis.error ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-emerald-400">⚠️ Cigarette Equivalent</p>
                    <p className="text-sm">
                      Breathing this air = smoking <strong>{selectedWard.cigarettes}</strong> cigarettes today.
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedWard.aiAnalysis.impact_summary}
                    </p>
                  </div>
                ) : (
                  advisoryForAQI(selectedWard.aqi)
                )}
              </p>
            </div>

            <div className="mt-6">
              <button 
                onClick={() => setIsPanelOpen(false)}
                className="mt-4 w-full px-4 py-2 rounded-full bg-white/8 hover:bg-white/12 text-sm"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating Popup Panel */}
      {isFloatOpen && (
        <div 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[1400px] min-h-[65vh]
                     bg-black/95 glass p-10 rounded-2xl shadow-[0_30px_120px_rgba(16,185,129,0.15)] backdrop-blur-xl
                     border border-emerald-500/25 z-[4000] transition-all duration-500 ease-out flex flex-col"
        >
          <button 
            onClick={() => setIsFloatOpen(false)}
            className="absolute top-3 right-3 text-gray-300 hover:text-white text-lg"
          >
            ✖
          </button>

          <h2 className="text-3xl font-bold text-emerald-400 mb-6 tracking-wide drop-shadow-sm">
            {floatContent.title}
          </h2>

          <div 
            className="text-base leading-relaxed pr-2 overflow-y-auto overflow-x-hidden break-words flex-1"
            style={{ maxHeight: '70vh' }}
            dangerouslySetInnerHTML={{ __html: floatContent.body }}
          />
        </div>
      )}

      {/* Live Status Bar */}
      <div className="fixed left-4 bottom-4 z-[2100] bg-black/60 text-white px-3 py-2 rounded-lg text-xs">
        {liveAQStatus}
      </div>
    </>
  );
};

export default DelhiPollutionDashboard;