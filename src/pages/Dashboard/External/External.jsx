import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearFilters } from "../../../store/filtersSlice.js";
import { clearCredentials } from "../../../store/authSlice.js";
import InternalFilters from "../components/InternalFilters.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket, faDownload } from "@fortawesome/free-solid-svg-icons";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import * as XLSX from "xlsx";
import "./External.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const GREEN = "#10b981";
const BLUE = "#4a78e6";
const DARK_BLUE = "#2240b5";
const PURPLE = "#a83be0";
const AXIS = "#7b8aa5";
const GRID = "#e5e9f0";

const FONT_TICK = 11;
const FONT_LABEL = 12;

const BRAND_COLORS = ["#0b8a5c", "#4a78e6", "#a83be0", "#f59e0b", "#ef4444", "#14b8a6"];
const OTHERS_COLOR = "#98a3b8";
const TOP_BRANDS = 6;

const formatTrendLabel = (d) =>
  `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;

const formatTick = (v) => {
  if (v >= 1000000) return `${+(v / 1000000).toFixed(2)}M`;
  if (v >= 1000) return `${+(v / 1000).toFixed(1)}k`;
  return String(v);
};

const formatMoney = (v) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(v) || 0);

const buildFilterQuery = (filters) => {
  const params = new URLSearchParams();

  const filterParams = {
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    store: filters.store,
    barcode: filters.barcode,
    BrandFamilies: filters.brandFamily,
    SkuNames: filters.skuName,
    Formats: filters.format,
    Segments: filters.segment,
  };

  Object.entries(filterParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

const niceScale = (maxValue, tickCount = 4) => {
  if (!maxValue || maxValue <= 0) return { max: 4, step: 1 };

  const rough = maxValue / tickCount;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;

  const niceFrac =
    frac <= 1 ? 1 :
    frac <= 2 ? 2 :
    frac <= 2.5 ? 2.5 :
    frac <= 5 ? 5 : 10;

  const step = niceFrac * pow;

  return {
    max: Math.ceil(maxValue / step) * step,
    step,
  };
};

function useElementWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const update = () => setWidth(Math.floor(el.clientWidth));
    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

function Legend({ items }) {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
      {items.map((it) => (
        <span
          key={it.name}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            color: it.textColor || it.color,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              background: it.color,
              display: "inline-block",
            }}
          />
          {it.name}
        </span>
      ))}
    </div>
  );
}

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 5,
};

const INTERNAL_EXTERNAL_BAR = [
  { name: "Internal", color: GREEN },
  { name: "External", color: BLUE },
];

const CHART_HEIGHT = 230;
const SEGMENT_ROW_H = 44;


function ChartSkeleton({ height = CHART_HEIGHT }) {
  return (
    <div style={{ width: "100%" }}>
      <Skeleton height={height - 24} borderRadius={8} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} width={36} height={10} />
        ))}
      </div>
    </div>
  );
}

function SegmentSkeleton({ rows = 5 }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton width={70} height={12} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <Skeleton height={10} borderRadius={6} />
            <Skeleton height={10} borderRadius={6} width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutSkeleton() {
  return (
    <>
      <Skeleton circle width={200} height={200} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 150 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Skeleton width={10} height={10} />
            <Skeleton width={110} height={12} />
          </div>
        ))}
      </div>
    </>
  );
}


function GroupedBarChart({ labels, internal, external }) {
  const [ref, width] = useElementWidth();

  const height = CHART_HEIGHT;
  const padL = 52;
  const padR = 12;
  const padT = 12;
  const padB = 32;

  const chartW = Math.max(width - padL - padR, 10);
  const chartH = height - padT - padB;
  const groupW = chartW / Math.max(labels.length, 1);
  const gap = 4;

  const barW = Math.max(4, Math.min(18, (groupW - gap) * 0.4));
  const labelStep = Math.max(Math.ceil(46 / groupW), 1);

  const { max, step } = niceScale(Math.max(...internal, ...external, 0));

  const ticks = [];
  for (let v = 0; v <= max + step / 2; v += step) ticks.push(v);

  const yOf = (v) => padT + chartH - (v / max) * chartH;

  return (
    <div ref={ref} style={{ width: "100%" }}>
      {width > 0 && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={padL}
                x2={width - padR}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke={GRID}
                strokeDasharray="4 4"
              />
              <text
                x={padL - 8}
                y={yOf(t)}
                fontSize={FONT_TICK}
                fill={AXIS}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {formatTick(t)}
              </text>
            </g>
          ))}

          {labels.map((label, i) => {
            const cx = padL + groupW * i + groupW / 2;
            const xi = cx - barW - gap / 2;
            const xe = cx + gap / 2;

            return (
              <g key={`${label}-${i}`}>
                <rect
                  x={xi}
                  y={yOf(internal[i])}
                  width={barW}
                  height={yOf(0) - yOf(internal[i])}
                  rx="2"
                  fill={GREEN}
                >
                  <title>{label} · Internal: {formatMoney(internal[i])}</title>
                </rect>

                <rect
                  x={xe}
                  y={yOf(external[i])}
                  width={barW}
                  height={yOf(0) - yOf(external[i])}
                  rx="2"
                  fill={BLUE}
                >
                  <title>{label} · External: {formatMoney(external[i])}</title>
                </rect>

                {i % labelStep === 0 && (
                  <text
                    x={cx}
                    y={height - 10}
                    fontSize={FONT_TICK}
                    fill={AXIS}
                    textAnchor="middle"
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}


function SegmentChart({ rows }) {
  const [ref, width] = useElementWidth();

  const padL = 88;
  const padR = 52;
  const padT = 6;
  const padB = 28;
  const rowH = SEGMENT_ROW_H;
  const barH = 12;

  const chartH = rowH * rows.length;
  const height = padT + chartH + padB;
  const chartW = Math.max(width - padL - padR, 10);

  const { max, step } = niceScale(
    Math.max(...rows.map((r) => Math.max(r.internal, r.external)), 0)
  );

  const xOf = (v) => padL + (v / max) * chartW;

  const ticks = [];
  for (let v = 0; v <= max + step / 2; v += step) ticks.push(v);

  return (
    <div ref={ref} style={{ width: "100%" }}>
      {width > 0 && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={xOf(t)}
                x2={xOf(t)}
                y1={padT}
                y2={padT + chartH}
                stroke={GRID}
                strokeDasharray="4 4"
              />
              <text
                x={xOf(t)}
                y={padT + chartH + 18}
                fontSize={FONT_TICK}
                fill={AXIS}
                textAnchor="middle"
              >
                {t}%
              </text>
            </g>
          ))}

          {rows.map((r, i) => {
            const cy = padT + rowH * i + rowH / 2;

            return (
              <g key={r.name}>
                <text
                  x={padL - 10}
                  y={cy}
                  fontSize={FONT_LABEL}
                  fill={AXIS}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {r.name}
                </text>

                <rect
                  x={padL}
                  y={cy - barH - 2}
                  width={Math.max(xOf(r.external) - padL, 0)}
                  height={barH}
                  rx={barH / 2}
                  fill={DARK_BLUE}
                >
                  <title>{r.name} · External: {r.external.toFixed(2)}%</title>
                </rect>

                <rect
                  x={padL}
                  y={cy + 2}
                  width={Math.max(xOf(r.internal) - padL, 0)}
                  height={barH}
                  rx={barH / 2}
                  fill={GREEN}
                >
                  <title>{r.name} · Internal: {r.internal.toFixed(2)}%</title>
                </rect>

                <text
                  x={xOf(r.external) + 6}
                  y={cy - barH / 2 - 2}
                  fontSize={FONT_TICK}
                  fill={AXIS}
                  dominantBaseline="middle"
                >
                  {r.external.toFixed(1)}%
                </text>

                <text
                  x={xOf(r.internal) + 6}
                  y={cy + barH / 2 + 2}
                  fontSize={FONT_TICK}
                  fill={AXIS}
                  dominantBaseline="middle"
                >
                  {r.internal.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}


function DualLineChart({ labels, internal, external }) {
  const [ref, width] = useElementWidth();

  const height = CHART_HEIGHT;
  const padL = 52;
  const padR = 16;
  const padT = 12;
  const padB = 32;

  const chartW = Math.max(width - padL - padR, 10);
  const chartH = height - padT - padB;

  const labelStep = Math.max(
    Math.ceil(46 / (chartW / Math.max(labels.length - 1, 1))),
    1
  );

  const { max, step } = niceScale(Math.max(...internal, ...external, 0));

  const ticks = [];
  for (let v = 0; v <= max + step / 2; v += step) ticks.push(v);

  const yOf = (v) => padT + chartH - (v / max) * chartH;
  const xOf = (i) => padL + (i / Math.max(labels.length - 1, 1)) * chartW;

  const toPath = (arr) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"} ${xOf(i)} ${yOf(v)}`).join(" ");

  return (
    <div ref={ref} style={{ width: "100%" }}>
      {width > 0 && (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={padL}
                x2={width - padR}
                y1={yOf(t)}
                y2={yOf(t)}
                stroke={GRID}
                strokeDasharray="4 4"
              />
              <text
                x={padL - 8}
                y={yOf(t)}
                fontSize={FONT_TICK}
                fill={AXIS}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {formatTick(t)}
              </text>
            </g>
          ))}

          {labels.map((l, i) =>
            i % labelStep === 0 ? (
              <text
                key={i}
                x={xOf(i)}
                y={height - 10}
                fontSize={FONT_TICK}
                fill={AXIS}
                textAnchor="middle"
              >
                {l}
              </text>
            ) : null
          )}

          <path d={toPath(external)} fill="none" stroke={PURPLE} strokeWidth="1.5" />
          <path d={toPath(internal)} fill="none" stroke={GREEN} strokeWidth="1.5" />

          {external.map((v, i) => (
            <circle key={`e${i}`} cx={xOf(i)} cy={yOf(v)} r="3" fill={PURPLE}>
              <title>{labels[i]} · External: {formatMoney(v)}</title>
            </circle>
          ))}

          {internal.map((v, i) => (
            <circle key={`i${i}`} cx={xOf(i)} cy={yOf(v)} r="3" fill={GREEN}>
              <title>{labels[i]} · Internal: {formatMoney(v)}</title>
            </circle>
          ))}
        </svg>
      )}
    </div>
  );
}

