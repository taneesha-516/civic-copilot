"use client";

import { Activity, WifiOff } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { NoPredictions } from "@/components/design-system/EmptyStates";
import { useToast } from "@/components/design-system/ToastSystem";
import { mockPredictions } from "@/src/data/mockPredictions";

const DELHI_CENTER = [28.6139, 77.209];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function locationShortName(locationName) {
  return locationName.replace(" Central Market", "").replace(" TV Tower Road", "");
}

function departmentForPrediction(prediction) {
  const value = prediction.predicted_issue.toLowerCase();
  if (value.includes("water") || value.includes("drain")) return "Delhi Jal Board";
  if (value.includes("streetlight") || value.includes("utility")) return "Electricity Department";
  return "PWD";
}

function issueSvg(prediction) {
  const value = prediction.predicted_issue.toLowerCase();

  if (value.includes("water") || value.includes("drain")) {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3C12 3 5 10.2 5 15A7 7 0 0 0 19 15C19 10.2 12 3 12 3Z" stroke="#1B4FD8" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `;
  }

  if (value.includes("streetlight") || value.includes("utility")) {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M13 2L4 14H11L10 22L20 9H13L13 2Z" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `;
  }

  if (value.includes("garbage") || value.includes("waste")) {
    return `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 6H21" stroke="#16A34A" stroke-width="2" stroke-linecap="round"/>
        <path d="M8 6V4H16V6" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M6 6L7 21H17L18 6" stroke="#16A34A" stroke-width="2" stroke-linejoin="round"/>
      </svg>
    `;
  }

  return `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 9V13" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 17H12.01" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/>
      <path d="M10.3 3.9L1.8 18A2 2 0 0 0 3.5 21H20.5A2 2 0 0 0 22.2 18L13.7 3.9A2 2 0 0 0 10.3 3.9Z" stroke="#F59E0B" stroke-width="2" stroke-linejoin="round"/>
    </svg>
  `;
}

function ensurePredictionMapStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("civic-prediction-map-client-styles")) return;

  const style = document.createElement("style");
  style.id = "civic-prediction-map-client-styles";
  style.textContent = `
    .civic-prediction-map .leaflet-container{height:400px;width:100%;background:#F8FAFC;font-family:var(--font-inter),Inter,system-ui,sans-serif;outline:none}
    .civic-prediction-map .leaflet-control-container{display:none}
    .civic-prediction-map .leaflet-tile{filter:saturate(.82) contrast(.96) brightness(1.02)}
    .civic-risk-div-icon{background:transparent;border:0}
    .civic-risk-marker{position:relative;width:132px;height:92px;transform:translateZ(0)}
    .civic-risk-outer,.civic-risk-middle{position:absolute;left:36px;top:0;border-radius:999px;transform-origin:center;animation:civic-risk-sonar 3s ease-out infinite}
    .civic-risk-outer{width:60px;height:60px;background:rgba(220,38,38,.08)}
    .civic-risk-middle{left:51px;top:15px;width:30px;height:30px;background:rgba(220,38,38,.2);animation-delay:.5s}
    .civic-risk-dot{position:absolute;left:60px;top:24px;width:12px;height:12px;border-radius:999px;background:#DC2626;border:2px solid #fff;box-shadow:0 0 0 5px rgba(220,38,38,.16),0 10px 26px rgba(220,38,38,.34)}
    .civic-risk-label{position:absolute;left:50%;top:64px;max-width:124px;transform:translateX(-50%);white-space:nowrap;border-radius:999px;background:#fff;padding:4px 9px;color:#0F172A;font-size:12px;font-weight:800;box-shadow:0 8px 24px rgba(15,23,42,.14),0 1px 3px rgba(15,23,42,.08)}
    @keyframes civic-risk-sonar{0%{transform:scale(1);opacity:.8}100%{transform:scale(2);opacity:0}}
    .civic-risk-popup .leaflet-popup-content-wrapper{background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.15);border:0;padding:0;overflow:hidden}
    .civic-risk-popup .leaflet-popup-content{margin:0;width:280px!important}
    .civic-risk-popup .leaflet-popup-tip{display:none}
    .civic-risk-popup .leaflet-popup-close-button{display:none}
    .civic-risk-popup-card{width:280px;color:#0F172A}
    .civic-risk-popup-strip{background:#FEE2E2;padding:12px;color:#DC2626;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .civic-risk-popup-body{padding:16px}
    .civic-risk-popup-title{font-size:16px;font-weight:900;letter-spacing:-.02em}
    .civic-risk-popup-issue{margin-top:10px;display:flex;align-items:center;gap:8px;color:#475569;font-size:14px;font-weight:700;line-height:1.35}
    .civic-risk-popup-confidence{margin-top:14px;display:flex;align-items:center;gap:14px}
    .civic-risk-popup-percent{font-size:30px;font-weight:900;letter-spacing:-.04em;color:#DC2626;line-height:1}
    .civic-risk-popup-time{margin-top:8px;color:#64748B;font-size:13px;font-weight:700}
    .civic-risk-popup-button{margin-top:14px;display:flex;height:40px;width:100%;align-items:center;justify-content:center;gap:8px;border:0;border-radius:10px;background:#1B4FD8;color:#fff;font-size:13px;font-weight:900;cursor:pointer;transition:background 150ms ease,transform 150ms ease}
    .civic-risk-popup-button:hover{background:#1340B0;transform:translateY(-1px)}
    .civic-risk-popup-button.is-alerted{background:#16A34A}
  `;
  document.head.appendChild(style);
}

function markerHtml(prediction) {
  return `
    <div class="civic-risk-marker">
      <span class="civic-risk-outer"></span>
      <span class="civic-risk-middle"></span>
      <span class="civic-risk-dot"></span>
      <span class="civic-risk-label">${escapeHtml(locationShortName(prediction.location_name))}</span>
    </div>
  `;
}

