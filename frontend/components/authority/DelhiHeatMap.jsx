"use client";

import { Bell, MapPin, Minus, Plus, RadioTower, WifiOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapNoData } from "@/components/design-system/EmptyStates";

const DELHI_CENTER = [28.6139, 77.209];

const FILTERS = ["All", "Roads", "Water", "Electricity", "Sanitation"];

const HEAT_OPTIONS = {
  radius: 30,
  blur: 25,
  maxZoom: 14,
  max: 1.0,
  gradient: {
    0.0: "#3B82F6",
    0.4: "#8B5CF6",
    0.6: "#F59E0B",
    0.85: "#EF4444",
    1.0: "#7F1D1D",
  },
};

const predictionHotspots = [
  {
    id: "lajpat-nagar",
    locationName: "Lajpat Nagar",
    lat: 28.5708,
    lng: 77.2433,
    issueType: "Road flooding risk",
    confidence: 87,
    timeframeDays: 7,
    department: "PWD",
  },
  {
    id: "pitampura",
    locationName: "Pitampura",
    lat: 28.7033,
    lng: 77.1322,
    issueType: "Sanitation overflow",
    confidence: 82,
    timeframeDays: 14,
    department: "Municipal",
  },
  {
    id: "noida-sector-18",
    locationName: "Noida Sector 18",
    lat: 28.57,
    lng: 77.326,
    issueType: "Electrical hazard",
    confidence: 79,
    timeframeDays: 10,
    department: "Utility Dept",
  },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function generateHeatPoints({
  area,
  category,
  count,
  latMin,
  latMax,
  lngMin,
  lngMax,
  intensityMin,
  intensityMax,
}) {
  return Array.from({ length: count }, (_, index) => {
    const latRatio = ((index * 37) % 100) / 100;
    const lngRatio = ((index * 53 + 17) % 100) / 100;
    const intensityRatio = ((index * 19 + 11) % 100) / 100;
    const intensity = Number(
      (intensityMin + (intensityMax - intensityMin) * intensityRatio).toFixed(2),
    );

    return {
      id: `${area}-${index + 1}`,
      area,
      category,
      lat: Number((latMin + (latMax - latMin) * latRatio).toFixed(4)),
      lng: Number((lngMin + (lngMax - lngMin) * lngRatio).toFixed(4)),
      intensity,
      severity: intensity >= 0.82 ? "critical" : intensity >= 0.55 ? "medium" : "low",
      ageDays: ((index * 5) % 7) + 1,
    };
  });
}

const HEAT_POINTS = [
  ...generateHeatPoints({
    area: "Connaught Place / Central Delhi",
    category: "Roads",
    count: 25,
    latMin: 28.62,
    latMax: 28.64,
    lngMin: 77.2,
    lngMax: 77.22,
    intensityMin: 0.86,
    intensityMax: 1.0,
  }),
  ...generateHeatPoints({
    area: "Chandni Chowk / Old Delhi",
    category: "Sanitation",
    count: 20,
    latMin: 28.65,
    latMax: 28.67,
    lngMin: 77.22,
    lngMax: 77.24,
    intensityMin: 0.82,
    intensityMax: 0.98,
  }),
  ...generateHeatPoints({
    area: "Karol Bagh",
    category: "Roads",
    count: 15,
    latMin: 28.64,
    latMax: 28.66,
    lngMin: 77.18,
    lngMax: 77.2,
    intensityMin: 0.5,
    intensityMax: 0.72,
  }),
  ...generateHeatPoints({
    area: "Rohini",
    category: "Electricity",
    count: 10,
    latMin: 28.72,
    latMax: 28.74,
    lngMin: 77.1,
    lngMax: 77.13,
    intensityMin: 0.48,
    intensityMax: 0.66,
  }),
  ...generateHeatPoints({
    area: "South Delhi",
    category: "Water",
    count: 10,
    latMin: 28.52,
    latMax: 28.57,
    lngMin: 77.2,
    lngMax: 77.25,
    intensityMin: 0.3,
    intensityMax: 0.44,
  }),
];

function toHeatCoordinates(points) {
  return points.map((point) => [point.lat, point.lng, point.intensity]);
}

function ensureDelhiMapStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("civic-delhi-map-styles")) return;

  const style = document.createElement("style");
  style.id = "civic-delhi-map-styles";
  style.textContent = `
    .civic-delhi-map .leaflet-container{height:100%;width:100%;background:#F8FAFC;font-family:var(--font-inter),Inter,system-ui,sans-serif;outline:none}
    .civic-delhi-map .leaflet-control-container{display:none}
    .civic-delhi-map .leaflet-tile{filter:saturate(.8) contrast(.96) brightness(1.02)}
    .civic-delhi-map .leaflet-overlay-pane canvas{mix-blend-mode:multiply}
    .civic-prediction-div-icon{background:transparent;border:0}
    .civic-prediction-marker{position:relative;height:40px;width:40px}
    .civic-prediction-ring{position:absolute;inset:7px;border-radius:999px;background:rgba(220,38,38,.22);animation:pulse-ring 2s infinite ease-out}
    .civic-prediction-ring:nth-child(2){animation-delay:.65s}
    .civic-prediction-dot{position:absolute;left:14px;top:14px;height:12px;width:12px;border-radius:999px;background:#DC2626;border:2px solid #fff;box-shadow:0 0 0 4px rgba(220,38,38,.16),0 10px 28px rgba(220,38,38,.35)}
    @keyframes pulse-ring{0%{transform:scale(.8);opacity:1}100%{transform:scale(2.5);opacity:0}}
    .civic-prediction-popup .leaflet-popup-content-wrapper,.civic-focus-popup .leaflet-popup-content-wrapper{border-radius:16px;background:rgba(255,255,255,.96);border:1px solid rgba(226,232,240,.9);box-shadow:0 20px 60px rgba(15,23,42,.18),0 8px 24px rgba(15,23,42,.1);backdrop-filter:blur(16px)}
    .civic-prediction-popup .leaflet-popup-content,.civic-focus-popup .leaflet-popup-content{margin:0;min-width:240px}
    .civic-prediction-popup .leaflet-popup-tip-container,.civic-focus-popup .leaflet-popup-tip-container{display:none}
    .civic-prediction-popup .leaflet-popup-close-button,.civic-focus-popup .leaflet-popup-close-button{display:none}
    .civic-prediction-popup-card{padding:16px;text-align:left;color:#0F172A}
    .civic-prediction-popup-title{font-size:14px;font-weight:800;letter-spacing:-.02em}
    .civic-prediction-popup-meta{margin-top:8px;font-size:12px;font-weight:700;color:#475569}
    .civic-prediction-popup-time{margin-top:4px;font-size:12px;color:#64748B}
    .civic-prediction-popup-button{margin-top:12px;height:34px;width:100%;border:0;border-radius:10px;background:#1B4FD8;color:#fff;font-size:12px;font-weight:800;cursor:pointer;transition:transform 150ms ease,background 150ms ease}
    .civic-prediction-popup-button:hover{background:#1340B0;transform:translateY(-1px)}
    .civic-focus-marker{position:relative;width:34px;height:42px;animation:civic-bounce-marker .72s ease-out 2}
    .civic-focus-marker::before{content:"";position:absolute;left:5px;top:3px;width:24px;height:24px;border-radius:999px;background:#1B4FD8;border:4px solid #fff;box-shadow:0 10px 28px rgba(27,79,216,.36)}
    .civic-focus-marker::after{content:"";position:absolute;left:13px;top:25px;width:8px;height:8px;background:#1B4FD8;transform:rotate(45deg);border-right:3px solid #fff;border-bottom:3px solid #fff}
    @keyframes civic-bounce-marker{0%,100%{transform:translateY(0) scale(1)}45%{transform:translateY(-18px) scale(1.04)}65%{transform:translateY(0) scale(.98)}82%{transform:translateY(-6px) scale(1.02)}}
  `;
  document.head.appendChild(style);
}

