import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearFilters } from "../../../store/filtersSlice.js";
import { clearCredentials } from "../../../store/authSlice.js";
import InternalFilters from "../components/InternalFilters.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import "./SalesData.css";

const API_BASE = "http://135.181.42.5:291";
const PER_PAGE = 10;
const EXPORT_LIMIT = 10000; 

const COLUMNS = [
  { key: "storeName", label: "Store name" },
  { key: "date", label: "Date" },
  { key: "barcode", label: "Barcode" },
  { key: "brandFamily", label: "Brand family" },
  { key: "skuName", label: "SKU name" },
  { key: "salesQuantity", label: "Sales quantity" },
  { key: "format", label: "Format" },
  { key: "segment", label: "Segment" },
  { key: "price", label: "Price" },
  { key: "salesRevenue", label: "Revenue" },
];

const ARRAY_FILTERS = [
  { api: "Companies", names: ["companies", "company"] },
  { api: "StoreNames", names: ["storeNames", "stores", "store", "storeName"] },
  { api: "Barcodes", names: ["barcodes", "barcode"] },
  { api: "BrandFamilies", names: ["brandFamilies", "brandFamily"] },
  { api: "SkuNames", names: ["skuNames", "skuName", "sku"] },
  { api: "Formats", names: ["formats", "format"] },
  { api: "Segments", names: ["segments", "segment"] },
];

const SCALAR_FILTERS = [
  { api: "FromDate", names: ["fromDate", "dateFrom", "startDate", "from"] },
  { api: "ToDate", names: ["toDate", "dateTo", "endDate", "to"] },
  { api: "MinSalesQuantity", names: ["minSalesQuantity"] },
  { api: "MaxSalesQuantity", names: ["maxSalesQuantity"] },
  { api: "MinPrice", names: ["minPrice"] },
  { api: "MaxPrice", names: ["maxPrice"] },
  { api: "MinSalesRevenue", names: ["minSalesRevenue"] },
  { api: "MaxSalesRevenue", names: ["maxSalesRevenue"] },
];