function paperPlaneSvg() {
  return `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

function confidenceArcSvg(value) {
  return `
    <svg width="86" height="54" viewBox="0 0 86 54" role="img" aria-label="${value}% confidence">
      <path d="M9 45 A34 34 0 0 1 77 45" fill="none" stroke="#E2E8F0" stroke-width="7" stroke-linecap="round"/>
      <path d="M9 45 A34 34 0 0 1 77 45" fill="none" stroke="#DC2626" stroke-width="7" stroke-linecap="round" pathLength="100" stroke-dasharray="${value} 100"/>
    </svg>
  `;
}

function popupHtml(prediction, alerted = false) {
  return `
    <article class="civic-risk-popup-card">
      <div class="civic-risk-popup-strip">Active Risk Forecast</div>
      <div class="civic-risk-popup-body">
        <h2 class="civic-risk-popup-title">${escapeHtml(prediction.location_name)}</h2>
        <div class="civic-risk-popup-issue">
          <span>${issueSvg(prediction)}</span>
          <span>${escapeHtml(prediction.predicted_issue)}</span>
        </div>
        <div class="civic-risk-popup-confidence">
          ${confidenceArcSvg(prediction.confidence_percentage)}
          <div>
            <div class="civic-risk-popup-percent">${prediction.confidence_percentage}%</div>
            <div class="civic-risk-popup-time">Expected ${escapeHtml(prediction.predicted_timeframe.toLowerCase())}</div>
          </div>
        </div>
        <button type="button" class="civic-risk-popup-button${alerted ? " is-alerted" : ""}" data-prediction-alert="${escapeHtml(prediction.id)}">
          ${alerted ? "&#10003; Department Alerted" : `${paperPlaneSvg()} Alert Department`}
        </button>
      </div>
    </article>
  `;
}

export default function PredictionMapClient({ predictions }) {
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markerLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const toast = useToast();

  const list = useMemo(() => predictions ?? mockPredictions, [predictions]);

  useEffect(() => {
    let disposed = false;

    async function bootMap() {
      try {
        ensurePredictionMapStyles();
        const leafletModule = await import("leaflet");
        const L = leafletModule.default ?? leafletModule;

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

        const markerLayer = L.layerGroup().addTo(map);
        mapRef.current = map;
        leafletRef.current = L;
        markerLayerRef.current = markerLayer;

        map.whenReady(() => {
          window.requestAnimationFrame(() => {
            if (disposed) return;
            map.invalidateSize();
            setMapReady(true);
          });
        });
      } catch {
        if (!disposed) {
          setMapError("Prediction map could not load. Please refresh the page.");
        }
      }
    }

    bootMap();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, [toast]);

  useEffect(() => {
    if (!mapReady || !leafletRef.current || !markerLayerRef.current) return;

    const L = leafletRef.current;
    const markerLayer = markerLayerRef.current;
    markerLayer.clearLayers();

    list.forEach((prediction) => {
      const marker = L.marker([prediction.latitude, prediction.longitude], {
        icon: L.divIcon({
          className: "civic-risk-div-icon",
          html: markerHtml(prediction),
          iconSize: [132, 92],
          iconAnchor: [66, 30],
          popupAnchor: [0, -22],
        }),
      }).bindPopup(popupHtml(prediction), {
        className: "civic-risk-popup",
        closeButton: false,
        maxWidth: 280,
        offset: L.point(0, -8),
      });

      marker.on("popupopen", (event) => {
        const button = event.popup
          .getElement()
          ?.querySelector(`[data-prediction-alert="${prediction.id}"]`);

        button?.addEventListener(
          "click",
          () => {
            const department = departmentForPrediction(prediction);
            marker.setPopupContent(popupHtml(prediction, true));
            marker.openPopup();
            toast.success(
              `${department} has been notified about ${locationShortName(prediction.location_name)} risk`,
              "Prediction alert queued for field verification.",
            );
          },
          { once: true },
        );
      });

      marker.addTo(markerLayer);
    });
  }, [mapReady, list, toast]);

  if (list.length === 0) {
    return (
      <section className="rounded-card bg-white p-6 shadow-card">
        <NoPredictions />
      </section>
    );
  }

  return (
    <section className="civic-prediction-map relative h-[400px] overflow-hidden rounded-card bg-white shadow-card">
      <div ref={mapNodeRef} className="h-[400px] w-full" />

      {!mapReady && !mapError ? (
        <div className="absolute inset-0 z-[850] grid place-items-center bg-[#F8FAFC]/[0.82] backdrop-blur-sm">
          <div className="rounded-card border border-white/70 bg-white/[0.9] px-5 py-4 text-center shadow-elevated">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-danger-light text-danger">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <p className="mt-3 text-sm font-extrabold text-text-primary">Loading forecast layer</p>
            <p className="mt-1 text-xs text-text-secondary">Rendering {list.length} live prediction hotspots</p>
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

      <div className="absolute left-4 top-4 z-[800] rounded-card border border-white/60 bg-white/[0.88] px-4 py-3 shadow-card backdrop-blur-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-text-muted">
          Active Risk Forecast
        </p>
        <p className="mt-1 text-sm font-extrabold text-text-primary">
          {list.length} {list.length === 1 ? "hotspot" : "hotspots"} under observation
        </p>
      </div>

      <div className="absolute bottom-4 left-4 z-[800] rounded-button bg-white/[0.82] px-3 py-2 text-[11px] font-semibold text-text-secondary shadow-card backdrop-blur-md">
        © CARTO / © OpenStreetMap contributors
      </div>
    </section>
  );
}
