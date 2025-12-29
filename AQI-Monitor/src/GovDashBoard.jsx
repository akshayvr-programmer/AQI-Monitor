import React, { useState, useEffect } from 'react';
import { 
  Activity, AlertTriangle, TrendingUp, TrendingDown, MapPin, Users, 
  Factory, Shield, Bell, Zap, Wind, Target, Radio, LogOut, ArrowRight, 
  BarChart3, Clock, Play, Pause, Trash2, CheckCircle, XCircle, Loader
} from 'lucide-react';

const GovDashBoard = () => {
  const [time, setTime] = useState(new Date());
  const [selectedWard, setSelectedWard] = useState(null);
  const [hoveredWard, setHoveredWard] = useState(null);
  
  // Command Queue State
  const [commandQueue, setCommandQueue] = useState([]);
  const [commandHistory, setCommandHistory] = useState([]);
  const [activeCommand, setActiveCommand] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Execute command queue
  useEffect(() => {
    if (commandQueue.length > 0 && !activeCommand) {
      const nextCommand = commandQueue[0];
      executeCommand(nextCommand);
    }
  }, [commandQueue, activeCommand]);

  const wards = [
    { id: 1, name: 'Anand Vihar', aqi: 425, lat: 28.6469, lng: 77.3162, zone: 'East', trend: 'up' },
    { id: 2, name: 'Shahdara', aqi: 378, lat: 28.68, lng: 77.28, zone: 'NE', trend: 'stable' },
    { id: 3, name: 'Chandni Chowk', aqi: 365, lat: 28.65, lng: 77.23, zone: 'Central', trend: 'down' },
    { id: 4, name: 'Rohini', aqi: 356, lat: 28.74, lng: 77.11, zone: 'NW', trend: 'up' },
    { id: 5, name: 'Narela', aqi: 387, lat: 28.85, lng: 77.09, zone: 'North', trend: 'up' },
    { id: 6, name: 'Dwarka', aqi: 276, lat: 28.59, lng: 77.04, zone: 'West', trend: 'down' },
    { id: 7, name: 'Saket', aqi: 234, lat: 28.52, lng: 77.21, zone: 'South', trend: 'stable' },
  ];

  const getAQIColor = (aqi) => {
    if (aqi >= 400) return '#8B0000';
    if (aqi >= 300) return '#cc0000';
    if (aqi >= 200) return '#ff3333';
    if (aqi >= 150) return '#ff6600';
    return '#00cc66';
  };

  const criticalZones = wards.filter(w => w.aqi > 300).length;
  const avgAQI = Math.round(wards.reduce((sum, w) => sum + w.aqi, 0) / wards.length);

  const systemAlerts = [
    { id: 1, time: '12:34:21', level: 'CRITICAL', message: 'Anand Vihar AQI exceeded 400', station: wards[0] },
    { id: 2, time: '11:45:08', level: 'WARNING', message: 'Shahdara trending upward +12%', station: wards[1] },
    { id: 3, time: '10:22:45', level: 'INFO', message: 'Narela critical threshold', station: wards[4] },
  ];

  const quickActions = [
    { id: 1, label: 'DEPLOY SPRINKLERS', icon: <Zap size={16} />, status: 'ready' },
    { id: 2, label: 'ODD-EVEN SCHEME', icon: <Shield size={16} />, status: 'pending' },
    { id: 3, label: 'FACTORY INSPECTION', icon: <Factory size={16} />, status: 'active' },
  ];

  // Generate unique command ID
  const generateCommandId = () => `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Create deployment command
  const createDeploymentCommand = (station) => {
    const command = {
      id: generateCommandId(),
      type: 'EMERGENCY_RESPONSE',
      station: station.name,
      stationId: station.id,
      zone: station.zone,
      aqi: station.aqi,
      status: 'PENDING',
      priority: station.aqi > 400 ? 'CRITICAL' : station.aqi > 300 ? 'HIGH' : 'MEDIUM',
      actions: [
        { id: 1, name: 'ALERT_BROADCAST', status: 'pending', duration: 2000, icon: '🔔' },
        { id: 2, name: 'SPRINKLER_ACTIVATION', status: 'pending', duration: 3000, icon: '💧' },
        { id: 3, name: 'TRAFFIC_CONTROL', status: 'pending', duration: 4000, icon: '🚦' },
        { id: 4, name: 'HEALTH_STANDBY', status: 'pending', duration: 2000, icon: '🏥' },
        { id: 5, name: 'FIELD_DEPLOYMENT', status: 'pending', duration: 3000, icon: '👮' }
      ],
      timestamp: new Date(),
      progress: 0,
      canCancel: true
    };

    return command;
  };

  // Handle Deploy Button Click
  const handleDeploy = (station) => {
    const command = createDeploymentCommand(station);
    
    // Add to queue
    setCommandQueue(prev => [...prev, command]);
    
    // Show notification
    console.log(`Command ${command.id} added to queue for ${station.name}`);
  };

  // Execute a command from the queue
  const executeCommand = async (command) => {
    setActiveCommand(command);
    
    // Update command status to EXECUTING
    setCommandQueue(prev => 
      prev.map(cmd => cmd.id === command.id ? { ...cmd, status: 'EXECUTING' } : cmd)
    );

    // Execute each action sequentially
    for (let i = 0; i < command.actions.length; i++) {
      const action = command.actions[i];
      
      // Update action status to executing
      updateActionStatus(command.id, action.id, 'executing');
      
      // Simulate action execution
      await new Promise(resolve => setTimeout(resolve, action.duration));
      
      // Update action status to completed
      updateActionStatus(command.id, action.id, 'completed');
      
      // Update progress
      const progress = ((i + 1) / command.actions.length) * 100;
      updateCommandProgress(command.id, progress);
    }

    // Mark command as completed
    completeCommand(command.id);
  };

  const updateActionStatus = (commandId, actionId, status) => {
    setCommandQueue(prev =>
      prev.map(cmd => {
        if (cmd.id === commandId) {
          return {
            ...cmd,
            actions: cmd.actions.map(action =>
              action.id === actionId ? { ...action, status } : action
            )
          };
        }
        return cmd;
      })
    );
  };

  const updateCommandProgress = (commandId, progress) => {
    setCommandQueue(prev =>
      prev.map(cmd => cmd.id === commandId ? { ...cmd, progress } : cmd)
    );
  };

  const completeCommand = (commandId) => {
    const completedCommand = commandQueue.find(cmd => cmd.id === commandId);
    
    if (completedCommand) {
      // Update to COMPLETED status
      const finalCommand = {
        ...completedCommand,
        status: 'COMPLETED',
        completedAt: new Date()
      };

      // Add to history
      setCommandHistory(prev => [finalCommand, ...prev].slice(0, 10));

      // Remove from queue
      setCommandQueue(prev => prev.filter(cmd => cmd.id !== commandId));

      // Clear active command
      setActiveCommand(null);

      // Auto-remove from history after 30 seconds
      setTimeout(() => {
        setCommandHistory(prev => prev.filter(cmd => cmd.id !== commandId));
      }, 30000);
    }
  };

  const cancelCommand = (commandId) => {
    const command = commandQueue.find(cmd => cmd.id === commandId);
    
    if (command && command.canCancel && command.status === 'PENDING') {
      // Mark as cancelled
      const cancelledCommand = {
        ...command,
        status: 'CANCELLED',
        cancelledAt: new Date()
      };

      // Add to history
      setCommandHistory(prev => [cancelledCommand, ...prev].slice(0, 10));

      // Remove from queue
      setCommandQueue(prev => prev.filter(cmd => cmd.id !== commandId));
    }
  };

  const pauseCommand = (commandId) => {
    setCommandQueue(prev =>
      prev.map(cmd => cmd.id === commandId ? { ...cmd, status: 'PAUSED', canCancel: false } : cmd)
    );
  };

  const resumeCommand = (commandId) => {
    setCommandQueue(prev =>
      prev.map(cmd => cmd.id === commandId ? { ...cmd, status: 'PENDING', canCancel: true } : cmd)
    );
  };

  return (
    <div style={s.container}>
      {/* Status Bar */}
      <div style={s.statusBar}>
        <div style={s.statusLeft}>
          <div style={s.statusDot} />
          <span>SYSTEM ACTIVE</span>
          <span style={s.divider}>|</span>
          <span style={s.time}>{time.toLocaleTimeString('en-IN', { hour12: false })} IST</span>
          <span style={s.divider}>|</span>
          <span style={s.queueInfo}>
            QUEUE: {commandQueue.length} | ACTIVE: {activeCommand ? 1 : 0}
          </span>
        </div>
        <div style={s.statusRight}>
          <Radio size={14} style={{animation: 'pulse 2s infinite'}} />
          <span>LIVE DATA FEED</span>
          <LogOut size={14} style={{cursor: 'pointer', marginLeft: '20px'}} onClick={() => window.location.href = '/'} />
        </div>
      </div>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logo}><Wind size={32} /></div>
          <div>
            <h1 style={s.title}>DELHI AIR QUALITY COMMAND CENTER</h1>
            <p style={s.subtitle}>Real-time Atmospheric Monitoring & Control System</p>
          </div>
        </div>
        <div style={s.headerStats}>
          <div style={s.headerStat}>
            <span style={s.statLabel}>STATUS</span>
            <span style={{...s.statVal, color: '#00ff00'}}>OPERATIONAL</span>
          </div>
          <div style={s.headerStat}>
            <span style={s.statLabel}>LATENCY</span>
            <span style={{...s.statVal, color: '#00ff00'}}>0.8s</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={s.statsGrid}>
        <div style={{...s.statCard, borderLeft: '3px solid #cc0000'}}>
          <div style={s.statHeader}>
            <AlertTriangle size={20} color="#cc0000" />
            <span>CRITICAL ZONES</span>
          </div>
          <div style={s.statValue}>{criticalZones}</div>
          <div style={s.statFooter}>AQI {'>'} 300</div>
        </div>
        
        <div style={{...s.statCard, borderLeft: '3px solid #4a9eff'}}>
          <div style={s.statHeader}>
            <Target size={20} color="#4a9eff" />
            <span>AVG AQI</span>
          </div>
          <div style={{...s.statValue, color: getAQIColor(avgAQI)}}>{avgAQI}</div>
          <div style={s.statFooter}>+12% vs yesterday</div>
        </div>
        
        <div style={{...s.statCard, borderLeft: '3px solid #8f3f97'}}>
          <div style={s.statHeader}>
            <MapPin size={20} color="#8f3f97" />
            <span>STATIONS</span>
          </div>
          <div style={s.statValue}>{wards.length}</div>
          <div style={s.statFooter}>All online</div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={s.mainGrid}>
        {/* Map */}
        <div style={s.mapSection}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}><MapPin size={18} /> LIVE SITUATION MAP</span>
          </div>
          
          <div style={s.mapContainer}>
            <svg viewBox="0 0 1000 800" style={s.svg}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Grid */}
              <g opacity="0.1">
                {[...Array(25)].map((_, i) => (
                  <React.Fragment key={i}>
                    <line x1={i * 40} y1="0" x2={i * 40} y2="800" stroke="#00ff00" strokeWidth="0.5"/>
                    <line x1="0" y1={i * 32} x2="1000" y2={i * 32} stroke="#00ff00" strokeWidth="0.5"/>
                  </React.Fragment>
                ))}
              </g>

              {/* Markers */}
              {wards.map(ward => {
                const x = (ward.lng - 76.85) * 1400;
                const y = 800 - (ward.lat - 28.4) * 1500;
                const isHovered = hoveredWard === ward.id;
                const radius = isHovered ? 20 : 14;
                const hasActiveCommand = commandQueue.some(cmd => cmd.stationId === ward.id);

                return (
                  <g key={ward.id}>
                    {ward.aqi > 350 && (
                      <circle cx={x} cy={y} r={radius + 12} fill={getAQIColor(ward.aqi)} opacity="0.2" style={{animation: 'pulse 2s infinite'}}/>
                    )}

                    {hasActiveCommand && (
                      <circle cx={x} cy={y} r={radius + 8} fill="none" stroke="#4a9eff" strokeWidth="2" opacity="0.8">
                        <animate attributeName="r" from={radius + 8} to={radius + 18} dur="2s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite"/>
                      </circle>
                    )}
                    
                    <circle
                      cx={x} cy={y} r={radius}
                      fill={getAQIColor(ward.aqi)}
                      stroke={hasActiveCommand ? "#4a9eff" : "#00ff00"}
                      strokeWidth={hasActiveCommand ? "3" : isHovered ? "2" : "1"}
                      style={{cursor: 'pointer', transition: 'all 0.3s', filter: isHovered ? 'url(#glow)' : 'none'}}
                      onMouseEnter={() => setHoveredWard(ward.id)}
                      onMouseLeave={() => setHoveredWard(null)}
                      onClick={() => setSelectedWard(ward)}
                    />
                    
                    <text x={x} y={y + 4} textAnchor="middle" fill="#000" fontSize="10" fontWeight="bold" fontFamily="monospace" pointerEvents="none">
                      {ward.aqi}
                    </text>

                    {isHovered && (
                      <g>
                        <rect x={x - 50} y={y - radius - 40} width="100" height="32" rx="4" fill="#000" stroke="#00ff00" strokeWidth="1" opacity="0.95"/>
                        <text x={x} y={y - radius - 24} textAnchor="middle" fill="#00ff00" fontSize="10" fontFamily="monospace" fontWeight="bold">{ward.name}</text>
                        <text x={x} y={y - radius - 12} textAnchor="middle" fill={getAQIColor(ward.aqi)} fontSize="11" fontFamily="monospace" fontWeight="bold">AQI: {ward.aqi}</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            <div style={s.legend}>
              <div style={s.legendTitle}>THREAT LEVELS</div>
              {[
                { label: 'CRITICAL', color: '#cc0000', range: '300+' },
                { label: 'UNHEALTHY', color: '#ff6600', range: '200-300' },
                { label: 'GOOD', color: '#00cc66', range: '0-100' },
              ].map(item => (
                <div key={item.label} style={s.legendItem}>
                  <div style={{...s.legendDot, background: item.color}} />
                  <span style={s.legendLabel}>{item.label}</span>
                  <span style={s.legendRange}>{item.range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={s.rightPanel}>
          {/* Command Queue */}
          {commandQueue.length > 0 && (
            <div style={s.commandQueueSection}>
              <div style={s.sectionHeader}>
                <span style={s.sectionTitle}>
                  <Activity size={18} /> COMMAND QUEUE ({commandQueue.length})
                </span>
                {activeCommand && <Loader size={16} style={{animation: 'spin 1s linear infinite'}} />}
              </div>
              <div style={s.commandList}>
                {commandQueue.map(command => (
                  <div key={command.id} style={{
                    ...s.commandItem,
                    borderLeft: `3px solid ${
                      command.status === 'EXECUTING' ? '#4a9eff' :
                      command.priority === 'CRITICAL' ? '#cc0000' :
                      command.priority === 'HIGH' ? '#ff6600' : '#ffaa00'
                    }`
                  }}>
                    <div style={s.commandHeader}>
                      <div style={s.commandId}>{command.id}</div>
                      <div style={{
                        ...s.commandStatus,
                        background: command.status === 'EXECUTING' ? '#4a9eff20' : 
                                   command.status === 'PAUSED' ? '#ffaa0020' : '#00ff0020',
                        color: command.status === 'EXECUTING' ? '#4a9eff' :
                               command.status === 'PAUSED' ? '#ffaa00' : '#00ff00'
                      }}>
                        {command.status}
                      </div>
                    </div>

                    <div style={s.commandInfo}>
                      <div style={s.commandStation}>{command.station}</div>
                      <div style={s.commandMeta}>
                        ZONE: {command.zone} | AQI: {command.aqi} | PRIORITY: {command.priority}
                      </div>
                    </div>

                    {command.status === 'EXECUTING' && (
                      <div style={s.progressBar}>
                        <div style={{...s.progressFill, width: `${command.progress}%`}} />
                        <div style={s.progressText}>{Math.round(command.progress)}%</div>
                      </div>
                    )}

                    <div style={s.commandActions}>
                      {command.actions.map(action => (
                        <div key={action.id} style={{
                          ...s.actionChip,
                          background: action.status === 'completed' ? '#00ff0020' :
                                     action.status === 'executing' ? '#4a9eff20' : '#00ff0010',
                          border: action.status === 'completed' ? '1px solid #00ff00' :
                                 action.status === 'executing' ? '1px solid #4a9eff' : '1px solid #00ff0030'
                        }}>
                          <span style={{fontSize: '12px'}}>{action.icon}</span>
                          {action.status === 'completed' && <CheckCircle size={12} color="#00ff00" />}
                          {action.status === 'executing' && <Loader size={12} color="#4a9eff" style={{animation: 'spin 1s linear infinite'}} />}
                        </div>
                      ))}
                    </div>

                    {command.status === 'PENDING' && (
                      <div style={s.commandControls}>
                        <button 
                          style={s.controlBtn}
                          onClick={() => cancelCommand(command.id)}
                          title="Cancel Command"
                        >
                          <Trash2 size={14} color="#ff3333" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          <div style={s.alertsSection}>
            <div style={s.sectionHeader}>
              <span style={s.sectionTitle}><Bell size={18} /> LIVE ALERTS</span>
              <div style={{...s.statusDot, animation: 'pulse 1s infinite'}} />
            </div>
            <div style={s.alertsList}>
              {systemAlerts.map(alert => (
                <div key={alert.id} style={{
                  ...s.alertItem,
                  borderLeft: `3px solid ${alert.level === 'CRITICAL' ? '#ff3333' : alert.level === 'WARNING' ? '#ffaa00' : '#4a9eff'}`
                }}>
                  <div style={s.alertHeader}>
                    <span style={s.alertTime}>[{alert.time}]</span>
                    <span style={{...s.alertLevel, color: alert.level === 'CRITICAL' ? '#ff3333' : '#ffaa00'}}>{alert.level}</span>
                  </div>
                  <p style={s.alertMessage}>{alert.message}</p>
                  <button 
                    style={s.alertBtn}
                    onClick={() => handleDeploy(alert.station)}
                    disabled={commandQueue.some(cmd => cmd.stationId === alert.station.id)}
                  >
                    {commandQueue.some(cmd => cmd.stationId === alert.station.id) ? 'IN QUEUE' : 'DEPLOY'} 
                    <ArrowRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Command History */}
          {commandHistory.length > 0 && (
            <div style={s.historySection}>
              <div style={s.sectionHeader}>
                <span style={s.sectionTitle}><Clock size={18} /> RECENT COMMANDS</span>
              </div>
              <div style={s.historyList}>
                {commandHistory.slice(0, 3).map(cmd => (
                  <div key={cmd.id} style={s.historyItem}>
                    <div style={{
                      ...s.historyStatus,
                      color: cmd.status === 'COMPLETED' ? '#00ff00' : '#ff3333'
                    }}>
                      {cmd.status === 'COMPLETED' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    </div>
                    <div style={s.historyInfo}>
                      <div style={s.historyStation}>{cmd.station}</div>
                      <div style={s.historyTime}>
                        {cmd.completedAt ? cmd.completedAt.toLocaleTimeString('en-IN', {hour12: false}) : 
                         cmd.cancelledAt ? cmd.cancelledAt.toLocaleTimeString('en-IN', {hour12: false}) : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={s.actionsSection}>
            <div style={s.sectionHeader}>
              <span style={s.sectionTitle}><Zap size={18} /> QUICK ACTIONS</span>
            </div>
            <div style={s.actionsList}>
              {quickActions.map(action => (
                <button key={action.id} style={{
                  ...s.actionBtn,
                  borderLeft: `3px solid ${action.status === 'active' ? '#00ff00' : '#4a9eff'}`
                }}>
                  <div style={s.actionIcon}>{action.icon}</div>
                  <span style={s.actionLabel}>{action.label}</span>
                  <div style={{...s.actionStatus, background: action.status === 'active' ? '#00ff0020' : '#4a9eff20', color: action.status === 'active' ? '#00ff00' : '#4a9eff'}}>
                    {action.status.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

const s = {
  container: { minHeight: '100vh', background: '#000', color: '#00ff00', fontFamily: '"Courier New", monospace' },
  statusBar: { background: '#0a0a0a', borderBottom: '1px solid #00ff0030', padding: '8px 20px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', letterSpacing: '0.5px' },
  statusLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  statusRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#ff3333', boxShadow: '0 0 8px #ff3333' },
  divider: { color: '#00ff0050', margin: '0 8px' },
  time: { color: '#4a9eff', fontWeight: '700' },
  queueInfo: { color: '#ffaa00', fontWeight: '700' },
  header: { padding: '20px 40px', borderBottom: '2px solid #00ff0050', display: 'flex', justifyContent: 'space-between', background: 'linear-gradient(180deg, #0a0a0a 0%, #000 100%)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '20px' },
  logo: { width: '56px', height: '56px', background: 'linear-gradient(135deg, #00ff00 0%, #00cc66 100%)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', boxShadow: '0 0 20px #00ff0050' },
  title: { fontSize: '24px', fontWeight: '700', margin: 0, letterSpacing: '2px', textShadow: '0 0 10px #00ff0050' },
  subtitle: { fontSize: '12px', color: '#00ff0080', margin: '4px 0 0 0', letterSpacing: '1px' },
  headerStats: { display: 'flex', gap: '24px' },
  headerStat: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  statLabel: { fontSize: '10px', color: '#00ff0080', marginBottom: '4px' },
  statVal: { fontSize: '16px', fontWeight: '700' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px 40px' },
  statCard: { background: '#0a0a0a', border: '1px solid #00ff0020', borderRadius: '4px', padding: '16px' },
  statHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '10px', color: '#00ff00' },
  statValue: { fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '8px', textShadow: '0 0 10px currentColor' },
  statFooter: { fontSize: '11px', color: '#00ff0080' },
  mainGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', padding: '20px 40px' },
  mapSection: { background: '#0a0a0a', border: '1px solid #00ff0030', borderRadius: '4px', overflow: 'hidden' },
  sectionHeader: { padding: '12px 16px', borderBottom: '1px solid #00ff0030', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' },
  mapContainer: { position: 'relative', padding: '20px', minHeight: '600px' },
  svg: { width: '100%', height: 'auto' },
  legend: { position: 'absolute', top: '30px', right: '30px', background: '#000', border: '1px solid #00ff00', borderRadius: '4px', padding: '12px' },
  legendTitle: { fontSize: '10px', fontWeight: '700', marginBottom: '12px', color: '#00ff00' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '10px' },
  legendDot: { width: '12px', height: '12px', borderRadius: '50%' },
  legendLabel: { flex: 1 },
  legendRange: { color: '#00ff0080' },
  rightPanel: { display: 'flex', flexDirection: 'column', gap: '20px' },
  
  // Command Queue Styles
  commandQueueSection: { background: '#0a0a0a', border: '1px solid #4a9eff50', borderRadius: '4px', maxHeight: '400px', display: 'flex', flexDirection: 'column' },
  commandList: { padding: '12px', overflowY: 'auto', flex: 1 },
  commandItem: { background: '#000', border: '1px solid #00ff0020', borderRadius: '4px', padding: '12px', marginBottom: '12px' },
  commandHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  commandId: { fontSize: '10px', color: '#4a9eff', fontWeight: '700', letterSpacing: '0.5px' },
  commandStatus: { fontSize: '9px', fontWeight: '700', padding: '4px 8px', borderRadius: '4px', letterSpacing: '0.5px' },
  commandInfo: { marginBottom: '12px' },
  commandStation: { fontSize: '12px', fontWeight: '700', color: '#fff', marginBottom: '4px' },
  commandMeta: { fontSize: '9px', color: '#00ff0080', letterSpacing: '0.5px' },
  progressBar: { position: 'relative', height: '6px', background: '#00ff0010', borderRadius: '3px', marginBottom: '12px', overflow: 'hidden' },
  progressFill: { position: 'absolute', height: '100%', background: 'linear-gradient(90deg, #4a9eff 0%, #00ff00 100%)', transition: 'width 0.3s', boxShadow: '0 0 8px #4a9eff' },
  progressText: { position: 'absolute', top: '-2px', right: '4px', fontSize: '8px', color: '#4a9eff', fontWeight: '700' },
  commandActions: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' },
  actionChip: { padding: '6px 10px', borderRadius: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s' },
  commandControls: { display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid #00ff0010' },
  controlBtn: { background: 'transparent', border: '1px solid #ff333330', borderRadius: '4px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', fontFamily: 'inherit' },
  
  // History Styles
  historySection: { background: '#0a0a0a', border: '1px solid #00ff0030', borderRadius: '4px' },
  historyList: { padding: '12px' },
  historyItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: '#000', border: '1px solid #00ff0010', borderRadius: '4px', marginBottom: '8px' },
  historyStatus: { display: 'flex' },
  historyInfo: { flex: 1 },
  historyStation: { fontSize: '11px', fontWeight: '700', color: '#fff', marginBottom: '2px' },
  historyTime: { fontSize: '9px', color: '#00ff0080' },
  
  alertsSection: { background: '#0a0a0a', border: '1px solid #00ff0030', borderRadius: '4px' },
  alertsList: { padding: '12px', maxHeight: '300px', overflowY: 'auto' },
  alertItem: { background: '#000', border: '1px solid #00ff0020', borderRadius: '4px', padding: '12px', marginBottom: '8px' },
  alertHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  alertTime: { fontSize: '10px', color: '#00ff0080' },
  alertLevel: { fontSize: '10px', fontWeight: '700' },
  alertMessage: { fontSize: '11px', margin: '0 0 8px 0', lineHeight: '1.4' },
  alertBtn: { background: '#ff333320', border: '1px solid #ff3333', borderRadius: '4px', padding: '6px 12px', color: '#ff3333', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700', letterSpacing: '0.5px', fontFamily: 'inherit' },
  actionsSection: { background: '#0a0a0a', border: '1px solid #00ff0030', borderRadius: '4px' },
  actionsList: { padding: '12px' },
  actionBtn: { width: '100%', background: '#000', border: '1px solid #00ff0020', borderRadius: '4px', padding: '12px', marginBottom: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s', fontFamily: 'inherit', color: 'inherit' },
  actionIcon: { width: '32px', height: '32px', background: '#00ff0010', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  actionLabel: { flex: 1, fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', textAlign: 'left' },
  actionStatus: { padding: '4px 8px', borderRadius: '4px', fontSize: '9px', fontWeight: '700', letterSpacing: '0.5px' },
};

export default GovDashBoard;
