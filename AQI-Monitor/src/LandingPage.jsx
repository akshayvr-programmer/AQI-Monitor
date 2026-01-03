import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Load Tailwind CSS if not already loaded
    if (!document.querySelector('script[src*="tailwindcss"]')) {
      const tailwindScript = document.createElement('script');
      tailwindScript.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(tailwindScript);
    }

    // Load Google Font if not already loaded
    if (!document.querySelector('link[href*="Plus+Jakarta+Sans"]')) {
      const fontLink = document.createElement('link');
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }

    // Apply body styles
    const originalOverflow = document.body.style.overflow;
    document.body.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    document.body.style.background = '#05070a';
    document.body.style.color = '#fff';
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    return () => {
      // Cleanup on unmount
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', width: '100vw' }}>
      <style>{`
        :root {
          --aqi-safe: #10b981;
          --glow-color: rgba(16, 185, 129, 0.2);
        }

        /* Cinematic Atmospheric Haze */
        .haze-container {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        .haze-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          animation: drift 25s infinite alternate ease-in-out;
        }

        .orb-1 { 
          width: 500px; 
          height: 500px; 
          background: #1e293b; 
          top: -10%; 
          left: -10%; 
        }

        .orb-2 { 
          width: 600px; 
          height: 600px; 
          background: #064e3b; 
          bottom: -20%; 
          right: -10%; 
          animation-duration: 35s; 
        }

        .orb-3 { 
          width: 400px; 
          height: 400px; 
          background: #111827; 
          top: 40%; 
          left: 30%; 
          animation-duration: 40s; 
        }

        @keyframes drift {
          from { transform: translate(0, 0) scale(1); }
          to { transform: translate(10%, 15%) scale(1.1); }
        }

        /* Glassmorphism Classes */
        .glass-nav {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .hero-text {
          background: linear-gradient(to bottom right, #ffffff 30%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .btn-glow {
          transition: all 0.5s ease;
        }

        .btn-glow:hover {
          box-shadow: 0 0 25px var(--glow-color);
          transform: translateY(-2px);
        }

        /* Subtle scanning line effect */
        .scanline {
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.2), transparent);
          position: absolute;
          top: 0;
          animation: scan 4s linear infinite;
        }

        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }

        /* Ensure proper spacing and layout */
        .landing-main {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
      `}</style>

      <div className="haze-container">
        <div className="haze-orb orb-1"></div>
        <div className="haze-orb orb-2"></div>
        <div className="haze-orb orb-3"></div>
        <div className="scanline"></div>
      </div>

      <div className="landing-main relative z-10">
        <header className="flex justify-between items-center p-6 md:px-12 glass-nav">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold tracking-widest uppercase">Live Status</span>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="bg-white/5 border border-white/10 px-6 py-2 rounded-full text-xs font-semibold tracking-widest uppercase hover:bg-white hover:text-black transition-all duration-500"
          >
            Government Access
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 relative">
          <div className="mb-8 opacity-50">
            <span className="text-[10px] tracking-[0.5em] uppercase text-green-500 font-bold">
              National Capital Territory
            </span>
          </div>

          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter mb-8 hero-text leading-tight">
            Delhi Pollution <br/> 
            <span className="italic font-light">Monitor</span>
          </h1>

          <p className="max-w-xl text-gray-400 text-base md:text-lg font-light leading-relaxed mb-12">
            A high-precision interface for tracking atmospheric data across 272 wards. 
            Real-time analytics for a healthier tomorrow.
          </p>

          <div className="relative group">
            <div className="absolute -inset-1 bg-green-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <button
              onClick={() => window.location.href = '/dashboard.html'}
              className="relative inline-block bg-white text-black font-bold px-12 py-5 rounded-full text-sm uppercase tracking-widest btn-glow"
            >
              Enter Dashboard
            </button>
          </div>

          <div className="mt-24 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 opacity-40 hover:opacity-100 transition-opacity duration-700">
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest mb-1">Coverage</p>
              <p className="text-xl font-bold">98.2%</p>
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-widest mb-1">Stations</p>
              <p className="text-xl font-bold">30+ Active</p>
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[10px] uppercase tracking-widest mb-1">Update Interval</p>
              <p className="text-xl font-bold">Every 15m</p>
            </div>
          </div>
        </main>

        <footer className="p-8 text-center text-[10px] text-gray-600 tracking-[0.3em] uppercase">
          &copy; 2024 Environment Control Board • Delhi Ward Protocol
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;