function BrandDonut({ segments, totalBrands }) {
  const size = 220;
  const stroke = 38;
  const radius = 82;
  const circ = 2 * Math.PI * radius;
  const c = size / 2;

  const total = segments.reduce((sum, s) => sum + s.pct, 0) || 1;

  let acc = 0;

  const arcs = segments.map((s) => {
    const start = acc;
    acc += s.pct;
    return { ...s, start };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ width: 220, height: 220, flexShrink: 0, maxWidth: "100%" }}
    >
      <g transform={`rotate(-90 ${c} ${c})`}>
        {arcs.map((s) => {
          const len = (s.pct / total) * circ;

          return (
            <circle
              key={s.name}
              cx={c}
              cy={c}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-((s.start / total) * circ)}
            >
              <title>{s.name}: {s.pct.toFixed(2)}%</title>
            </circle>
          );
        })}
      </g>

      <text
        x={c}
        y={c - 4}
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="#1f2937"
      >
        {totalBrands}
      </text>

      <text
        x={c}
        y={c + 14}
        textAnchor="middle"
        fontSize="11"
        fill={AXIS}
      >
        brands
      </text>
    </svg>
  );
}

function BrandLegend({ segments }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 150 }}>
      {segments.map((s) => (
        <div
          key={s.name}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            fontSize: 12,
            color: "#374151",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: s.color,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {s.name}
          </span>

          <span style={{ fontWeight: 600 }}>{s.pct.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}


function External() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const filters = useSelector((state) => state.filters);

  const [trendRaw, setTrendRaw] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState("");

  const [segmentsRaw, setSegmentsRaw] = useState([]);
  const [segmentsLoading, setSegmentsLoading] = useState(true);
  const [segmentsError, setSegmentsError] = useState("");

  const [brandsRaw, setBrandsRaw] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsError, setBrandsError] = useState("");

  const activeTab = location.pathname.startsWith("/sales-data")
    ? "sales"
    : "dashboard";

  const activeSubTab = location.pathname.includes("/external")
    ? "external"
    : "internal";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiresAt");

    dispatch(clearCredentials());
    dispatch(clearFilters());

    navigate("/login");
  };

  const handleApiError = (err, setError, message) => {
    if (err.status === 401) {
      handleLogout();
    } else {
      console.error(message, err);
      setError("Məlumat yüklənmədi");
    }
  };

  const getHeaders = () => ({
    accept: "text/plain",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const query = buildFilterQuery(filters);

  useEffect(() => {
    let ignore = false;

    setTrendLoading(true);
    setTrendError("");

    fetch(
      `${API_BASE}/api/products/revenue-by-day/internal-external${query}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    )
      .then(async (res) => {
        if (res.status === 401) {
          const e = new Error("Unauthorized");
          e.status = 401;
          throw e;
        }

        if (!res.ok) {
          throw new Error(`Xəta: ${res.status}`);
        }

        const text = await res.text();
        const data = JSON.parse(text);

        return Array.isArray(data) ? data : [];
      })
      .then((data) => {
        if (!ignore) {
          setTrendRaw(data);
          setTrendLoading(false);
        }
      })
      .catch((err) => {
        if (ignore) return;

        handleApiError(
          err,
          setTrendError,
          "Revenue trend yüklənmədi:"
        );

        setTrendLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [query]);

  useEffect(() => {
    let ignore = false;

    setSegmentsLoading(true);
    setSegmentsError("");

    fetch(
      `${API_BASE}/api/products/segments/share/internal-external${query}`,
      {
        method: "GET",
        headers: getHeaders(),
      }
    )
      .then(async (res) => {
        if (res.status === 401) {
          const e = new Error("Unauthorized");
          e.status = 401;
          throw e;
        }

        if (!res.ok) {
          throw new Error(`Xəta: ${res.status}`);
        }

        const text = await res.text();
        const data = JSON.parse(text);

        return Array.isArray(data) ? data : [];
      })
      .then((data) => {
        if (!ignore) {
          setSegmentsRaw(data);
          setSegmentsLoading(false);
        }
      })
      .catch((err) => {
        if (ignore) return;

        handleApiError(
          err,
          setSegmentsError,
          "Seqmentlər yüklənmədi:"
        );

        setSegmentsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [query]);

  useEffect(() => {
    let ignore = false;

    setBrandsLoading(true);
    setBrandsError("");

    fetch(`${API_BASE}/api/products/brands/share${query}`, {
      method: "GET",
      headers: getHeaders(),
    })
      .then(async (res) => {
        if (res.status === 401) {
          const e = new Error("Unauthorized");
          e.status = 401;
          throw e;
        }

        if (!res.ok) {
          throw new Error(`Xəta: ${res.status}`);
        }

        const text = await res.text();
        const data = JSON.parse(text);

        return Array.isArray(data) ? data : [];
      })
      .then((data) => {
        if (!ignore) {
          setBrandsRaw(data);
          setBrandsLoading(false);
        }
      })
      .catch((err) => {
        if (ignore) return;

        handleApiError(
          err,
          setBrandsError,
          "Brand share yüklənmədi:"
        );

        setBrandsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [query]);

  const trend = useMemo(() => {
    const from = filters.dateFrom
      ? new Date(filters.dateFrom)
      : null;

    let to = null;

    if (filters.dateTo) {
      to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
    }

    const rows = trendRaw
      .map((r) => ({
        d: new Date(r.day),
        internal: Number(r.internalRevenue) || 0,
        external: Number(r.externalRevenue) || 0,
      }))
      .filter((r) => !isNaN(r.d))
      .filter((r) => (!from || r.d >= from) && (!to || r.d <= to))
      .sort((a, b) => a.d - b.d);

    return {
      labels: rows.map((r) => formatTrendLabel(r.d)),
      internal: rows.map((r) => r.internal),
      external: rows.map((r) => r.external),
    };
  }, [trendRaw, filters.dateFrom, filters.dateTo]);

  const segmentRows = useMemo(
    () =>
      segmentsRaw.map((r) => ({
        name: r.segment,
        internal: Number(r.internalSharePercentage) || 0,
        external: Number(r.externalSharePercentage) || 0,
      })),
    [segmentsRaw]
  );

  const filteredSegments = useMemo(() => {
    if (!filters.segment) return segmentRows;

    const wanted = String(filters.segment).toUpperCase();

    return segmentRows.filter(
      (r) => String(r.name).toUpperCase() === wanted
    );
  }, [segmentRows, filters.segment]);

  const brandRows = useMemo(
    () =>
      brandsRaw
        .map((r) => ({
          name: r.brandFamily,
          pct: Number(r.sharePercentage) || 0,
        }))
        .sort((a, b) => b.pct - a.pct),
    [brandsRaw]
  );

  const brandSegments = useMemo(() => {
    const top = brandRows.slice(0, TOP_BRANDS).map((b, i) => ({
      ...b,
      color: BRAND_COLORS[i % BRAND_COLORS.length],
    }));

    const rest = brandRows.slice(TOP_BRANDS);

    if (rest.length > 0) {
      const othersPct = rest.reduce((sum, b) => sum + b.pct, 0);

      top.push({
        name: "Others",
        pct: othersPct,
        color: OTHERS_COLOR,
      });
    }

    return top;
  }, [brandRows]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    const filterRows = [
      ["Filter", "Seçim"],
      ["Overview", activeSubTab === "external" ? "External" : "Internal"],
      ["Date from", filters.dateFrom || "All"],
      ["Date to", filters.dateTo || "All"],
      ["Store", filters.store || "All"],
      ["Barcode", filters.barcode || "All"],
      ["Brand family", filters.brandFamily || "All"],
      ["SKU name", filters.skuName || "All"],
      ["Format", filters.format || "All"],
      ["Segment", filters.segment || "All"],
    ];

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(filterRows),
      "Filters"
    );

    const salesRows = trend.labels.map((d, i) => ({
      Month: d,
      Internal: trend.internal[i],
      External: trend.external[i],
    }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(salesRows),
      "Sales & Revenue"
    );

    const segRows = filteredSegments.map((s) => ({
      Segment: s.name,
      "Internal %": s.internal,
      "External %": s.external,
    }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(segRows),
      "Segments"
    );

    const trendRows = trend.labels.map((d, i) => ({
      Month: d,
      Internal: trend.internal[i],
      External: trend.external[i],
    }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(trendRows),
      "Sales Trends"
    );

    const shareRows = brandRows.map((b) => ({
      "Brand family": b.name,
      "Share %": b.pct,
    }));

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(shareRows),
      "Market share"
    );

    const date = new Date().toISOString().slice(0, 10);

    XLSX.writeFile(
      wb,
      `sellout-${activeSubTab}-overview-${date}.xlsx`
    );
  };

  return (
    <div className="internal-page">
      <header className="internal-header">
        <div className="internal-header-left">
          <span className="internal-logo">SelloutData</span>
          <span className="internal-logo-sub">Analytics Platform</span>
        </div>

        <button
          className="internal-logout"
          onClick={handleLogout}
          title="Çıxış"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
      </header>

      <nav className="internal-tabs">
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => navigate("/dashboard/internal")}
        >
          Dashboard
        </button>

        <button
          className={activeTab === "sales" ? "active" : ""}
          onClick={() => navigate("/sales-data")}
        >
          Sales data
        </button>
      </nav>

      <InternalFilters
        options={{
          segment: segmentRows.map((segment) => segment.name),
        }}
      />

      <div className="internal-subtabs">
        <button
          className={activeSubTab === "internal" ? "active" : ""}
          onClick={() => navigate("/dashboard/internal")}
        >
          Internal Overview
        </button>

        <button
          className={activeSubTab === "external" ? "active" : ""}
          onClick={() => navigate("/dashboard/external")}
        >
          External Overview
        </button>

        <button className="export-btn" onClick={handleExport}>
          <FontAwesomeIcon icon={faDownload} />
          <span>Export</span>
        </button>
      </div>

      <SkeletonTheme baseColor="#e5e7eb" highlightColor="#f3f4f6">
        <section className="charts-section">

          <div className="chart-card ext-card">
            <div
              className="chart-card-header chart-card-header-row"
              style={headerRowStyle}
            >
              <span>Monthly sales &amp; revenue</span>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Legend items={INTERNAL_EXTERNAL_BAR} />
              </div>
            </div>

            <div className="chart-card-body ext-chart-body">
              {trendLoading ? (
                <ChartSkeleton />
              ) : trendError ? (
                <div className="empty-note">{trendError}</div>
              ) : trend.labels.length === 0 ? (
                <div className="empty-note">Məlumat yoxdur</div>
              ) : (
                <GroupedBarChart
                  labels={trend.labels}
                  internal={trend.internal}
                  external={trend.external}
                />
              )}
            </div>
          </div>

          <div className="chart-card ext-card">
            <div
              className="chart-card-header chart-card-header-row"
              style={headerRowStyle}
            >
              <span>Seqmentlər</span>

              <Legend
                items={[
                  { name: "Internal", color: GREEN },
                  { name: "External", color: DARK_BLUE },
                ]}
              />
            </div>

            <div className="chart-card-body chart-card-body-auto ext-chart-body">
              {segmentsLoading ? (
                <SegmentSkeleton rows={5} />
              ) : segmentsError ? (
                <div className="empty-note">{segmentsError}</div>
              ) : filteredSegments.length === 0 ? (
                <div className="empty-note">Məlumat yoxdur</div>
              ) : (
                <SegmentChart rows={filteredSegments} />
              )}
            </div>
          </div>

          <div className="chart-card ext-card">
            <div
              className="chart-card-header chart-card-header-row"
              style={headerRowStyle}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span>Monthly sales trends</span>

                <span className="chart-card-subtitle">
                  Revenue performance over time
                </span>
              </div>

              <Legend
                items={[
                  { name: "Internal", color: GREEN },
                  { name: "External", color: PURPLE },
                ]}
              />
            </div>

            <div className="chart-card-body ext-chart-body">
              {trendLoading ? (
                <ChartSkeleton />
              ) : trendError ? (
                <div className="empty-note">{trendError}</div>
              ) : trend.labels.length === 0 ? (
                <div className="empty-note">Məlumat yoxdur</div>
              ) : (
                <DualLineChart
                  labels={trend.labels}
                  internal={trend.internal}
                  external={trend.external}
                />
              )}
            </div>
          </div>

          <div className="chart-card ext-card">
            <div className="chart-card-header">
              <span>Market share by brand</span>

              <span className="chart-card-subtitle">
                Top performing brands distribution
              </span>
            </div>

            <div
              className="chart-card-body donut-body ext-chart-body"
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 28,
              }}
            >
              {brandsLoading ? (
                <DonutSkeleton />
              ) : brandsError ? (
                <div className="empty-note">{brandsError}</div>
              ) : brandSegments.length === 0 ? (
                <div className="empty-note">Məlumat yoxdur</div>
              ) : (
                <>
                  <BrandDonut
                    segments={brandSegments}
                    totalBrands={brandRows.length}
                  />

                  <BrandLegend segments={brandSegments} />
                </>
              )}
            </div>
          </div>

        </section>
      </SkeletonTheme>
    </div>
  );
}

export default External;