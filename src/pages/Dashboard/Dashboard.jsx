import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  faRightFromBracket,
  faArrowTrendUp,
  faDollarSign,
  faMedal,
  faCube,
} from "@fortawesome/free-solid-svg-icons";
import "./Dashboard.css";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const BRAND_COLORS = [
  "#6b8f4e",
  "#3a3f4b",
  "#5b8fa8",
  "#3730d6",
  "#a8b4c2",
  "#d1d5db",
];

const STAT_CARDS = [
  {
    title: "Total Sales",
    icon: faArrowTrendUp,
    iconColor: "#5b6cf0",
    iconBg: "#eef0ff",
  },
  {
    title: "Total Revenue",
    icon: faDollarSign,
    iconColor: "#2fae62",
    iconBg: "#e6f6ec",
  },
  {
    title: "Top Brand share",
    icon: faMedal,
    iconColor: "#a43be0",
    iconBg: "#f6e9fd",
  },
  {
    title: "Active Products",
    icon: faCube,
    iconColor: "#6b7280",
    iconBg: "#eceef1",
  },
];

const formatCompact = (v) =>
  new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(v) || 0);

const formatTrendLabel = (d) =>
  `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;

const monthKey = (d) => d.getFullYear() * 12 + d.getMonth();

// API sorğusu
// Boş filterlər API-yə göndərilmir.
const fetchListOnce = (path, params = {}) => {
  const token = localStorage.getItem("token");

  return axios
    .get(`${API_BASE}${path}`, {
      headers: {
        accept: "text/plain",
        Authorization: `Bearer ${token}`,
      },
      params: {
        dateFrom: params.dateFrom || undefined,
        dateTo: params.dateTo || undefined,
        Store: params.store || undefined,
        Barcode: params.barcode || undefined,
        BrandFamilies: params.brandFamily || undefined,
        SkuNames: params.skuName || undefined,
        Formats: params.format || undefined,
        Segments: params.segment || undefined,
      },
    })
    .then((res) => {
      if (Array.isArray(res.data)) return res.data;

      if (typeof res.data === "string") {
        try {
          const parsed = JSON.parse(res.data);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }

      return [];
    })
    .catch((err) => {
      if (err.response?.status === 401) {
        err.message = "Unauthorized";
        err.status = 401;
      }

      throw err;
    });
};

function SimpleBarChart({
  data,
  labels,
  color = "#7fb56e",
  formatValue,
}) {
  const max = Math.max(...data, 1);
  const width = 400;
  const height = 200;
  const padding = 28;
  const padL = 46;
  const chartW = width - padL - padding;
  const chartH = height - padding * 2;
  const barGap = data.length > 8 ? 6 : 14;

  const barWidth =
    data.length > 0
      ? (chartW - barGap * (data.length - 1)) / data.length
      : chartW;

  const labelStep = Math.max(Math.ceil(labels.length / 6), 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="simple-chart-svg">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={width - padding}
            y1={padding + chartH * (1 - t)}
            y2={padding + chartH * (1 - t)}
            stroke="#f0f0f0"
            strokeWidth="1"
          />
          <text
            x={padL - 6}
            y={padding + chartH * (1 - t)}
            fontSize="10"
            textAnchor="end"
            dominantBaseline="middle"
            fill="#9ca3af"
          >
            {formatCompact(max * t)}
          </text>
        </g>
      ))}

      {data.map((v, i) => {
        const barH = max > 0 ? (v / max) * chartH : 0;
        const x = padL + i * (barWidth + barGap);
        const y = padding + chartH - barH;

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={Math.max(barH, 1)}
            rx="4"
            fill={color}
          >
            <title>
              {labels[i]}: {formatValue ? formatValue(v) : v}
            </title>
          </rect>
        );
      })}

      {labels.map((label, i) =>
        i % labelStep === 0 ? (
          <text
            key={i}
            x={padL + i * (barWidth + barGap) + barWidth / 2}
            y={height - 6}
            fontSize="11"
            textAnchor="middle"
            fill="#9ca3af"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function SimpleLineChart({
  data,
  labels,
  color = "#6fae8a",
  formatValue,
}) {
  const width = 560;
  const height = 200;
  const padding = 28;
  const padL = 52;
  const chartW = width - padL - padding;
  const chartH = height - padding * 2;

  const rawMax = data.length ? Math.max(...data) : 1;
  const rawMin = data.length ? Math.min(...data) : 0;
  const span = rawMax - rawMin;

  const yMin =
    data.length > 1 && span > 0
      ? Math.max(0, rawMin - span * 0.15)
      : 0;

  const yMax = span > 0 ? rawMax + span * 0.1 : rawMax || 1;
  const range = yMax - yMin || 1;

  const toY = (v) =>
    padding + chartH - ((v - yMin) / range) * chartH;

  const points = data.map((v, i) => {
    const x =
      data.length === 1
        ? padL + chartW / 2
        : padL + (i / (data.length - 1)) * chartW;

    return [x, toY(v)];
  });

  const hasPoints = points.length > 0;
  const baseY = padding + chartH;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");

  const areaPath = hasPoints
    ? `M ${points[0][0]} ${baseY} ` +
      points.map((p) => `L ${p[0]} ${p[1]}`).join(" ") +
      ` L ${points[points.length - 1][0]} ${baseY} Z`
    : "";

  const labelStep = Math.max(Math.ceil(labels.length / 12), 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="simple-chart-svg">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line
            x1={padL}
            x2={width - padding}
            y1={padding + chartH * (1 - t)}
            y2={padding + chartH * (1 - t)}
            stroke="#f0f0f0"
            strokeWidth="1"
          />
          <text
            x={padL - 8}
            y={padding + chartH * (1 - t)}
            fontSize="10"
            textAnchor="end"
            dominantBaseline="middle"
            fill="#9ca3af"
          >
            {formatCompact(yMin + range * t)}
          </text>
        </g>
      ))}

      {hasPoints && (
        <>
          <path
            d={areaPath}
            fill={color}
            opacity="0.12"
            stroke="none"
          />
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </>
      )}

      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="4" fill={color}>
          <title>
            {labels[i]}: {formatValue ? formatValue(data[i]) : data[i]}
          </title>
        </circle>
      ))}

      {labels.map((label, i) =>
        i % labelStep === 0 && points[i] ? (
          <text
            key={i}
            x={points[i][0]}
            y={height - 6}
            fontSize="11"
            textAnchor="middle"
            fill="#9ca3af"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function SimpleDonutChart({ segments }) {
  const size = 180;
  const stroke = 28;
  const svgWidth = 460;
  const svgHeight = 260;
  const radius = (size - stroke) / 2;
  const outerR = radius + stroke / 2;
  const circumference = 2 * Math.PI * radius;

  const donutCx = svgWidth / 2;
  const donutCy = svgHeight / 2;

  const data = segments || [];

  if (!data.length) {
    return (
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      >
        <circle
          cx={donutCx}
          cy={donutCy}
          r={radius}
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={stroke}
        />
      </svg>
    );
  }

  let cumPct = 0;

  const withAngles = data.map((s) => {
    const midPct = cumPct + s.pct / 2;
    cumPct += s.pct;

    const rad = (midPct / 100) * 360 * (Math.PI / 180);

    return { ...s, rad };
  });

  let offsetAcc = 0;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="donut-chart-svg"
    >
      <g transform={`rotate(-90 ${donutCx} ${donutCy})`}>
        {data.map((s) => {
          const segLength = (s.pct / 100) * circumference;
          const dasharray = `${segLength} ${circumference - segLength}`;
          const dashoffset = -((offsetAcc / 100) * circumference);

          offsetAcc += s.pct;

          return (
            <circle
              key={s.name}
              cx={donutCx}
              cy={donutCy}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
            />
          );
        })}
      </g>

      {withAngles.map((s) => {
        const sin = Math.sin(s.rad);
        const cos = Math.cos(s.rad);
        const p1x = donutCx + sin * (outerR + 4);
        const p1y = donutCy - cos * (outerR + 4);
        const p2x = donutCx + sin * (outerR + 20);
        const p2y = donutCy - cos * (outerR + 20);
        const isRight = sin >= 0;
        const p3x = isRight ? p2x + 24 : p2x - 24;

        return (
          <g key={s.name}>
            <polyline
              points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p2y}`}
              fill="none"
              stroke="#c9ccd1"
              strokeWidth="1"
            />
            <text
              x={isRight ? p3x + 4 : p3x - 4}
              y={p2y}
              fontSize="12"
              fill="#5a5f6a"
              textAnchor={isRight ? "start" : "end"}
              dominantBaseline="middle"
            >
              {s.pct.toFixed(1)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [statistics, setStatistics] = useState(null);
  const [products, setProducts] = useState([]);
  const [barcodes, setBarcodes] = useState([]);
  const [brandFamilies, setBrandFamilies] = useState([]);
  const [skuNames, setSkuNames] = useState([]);
  const [formats, setFormats] = useState([]);
  const [segments, setSegments] = useState([]);

  const [segmentShare, setSegmentShare] = useState([]);
  const [segmentShareLoading, setSegmentShareLoading] = useState(true);
  const [segmentShareError, setSegmentShareError] = useState(false);

  const [revenueByDay, setRevenueByDay] = useState([]);
  const [brandShare, setBrandShare] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    store: "",
    barcode: "",
    brandFamily: "",
    skuName: "",
    format: "",
    segment: "",
  });

  const [dateOpen, setDateOpen] = useState(false);

  const activeTab = location.pathname.startsWith("/sales-data")
    ? "sales"
    : "dashboard";

  const activeSubTab = location.pathname.includes("/external")
    ? "external"
    : "internal";

  useEffect(() => {
    if (
      location.pathname === "/dashboard" ||
      location.pathname === "/dashboard/"
    ) {
      navigate("/dashboard/internal", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    let ignore = false;
    const token = localStorage.getItem("token");

    fetch(`${API_BASE}/api/products/statistics`, {
      method: "GET",
      headers: {
        accept: "text/plain",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        if (response.status === 401) {
          const err = new Error("Unauthorized");
          err.status = 401;
          throw err;
        }

        if (!response.ok) {
          throw new Error(`Statistika yüklənmədi: ${response.status}`);
        }

        const responseText = await response.text();
        return JSON.parse(responseText);
      })
      .then((data) => {
        if (!ignore) setStatistics(data);
      })
      .catch((err) => {
        if (err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("expiresAt");
          navigate("/login");
        } else {
          console.error("Dashboard statistikaları yüklənmədi:", err);
        }
      });

    return () => {
      ignore = true;
    };
  }, [navigate]);

  const applyPreset = (days) => {
    const to = new Date();
    const from = new Date();

    if (days === "today") {
      // Bu gün
    } else if (days === "month") {
      from.setDate(1);
    } else {
      from.setDate(to.getDate() - days);
    }

    setFilters((f) => ({
      ...f,
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
    }));

    setDateOpen(false);
  };

  useEffect(() => {
    setLoading(false);
    setError("");

    setProducts([
      {
        salesQuantity: 27,
        salesRevenue: 134.3,
        brandFamily: "Davidoff",
        skuName: "Product 1",
        segment: "Premium",
        storeName: "Store 1",
        barcode: "10001",
        format: "Format 1",
        date: "2026-09-21",
      },
      {
        salesQuantity: 20,
        salesRevenue: 100,
        brandFamily: "JTI",
        skuName: "Product 2",
        segment: "Orta",
        storeName: "Store 2",
        barcode: "10002",
        format: "Format 2",
        date: "2026-09-20",
      },
      {
        salesQuantity: 15,
        salesRevenue: 80,
        brandFamily: "BAT",
        skuName: "Product 3",
        segment: "Ekonomik",
        storeName: "Store 1",
        barcode: "10003",
        format: "Format 1",
        date: "2026-09-19",
      },
      {
        salesQuantity: 18,
        salesRevenue: 92,
        brandFamily: "TABATERZA",
        skuName: "Product 4",
        segment: "Premium",
        storeName: "Store 2",
        barcode: "10004",
        format: "Format 2",
        date: "2026-09-18",
      },
      {
        salesQuantity: 8,
        salesRevenue: 26,
        brandFamily: "CAHAN",
        skuName: "Product 5",
        segment: "Ekonomik",
        storeName: "Store 1",
        barcode: "10005",
        format: "Format 1",
        date: "2026-09-17",
      },
    ]);
  }, []);

  useEffect(() => {
    let ignore = false;

    const handleError = (err, label) => {
      if (err.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expiresAt");
        navigate("/login");
      } else {
        console.error(`${label} yüklənmədi:`, err);
      }
    };

    fetchListOnce("/api/products/barcodes")
      .then((data) => {
        if (!ignore) setBarcodes(data);
      })
      .catch((err) => handleError(err, "Barkodlar"));

    fetchListOnce("/api/products/brand-families")
      .then((data) => {
        if (!ignore) setBrandFamilies(data);
      })
      .catch((err) => handleError(err, "Brand family"));

    fetchListOnce("/api/products/sku-names")
      .then((data) => {
        if (!ignore) setSkuNames(data);
      })
      .catch((err) => handleError(err, "SKU name"));

    fetchListOnce("/api/products/formats")
      .then((data) => {
        if (!ignore) setFormats(data);
      })
      .catch((err) => handleError(err, "Format"));

    fetchListOnce("/api/products/segments")
      .then((data) => {
        if (!ignore) setSegments(data);
      })
      .catch((err) => handleError(err, "Segment"));

    return () => {
      ignore = true;
    };
  }, [navigate]);
  useEffect(() => {
    let ignore = false;

    const handleError = (err) => {
      if (err.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expiresAt");
        navigate("/login");
      } else {
        console.error("Revenue by day yüklənmədi:", err);
      }
    };

    fetchListOnce("/api/products/revenue-by-day", filters)
      .then((data) => {
        if (!ignore) setRevenueByDay(data);
      })
      .catch(handleError);

    return () => {
      ignore = true;
    };
  }, [
    navigate,
    filters.dateFrom,
    filters.dateTo,
    filters.store,
    filters.barcode,
    filters.brandFamily,
    filters.skuName,
    filters.format,
    filters.segment,
  ]);

  useEffect(() => {
    let ignore = false;

    setSegmentShareLoading(true);
    setSegmentShareError(false);

    fetchListOnce("/api/products/segments/share", filters)
      .then((data) => {
        if (!ignore) {
          setSegmentShare(data);
          setSegmentShareLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setSegmentShareError(true);
          setSegmentShareLoading(false);
        }

        if (err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("expiresAt");
          navigate("/login");
        } else {
          console.error("Segment məlumatları yüklənmədi:", err);
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    navigate,
    filters.dateFrom,
    filters.dateTo,
    filters.store,
    filters.barcode,
    filters.brandFamily,
    filters.skuName,
    filters.format,
    filters.segment,
  ]);

  useEffect(() => {
    let ignore = false;

    fetchListOnce("/api/products/brands/share", filters)
      .then((data) => {
        if (!ignore) setBrandShare(data);
      })
      .catch((err) => {
        if (err.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("expiresAt");
          navigate("/login");
        } else {
          console.error("Brand məlumatları yüklənmədi:", err);
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    navigate,
    filters.dateFrom,
    filters.dateTo,
    filters.store,
    filters.barcode,
    filters.brandFamily,
    filters.skuName,
    filters.format,
    filters.segment,
  ]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiresAt");
    navigate("/login");
  };

  const filterOptions = useMemo(() => {
    const uniq = (key) =>
      Array.from(new Set(products.map((p) => p[key]).filter(Boolean)));

    return {
      store: uniq("storeName"),
      barcode: barcodes,
      brandFamily: brandFamilies,
      skuName: skuNames,
      format: formats,
      segment: segments,
    };
  }, [products, barcodes, brandFamilies, skuNames, formats, segments]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters.dateFrom || filters.dateTo) {
        if (!p.date) return false;

        const d = new Date(p.date);

        if (isNaN(d)) return false;
        if (filters.dateFrom && d < new Date(filters.dateFrom)) return false;

        if (filters.dateTo) {
          const to = new Date(filters.dateTo);
          to.setHours(23, 59, 59, 999);

          if (d > to) return false;
        }
      }

      if (filters.store && p.storeName !== filters.store) return false;
      if (filters.barcode && p.barcode !== filters.barcode) return false;

      if (
        filters.brandFamily &&
        (p.brandFamily || "").toUpperCase() !==
          filters.brandFamily.toUpperCase()
      ) return false;

      if (
        filters.skuName &&
        (p.skuName || "").toUpperCase() !== filters.skuName.toUpperCase()
      ) return false;

      if (
        filters.format &&
        (p.format || "").toUpperCase() !== filters.format.toUpperCase()
      ) return false;

      if (
        filters.segment &&
        (p.segment || "").toUpperCase() !== filters.segment.toUpperCase()
      ) return false;

      return true;
    });
  }, [products, filters]);

  const clearAllFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      store: "",
      barcode: "",
      brandFamily: "",
      skuName: "",
      format: "",
      segment: "",
    });
  };

  const trendSeries = useMemo(() => {
    const fromKey = filters.dateFrom
      ? monthKey(new Date(filters.dateFrom))
      : null;

    const toKey = filters.dateTo
      ? monthKey(new Date(filters.dateTo))
      : null;

    const byMonth = {};

    revenueByDay.forEach((r) => {
      const d = new Date(r.day);

      if (isNaN(d)) return;

      const key = monthKey(d);

      if (fromKey !== null && key < fromKey) return;
      if (toKey !== null && key > toKey) return;

      if (!byMonth[key]) {
        byMonth[key] = {
          d: new Date(d.getFullYear(), d.getMonth(), 1),
          revenue: 0,
        };
      }

      byMonth[key].revenue += Number(r.revenue) || 0;
    });

    const rows = Object.keys(byMonth)
      .map(Number)
      .sort((a, b) => a - b)
      .map((k) => byMonth[k]);

    return {
      labels: rows.map((r) => formatTrendLabel(r.d)),
      revenue: rows.map((r) => r.revenue),
    };
  }, [revenueByDay, filters.dateFrom, filters.dateTo]);

  const segmentAgg = useMemo(() => {
    return segmentShare
      .map((row) => ({
        name: row.segment,
        pct: Number(row.sharePercentage) || 0,
      }))
      .filter((row) => row.name)
      .filter(
        (row) =>
          !filters.segment ||
          String(row.name).toUpperCase() === filters.segment.toUpperCase(),
      )
      .sort((a, b) => b.pct - a.pct);
  }, [segmentShare, filters.segment]);

  const brandShareAgg = useMemo(() => {
    const sorted = brandShare
      .map((b) => ({
        name: b.brandFamily,
        pct: Number(b.sharePercentage) || 0,
      }))
      .sort((a, b) => b.pct - a.pct);

    const top = sorted.slice(0, 5);
    const restPct = sorted
      .slice(5)
      .reduce((sum, b) => sum + b.pct, 0);

    if (restPct > 0) {
      top.push({ name: "Digər", pct: restPct });
    }

    return top.map((b, i) => ({
      ...b,
      color: BRAND_COLORS[i % BRAND_COLORS.length],
    }));
  }, [brandShare]);

  const maxSegmentPct = Math.max(
    ...segmentAgg.map((s) => s.pct),
    1,
  );

  const formatNumber = (value, maximumFractionDigits = 0) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(
      Number(value) || 0,
    );

  const formatChange = (value) => {
    const change = Number(value) || 0;
    const sign = change > 0 ? "+" : "";

    return `${sign}${formatNumber(change, 2)}% from last month`;
  };

  const statValues = statistics
    ? [
        {
          value: formatNumber(statistics.totalSales?.currentValue),
          change: formatChange(
            statistics.totalSales?.percentChangeFromLastMonth,
          ),
        },
        {
          value: formatNumber(statistics.totalRevenue?.currentValue, 2),
          change: formatChange(
            statistics.totalRevenue?.percentChangeFromLastMonth,
          ),
        },
        {
          value: `${statistics.topBrandShare?.brandFamily || "—"}${
            statistics.topBrandShare?.sharePercentage != null
              ? ` (${formatNumber(
                  statistics.topBrandShare.sharePercentage,
                  2,
                )}%)`
              : ""
          }`,
          change: formatChange(
            statistics.topBrandShare?.percentChangeFromLastMonth,
          ),
        },
        {
          value: formatNumber(statistics.activeProducts?.currentValue),
          change: formatChange(
            statistics.activeProducts?.percentChangeFromLastMonth,
          ),
        },
      ]
    : null;

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

      <div className="internal-filters">
        <div className="date-range-wrap">
          <button
            className="filter-pill filter-pill-icon"
            onClick={() => setDateOpen((v) => !v)}
            type="button"
          >
            <span>📅</span>
            <span>
              {filters.dateFrom || filters.dateTo
                ? `${filters.dateFrom || "…"} → ${filters.dateTo || "…"}`
                : "Date range"}
            </span>
          </button>

          {dateOpen && (
            <div className="date-range-popover">
              <div className="date-range-presets">
                <button onClick={() => applyPreset("today")}>
                  Today
                </button>
                <button onClick={() => applyPreset(7)}>
                  Last 7 days
                </button>
                <button onClick={() => applyPreset(30)}>
                  Last 30 days
                </button>
                <button onClick={() => applyPreset("month")}>
                  This month
                </button>
              </div>

              <div className="date-range-custom">
                <label>
                  From
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateFrom: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  To
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateTo: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              <div className="date-range-actions">
                <button
                  className="date-range-clear"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      dateFrom: "",
                      dateTo: "",
                    })
                  }
                >
                  Sil
                </button>

                <button
                  className="date-range-apply"
                  onClick={() => setDateOpen(false)}
                >
                  Tətbiq et
                </button>
              </div>
            </div>
          )}
        </div>

        <select
          className="filter-pill"
          value={filters.store}
          onChange={(e) =>
            setFilters({ ...filters, store: e.target.value })
          }
        >
          <option value="">All stores</option>
          {filterOptions.store.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="filter-pill"
          value={filters.barcode}
          onChange={(e) =>
            setFilters({ ...filters, barcode: e.target.value })
          }
        >
          <option value="">Barcode</option>
          {filterOptions.barcode.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="filter-pill"
          value={filters.brandFamily}
          onChange={(e) =>
            setFilters({ ...filters, brandFamily: e.target.value })
          }
        >
          <option value="">Brand family</option>
          {filterOptions.brandFamily.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="filter-pill"
          value={filters.skuName}
          onChange={(e) =>
            setFilters({ ...filters, skuName: e.target.value })
          }
        >
          <option value="">SKU name</option>
          {filterOptions.skuName.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="filter-pill"
          value={filters.format}
          onChange={(e) =>
            setFilters({ ...filters, format: e.target.value })
          }
        >
          <option value="">Format</option>
          {filterOptions.format.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          className="filter-pill"
          value={filters.segment}
          onChange={(e) =>
            setFilters({ ...filters, segment: e.target.value })
          }
        >
          <option value="">Segment</option>
          {filterOptions.segment.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <button className="filter-clear" onClick={clearAllFilters}>
          Clear all
        </button>
      </div>

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
      </div>

      {loading && (
        <div className="internal-status">Yüklənir...</div>
      )}

      {error && (
        <div className="internal-status internal-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="stats-section">
            {STAT_CARDS.map((c, index) => (
              <div className="stat-card" key={c.title}>
                <div className="stat-card-info">
                  <span className="stat-card-title">
                    {c.title}
                  </span>

                  {statValues ? (
                    <>
                      <span className="stat-card-value">
                        {statValues[index].value}
                      </span>

                      <span className="stat-card-change">
                        {statValues[index].change}
                      </span>
                    </>
                  ) : (
                    <SkeletonTheme
                      baseColor="#e5e7eb"
                      highlightColor="#f3f4f6"
                    >
                      <span className="stat-card-value">
                        <Skeleton width={110} height={26} />
                      </span>

                      <span className="stat-card-change">
                        <Skeleton width={140} height={12} />
                      </span>
                    </SkeletonTheme>
                  )}
                </div>

                <div
                  className="stat-card-icon"
                  style={{
                    background: c.iconBg,
                    color: c.iconColor,
                  }}
                >
                  <FontAwesomeIcon icon={c.icon} />
                </div>
              </div>
            ))}
          </section>

          <section className="charts-section">
            <div className="chart-card">
              <div className="chart-card-header chart-card-header-row">
                <span>Monthly sales &amp; revenue</span>
              </div>

              <div className="chart-card-body">
                {trendSeries.revenue.length === 0 ? (
                  <div className="empty-note">
                    Məlumat yoxdur
                  </div>
                ) : (
                  <SimpleBarChart
                    data={trendSeries.revenue}
                    labels={trendSeries.labels}
                    formatValue={(v) => formatNumber(v, 2)}
                  />
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <span>Seqmentlər</span>
              </div>

              <div className="chart-card-body segment-list">
                {segmentShareLoading ? (
                  <SkeletonTheme
                    baseColor="#e5e7eb"
                    highlightColor="#f3f4f6"
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div className="segment-row" key={i}>
                        <div className="segment-name">
                          <Skeleton width={70} />
                        </div>

                        <div className="segment-bar-track">
                          <Skeleton height={10} borderRadius={6} />
                        </div>

                        <div className="segment-pct">
                          <Skeleton width={36} />
                        </div>
                      </div>
                    ))}
                  </SkeletonTheme>
                ) : segmentShareError ? (
                  <div className="empty-note">
                    Məlumat yüklənmədi
                  </div>
                ) : segmentAgg.length === 0 ? (
                  <div className="empty-note">
                    Məlumat yoxdur
                  </div>
                ) : (
                  segmentAgg.map((s) => (
                    <div className="segment-row" key={s.name}>
                      <div className="segment-name">
                        {s.name}
                      </div>

                      <div className="segment-bar-track">
                        <div
                          className="segment-bar-fill"
                          style={{
                            width: `${(s.pct / maxSegmentPct) * 100}%`,
                          }}
                        />
                      </div>

                      <div className="segment-pct">
                        {s.pct.toFixed(1)}%
                      </div>
                    </div>
                  ))
                )}

                {!segmentShareLoading &&
                  !segmentShareError &&
                  segmentAgg.length > 0 && (
                    <div className="segment-axis">
                      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                        <span key={t}>
                          {Math.round(maxSegmentPct * t)}%
                        </span>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <span>Monthly sales trends</span>
                <span className="chart-card-subtitle">
                  Revenue performance over time
                </span>
              </div>

              <div className="chart-card-body">
                {trendSeries.revenue.length === 0 ? (
                  <div className="empty-note">
                    Məlumat yoxdur
                  </div>
                ) : (
                  <SimpleLineChart
                    data={trendSeries.revenue}
                    labels={trendSeries.labels}
                    formatValue={(v) => formatNumber(v, 2)}
                  />
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-card-header">
                <span>Market share by brand</span>
                <span className="chart-card-subtitle">
                  Top performing brands distribution
                </span>
              </div>

              <div className="chart-card-body donut-body donut-body-callout">
                <div className="donut-wrap">
                  <SimpleDonutChart segments={brandShareAgg} />
                </div>

                <div className="donut-legend donut-legend-bottom">
                  {brandShareAgg.length === 0 && (
                    <div className="empty-note">
                      Məlumat yoxdur
                    </div>
                  )}

                  {brandShareAgg.map((b) => (
                    <div
                      className="donut-legend-item"
                      key={b.name}
                    >
                      <span
                        className="donut-dot"
                        style={{ background: b.color }}
                      /> 

                      <span>
                        {b.name}: {b.pct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;