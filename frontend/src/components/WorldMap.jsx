import React, { useState, useEffect } from "react";
import api from "../utils/api";
import GlassCard from "./GlassCard";
import { Map, Loader2, Info, Compass, HelpCircle } from "lucide-react";

// World map SVG coordinate mapping for 8 global cities
const CITY_COORDS = {
  "New York": { x: 260, y: 140, country: "United States" },
  "San Francisco": { x: 160, y: 155, country: "United States" },
  "London": { x: 440, y: 105, country: "United Kingdom" },
  "Berlin": { x: 475, y: 105, country: "Germany" },
  "Tokyo": { x: 810, y: 165, country: "Japan" },
  "Singapore": { x: 720, y: 265, country: "Singapore" },
  "Bangalore": { x: 670, y: 225, country: "India" },
  "Sydney": { x: 860, y: 350, country: "Australia" },
};

const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Energy"];

const WorldMap = () => {
  const [businesses, setBusinesses] = useState([]);
  const [migrations, setMigrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCity, setHoveredCity] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bizRes = await api.get("/businesses");
        setBusinesses(bizRes.data);

        // Fetch logs to extract recent migrations
        const logsRes = await api.get("/simulation/logs");
        const recentMigrations = logsRes.data
          .filter((l) => l.category === "migration")
          .map((m) => {
            // Parse message: "AI Agent X migrated from CityA to CityB seeking..."
            const msg = m.message;
            const regex = /from (\w+(?:\s\w+)*) to (\w+(?:\s\w+)*) seeking/i;
            const match = msg.match(regex);
            if (match && CITY_COORDS[match[1]] && CITY_COORDS[match[2]]) {
              return {
                agent: msg.split(" migrated")[0].replace("AI Agent ", ""),
                from: match[1],
                to: match[2],
                id: m.id
              };
            }
            return null;
          })
          .filter(Boolean)
          .slice(0, 8); // show up to 8 recent lines

        setMigrations(recentMigrations);
      } catch (err) {
        console.error("Error fetching map data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
        <Loader2 className="animate-spin text-cyan-400" size={42} />
        <p className="text-slate-400 text-sm font-semibold">Loading map coordinates...</p>
      </div>
    );
  }

  // Calculate city specific stats
  const getCityStats = (city) => {
    const cityBizs = businesses.filter((b) => b.city === city);
    const activeCount = cityBizs.length;
    const totalEmployees = cityBizs.reduce((acc, curr) => acc + curr.employees, 0);
    const totalRev = cityBizs.reduce((acc, curr) => acc + curr.revenue, 0);
    const avgRisk = activeCount
      ? cityBizs.reduce((acc, curr) => acc + curr.risk_level, 0) / activeCount
      : 0;

    // Calculate city health score
    let health = 50.0;
    if (activeCount > 0) {
      const avgProfitFactor = cityBizs.reduce((acc, curr) => acc + curr.revenue / Math.max(curr.expenses, 1.0), 0) / activeCount;
      const avgGrowth = cityBizs.reduce((acc, curr) => acc + curr.growth_rate, 0) / activeCount;
      health = (avgProfitFactor * 50.0) + (avgGrowth * 200.0);
      health = Math.max(5.0, Math.min(100.0, health));
    }

    return {
      name: city,
      activeCount,
      totalEmployees,
      totalRev,
      avgRisk,
      health
    };
  };

  const citiesStats = Object.keys(CITY_COORDS).map((c) => getCityStats(c));

  // Identify Hotspots (Health > 65% and count > 1)
  const hotspots = citiesStats.filter((c) => c.health > 60 && c.activeCount > 2);

  // Active City Data for detail display
  const activeCityData = selectedCity ? getCityStats(selectedCity) : null;
  const activeCityBizs = selectedCity ? businesses.filter((b) => b.city === selectedCity) : [];

  return (
    <div className="space-y-6">
      {/* Brand Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-2">
          <Map className="text-cyan-400" />
          INTERACTIVE GLOBAL LEDGER MAP
        </h2>
        <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
          Visualizing corporate hubs, migration vectors, and economic hotspots
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* World Map SVG Display */}
        <GlassCard className="xl:col-span-2 relative overflow-hidden flex flex-col items-center justify-center p-4">
          {/* Legend Overlay */}
          <div className="absolute top-4 left-4 z-10 space-y-1 bg-black/60 backdrop-blur border border-white/5 p-3 rounded-xl text-[10px]">
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
              <span className="text-slate-300">Active Migration Trace</span>
            </div>
          </div>

          <div className="w-full relative aspect-[2/1] max-w-4xl bg-slate-950/65 rounded-xl border border-white/5 overflow-hidden">
            {/* SVG Canvas */}
            <svg
              viewBox="0 0 1000 500"
              className="w-full h-full select-none"
              style={{ background: "#05060b" }}
            >
              {/* Background Grid Lines (Sci-Fi Radar Look) */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
                </pattern>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#22d3ee" />
                </marker>
              </defs>
              <rect width="1000" height="500" fill="url(#grid)" />

              {/* Simplified Abstract Continent Outlines */}
              {/* North America */}
              <polygon points="80,100 240,60 300,120 280,180 250,220 180,240 120,200 60,140" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              {/* South America */}
              <polygon points="260,250 320,260 350,300 320,380 270,440 250,440 230,340" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              {/* Eurasia / Africa */}
              <polygon points="400,60 520,40 680,40 850,50 890,120 840,240 760,220 620,180 500,220 420,220" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <polygon points="400,230 480,240 540,270 540,320 480,380 430,380 380,300" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              {/* Australia */}
              <polygon points="760,320 840,300 890,340 870,400 780,390" fill="rgba(255,255,255,0.015)" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

              {/* Draw Migration Trace Lines */}
              {migrations.map((mig) => {
                const fromCoord = CITY_COORDS[mig.from];
                const toCoord = CITY_COORDS[mig.to];
                if (!fromCoord || !toCoord) return null;
                
                // Draw curve path
                const dx = toCoord.x - fromCoord.x;
                const dy = toCoord.y - fromCoord.y;
                const dr = Math.sqrt(dx * dx + dy * dy);
                const pathStr = `M ${fromCoord.x} ${fromCoord.y} A ${dr} ${dr} 0 0 1 ${toCoord.x} ${toCoord.y}`;
                
                return (
                  <path
                    key={mig.id}
                    d={pathStr}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    markerEnd="url(#arrow)"
                    className="opacity-75"
                    style={{
                      strokeDashoffset: 100,
                      animation: "dash 5s linear infinite"
                    }}
                  />
                );
              })}

              {/* Draw City Nodes */}
              {Object.keys(CITY_COORDS).map((c) => {
                const coord = CITY_COORDS[c];
                const stats = getCityStats(c);
                const isHotspot = hotspots.some((h) => h.name === c);
                const isSelected = selectedCity === c;

                return (
                  <g
                    key={c}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredCity(stats)}
                    onMouseLeave={() => setHoveredCity(null)}
                    onClick={() => setSelectedCity(c)}
                  >
                    {/* Glowing pulse rings for hotspots */}
                    {isHotspot && (
                      <circle
                        cx={coord.x}
                        cy={coord.y}
                        r="14"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        className="animate-ping opacity-45"
                      />
                    )}
                    {/* Node Circle */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isSelected ? "8" : "5.5"}
                      fill={isHotspot ? "#06b6d4" : "#a855f7"}
                      stroke={isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.25)"}
                      strokeWidth={isSelected ? "2" : "1"}
                      className="transition-all hover:scale-125"
                    />
                    {/* City Label text */}
                    <text
                      x={coord.x}
                      y={coord.y - 12}
                      textAnchor="middle"
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow"
                    >
                      {c}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredCity && (
              <div
                className="absolute z-20 bg-slate-950/95 border border-white/10 p-3 rounded-xl pointer-events-none text-xs w-48 shadow-glass"
                style={{
                  left: `${CITY_COORDS[hoveredCity.name].x * 0.9}px`,
                  top: `${CITY_COORDS[hoveredCity.name].y * 0.8}px`
                }}
              >
                <div className="font-extrabold text-slate-100 flex items-center justify-between mb-1">
                  <span>{hoveredCity.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    {CITY_COORDS[hoveredCity.name].country}
                  </span>
                </div>
                <div className="space-y-1.5 mt-2 border-t border-white/5 pt-2 font-mono text-[10px] text-slate-300">
                  <div className="flex justify-between">
                    <span>Agents:</span>
                    <span className="text-slate-100 font-bold">{hoveredCity.activeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Workforce:</span>
                    <span className="text-slate-100 font-bold">{hoveredCity.totalEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rev Yield:</span>
                    <span className="text-emerald-400">${Math.round(hoveredCity.totalRev).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Health Index:</span>
                    <span className="text-cyan-400 font-bold">{hoveredCity.health.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Selected Hub telemetry panel */}
        <GlassCard className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 mb-3">
            <Compass className="text-purple-400 animate-spin" style={{ animationDuration: '6s' }} size={18} />
            <h4 className="text-sm font-extrabold uppercase text-slate-200 tracking-wider">Hub Telemetry</h4>
          </div>

          {!selectedCity ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
              <Info size={36} className="mb-2 text-slate-600" />
              <span>Select any glowing node on the world map to view detailed regional business catalog and migration flows.</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* City Title */}
              <div>
                <h3 className="text-lg font-black text-slate-200">{activeCityData?.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Country: {CITY_COORDS[selectedCity].country}
                </p>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Agents</span>
                  <p className="text-lg font-bold text-slate-200 mt-0.5">{activeCityData?.activeCount}</p>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Health Score</span>
                  <p className="text-lg font-bold text-cyan-400 mt-0.5">{activeCityData?.health.toFixed(1)}%</p>
                </div>
              </div>

              {/* Businesses Roster */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Active Corporations</h5>
                {activeCityBizs.length === 0 ? (
                  <p className="text-xs text-slate-600">No active businesses in this hub.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {activeCityBizs.map((b) => (
                      <div key={b.id} className="p-2 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-300">{b.name}</p>
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">{b.industry}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-300">{b.employees} workers</p>
                          <span className="text-[9px] text-emerald-400">${Math.round(b.revenue).toLocaleString()}</span>
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

      {/* Migration logs section */}
      <GlassCard>
        <h4 className="text-sm font-extrabold uppercase text-slate-300 tracking-wider mb-3">
          Recent Migration Vectors
        </h4>
        <div className="space-y-2 text-xs">
          {migrations.length === 0 ? (
            <p className="text-slate-500 text-center py-6">No recent migrations. Advance the simulation timeline to trigger relocations.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {migrations.map((mig) => (
                <div key={mig.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
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

      {/* Custom dynamic dash offset keyframes definition */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default WorldMap;
export { INDUSTRIES };
