import React, { useState, useEffect, useCallback } from 'react';
import { Wind, MapPin, Search, AlertCircle, RefreshCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import WardDetailModal from './WardDetailModal';
import { getAQICategory } from './aqiService';
import { fetchDelhiAirQuality } from './openaqService';

const DelhiAQIHome = () => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Fetch real-time AQI data on component mount
  useEffect(() => {
    fetchRealTimeData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchRealTimeData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeData = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      console.log('📡 Starting data fetch...');
      const result = await fetchDelhiAirQuality();
      
      console.log('📦 Received result:', result);
      
      if (result.success && result.stations) {
        // Filter out stations without coordinates
        const validStations = result.stations.filter(
          station => station.lat && station.lng && station.aqi > 0
        );

        console.log(`✅ Valid stations: ${validStations.length}`);

        if (validStations.length === 0) {
          setError('No valid monitoring stations found');
          setLoading(false);
          setRefreshing(false);
          return;
        }

        // Format for our component
        const formattedData = validStations.map((station, index) => ({
          id: index + 1,
          name: station.name,
          zone: determineZone(station.lat, station.lng),
          aqi: station.aqi,
          lat: station.lat,
          lng: station.lng,
          pollutants: station.pollutants,
          time: station.lastUpdated,
          dominantPollutant: getDominantPollutant(station.pollutants),
        }));

        console.log('🎯 Formatted data:', formattedData.length, 'stations');
        console.log('📍 First station:', formattedData[0]);

        setLocations(formattedData);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Failed to fetch air quality data');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching AQI data:', error);
      setError('Unable to connect to air quality service');
      setLoading(false);
    }
    
    setRefreshing(false);
  };

  // Determine zone based on coordinates
  const determineZone = (lat, lng) => {
    if (lat > 28.7) return lng > 77.2 ? 'North-East' : 'North';
    if (lat > 28.6) return lng > 77.2 ? 'Central-East' : 'Central';
    if (lat > 28.5) return lng > 77.2 ? 'South-East' : 'South';
    return lng > 77.1 ? 'South-West' : 'West';
  };

  const getDominantPollutant = (pollutants) => {
    if (!pollutants) return 'pm25';
    
    const values = {
      pm25: pollutants.pm25 || 0,
      pm10: pollutants.pm10 || 0,
      no2: pollutants.no2 || 0,
      o3: pollutants.o3 || 0,
    };
    
    return Object.entries(values).reduce(
      (max, [key, val]) => val > max.val ? { param: key, val } : max,
      { param: 'pm25', val: 0 }
    ).param;
  };

  const getAQIColor = (aqi) => {
    const category = getAQICategory(aqi);
    return category.color;
  };

  const getHealthAdvice = (aqi) => {
    if (aqi > 300) return 'Health warning: emergency conditions. Everyone should avoid all outdoor exertion.';
    if (aqi > 200) return 'Everyone may experience health effects. Sensitive groups should avoid outdoor activities.';
    if (aqi > 150) return 'Sensitive groups should limit prolonged outdoor activities.';
    if (aqi > 100) return 'Unusually sensitive people should consider reducing prolonged outdoor exertion.';
    return 'Air quality is acceptable for most people. Enjoy outdoor activities!';
  };

  // Zoom and pan controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.tagName === 'rect') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove]);

  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const avgAQI = locations.length > 0
    ? Math.round(locations.reduce((sum, loc) => sum + (loc.aqi || 0), 0) / locations.length)
    : 0;

  const maxAQI = locations.length > 0
    ? Math.max(...locations.map(loc => loc.aqi || 0))
    : 0;

  const minAQI = locations.length > 0
    ? Math.min(...locations.map(loc => loc.aqi || 0).filter(aqi => aqi > 0))
    : 0;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Wind size={48} color="#4a9eff" />
        <div style={styles.loadingText}>Loading real-time AQI data...</div>
        <div style={{ color: '#666', fontSize: '14px' }}>
          Connecting to air quality monitoring network
        </div>
      </div>
    );
  }

  if (error && locations.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <AlertCircle size={48} color="#ff4444" />
        <div style={styles.loadingText}>Unable to Load Data</div>
        <div style={{ color: '#999', fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
          {error}
        </div>
        <button 
          onClick={fetchRealTimeData} 
          style={{...styles.refreshButton, marginTop: '20px'}}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <div style={styles.logo}>
              <Wind size={32} color="#fff" />
            </div>
            <div>
              <h1 style={styles.title}>Delhi AQI Monitor</h1>
              <p style={styles.subtitle}>
                Real-time Air Quality Index
                {lastUpdated && (
                  <span style={styles.updateTime}>
                    {' • '}Updated: {lastUpdated.toLocaleTimeString('en-IN')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div style={styles.headerRight}>
            <button 
              onClick={fetchRealTimeData} 
              style={styles.refreshButton}
              disabled={refreshing}
              aria-label="Refresh data"
            >
              <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            <button 
              onClick={() => window.location.href = '/login'} 
              style={styles.loginButton}
              aria-label="Government login"
            >
              Government Login
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Average AQI</p>
          <h2 style={{...styles.statValue, color: getAQIColor(avgAQI)}}>{avgAQI}</h2>
          <p style={styles.statSubtext}>{getAQICategory(avgAQI).level}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Monitoring Stations</p>
          <h2 style={styles.statValue}>{locations.length}</h2>
          <p style={styles.statSubtext}>Live Data</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Worst Location</p>
          <h2 style={{...styles.statValue, color: getAQIColor(maxAQI)}}>{maxAQI}</h2>
          <p style={styles.statSubtext}>{locations.find(l => l.aqi === maxAQI)?.name || '-'}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Best Location</p>
          <h2 style={{...styles.statValue, color: getAQIColor(minAQI)}}>{minAQI}</h2>
          <p style={styles.statSubtext}>{locations.find(l => l.aqi === minAQI)?.name || '-'}</p>
        </div>
      </div>

      {/* Search */}
      <div style={styles.searchContainer}>
        <Search size={20} color="#666" />
        <input
          type="text"
          placeholder="Search monitoring stations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
          aria-label="Search monitoring stations"
        />
      </div>

      {/* Map and Details */}
      <div style={styles.mapWrapper}>
        <div style={styles.mapContainer}>
          <svg
            viewBox="0 0 1000 800"
            style={{
              ...styles.svg,
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Grid */}
              {[...Array(25)].map((_, i) => (
                <line
                  key={`v${i}`}
                  x1={i * 40}
                  y1="0"
                  x2={i * 40}
                  y2="800"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
              ))}
              {[...Array(20)].map((_, i) => (
                <line
                  key={`h${i}`}
                  x1="0"
                  y1={i * 40}
                  x2="1000"
                  y2={i * 40}
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="1"
                />
              ))}

              {/* Heat overlay */}
              {filteredLocations.map(loc => {
                const x = (loc.lng - 76.85) * 1400;
                const y = 800 - (loc.lat - 28.4) * 1500;
                return (
                  <circle
                    key={`heat-${loc.id}`}
                    cx={x}
                    cy={y}
                    r="80"
                    fill={getAQIColor(loc.aqi)}
                    opacity="0.15"
                    style={{ pointerEvents: 'none' }}
                  />
                );
              })}

              {/* Markers */}
              {filteredLocations.map(loc => {
                const x = (loc.lng - 76.85) * 1400;
                const y = 800 - (loc.lat - 28.4) * 1500;
                const isHovered = hoveredLocation === loc.id;
                const isSelected = selectedLocation?.id === loc.id;
                const radius = isHovered || isSelected ? 22 : 16;

                return (
                  <g key={loc.id}>
                    {/* Warning pulse for severe AQI */}
                    {loc.aqi > 300 && (
                      <circle
                        cx={x}
                        cy={y}
                        r={radius + 8}
                        fill="none"
                        stroke="#ff4444"
                        strokeWidth="2"
                        opacity="0.6"
                      >
                        <animate
                          attributeName="r"
                          from={radius + 8}
                          to={radius + 16}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          from="0.6"
                          to="0"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}

                    {/* Marker circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={radius}
                      fill={getAQIColor(loc.aqi)}
                      stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.3)'}
                      strokeWidth={isSelected ? 3 : 2}
                      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                      onMouseEnter={() => setHoveredLocation(loc.id)}
                      onMouseLeave={() => setHoveredLocation(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLocation(loc);
                      }}
                    />

                    {/* AQI text */}
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize="10"
                      fontWeight="700"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {loc.aqi}
                    </text>

                    {/* Hover tooltip */}
                    {isHovered && !isSelected && (
                      <g>
                        <rect
                          x={x + 30}
                          y={y - 35}
                          width="140"
                          height="60"
                          fill="#1a1a1a"
                          stroke={getAQIColor(loc.aqi)}
                          strokeWidth="2"
                          rx="8"
                          style={{ pointerEvents: 'none' }}
                        />
                        <text
                          x={x + 100}
                          y={y - 15}
                          textAnchor="middle"
                          fill="#fff"
                          fontSize="11"
                          fontWeight="600"
                          style={{ pointerEvents: 'none' }}
                        >
                          {loc.name}
                        </text>
                        <text
                          x={x + 100}
                          y={y + 2}
                          textAnchor="middle"
                          fill="#4a9eff"
                          fontSize="10"
                          style={{ pointerEvents: 'none' }}
                        >
                          AQI: {loc.aqi}
                        </text>
                        <text
                          x={x + 100}
                          y={y + 17}
                          textAnchor="middle"
                          fill={getAQIColor(loc.aqi)}
                          fontSize="9"
                          style={{ pointerEvents: 'none' }}
                        >
                          {getAQICategory(loc.aqi).level}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Zoom Controls */}
          <div style={styles.zoomControls}>
            <button
              onClick={handleZoomIn}
              style={styles.zoomButton}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
            <div style={styles.zoomLevel}>
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={handleZoomOut}
              style={styles.zoomButton}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <button
              onClick={handleResetView}
              style={styles.resetButton}
              aria-label="Reset view"
              title="Reset view"
            >
              <Maximize2 size={18} />
            </button>
          </div>

          {/* Legend */}
          <div style={styles.legend}>
            <h4 style={styles.legendTitle}>AQI Scale</h4>
            {[
              { label: 'Good', range: '0-50', color: '#00e400' },
              { label: 'Moderate', range: '51-100', color: '#ffff00' },
              { label: 'Unhealthy for SG', range: '101-150', color: '#ff7e00' },
              { label: 'Unhealthy', range: '151-200', color: '#ff0000' },
              { label: 'Very Unhealthy', range: '201-300', color: '#8f3f97' },
              { label: 'Hazardous', range: '301+', color: '#7e0023' },
            ].map(cat => (
              <div key={cat.label} style={styles.legendItem}>
                <div style={{...styles.legendDot, background: cat.color}} />
                <span style={styles.legendLabel}>{cat.label}</span>
                <span style={styles.legendRange}>{cat.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details Panel */}
        <div style={styles.detailsPanel}>
          {selectedLocation ? (
            <div style={styles.details}>
              <div style={styles.detailsHeader}>
                <MapPin size={24} color="#4a9eff" />
                <h3 style={styles.detailsTitle}>{selectedLocation.name}</h3>
              </div>
              <div style={styles.zoneBadge}>{selectedLocation.zone} Delhi</div>

              <div style={{...styles.aqiBadge, background: getAQIColor(selectedLocation.aqi)}}>
                <div style={styles.aqiNumber}>{selectedLocation.aqi}</div>
                <div style={styles.aqiLabel}>{getAQICategory(selectedLocation.aqi).level}</div>
              </div>

              {selectedLocation.time && (
                <div style={styles.timestamp}>
                  Last updated: {new Date(selectedLocation.time).toLocaleString('en-IN')}
                </div>
              )}

              <div style={styles.adviceBox}>
                <AlertCircle size={20} color="#4a9eff" style={{ flexShrink: 0 }} />
                <p style={styles.adviceText}>
                  {getHealthAdvice(selectedLocation.aqi)}
                </p>
              </div>

              {selectedLocation.pollutants && Object.keys(selectedLocation.pollutants).some(key => selectedLocation.pollutants[key] !== null) && (
                <div style={styles.pollutants}>
                  <h4 style={styles.pollutantsTitle}>Live Pollutants</h4>
                  {Object.entries(selectedLocation.pollutants)
                    .filter(([_, value]) => value !== null && value > 0)
                    .map(([key, value]) => (
                      <div key={key} style={styles.pollutantRow}>
                        <div style={styles.pollutantName}>{key.toUpperCase()}</div>
                        <div style={styles.pollutantBar}>
                          <div 
                            style={{
                              ...styles.pollutantFill,
                              width: `${Math.min((value / 300) * 100, 100)}%`,
                              background: value > 100 ? '#ff4444' : value > 50 ? '#ff7e00' : '#4a9eff'
                            }}
                          />
                        </div>
                        <div style={styles.pollutantValue}>{value}</div>
                      </div>
                    ))}
                </div>
              )}

              <div style={styles.buttonGroup}>
                <button 
                  onClick={() => setShowModal(true)} 
                  style={styles.moreInfoBtn}
                >
                  More Info
                </button>
                <button 
                  onClick={() => setSelectedLocation(null)} 
                  style={styles.closeBtn}
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <MapPin size={48} color="#4a9eff" />
              <h3 style={styles.emptyTitle}>Select a Station</h3>
              <p style={styles.emptyText}>
                Click on any marker to view real-time air quality data from that monitoring station
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ward Detail Modal */}
      {showModal && selectedLocation && (
        <WardDetailModal
          location={selectedLocation}
          onClose={() => setShowModal(false)}
        />
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          input::placeholder {
            color: #666;
          }
          
          button:hover:not(:disabled) {
            opacity: 0.9;
            transform: translateY(-1px);
          }
          
          button:active:not(:disabled) {
            transform: translateY(0);
          }
          
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  loadingContainer: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px'
  },
  loadingText: {
    color: '#999',
    fontSize: '18px'
  },
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    background: 'rgba(26,26,26,0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  headerContent: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  logo: {
    width: '56px',
    height: '56px',
    background: 'linear-gradient(135deg, #4a9eff 0%, #357abd 100%)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#999',
    margin: '4px 0 0 0'
  },
  updateTime: {
    color: '#4a9eff',
    fontSize: '12px'
  },
  headerRight: {
    display: 'flex',
    gap: '12px'
  },
  refreshButton: {
    padding: '12px 20px',
    background: 'rgba(74,158,255,0.2)',
    border: '1px solid #4a9eff',
    borderRadius: '8px',
    color: '#4a9eff',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s'
  },
  loginButton: {
    padding: '12px 24px',
    background: '#4a9eff',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  stats: {
    maxWidth: '1600px',
    margin: '30px auto',
    padding: '0 40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  statCard: {
    background: 'rgba(26,26,26,0.8)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  statLabel: {
    fontSize: '14px',
    color: '#999',
    margin: '0 0 8px 0'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '700',
    margin: 0
  },
  statSubtext: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  searchContainer: {
    maxWidth: '1600px',
    margin: '0 auto 30px',
    padding: '16px 40px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  searchInput: {
    flex: 1,
    background: 'rgba(26,26,26,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    padding: '12px 16px',
    outline: 'none'
  },
  mapWrapper: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '0 40px 40px',
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '20px'
  },
  mapContainer: {
    position: 'relative',
    background: 'rgba(26,26,26,0.8)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.1)',
    minHeight: '600px',
    overflow: 'hidden'
  },
  svg: {
    width: '100%',
    height: 'auto',
    display: 'block'
  },
  legend: {
    position: 'absolute',
    top: '30px',
    right: '30px',
    background: 'rgba(26,26,26,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px',
    minWidth: '200px',
    backdropFilter: 'blur(10px)'
  },
  legendTitle: {
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 12px 0'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  legendDot: {
    width: '16px',
    height: '16px',
    borderRadius: '50%'
  },
  legendLabel: {
    fontSize: '12px',
    flex: 1
  },
  legendRange: {
    fontSize: '11px',
    color: '#999'
  },
  detailsPanel: {
    background: 'rgba(26,26,26,0.8)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    height: 'fit-content',
    position: 'sticky',
    top: '120px'
  },
  details: {},
  detailsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  detailsTitle: {
    fontSize: '24px',
    fontWeight: '600',
    margin: 0
  },
  zoneBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    background: 'rgba(74,158,255,0.2)',
    color: '#4a9eff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  aqiBadge: {
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    marginBottom: '16px'
  },
  aqiNumber: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#fff',
    margin: 0
  },
  aqiLabel: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#fff',
    marginTop: '8px'
  },
  timestamp: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'center',
    marginBottom: '16px'
  },
  adviceBox: {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: 'rgba(74,158,255,0.1)',
    borderRadius: '12px',
    marginBottom: '20px'
  },
  adviceText: {
    fontSize: '14px',
    color: '#fff',
    margin: 0,
    lineHeight: '1.5'
  },
  pollutants: {
    marginBottom: '20px'
  },
  pollutantsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  pollutantRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px'
  },
  pollutantName: {
    fontSize: '13px',
    width: '60px',
    color: '#999'
  },
  pollutantBar: {
    flex: 1,
    height: '6px',
    background: '#0a0a0a',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  pollutantFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s'
  },
  pollutantValue: {
    fontSize: '12px',
    fontWeight: '600',
    width: '50px',
    textAlign: 'right'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  },
  moreInfoBtn: {
    flex: 1,
    padding: '12px',
    background: 'rgba(74,158,255,0.2)',
    border: '1px solid #4a9eff',
    borderRadius: '8px',
    color: '#4a9eff',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  closeBtn: {
    flex: 1,
    padding: '12px',
    background: '#4a9eff',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 20px',
    textAlign: 'center'
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '16px 0 8px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#999',
    lineHeight: '1.5'
  },
  zoomControls: {
    position: 'absolute',
    bottom: '30px',
    right: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: 'rgba(26,26,26,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '8px',
    backdropFilter: 'blur(10px)'
  },
  zoomButton: {
    width: '40px',
    height: '40px',
    background: '#2a2a2a',
    border: '1px solid #4a9eff',
    borderRadius: '6px',
    color: '#4a9eff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s'
  },
  zoomLevel: {
    width: '40px',
    height: '30px',
    background: '#0a0a0a',
    border: '1px solid rgba(74,158,255,0.3)',
    borderRadius: '4px',
    color: '#4a9eff',
    fontSize: '11px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resetButton: {
    width: '40px',
    height: '40px',
    background: '#2a2a2a',
    border: '1px solid rgba(74,158,255,0.5)',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s'
  }
};

export default DelhiAQIHome;