const pick = (obj, names) => {
  for (const n of names) {
    const v = obj?.[n];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

function buildQuery({ filters, search, brand, sort, page, take = PER_PAGE, skipOverride }) {
  const qs = new URLSearchParams();

  if (search.trim()) qs.set("SearchTerm", search.trim());

  ARRAY_FILTERS.forEach(({ api, names }) => {
    let v = pick(filters, names);
    if (v === undefined) return;
    if (!Array.isArray(v)) v = [v];
    v.filter((x) => x !== "" && x != null).forEach((x) => qs.append(api, x));
  });

  if (brand) qs.append("BrandFamilies", brand);

  SCALAR_FILTERS.forEach(({ api, names }) => {
    const v = pick(filters, names);
    if (v === undefined) return;
    const val = v instanceof Date ? v.toISOString() : v;
    qs.set(api, val);
  });

  qs.set("Deleted", "false");

  qs.set("Skip", String(skipOverride ?? (page - 1) * PER_PAGE));
  qs.set("Take", String(take));

  if (sort.key) {
    qs.set("SortField", sort.key);
    qs.set("OrderBy", String(sort.dir === "asc")); 
  }

  return qs.toString();
}

function formatMoney(value) {
  if (value === null || value === undefined || isNaN(value)) return "$0.00";
  return `$${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString();
}

// 1 ... 4 5 6 ... 26 kimi səhifə siyahısı
function getPageItems(page, pages) {
  const nums = [...new Set([1, page - 1, page, page + 1, pages])]
    .filter((p) => p >= 1 && p <= pages)
    .sort((a, b) => a - b);
  const items = [];
  nums.forEach((p, i) => {
    if (i && p - nums[i - 1] > 1) items.push("dots-" + p);
    items.push(p);
  });
  return items;
}

function SalesData() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.filters) || {};

  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [page, setPage] = useState(1);
  const [brand, setBrand] = useState("");

  const [knownValues, setKnownValues] = useState({
    storeName: [],
    barcode: [],
    brandFamily: [],
    skuName: [],
    format: [],
    segment: [],
  });

  const [status, setStatus] = useState(null); 

  const activeTab = location.pathname.startsWith("/sales-data")
    ? "sales"
    : "dashboard";

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiresAt");
    dispatch(clearCredentials());
    dispatch(clearFilters());
    navigate("/login");
  }, [dispatch, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    setPage(1);
  }, [filtersKey, debouncedSearch, brand, sort]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const query = buildQuery({ filters, search: debouncedSearch, brand, sort, page });

        const res = await fetch(`${API_BASE}/api/products?${query}`, {
          headers: {
            accept: "text/plain",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (res.status === 401) {
          handleLogout();
          return;
        }
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Xəta: ${res.status}`);
        }

        const json = await res.json();
        if (json.succeeded === false) {
          throw new Error(json.message || json.errors?.join(", ") || "Sorğu uğursuz oldu");
        }

        const data = json.data || [];
        setProducts(data);
        setTotalCount(json.count ?? data.length);

        setKnownValues((prev) => {
          const next = { ...prev };
          Object.keys(prev).forEach((k) => {
            const set = new Set(prev[k]);
            data.forEach((p) => p[k] && set.add(p[k]));
            next[k] = Array.from(set).sort();
          });
          return next;
        });
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Məlumat alınmadı:", err);
        setError(err.message || "Məlumat alınmadı");
        setProducts([]);
        setTotalCount(0);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [filtersKey, debouncedSearch, brand, sort, page]);

  useEffect(() => {
    if (!status) return undefined;
    const t = setTimeout(() => setStatus(null), 5000);
    return () => clearTimeout(t);
  }, [status]);

  const filterOptions = useMemo(
    () => ({
      store: knownValues.storeName,
      barcode: knownValues.barcode,
      brandFamily: knownValues.brandFamily,
      skuName: knownValues.skuName,
      format: knownValues.format,
      segment: knownValues.segment,
    }),
    [knownValues]
  );

  const pages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const current = Math.min(page, pages);

  const pageRevenue = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.salesRevenue) || 0), 0),
    [products]
  );

  const onSort = (key) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const query = buildQuery({
        filters,
        search: debouncedSearch,
        brand,
        sort,
        page: 1,
        take: EXPORT_LIMIT,
        skipOverride: 0,
      });
      const res = await fetch(`${API_BASE}/api/products?${query}`, {
        headers: { accept: "text/plain", Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (!res.ok) throw new Error(`Xəta: ${res.status}`);
      const json = await res.json();
      const list = json.data || [];

      const header = COLUMNS.map((c) => c.label);
      const lines = list.map((p) =>
        COLUMNS.map((c) => {
          const val = c.key === "date" ? formatDate(p.date) : p[c.key] ?? "";
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",")
      );
      const csv = [header.join(","), ...lines].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales-data.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export alınmadı:", err);
      setStatus({ type: "error", text: err.message || "Export alınmadı" });
    } finally {
      setExporting(false);
    }
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
          type="button"
        >
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
      </header>

      <nav className="internal-tabs">
        <button
          type="button"
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => navigate("/dashboard/internal")}
        >
          Dashboard
        </button>
        <button
          type="button"
          className={activeTab === "sales" ? "active" : ""}
          onClick={() => navigate("/sales-data")}
        >
          Sales data
        </button>
      </nav>

      <InternalFilters options={filterOptions} />

      {error && <div className="internal-status internal-error">{error}</div>}

      <section className="sd-card">
        <div className="sd-card__head">
          <div>
            <h2>Sales Transaction History</h2>
            <p>Detailed sales records with filtering options</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="sd-btn"
              onClick={handleExport}
              disabled={exporting}
              style={exporting ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
              </svg>
              {exporting ? "Yüklənir..." : "Export"}
            </button>
          </div>
        </div>

        {status && (
          <div
            role="status"
            style={{
              margin: "0 0 12px",
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background: status.type === "success" ? "#e3f7e9" : "#fdecec",
              color: status.type === "success" ? "#15803d" : "#b91c1c",
            }}
          >
            {status.text}
          </div>
        )}

        <div className="sd-bar">
          <div className="sd-search-wrap">
            <input
              type="search"
              className="sd-search"
              placeholder="Search products, brands, stores"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="filter-pill"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="">All brands</option>
            {knownValues.brandFamily.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div className="sd-table-wrap" style={loading ? { opacity: 0.6 } : undefined}>
          <table className="sd-table">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th key={c.key}>
                    <button type="button" onClick={() => onSort(c.key)}>
                      <span className="sd-th-label">{c.label}</span>
                      <span className="sd-sort" aria-hidden="true">
                        {sort.key === c.key
                          ? sort.dir === "asc"
                            ? "↑"
                            : "↓"
                          : "↑↓"}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && products.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="sd-empty">
                    Yüklənir...
                  </td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="sd-empty">
                    Məlumat tapılmadı
                  </td>
                </tr>
              )}
              {products.map((p, i) => (
                <tr key={p.id ?? `${current}-${i}`}>
                  <td>{p.storeName || "—"}</td>
                  <td>{formatDate(p.date)}</td>
                  <td>{p.barcode || "—"}</td>
                  <td>{p.brandFamily || "—"}</td>
                  <td>{p.skuName || "—"}</td>
                  <td>{p.salesQuantity ?? 0}</td>
                  <td>{p.format || "—"}</td>
                  <td>{p.segment || "—"}</td>
                  <td>{formatMoney(p.price)}</td>
                  <td>{formatMoney(p.salesRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sd-total">
          Page revenue: {formatMoney(pageRevenue)}
        </div>

        <nav className="sd-pagination" aria-label="Pagination">
          <span>Total - {totalCount.toLocaleString()}</span>
          <button
            type="button"
            disabled={current === 1 || loading}
            onClick={() => setPage(current - 1)}
            aria-label="Previous"
          > 
            ‹
          </button>
          {getPageItems(current, pages).map((p) =>
            typeof p === "string" ? (
              <span key={p} className="sd-dots">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={p === current ? "active" : ""}
                aria-current={p === current ? "page" : undefined}
                disabled={loading}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            disabled={current === pages || loading}
            onClick={() => setPage(current + 1)}
            aria-label="Next"
          >
            ›
          </button>
        </nav>
      </section>
    </div>
  );
}

export default SalesData;