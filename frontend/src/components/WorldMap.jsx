import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import GlassCard from "./GlassCard";
import { Map, Loader2, Info, Compass, X, TrendingUp, Users, DollarSign, Activity } from "lucide-react";

// ─── Expanded World City Dataset ─────────────────────────────────────────────
// SVG ViewBox: 0 0 1000 500
// Longitude → x: (lng + 180) / 360 * 1000
// Latitude  → y: (90 - lat)  / 180 * 500
const lngToX = (lng) => ((lng + 180) / 360) * 1000;
const latToY = (lat) => ((90 - lat) / 180) * 500;

export const CITY_COORDS = {
  // ── North America ──────────────────────────────────────────────
  "New York": { x: lngToX(-74.01), y: latToY(40.71), country: "United States", region: "North America" },
  "San Francisco": { x: lngToX(-122.42), y: latToY(37.77), country: "United States", region: "North America" },
  "Los Angeles": { x: lngToX(-118.24), y: latToY(34.05), country: "United States", region: "North America" },
  "Chicago": { x: lngToX(-87.63), y: latToY(41.88), country: "United States", region: "North America" },
  "Seattle": { x: lngToX(-122.33), y: latToY(47.61), country: "United States", region: "North America" },
  "Austin": { x: lngToX(-97.74), y: latToY(30.27), country: "United States", region: "North America" },
  "Toronto": { x: lngToX(-79.38), y: latToY(43.65), country: "Canada", region: "North America" },
  "Vancouver": { x: lngToX(-123.12), y: latToY(49.25), country: "Canada", region: "North America" },
  "Mexico City": { x: lngToX(-99.13), y: latToY(19.43), country: "Mexico", region: "North America" },

  // ── South America ──────────────────────────────────────────────
  "São Paulo": { x: lngToX(-46.63), y: latToY(-23.55), country: "Brazil", region: "South America" },
  "Rio de Janeiro": { x: lngToX(-43.17), y: latToY(-22.91), country: "Brazil", region: "South America" },
  "Buenos Aires": { x: lngToX(-58.38), y: latToY(-34.61), country: "Argentina", region: "South America" },
  "Bogotá": { x: lngToX(-74.08), y: latToY(4.71), country: "Colombia", region: "South America" },
  "Lima": { x: lngToX(-77.03), y: latToY(-12.05), country: "Peru", region: "South America" },
  "Santiago": { x: lngToX(-70.67), y: latToY(-33.46), country: "Chile", region: "South America" },

  // ── Europe ─────────────────────────────────────────────────────
  "London": { x: lngToX(-0.13), y: latToY(51.51), country: "United Kingdom", region: "Europe" },
  "Berlin": { x: lngToX(13.40), y: latToY(52.52), country: "Germany", region: "Europe" },
  "Paris": { x: lngToX(2.35), y: latToY(48.86), country: "France", region: "Europe" },
  "Amsterdam": { x: lngToX(4.90), y: latToY(52.37), country: "Netherlands", region: "Europe" },
  "Stockholm": { x: lngToX(18.07), y: latToY(59.33), country: "Sweden", region: "Europe" },
  "Madrid": { x: lngToX(-3.70), y: latToY(40.42), country: "Spain", region: "Europe" },
  "Milan": { x: lngToX(9.19), y: latToY(45.46), country: "Italy", region: "Europe" },
  "Zürich": { x: lngToX(8.54), y: latToY(47.38), country: "Switzerland", region: "Europe" },
  "Warsaw": { x: lngToX(21.01), y: latToY(52.23), country: "Poland", region: "Europe" },
  "Vienna": { x: lngToX(16.37), y: latToY(48.21), country: "Austria", region: "Europe" },

  // ── Africa ─────────────────────────────────────────────────────
  "Lagos": { x: lngToX(3.38), y: latToY(6.46), country: "Nigeria", region: "Africa" },
  "Nairobi": { x: lngToX(36.82), y: latToY(-1.29), country: "Kenya", region: "Africa" },
  "Cairo": { x: lngToX(31.23), y: latToY(30.06), country: "Egypt", region: "Africa" },
  "Johannesburg": { x: lngToX(28.05), y: latToY(-26.20), country: "South Africa", region: "Africa" },
  "Casablanca": { x: lngToX(-7.59), y: latToY(33.59), country: "Morocco", region: "Africa" },
  "Accra": { x: lngToX(-0.19), y: latToY(5.56), country: "Ghana", region: "Africa" },

  // ── Middle East ────────────────────────────────────────────────
  "Dubai": { x: lngToX(55.30), y: latToY(25.20), country: "UAE", region: "Middle East" },
  "Riyadh": { x: lngToX(46.72), y: latToY(24.69), country: "Saudi Arabia", region: "Middle East" },
  "Tel Aviv": { x: lngToX(34.78), y: latToY(32.08), country: "Israel", region: "Middle East" },
  "Istanbul": { x: lngToX(28.98), y: latToY(41.01), country: "Turkey", region: "Middle East" },

  // ── Asia ───────────────────────────────────────────────────────
  "Tokyo": { x: lngToX(139.69), y: latToY(35.68), country: "Japan", region: "Asia" },
  "Singapore": { x: lngToX(103.82), y: latToY(1.35), country: "Singapore", region: "Asia" },
  "Bangalore": { x: lngToX(77.59), y: latToY(12.97), country: "India", region: "Asia" },
  "Mumbai": { x: lngToX(72.88), y: latToY(19.08), country: "India", region: "Asia" },
  "New Delhi": { x: lngToX(77.21), y: latToY(28.63), country: "India", region: "Asia" },
  "Shanghai": { x: lngToX(121.47), y: latToY(31.23), country: "China", region: "Asia" },
  "Beijing": { x: lngToX(116.39), y: latToY(39.91), country: "China", region: "Asia" },
  "Shenzhen": { x: lngToX(114.06), y: latToY(22.54), country: "China", region: "Asia" },
  "Seoul": { x: lngToX(126.98), y: latToY(37.57), country: "South Korea", region: "Asia" },
  "Hong Kong": { x: lngToX(114.17), y: latToY(22.32), country: "Hong Kong", region: "Asia" },
  "Taipei": { x: lngToX(121.57), y: latToY(25.04), country: "Taiwan", region: "Asia" },
  "Bangkok": { x: lngToX(100.52), y: latToY(13.75), country: "Thailand", region: "Asia" },
  "Kuala Lumpur": { x: lngToX(101.69), y: latToY(3.15), country: "Malaysia", region: "Asia" },
  "Jakarta": { x: lngToX(106.84), y: latToY(-6.21), country: "Indonesia", region: "Asia" },

  // ── Oceania ────────────────────────────────────────────────────
  "Sydney": { x: lngToX(151.21), y: latToY(-33.87), country: "Australia", region: "Oceania" },
  "Melbourne": { x: lngToX(144.96), y: latToY(-37.81), country: "Australia", region: "Oceania" },
  "Auckland": { x: lngToX(174.77), y: latToY(-36.86), country: "New Zealand", region: "Oceania" },
};