function predictionMarkerHtml() {
  return `
    <div class="civic-prediction-marker">
      <span class="civic-prediction-ring"></span>
      <span class="civic-prediction-ring"></span>
      <span class="civic-prediction-dot"></span>
    </div>
  `;
}

function predictionPopupHtml(hotspot) {
  return `
    <div class="civic-prediction-popup-card">
      <p class="civic-prediction-popup-title">${escapeHtml(hotspot.locationName)}</p>
      <p class="civic-prediction-popup-meta">${escapeHtml(hotspot.issueType)} · ${hotspot.confidence}% confidence</p>
      <p class="civic-prediction-popup-time">Expected within ${hotspot.timeframeDays} days</p>
      <button type="button" class="civic-prediction-popup-button" data-alert-id="${escapeHtml(hotspot.id)}">
        Alert Department
      </button>
    </div>
  `;
}

function focusPopupHtml(complaint) {
  return `
    <div class="p-4 text-left">
      <p class="font-mono text-xs font-bold text-[#1B4FD8]">${escapeHtml(complaint.ticket)}</p>
      <p class="mt-1 text-sm font-bold text-[#0F172A]">${escapeHtml(complaint.issue)} at ${escapeHtml(complaint.location)}</p>
      <p class="mt-2 text-xs leading-5 text-[#475569]">${escapeHtml(complaint.text)}</p>
    </div>
  `;
}

