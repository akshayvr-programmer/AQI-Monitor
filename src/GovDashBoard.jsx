import React, { useState, useEffect } from 'react';
import { BarChart3, Wind, AlertTriangle, TrendingUp, MapPin, Activity, Users, Bell, LogOut, Settings, Download } from 'lucide-react';

export default function GovDashBoard() {
  const [selectedWard, setSelectedWard] = useState(null);
  const [hoveredWard, setHoveredWard] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [showNotifications, setShowNotifications] = useState(false);
  const [userName, setUserName] = useState('Admin');

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (email) {
      const name = email.split('@')[0];
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  const wardData = [
    { id: 1, name: 'Narela', aqi: 387, zone: 'North', lat: 28.85, lng: 77.09, population: 285000 },
    { id: 2, name: 'Rohini', aqi: 356, zone: 'North-West', lat: 28.74, lng: 77.11, population: 650000 },
    { id: 3, name: 'Model Town', aqi: 342, zone: 'North', lat: 28.72, lng: 77.19, population: 150000 },
    { id: 4, name: 'Civil Lines', aqi: 298, zone: 'North', lat: 28.68, lng: 77.22, population: 120000 },
    { id: 5, name: 'Karol Bagh', aqi: 312, zone: 'Central', lat: 28.65, lng: 77.19, population: 180000 },
    { id: 6, name: 'Chandni Chowk', aqi: 365, zone: 'Central', lat: 28.65, lng: 77.23, population: 200000 },
    { id: 7, name: 'Connaught Place', aqi: 289, zone: 'Central', lat: 28.63, lng: 77.22, population: 90000 },
    { id: 8, name: 'Dwarka', aqi: 276, zone: 'West', lat: 28.59, lng: 77.04, population: 450000 },
    { id: 9, name: 'Janakpuri', aqi: 298, zone: 'West', lat: 28.62, lng: 77.08, population: 320000 },
    { id: 10, name: 'Mayur Vihar', aqi: 334, zone: 'East', lat: 28.61, lng: 77.29, population: 280000 },
    { id: 11, name: 'Patparganj', aqi: 345, zone: 'East', lat: 28.63, lng: 77.31, population: 240000 },
    { id: 12, name: 'Shahdara', aqi: 378, zone: 'North-East', lat: 28.68, lng: 77.28, population: 360000 },
    { id: 13, name: 'Najafgarh', aqi: 312, zone: 'South-West', lat: 28.61, lng: 76.98, population: 290000 },
    { id: 14, name: 'Vasant Vihar', aqi: 245, zone: 'South-West', lat: 28.55, lng: 77.16, population: 95000 },
    { id: 15, name: 'Hauz Khas', aqi: 267, zone: 'South', lat: 28.55, lng: 77.20, population: 140000 },
    { id: 16, name: 'Greater Kailash', aqi: 254, zone: 'South', lat: 28.55, lng: 77.24, population: 160000 },
    { id: 17, name: 'Mehrauli', aqi: 289, zone: 'South', lat: 28.52, lng: 77.18, population: 180000 },
    { id: 18, name: 'Saket', aqi: 234, zone: 'South', lat: 28.52, lng: 77.21, population: 210000 },
  ];

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';
    if (aqi <= 100) return '#ffff00';
    if (aqi <= 150) return '#ff7e00';
    if (aqi <= 200) return '#ff0000';
    if (aqi <= 300) return '#8f3f97';
    return '#7e0023';
  };

  const getAQICategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const avgAQI = Math.round(wardData.reduce((sum, w) => sum + w.aqi, 0) / wardData.length);
  const criticalWards = wardData.filter(w => w.aqi > 300).length;
  const totalPopulation = wardData.reduce((sum, w) => sum + w.population, 0);

  const notifications = [
    { id: 1, type: 'critical', message: 'AQI in Narela exceeded 380', time: '5 min ago' },
    { id: 2, type: 'warning', message: 'Shahdara reached hazardous levels', time: '15 min ago' },
    { id: 3, type: 'info', message: 'Daily report generated', time: '1 hour ago' },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>🛡</div>
          <div>
            <h1 style={styles.title}>AQI Monitor System</h1>
            <p style={styles.subtitle}>Delhi Air Quality Dashboard</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.iconButton} onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            <span style={styles.badge}>3</span>
          </button>
          <button style={styles.iconButton}>
            <Settings size={20} />
          </button>
          <div style={styles.userProfile}>
            <div style={styles.avatar}>{userName.substring(0, 2).toUpperCase()}</div>
            <span style={styles.userName}>{userName}</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {showNotifications && (
        <div style={styles.notificationsPanel}>
          <h3 style={styles.notificationsTitle}>Notifications</h3>
          {notifications.map(notif => (
            <div key={notif.id} style={styles.notificationItem}>
              <div style={{
                ...styles.notifDot,
                background: notif.type === 'critical' ? '#ff4444' : notif.type === 'warning' ? '#ff7e00' : '#4a9eff'
              }} />
              <div style={styles.notifContent}>
                <p style={styles.notifMessage}>{notif.message}</p>
                <p style={styles.notifTime}>{notif.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
            <Wind size={24} />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Average AQI</p>
            <h3 style={styles.statValue}>{avgAQI}</h3>
            <p style={styles.statChange}>
              <TrendingUp size={14} />
              <span style={{color: '#ff4444'}}>+12% from yesterday</span>
            </p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
            <AlertTriangle size={24} />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Critical Wards</p>
            <h3 style={styles.statValue}>{criticalWards}</h3>
            <p style={styles.statChange}>
              <span style={{color: '#ff4444'}}>AQI {'>'} 300</span>
            </p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'}}>
            <MapPin size={24} />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Total Wards</p>
            <h3 style={styles.statValue}>{wardData.length}</h3>
            <p style={styles.statChange}>
              <span style={{color: '#00cc66'}}>All monitored</span>
            </p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statIcon, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>
            <Users size={24} />
          </div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Affected Population</p>
            <h3 style={styles.statValue}>{(totalPopulation / 1000000).toFixed(1)}M</h3>
            <p style={styles.statChange}>
              <span style={{color: '#999'}}>Across Delhi</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Map Section */}
        <div style={styles.mapSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Interactive Ward Map</h2>
            <div style={styles.headerActions}>
              <div style={styles.timeSelector}>
                {['24h', '7d', '30d'].map(range => (
                  <button
                    key={range}
                    style={{
                      ...styles.timeButton,
                      ...(timeRange === range ? styles.timeButtonActive : {})
                    }}
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <button style={styles.downloadButton}>
                <Download size={18} />
              </button>
            </div>
          </div>

          {/* MAP SVG - SEE FULL CODE IN ARTIFACT */}
          <div style={styles.mapContainer}>
            <svg viewBox="0 0 800 600" style={styles.svg}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <g opacity="0.1">
                {[...Array(20)].map((_, i) => (
                  <React.Fragment key={i}>
                    <line x1={i * 40} y1="0" x2={i * 40} y2="600" stroke="#666" strokeWidth="0.5"/>
                    <line x1="0" y1={i * 30} x2="800" y2={i * 30} stroke="#666" strokeWidth="0.5"/>
                  </React.Fragment>
                ))}
              </g>

              {wardData.map(ward => {
                const x = (ward.lng - 76.8) * 1200;
                const y = 600 - (ward.lat - 28.4) * 1200;
                const radius = hoveredWard === ward.id || selectedWard?.id === ward.id ? 35 : 25;
                const isHovered = hoveredWard === ward.id;
                const isSelected = selectedWard?.id === ward.id;

                return (
                  <g key={ward.id}>
                    {ward.aqi > 300 && (
                      <circle cx={x} cy={y} r={radius + 10} fill={getAQIColor(ward.aqi)} opacity="0.2" style={{animation: 'pulse 2s infinite'}}/>
                    )}
                    <circle
                      cx={x} cy={y} r={radius}
                      fill={getAQIColor(ward.aqi)}
                      opacity={isHovered || isSelected ? 1 : 0.85}
                      stroke={isSelected ? '#ffffff' : 'transparent'}
                      strokeWidth="3"
                      style={{cursor: 'pointer', transition: 'all 0.3s ease', filter: isHovered || isSelected ? 'url(#glow)' : 'none'}}
                      onMouseEnter={() => setHoveredWard(ward.id)}
                      onMouseLeave={() => setHoveredWard(null)}
                      onClick={() => setSelectedWard(ward)}
                    />
                    {(isHovered || isSelected) && (
                      <g>
                        <rect x={x - 40} y={y - radius - 35} width="80" height="28" rx="4" fill="#1a1a1a" opacity="0.95"/>
                        <text x={x} y={y - radius - 20} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">{ward.name}</text>
                        <text x={x} y={y - radius - 8} textAnchor="middle" fill={getAQIColor(ward.aqi)} fontSize="13" fontWeight="bold">AQI: {ward.aqi}</text>
                      </g>
                    )}
                    <text x={x} y={y + 5} textAnchor="middle" fill="#ffffff" fontSize={isHovered || isSelected ? "14" : "12"} fontWeight="bold" pointerEvents="none">{ward.aqi}</text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div style={styles.legend}>
              <h4 style={styles.legendTitle}>AQI Scale</h4>
              {[
                { label: 'Good', range: '0-50', color: '#00e400' },
                { label: 'Moderate', range: '51-100', color: '#ffff00' },
                { label: 'Unhealthy (Sensitive)', range: '101-150', color: '#ff7e00' },
                { label: 'Unhealthy', range: '151-200', color: '#ff0000' },
                { label: 'Very Unhealthy', range: '201-300', color: '#8f3f97' },
                { label: 'Hazardous', range: '301+', color: '#7e0023' },
              ].map(item => (
                <div key={item.label} style={styles.legendItem}>
                  <div style={{...styles.legendColor, background: item.color}} />
                  <span style={styles.legendLabel}>{item.label}</span>
                  <span style={styles.legendRange}>{item.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details Panel */}
        <div style={styles.detailsPanel}>
          <h2 style={styles.sectionTitle}>{selectedWard ? 'Ward Details' : 'Select a Ward'}</h2>
          {selectedWard ? (
            <div style={styles.wardDetails}>
              <div style={styles.wardHeader}>
                <h3 style={styles.wardName}>{selectedWard.name}</h3>
                <span style={{...styles.wardZone, background: getAQIColor(selectedWard.aqi) + '20', color: getAQIColor(selectedWard.aqi)}}>{selectedWard.zone}</span>
              </div>
              <div style={{...styles.aqiBadge, background: getAQIColor(selectedWard.aqi)}}>
                <div style={styles.aqiValue}>{selectedWard.aqi}</div>
                <div style={styles.aqiLabel}>{getAQICategory(selectedWard.aqi)}</div>
              </div>
              <div style={styles.detailsList}>
                <div style={styles.detailItem}>
                  <Users size={18} color="#4a9eff" />
                  <div>
                    <p style={styles.detailLabel}>Population</p>
                    <p style={styles.detailValue}>{(selectedWard.population / 1000).toFixed(0)}K</p>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <MapPin size={18} color="#4a9eff" />
                  <div>
                    <p style={styles.detailLabel}>Coordinates</p>
                    <p style={styles.detailValue}>{selectedWard.lat.toFixed(2)}°N, {selectedWard.lng.toFixed(2)}°E</p>
                  </div>
                </div>
                <div style={styles.detailItem}>
                  <Activity size={18} color="#4a9eff" />
                  <div>
                    <p style={styles.detailLabel}>Pollutants</p>
                    <p style={styles.detailValue}>PM2.5, PM10, NO₂</p>
                  </div>
                </div>
              </div>
              <div style={styles.pollutantBars}>
                <h4 style={styles.pollutantTitle}>Pollutant Breakdown</h4>
                {[
                  { name: 'PM2.5', value: 85 },
                  { name: 'PM10', value: 72 },
                  { name: 'NO₂', value: 58 },
                  { name: 'SO₂', value: 34 },
                  { name: 'CO', value: 41 },
                ].map(pollutant => (
                  <div key={pollutant.name} style={styles.pollutantBar}>
                    <div style={styles.pollutantInfo}>
                      <span style={styles.pollutantName}>{pollutant.name}</span>
                      <span style={styles.pollutantPercent}>{pollutant.value}%</span>
                    </div>
                    <div style={styles.barContainer}>
                      <div style={{...styles.barFill, width: `${pollutant.value}%`, background: pollutant.value > 70 ? '#ff4444' : pollutant.value > 50 ? '#ff7e00' : '#4a9eff'}}/>
                    </div>
                  </div>
                ))}
              </div>
              <button style={styles.actionButton}>
                <BarChart3 size={18} />
                View Detailed Analytics
              </button>
            </div>
          ) : (
            <div style={styles.emptyState}>
              <MapPin size={64} color="#333" />
              <p style={styles.emptyText}>Click on any ward on the map to view detailed information</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// Styles object truncated for brevity - see full implementation
const styles = {
  container: { minHeight: '100vh', background: '#0a0a0a', color: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', position: 'relative' },
  header: { background: '#1a1a1a', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' },
  // ... (add remaining styles from previous artifact)
};