export const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Energy"];

// ─── Industry Color Map ────────────────────────────────────────────────────────
const INDUSTRY_COLORS = {
  Technology: "#22d3ee",
  Finance: "#a78bfa",
  Healthcare: "#34d399",
  Retail: "#fb923c",
  Manufacturing: "#94a3b8",
  Energy: "#facc15",
};

const WorldMap = () => {
  const [businesses, setBusinesses] = useState([]);
  const [migrations, setMigrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCity, setHoveredCity] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [viewBox, setViewBox] = useState("0 0 1000 500");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bizRes = await api.get("/businesses");
        setBusinesses(bizRes.data);

        const logsRes = await api.get("/simulation/logs");
        const recentMigrations = logsRes.data
          .filter((l) => l.category === "migration")
          .map((m) => {
            const msg = m.message;
            const regex = /from ([A-Za-z\s]+) to ([A-Za-z\s]+) seeking/i;
            const match = msg.match(regex);
            if (match) {
              const fromCity = match[1].trim();
              const toCity = match[2].trim();
              if (CITY_COORDS[fromCity] && CITY_COORDS[toCity]) {
                return { agent: msg.split(" migrated")[0].replace("AI Agent ", ""), from: fromCity, to: toCity, id: m.id };
              }
            }
            return null;
          })
          .filter(Boolean)
          .slice(0, 10);

        setMigrations(recentMigrations);
      } catch (err) {
        console.error("Error fetching map data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ─── Stats per city ───────────────────────────────────────────
  const getCityStats = (city) => {
    const cityBizs = businesses.filter((b) => b.city === city && b.is_active !== false);
    const activeCount = cityBizs.length;
    const totalEmployees = cityBizs.reduce((acc, b) => acc + (b.employees || 0), 0);
    const totalRev = cityBizs.reduce((acc, b) => acc + (b.revenue || 0), 0);
    const avgRisk = activeCount
      ? cityBizs.reduce((acc, b) => acc + (b.risk_level || 0), 0) / activeCount
      : 0;
    let health = 50;
    if (activeCount > 0) {
      const avgPF = cityBizs.reduce((acc, b) => acc + (b.revenue || 0) / Math.max(b.expenses || 1, 1), 0) / activeCount;
      const avgG = cityBizs.reduce((acc, b) => acc + (b.growth_rate || 0), 0) / activeCount;
      health = Math.max(5, Math.min(100, avgPF * 50 + avgG * 200));
    }
    return { name: city, activeCount, totalEmployees, totalRev, avgRisk, health };
  };

  // ─── Aggregate all cities with businesses ─────────────────────
  const citiesWithBiz = [
    ...new Set(businesses.map((b) => b.city).filter((c) => c && CITY_COORDS[c]))
  ];
  const allDisplayCities = [
    ...new Set([...Object.keys(CITY_COORDS), ...citiesWithBiz])
  ].filter((c) => CITY_COORDS[c]);

  const citiesStats = allDisplayCities.map((c) => getCityStats(c));
  const hotspots = citiesStats.filter((c) => c.health > 60 && c.activeCount > 1);

  const activeCityData = selectedCity ? getCityStats(selectedCity) : null;
  const activeCityBizs = selectedCity
    ? businesses.filter((b) => b.city === selectedCity && b.is_active !== false)
    : [];

  // ─── Handle click on city node ────────────────────────────────
  const handleCityClick = (cityName) => {
    try {
      if (!cityName || !CITY_COORDS[cityName]) return;
      setSelectedCity(cityName === selectedCity ? null : cityName);
      setSelectedBusiness(null);
    } catch (e) {
      console.error("Map city click error:", e);
    }
  };

  // ─── Handle click on individual business marker ───────────────
  const handleBusinessClick = (biz) => {
    try {
      if (!biz) return;
      setSelectedBusiness(biz);
      if (biz.city && CITY_COORDS[biz.city]) {
        setSelectedCity(biz.city);
      }
    } catch (e) {
      console.error("Map business click error:", e);
    }
  };

  // ─── Render city coordinates safely ──────────────────────────
  const safeCoord = (city) => {
    const coord = CITY_COORDS[city];
    if (!coord) return null;
    const x = typeof coord.x === "number" && isFinite(coord.x) ? coord.x : null;
    const y = typeof coord.y === "number" && isFinite(coord.y) ? coord.y : null;
    if (x === null || y === null) return null;
    return { x, y, country: coord.country || "", region: coord.region || "" };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <Loader2 className="animate-spin text-cyan-400" size={42} />
        <p className="text-slate-400 text-sm font-semibold">Loading global coordinates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-2">
          <Map className="text-cyan-400" />
          INTERACTIVE GLOBAL LEDGER MAP
        </h2>
        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
          {allDisplayCities.length} global hubs · {businesses.length} active agents · {migrations.length} migration vectors
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ─── SVG Map ─────────────────────────────────────────── */}
        <GlassCard className="xl:col-span-2 relative overflow-hidden flex flex-col p-4 gap-3">
          {/* Legend */}
          <div className="absolute top-6 left-6 z-10 bg-black/70 backdrop-blur border border-white/10 p-3 rounded-xl text-[11px] space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-neon-cyan animate-pulse" />
              <span className="text-slate-300">Economic Hotspot</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <span className="text-slate-300">Active Business Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="border-t border-dashed border-cyan-400 w-6 inline-block" />
              <span className="text-slate-300">Migration Trace</span>
            </div>
            <div className="mt-1 pt-1 border-t border-white/5 text-slate-500 text-[10px]">Click any node to inspect</div>
          </div>

          {/* Industry legend */}
          <div className="absolute top-6 right-6 z-10 bg-black/70 backdrop-blur border border-white/10 p-3 rounded-xl text-[10px] space-y-1">
            {Object.entries(INDUSTRY_COLORS).map(([ind, color]) => (
              <div key={ind} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                <span className="text-slate-400">{ind}</span>
              </div>
            ))}
          </div>

          <div className="w-full relative aspect-[2/1] bg-slate-950/65 rounded-xl border border-white/5 overflow-hidden mt-2">
            <svg
              ref={svgRef}
              viewBox="0 0 1000 500"
              className="w-full h-full select-none"
              style={{ background: "linear-gradient(180deg, #03050f 0%, #050a1a 100%)" }}
            >
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                </pattern>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#22d3ee" />
                </marker>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                  <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <radialGradient id="oceanGrad" cx="50%" cy="50%" r="70%">
                  <stop offset="0%" stopColor="#0a1628" />
                  <stop offset="100%" stopColor="#030810" />
                </radialGradient>
              </defs>

              {/* Ocean background */}
              <rect width="1000" height="500" fill="url(#oceanGrad)" />
              <rect width="1000" height="500" fill="url(#grid)" />

              {/* ── Continent Outlines (improved shapes) ── */}
              {/* North America */}
              <polygon points="65,55 130,40 200,50 255,65 295,85 300,125 285,175 260,215 235,240 195,255 170,250 140,220 100,195 70,160 50,120 55,85" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="1" />
              {/* Central America */}
              <polygon points="210,235 235,240 240,265 220,280 200,270 195,255" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="0.8" />
              {/* South America */}
              <polygon points="230,280 270,265 310,275 345,310 355,350 345,400 320,440 285,455 255,450 235,410 215,365 205,320 215,290" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="1" />
              {/* Europe */}
              <polygon points="430,50 490,40 520,55 555,50 580,60 590,85 575,100 555,110 530,115 510,130 490,125 470,135 455,130 440,110 430,90" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="1" />
              {/* Scandinavia */}
              <polygon points="480,35 510,25 540,30 560,50 540,60 510,55 485,50" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="0.8" />
              {/* Iberian */}
              <polygon points="430,115 460,105 475,125 465,145 440,150 425,135" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="0.8" />
              {/* Russia / Central Asia */}
              <polygon points="540,30 640,20 780,25 860,40 890,65 870,90 840,95 810,80 780,75 740,70 700,75 660,85 620,80 580,85 550,75 535,60" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="1" />
              {/* Africa */}
              <polygon points="455,145 520,140 565,145 595,155 615,190 620,235 610,285 590,330 555,370 520,385 490,380 465,360 445,325 435,285 430,240 435,200 445,170" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="1" />
              {/* Middle East / Arabian Peninsula */}
              <polygon points="560,135 610,130 640,145 650,170 635,195 605,200 575,190 555,170 550,150" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="0.8" />
              {/* Indian Subcontinent */}
              <polygon points="650,135 700,130 730,140 740,165 735,200 720,230 700,250 680,255 660,235 645,205 640,175 645,150" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="1" />
              {/* Southeast Asia */}
              <polygon points="750,175 800,170 840,185 850,210 830,230 800,235 770,225 745,205 740,190" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="1" />
              {/* Japan */}
              <polygon points="850,130 870,120 890,130 885,160 870,175 855,165 840,145" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="0.8" />
              {/* Australia */}
              <polygon points="775,325 840,315 900,330 920,360 910,400 880,420 840,415 800,400 775,370 765,345" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="1" />
              {/* New Zealand */}
              <polygon points="930,370 945,360 955,380 945,400 930,395" fill="rgba(255,255,255,0.018)" stroke="rgba(100,180,255,0.09)" strokeWidth="0.8" />

              {/* ── Migration Trace Lines ── */}
              {migrations.map((mig) => {
                const from = safeCoord(mig.from);
                const to = safeCoord(mig.to);
                if (!from || !to) return null;
                const dr = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
                const pathStr = `M ${from.x} ${from.y} A ${dr} ${dr} 0 0 1 ${to.x} ${to.y}`;
                return (
                  <path
                    key={mig.id}
                    d={pathStr}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    strokeDasharray="6 4"
                    markerEnd="url(#arrow)"
                    opacity="0.65"
                    style={{ strokeDashoffset: 100, animation: "dash 5s linear infinite" }}
                  />
                );
              })}

              {/* ── City Node Markers ── */}
              {allDisplayCities.map((c) => {
                const coord = safeCoord(c);
                if (!coord) return null;
                const stats = getCityStats(c);
                const isHotspot = hotspots.some((h) => h.name === c);
                const isSelected = selectedCity === c;
                const hasAgents = stats.activeCount > 0;

                return (
                  <g
                    key={c}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => setHoveredCity(c)}
                    onMouseLeave={() => setHoveredCity(null)}
                    onClick={() => handleCityClick(c)}
                  >
                    {/* Hotspot pulse */}
                    {isHotspot && (
                      <circle cx={coord.x} cy={coord.y} r="14" fill="none" stroke="#22d3ee" strokeWidth="1.5" className="animate-ping opacity-40" />
                    )}
                    {/* Outer ring for selected */}
                    {isSelected && (
                      <circle cx={coord.x} cy={coord.y} r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                    )}
                    {/* Main node */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isSelected ? 7.5 : hasAgents ? 6 : 4}
                      fill={isHotspot ? "#06b6d4" : hasAgents ? "#a855f7" : "rgba(148,163,184,0.4)"}
                      stroke={isSelected ? "#ffffff" : "rgba(255,255,255,0.2)"}
                      strokeWidth={isSelected ? 1.8 : 0.8}
                      filter={hasAgents ? "url(#glow)" : undefined}
                    />
                    {/* Agent count badge */}
                    {hasAgents && (
                      <text
                        x={coord.x}
                        y={coord.y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="5"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {stats.activeCount > 9 ? "9+" : stats.activeCount}
                      </text>
                    )}
                    {/* City label */}
                    <text
                      x={coord.x}
                      y={coord.y - 11}
                      textAnchor="middle"
                      fill={isSelected ? "#22d3ee" : "#cbd5e1"}
                      fontSize="8"
                      fontWeight="600"
                      letterSpacing="0.3"
                      className="pointer-events-none"
                      style={{ textShadow: "0 0 6px #000, 0 0 6px #000" }}
                    >
                      {c}
                    </text>
                  </g>
                );
              })}

              {/* ── Individual Business Markers (on lat/lng) ── */}
              {businesses
                .filter((b) => {
                  const lat = parseFloat(b.latitude);
                  const lng = parseFloat(b.longitude);
                  return !isNaN(lat) && !isNaN(lng) && isFinite(lat) && isFinite(lng)
                    && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
                })
                .map((b) => {
                  const bx = lngToX(parseFloat(b.longitude));
                  const by = latToY(parseFloat(b.latitude));
                  const color = INDUSTRY_COLORS[b.industry] || "#94a3b8";
                  const isSelectedBiz = selectedBusiness?.id === b.id;
                  return (
                    <g
                      key={`biz-${b.id}`}
                      style={{ cursor: "pointer" }}
                      onClick={() => handleBusinessClick(b)}
                      onMouseEnter={() => setHoveredCity(b.city)}
                      onMouseLeave={() => setHoveredCity(null)}
                    >
                      <circle
                        cx={bx}
                        cy={by}
                        r={isSelectedBiz ? 4.5 : 3}
                        fill={color}
                        stroke={isSelectedBiz ? "#fff" : "rgba(0,0,0,0.5)"}
                        strokeWidth={isSelectedBiz ? 1.5 : 0.5}
                        opacity="0.85"
                      />
                    </g>
                  );
                })}
            </svg>

            {/* ── Hover Tooltip ── */}
            {hoveredCity && CITY_COORDS[hoveredCity] && (() => {
              const coord = safeCoord(hoveredCity);
              const stats = getCityStats(hoveredCity);
              if (!coord) return null;
              // compute approximate pixel position from svg viewBox
              return (
                <div
                  className="absolute z-20 bg-slate-950/95 border border-white/15 p-3 rounded-xl pointer-events-none text-xs w-52 shadow-glass"
                  style={{
                    left: `${Math.min(75, (coord.x / 1000) * 100)}%`,
                    top: `${Math.min(65, (coord.y / 500) * 100)}%`,
                    transform: "translate(-50%, -110%)",
                  }}
                >
                  <div className="font-extrabold text-slate-100 flex items-center justify-between mb-1.5">
                    <span>{hoveredCity}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{CITY_COORDS[hoveredCity].country}</span>
                  </div>
                  <div className="space-y-1 border-t border-white/5 pt-2 font-mono text-[10px] text-slate-300">
                    <div className="flex justify-between"><span>Agents:</span>      <span className="text-slate-100 font-bold">{stats.activeCount}</span></div>
                    <div className="flex justify-between"><span>Workforce:</span>   <span className="text-slate-100 font-bold">{stats.totalEmployees.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Revenue:</span>     <span className="text-emerald-400">${Math.round(stats.totalRev).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Health Index:</span><span className="text-cyan-400 font-bold">{stats.health.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Avg Risk:</span>    <span className={stats.avgRisk > 50 ? "text-rose-400 font-bold" : "text-slate-400"}>{stats.avgRisk.toFixed(1)}%</span></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </GlassCard>

        {/* ─── Hub Telemetry Panel ──────────────────────────────── */}
        <GlassCard className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
            <Compass className="text-purple-400 animate-spin" style={{ animationDuration: "6s" }} size={18} />
            <h4 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">Hub Telemetry</h4>
          </div>

          {/* Selected Business Panel */}
          {selectedBusiness && (
            <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-100">{selectedBusiness.name}</span>
                <button onClick={() => setSelectedBusiness(null)} className="text-slate-500 hover:text-slate-200">
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1"><span style={{ color: INDUSTRY_COLORS[selectedBusiness.industry] || "#94a3b8" }}>●</span>{selectedBusiness.industry}</div>
                <div>{selectedBusiness.city}, {selectedBusiness.country}</div>
                <div className="flex items-center gap-1"><Users size={10} />{selectedBusiness.employees} staff</div>
                <div className="flex items-center gap-1"><DollarSign size={10} />${Math.round(selectedBusiness.revenue || 0).toLocaleString()}</div>
                <div className="flex items-center gap-1"><TrendingUp size={10} />{((selectedBusiness.growth_rate || 0) * 100).toFixed(1)}% growth</div>
                <div className="flex items-center gap-1"><Activity size={10} />{(selectedBusiness.risk_level || 0).toFixed(1)}% risk</div>
              </div>
            </div>
          )}

          {!selectedCity ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <Info size={36} className="mb-2 text-slate-600" />
              <span>Select any glowing node on the world map to view detailed regional business catalog and migration flows.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-200">{selectedCity}</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {CITY_COORDS[selectedCity]?.country || ""} · {CITY_COORDS[selectedCity]?.region || ""}
                  </p>
                </div>
                <button onClick={() => { setSelectedCity(null); setSelectedBusiness(null); }} className="text-slate-500 hover:text-slate-200">
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Agents</span>
                  <p className="text-lg font-bold text-slate-200 mt-0.5">{activeCityData?.activeCount || 0}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Health Score</span>
                  <p className="text-lg font-bold text-cyan-400 mt-0.5">{(activeCityData?.health || 0).toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Workforce</span>
                  <p className="text-base font-bold text-slate-300 mt-0.5">{(activeCityData?.totalEmployees || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Avg Risk</span>
                  <p className={`text-base font-bold mt-0.5 ${(activeCityData?.avgRisk || 0) > 50 ? "text-rose-400" : "text-slate-300"}`}>
                    {(activeCityData?.avgRisk || 0).toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Active Corporations</h5>
                {activeCityBizs.length === 0 ? (
                  <p className="text-xs text-slate-600">No active businesses in this hub.</p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {activeCityBizs.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBusiness(b)}
                        className={`p-2 border rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors ${selectedBusiness?.id === b.id ? "bg-purple-500/15 border-purple-500/30" : "bg-white/2 border-white/5 hover:bg-white/5"}`}
                      >
                        <div>
                          <p className="font-bold text-slate-300">{b.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: INDUSTRY_COLORS[b.industry] || "#94a3b8" }} />
                            <span className="text-[9px] text-slate-500 uppercase font-semibold">{b.industry}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-300">{b.employees} workers</p>
                          <span className="text-[9px] text-emerald-400">${Math.round(b.revenue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* ─── Migration Vectors ──────────────────────────────────── */}
      <GlassCard>
        <h4 className="text-sm font-extrabold uppercase text-slate-300 tracking-wider mb-3">Recent Migration Vectors</h4>
        <div className="space-y-2 text-xs">
          {migrations.length === 0 ? (
            <p className="text-slate-500 text-center py-6">No recent migrations. Advance the simulation timeline to trigger relocations.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {migrations.map((mig) => (
                <div
                  key={mig.id}
                  className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/8 transition-colors"
                >
                  <div>
                    <span className="font-bold text-cyan-400">{mig.agent}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Corporate Relocation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 text-xs font-semibold">{mig.from}</span>
                    <span className="text-slate-500">➜</span>
                    <span className="text-cyan-400 text-xs font-bold">{mig.to}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default WorldMap;