function categoryForComplaint(complaint) {
  const type = String(complaint.type ?? complaint.issue_type ?? "").toLowerCase();
  const department = String(complaint.department ?? complaint.departmentName ?? "").toLowerCase();

  if (type.includes("water") || department.includes("jal") || department.includes("water")) return "Water";
  if (type.includes("electric") || type.includes("streetlight") || department.includes("electric") || department.includes("utility")) return "Electricity";
  if (type.includes("sanitation") || type.includes("garbage") || department.includes("sanitation") || department.includes("municipal")) return "Sanitation";
  return "Roads";
}

function severityForComplaint(complaint) {
  if (complaint.severity) return complaint.severity;

  const score = Number(complaint.severity_score ?? complaint.severityScore ?? 5);
  if (score >= 8) return "critical";
  if (score >= 5) return "medium";
  return "low";
}

function intensityForComplaint(complaint) {
  const priority = Number(complaint.priorityScore ?? complaint.priority_score);
  if (Number.isFinite(priority)) return Math.max(0.3, Math.min(1, priority / 100));

  const severity = Number(complaint.severity_score ?? complaint.severityScore ?? 5);
  return Math.max(0.3, Math.min(1, severity / 10));
}

function ageDaysForComplaint(complaint) {
  const submittedAt = new Date(complaint.submitted_at ?? Date.now()).getTime();
  if (!Number.isFinite(submittedAt)) return 1;

  return Math.max(1, Math.ceil((Date.now() - submittedAt) / (24 * 60 * 60 * 1000)));
}

