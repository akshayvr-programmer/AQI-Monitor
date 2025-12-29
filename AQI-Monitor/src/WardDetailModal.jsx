import React from 'react';
import { X, MapPin, Wind, AlertTriangle, TrendingUp, Calendar, Activity } from 'lucide-react';
import { getAQICategory } from './aqiService';

const WardDetailModal = ({ location, onClose }) => {
  if (!location) return null;

  const aqiCategory = getAQICategory(location.aqi);

  const getHealthRecommendations = (aqi) => {
    if (aqi > 300) {
      return {
        general: 'Avoid all outdoor activities',
        sensitive: 'Remain indoors and keep activity levels low',
        children: 'Schools should cancel outdoor activities',
        elderly: 'Stay indoors with air purifiers running'
      };
    }
    if (aqi > 200) {
      return {
        general: 'Avoid prolonged outdoor exertion',
        sensitive: 'Avoid all outdoor activities',
        children: 'Limit outdoor play time',
        elderly: 'Stay indoors as much as possible'
      };
    }
    if (aqi > 150) {
      return {
        general: 'Consider reducing intense outdoor activities',
        sensitive: 'Limit prolonged outdoor exertion',
        children: 'Reduce outdoor play time',
        elderly: 'Take frequent breaks if outdoors'
      };
    }
    if (aqi > 100) {
      return {
        general: 'Unusually sensitive people should consider reducing prolonged outdoor activities',
        sensitive: 'Consider reducing prolonged outdoor activities',
        children: 'Normal activities are acceptable',
        elderly: 'Normal activities are acceptable with caution'
      };
    }
    return {
      general: 'Air quality is satisfactory',
      sensitive: 'Enjoy normal outdoor activities',
      children: 'Enjoy normal outdoor activities',
      elderly: 'Enjoy normal outdoor activities'
    };
  };

  const recommendations = getHealthRecommendations(location.aqi);

  const getPollutantInfo = (pollutant) => {
    const info = {
      pm25: {
        name: 'PM2.5',
        fullName: 'Fine Particulate Matter',
        description: 'Particles less than 2.5 micrometers in diameter that can penetrate deep into the lungs',
        sources: 'Vehicle emissions, industrial processes, burning of fossil fuels'
      },
      pm10: {
        name: 'PM10',
        fullName: 'Coarse Particulate Matter',
        description: 'Particles less than 10 micrometers in diameter',
        sources: 'Dust, pollen, mold, construction sites, unpaved roads'
      },
      no2: {
        name: 'NO₂',
        fullName: 'Nitrogen Dioxide',
        description: 'A reddish-brown gas that can irritate airways',
        sources: 'Vehicle emissions, power plants, industrial facilities'
      },
      o3: {
        name: 'O₃',
        fullName: 'Ozone',
        description: 'A gas formed when pollutants react in sunlight',
        sources: 'Chemical reactions between NOx and VOCs in sunlight'
      },
      so2: {
        name: 'SO₂',
        fullName: 'Sulfur Dioxide',
        description: 'A colorless gas with a pungent odor',
        sources: 'Burning of fossil fuels, industrial processes'
      },
      co: {
        name: 'CO',
        fullName: 'Carbon Monoxide',
        description: 'A colorless, odorless toxic gas',
        sources: 'Vehicle emissions, incomplete combustion'
      }
    };
    return info[pollutant] || { name: pollutant.toUpperCase(), fullName: 'Unknown', description: '', sources: '' };
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerIcon}>
              <MapPin size={24} color="#fff" />
            </div>
            <div>
              <h2 style={styles.title}>{location.name}</h2>
              <p style={styles.subtitle}>{location.zone} Delhi</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeButton} aria-label="Close modal">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {/* Current AQI */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Activity size={20} color="#4a9eff" />
              <h3 style={styles.sectionTitle}>Current Air Quality</h3>
            </div>
            <div style={{...styles.aqiCard, background: aqiCategory.color}}>
              <div style={styles.aqiValue}>{location.aqi}</div>
              <div style={styles.aqiLevel}>{aqiCategory.level}</div>
              <div style={styles.aqiDescription}>{aqiCategory.description}</div>
            </div>
            {location.time && (
              <p style={styles.timestamp}>
                <Calendar size={14} />
                Last updated: {new Date(location.time).toLocaleString('en-IN', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>

          {/* Pollutant Details */}
          {location.pollutants && Object.keys(location.pollutants).some(key => location.pollutants[key] !== null) && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <Wind size={20} color="#4a9eff" />
                <h3 style={styles.sectionTitle}>Pollutant Breakdown</h3>
              </div>
              <div style={styles.pollutantGrid}>
                {Object.entries(location.pollutants)
                  .filter(([_, value]) => value !== null && value > 0)
                  .map(([key, value]) => {
                    const pollutantInfo = getPollutantInfo(key);
                    const intensity = value > 100 ? 'high' : value > 50 ? 'medium' : 'low';
                    return (
                      <div key={key} style={styles.pollutantCard}>
                        <div style={styles.pollutantHeader}>
                          <span style={styles.pollutantName}>{pollutantInfo.name}</span>
                          <span style={{
                            ...styles.pollutantValue,
                            color: intensity === 'high' ? '#ff4444' : intensity === 'medium' ? '#ff7e00' : '#4a9eff'
                          }}>
                            {value} µg/m³
                          </span>
                        </div>
                        <div style={styles.pollutantFullName}>{pollutantInfo.fullName}</div>
                        <div style={styles.pollutantBar}>
                          <div style={{
                            ...styles.pollutantFill,
                            width: `${Math.min((value / 200) * 100, 100)}%`,
                            background: intensity === 'high' ? '#ff4444' : intensity === 'medium' ? '#ff7e00' : '#4a9eff'
                          }} />
                        </div>
                        {pollutantInfo.description && (
                          <p style={styles.pollutantDescription}>{pollutantInfo.description}</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Health Recommendations */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#4a9eff" />
              <h3 style={styles.sectionTitle}>Health Recommendations</h3>
            </div>
            <div style={styles.recommendationsGrid}>
              <div style={styles.recommendationCard}>
                <div style={styles.recommendationIcon}>👥</div>
                <div style={styles.recommendationTitle}>General Public</div>
                <p style={styles.recommendationText}>{recommendations.general}</p>
              </div>
              <div style={styles.recommendationCard}>
                <div style={styles.recommendationIcon}>🫁</div>
                <div style={styles.recommendationTitle}>Sensitive Groups</div>
                <p style={styles.recommendationText}>{recommendations.sensitive}</p>
              </div>
              <div style={styles.recommendationCard}>
                <div style={styles.recommendationIcon}>👶</div>
                <div style={styles.recommendationTitle}>Children</div>
                <p style={styles.recommendationText}>{recommendations.children}</p>
              </div>
              <div style={styles.recommendationCard}>
                <div style={styles.recommendationIcon}>👴</div>
                <div style={styles.recommendationTitle}>Elderly</div>
                <p style={styles.recommendationText}>{recommendations.elderly}</p>
              </div>
            </div>
          </div>

          {/* Protection Measures */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <TrendingUp size={20} color="#4a9eff" />
              <h3 style={styles.sectionTitle}>Recommended Actions</h3>
            </div>
            <div style={styles.actionsList}>
              {location.aqi > 200 && (
                <>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>Use N95 or P100 masks when going outdoors</span>
                  </div>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>Keep windows and doors closed</span>
                  </div>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>Use air purifiers with HEPA filters indoors</span>
                  </div>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>Avoid using fireplaces or candles</span>
                  </div>
                </>
              )}
              {location.aqi > 100 && location.aqi <= 200 && (
                <>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>Consider wearing a mask outdoors if sensitive</span>
                  </div>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>Limit time spent near busy roads</span>
                  </div>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>Use air purifiers if available</span>
                  </div>
                </>
              )}
              {location.aqi <= 100 && (
                <>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>Enjoy outdoor activities normally</span>
                  </div>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>Maintain good ventilation indoors</span>
                  </div>
                  <div style={styles.actionItem}>
                    <div style={styles.actionDot} />
                    <span>No special precautions needed</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location Info */}
          <div style={styles.section}>
            <div style={styles.infoGrid}>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Coordinates</div>
                <div style={styles.infoValue}>
                  {location.lat.toFixed(4)}°N, {location.lng.toFixed(4)}°E
                </div>
              </div>
              <div style={styles.infoCard}>
                <div style={styles.infoLabel}>Zone</div>
                <div style={styles.infoValue}>{location.zone}</div>
              </div>
              {location.dominantPollutant && (
                <div style={styles.infoCard}>
                  <div style={styles.infoLabel}>Dominant Pollutant</div>
                  <div style={styles.infoValue}>
                    {getPollutantInfo(location.dominantPollutant).name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Data provided by OpenAQ and government monitoring stations. 
            AQI calculated using US EPA standards.
          </p>
          <button onClick={onClose} style={styles.closeFooterButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    overflowY: 'auto'
  },
  modal: {
    background: '#1a1a1a',
    borderRadius: '20px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  },
  header: {
    background: 'rgba(26,26,26,0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  headerIcon: {
    width: '48px',
    height: '48px',
    background: 'linear-gradient(135deg, #4a9eff 0%, #357abd 100%)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    margin: 0,
    color: '#fff'
  },
  subtitle: {
    fontSize: '14px',
    color: '#999',
    margin: '4px 0 0 0'
  },
  closeButton: {
    width: '40px',
    height: '40px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px'
  },
  section: {
    marginBottom: '32px'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#fff'
  },
  aqiCard: {
    borderRadius: '16px',
    padding: '32px',
    textAlign: 'center',
    marginBottom: '12px'
  },
  aqiValue: {
    fontSize: '64px',
    fontWeight: '700',
    color: '#fff',
    margin: 0
  },
  aqiLevel: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#fff',
    marginTop: '8px'
  },
  aqiDescription: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.9)',
    marginTop: '12px',
    lineHeight: '1.5'
  },
  timestamp: {
    fontSize: '13px',
    color: '#999',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifyContent: 'center'
  },
  pollutantGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  pollutantCard: {
    background: 'rgba(26,26,26,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px'
  },
  pollutantHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  pollutantName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff'
  },
  pollutantValue: {
    fontSize: '16px',
    fontWeight: '700'
  },
  pollutantFullName: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '12px'
  },
  pollutantBar: {
    height: '8px',
    background: '#0a0a0a',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px'
  },
  pollutantFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s'
  },
  pollutantDescription: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
    lineHeight: '1.5'
  },
  recommendationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  recommendationCard: {
    background: 'rgba(74,158,255,0.1)',
    border: '1px solid rgba(74,158,255,0.2)',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center'
  },
  recommendationIcon: {
    fontSize: '32px',
    marginBottom: '8px'
  },
  recommendationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a9eff',
    marginBottom: '8px'
  },
  recommendationText: {
    fontSize: '13px',
    color: '#fff',
    margin: 0,
    lineHeight: '1.5'
  },
  actionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  actionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
    color: '#fff',
    padding: '12px',
    background: 'rgba(74,158,255,0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(74,158,255,0.2)'
  },
  actionDot: {
    width: '8px',
    height: '8px',
    background: '#4a9eff',
    borderRadius: '50%',
    flexShrink: 0
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  infoCard: {
    background: 'rgba(26,26,26,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '16px'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '6px'
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff'
  },
  footer: {
    background: 'rgba(26,26,26,0.95)',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    padding: '20px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  footerText: {
    fontSize: '12px',
    color: '#999',
    margin: 0,
    flex: 1
  },
  closeFooterButton: {
    padding: '12px 24px',
    background: '#4a9eff',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default WardDetailModal;