export default function DelhiHeatMap({
  focusedComplaint,
  heightClass = "h-[480px]",
  className,
  showOverviewControls = true,
  complaintPoints,
  categoryFilter,
  severityFilter = "All",
  daysFilter = 7,
  predictionsVisible,
  onPredictionsVisibleChange,
  onShowAllCategories,
  heatmapData,
  children,
}) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const heatLayerRef = useRef(null);
  const predictionLayerRef = useRef(null);
  const focusMarkerRef = useRef(null);
  const overviewTimerRef = useRef(0);

  const [activeCategory, setActiveCategory] = useState("All");
  const [internalShowPredictions, setInternalShowPredictions] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const selectedCategory = categoryFilter ?? activeCategory;
  const predictionsShown = predictionsVisible ?? internalShowPredictions;
  const sourcePoints = useMemo(() => {
    if (heatmapData?.heatmap_points?.length) {
      return heatmapData.heatmap_points.map((point, index) => ({
        ...point,
        id: point.complaint_id ?? `heatmap-${index}`,
        area: point.location ?? "Delhi",
        category: categoryForComplaint(point),
        lat: Number(point.latitude ?? 28.6139),
        lng: Number(point.longitude ?? 77.209),
        intensity: Math.max(
          0.3,
          Math.min(
            1,
            Number(point.weight ?? (point.priority_score ? point.priority_score / 100 : 0.5)),
          ),
        ),
        severity: severityForComplaint(point),
        ageDays: ageDaysForComplaint(point),
      }));
    }

    if (!complaintPoints?.length) return HEAT_POINTS;

    return complaintPoints.map((complaint, index) => ({
      id: complaint.ticket ?? complaint.ticket_id ?? `complaint-${index}`,
      area: complaint.location ?? complaint.location_name ?? "Delhi",
      category: categoryForComplaint(complaint),
      lat: Number(complaint.lat ?? complaint.latitude ?? 28.6139),
      lng: Number(complaint.lng ?? complaint.longitude ?? 77.209),
      intensity: intensityForComplaint(complaint),
      severity: severityForComplaint(complaint),
      ageDays: ageDaysForComplaint(complaint),
    }));
  }, [complaintPoints, heatmapData]);

  const filteredPoints = useMemo(() => {
    return sourcePoints.filter((point) => {
      const matchesCategory = selectedCategory === "All" || point.category === selectedCategory;
      const matchesSeverity = severityFilter === "All" || point.severity === severityFilter;
      const matchesDate = !daysFilter || point.ageDays <= daysFilter;

      return matchesCategory && matchesSeverity && matchesDate;
    });
  }, [daysFilter, selectedCategory, severityFilter, sourcePoints]);

  useEffect(() => {
    let disposed = false;

    async function bootMap() {
      try {
        ensureDelhiMapStyles();

        const leafletModule = await import("leaflet");
        const L = leafletModule.default ?? leafletModule;

        window.L = L;
        await import("leaflet.heat");

        if (disposed || !mapNodeRef.current || mapRef.current) return;

        const map = L.map(mapNodeRef.current, {
          center: DELHI_CENTER,
          zoom: 11,
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: true,
        });

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            attribution: "© CARTO / © OpenStreetMap contributors",
            maxZoom: 19,
          },
        ).addTo(map);

        const heatLayer = L.heatLayer(toHeatCoordinates(HEAT_POINTS), HEAT_OPTIONS).addTo(map);
        const predictionLayer = L.layerGroup().addTo(map);

        mapRef.current = map;
        leafletRef.current = L;
        heatLayerRef.current = heatLayer;
        predictionLayerRef.current = predictionLayer;

        map.whenReady(() => {
          window.requestAnimationFrame(() => {
            if (disposed) return;
            map.invalidateSize();
            setMapReady(true);
          });
        });
      } catch {
        if (!disposed) {
          setMapError("Delhi heatmap could not load. Please refresh the dashboard.");
          setMapReady(false);
        }
      }
    }

    bootMap();

    return () => {
      disposed = true;
      window.clearTimeout(overviewTimerRef.current);
      if (focusMarkerRef.current) {
        focusMarkerRef.current.remove();
        focusMarkerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      heatLayerRef.current = null;
      predictionLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !heatLayerRef.current || !mapRef.current) return;

    heatLayerRef.current.setLatLngs(toHeatCoordinates(filteredPoints));
    mapRef.current.invalidateSize();
  }, [filteredPoints, mapReady]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !predictionLayerRef.current) return;

    const L = leafletRef.current;
    const predictionLayer = predictionLayerRef.current;
    predictionLayer.clearLayers();

    if (!predictionsShown) return;

    predictionHotspots.forEach((hotspot) => {
      const marker = L.marker([hotspot.lat, hotspot.lng], {
        icon: L.divIcon({
          className: "civic-prediction-div-icon",
          html: predictionMarkerHtml(),
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      }).bindPopup(predictionPopupHtml(hotspot), {
        className: "civic-prediction-popup",
        closeButton: false,
        offset: L.point(0, -14),
      });

      marker.on("popupopen", (event) => {
        const button = event.popup
          .getElement()
          ?.querySelector(`[data-alert-id="${hotspot.id}"]`);
        button?.addEventListener(
          "click",
          () => window.alert(`${hotspot.department} has been alerted about ${hotspot.locationName}.`),
          { once: true },
        );
      });

      marker.addTo(predictionLayer);
    });
  }, [mapReady, predictionsShown]);

  useEffect(() => {
    if (!mapReady || !focusedComplaint || !leafletRef.current || !mapRef.current) return;

    const L = leafletRef.current;
    const map = mapRef.current;
    const position = [focusedComplaint.lat, focusedComplaint.lng];

    window.clearTimeout(overviewTimerRef.current);
    if (focusMarkerRef.current) {
      focusMarkerRef.current.remove();
      focusMarkerRef.current = null;
    }

    map.flyTo(position, 15, { duration: 1.2, easeLinearity: 0.5 });

    const marker = L.marker(position, {
      icon: L.divIcon({
        className: "",
        html: '<div class="civic-focus-marker"></div>',
        iconSize: [34, 42],
        iconAnchor: [17, 38],
        popupAnchor: [0, -38],
      }),
    })
      .addTo(map)
      .bindPopup(focusPopupHtml(focusedComplaint), {
        className: "civic-focus-popup",
        closeButton: false,
        offset: L.point(0, -8),
      })
      .openPopup();

    focusMarkerRef.current = marker;
    overviewTimerRef.current = window.setTimeout(() => {
      map.flyTo(DELHI_CENTER, 11, { duration: 1.2, easeLinearity: 0.5 });
      window.setTimeout(() => {
        if (focusMarkerRef.current === marker) {
          marker.remove();
          focusMarkerRef.current = null;
        }
      }, 1200);
    }, 5000);
  }, [focusedComplaint, mapReady]);

  function zoomIn() {
    mapRef.current?.zoomIn();
  }

  function zoomOut() {
    mapRef.current?.zoomOut();
  }

  function togglePredictions() {
    const nextValue = !predictionsShown;

    if (onPredictionsVisibleChange) {
      onPredictionsVisibleChange(nextValue);
      return;
    }

    setInternalShowPredictions(nextValue);
  }

  function showAllCategories() {
    setActiveCategory("All");
    onShowAllCategories?.();
  }

  return (
    <article
      className={cn(
        "civic-delhi-map relative overflow-visible rounded-card border border-white bg-white shadow-card",
        heightClass,
        className,
      )}
    >
      <div ref={mapNodeRef} className="h-full w-full overflow-hidden rounded-card" />

      {!mapError ? (
        <div
          className={cn(
            "absolute inset-0 z-[850] grid place-items-center bg-[#F8FAFC] transition-opacity duration-500 [background-image:linear-gradient(rgba(226,232,240,0.72)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.72)_1px,transparent_1px)] [background-size:40px_40px]",
            mapReady ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          <div className="text-center">
            <MapPin className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-400">Initializing map...</p>
            <div className="mt-4 flex justify-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-slate-300 [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      ) : null}

      {mapError ? (
        <div className="absolute inset-6 z-[860] grid place-items-center rounded-card border border-danger/20 bg-white/90 shadow-elevated backdrop-blur-md">
          <div className="max-w-xs text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-danger-light text-danger">
              <WifiOff className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-extrabold text-text-primary">Map temporarily unavailable</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{mapError}</p>
          </div>
        </div>
      ) : null}

      {!mapError && filteredPoints.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[790] grid place-items-center p-6">
          <div className="pointer-events-auto w-[320px] overflow-hidden rounded-card border border-white/70 bg-white/[0.9] shadow-elevated backdrop-blur-md">
            <MapNoData
              category={`${selectedCategory} complaints`}
              onShowAll={showAllCategories}
            />
          </div>
        </div>
      ) : null}

      {showOverviewControls ? (
        <>
      <div className="absolute left-4 top-4 z-[800] w-[188px] rounded-[12px] border border-white/60 bg-white/[0.85] p-4 shadow-card backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">
              Active Complaints
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-[-0.03em] text-primary">
              {filteredPoints.length}
            </p>
            <p className="mt-0.5 text-xs font-medium text-text-secondary">Across Delhi NCR</p>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-[12px] bg-primary-light text-primary">
            <RadioTower className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="absolute left-4 top-36 z-[800] flex flex-wrap gap-2 rounded-[12px] border border-white/60 bg-white/80 p-2 shadow-card backdrop-blur-md">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveCategory(filter)}
            className={cn(
              "h-8 rounded-badge px-3 text-xs font-extrabold transition duration-150 ease-in-out active:scale-[0.98]",
              activeCategory === filter
                ? "bg-primary text-white shadow-[0_8px_18px_rgba(27,79,216,0.22)]"
                : "border border-border bg-white text-text-secondary hover:bg-primary-light hover:text-primary",
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={togglePredictions}
        className="absolute right-4 top-4 z-[800] flex min-h-12 items-center gap-3 rounded-[12px] border border-white/60 bg-white/[0.85] px-4 text-sm font-extrabold text-text-primary shadow-card backdrop-blur-md transition duration-150 ease-in-out hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.98]"
        aria-pressed={predictionsShown}
      >
        <Bell className={cn("h-4 w-4", predictionsShown ? "text-danger" : "text-text-muted")} />
        <span>Show Predictions</span>
        <span
          className={cn(
            "relative h-6 w-11 rounded-full transition duration-150 ease-in-out",
            predictionsShown ? "bg-primary" : "bg-slate-300",
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition duration-150 ease-in-out",
              predictionsShown ? "left-6" : "left-1",
            )}
          />
        </span>
      </button>
        </>
      ) : null}

      {children}

      <div className="absolute bottom-4 right-4 z-[800] overflow-hidden rounded-[12px] border border-border bg-white shadow-card">
        <button
          type="button"
          onClick={zoomIn}
          className="grid h-10 w-10 place-items-center text-text-primary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary active:scale-[0.98]"
          aria-label="Zoom in"
        >
          <Plus className="h-5 w-5" />
        </button>
        <div className="h-px bg-border" />
        <button
          type="button"
          onClick={zoomOut}
          className="grid h-10 w-10 place-items-center text-text-primary transition duration-150 ease-in-out hover:bg-primary-light hover:text-primary active:scale-[0.98]"
          aria-label="Zoom out"
        >
          <Minus className="h-5 w-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-[800] rounded-button bg-white/[0.82] px-3 py-2 text-[11px] font-semibold text-text-secondary shadow-card backdrop-blur-md">
        © CARTO / © OpenStreetMap contributors
      </div>
    </article>
  );
}
