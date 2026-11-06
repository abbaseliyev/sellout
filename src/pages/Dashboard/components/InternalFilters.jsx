import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useBarcodes } from "../../../api/hooks/useBarcodes.js";
import { useBrandFamilies } from "../../../api/hooks/useBrandFamilies.js";
import {
  useFormats,
  useSegments,
  useSkuNames,
} from "../../../api/hooks/useProductFilterOptions.js";
import { clearFilters, updateFilters } from "../../../store/filtersSlice.js";
import { clearCredentials } from "../../../store/authSlice.js";

const FILTERS = [
  ["store", "All stores"],
  ["barcode", "Barcode"],
  ["brandFamily", "Brand family"],
  ["skuName", "SKU name"],
  ["format", "Format"],
  ["segment", "Segment"],
];

function toLocalISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function InternalFilters({ options = {} }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const filters = useSelector((state) => state.filters);
  const { data: barcodes = [], error: barcodeError } = useBarcodes();
  const { data: brandFamilies = [], error: brandFamilyError } =
    useBrandFamilies();
  const { data: skuNames = [], error: skuNamesError } = useSkuNames();
  const { data: formats = [], error: formatsError } = useFormats();
  const { data: segments = [], error: segmentsError } = useSegments();
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    const requestError =
      barcodeError ||
      brandFamilyError ||
      skuNamesError ||
      formatsError ||
      segmentsError;
    if (requestError?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("expiresAt");
      dispatch(clearCredentials());
      navigate("/login");
    }
  }, [
    barcodeError,
    brandFamilyError,
    skuNamesError,
    formatsError,
    segmentsError,
    dispatch,
    navigate,
  ]);

  const update = (key, value) => dispatch(updateFilters({ [key]: value }));

  const applyPreset = (preset) => {
    const to = new Date();
    const from = new Date(to);
    if (preset === "month") {
      from.setDate(1);
    } else if (preset !== "today") {
      from.setDate(to.getDate() - preset);
    }
    dispatch(
      updateFilters({
        dateFrom: toLocalISO(from),
        dateTo: toLocalISO(to),
      }),
    );
    setDateOpen(false);
  };

  const getOptions = (key) => {
    if (key === "barcode") return barcodes;
    if (key === "brandFamily") return brandFamilies;
    if (key === "skuName") return skuNames;
    if (key === "format") return formats;
    if (key === "segment") return segments;
    return options[key] || [];
  };

  return (
    <div className="internal-filters">
      <div className="date-range-wrap">
        <button
          className="filter-pill filter-pill-icon"
          onClick={() => setDateOpen((open) => !open)}
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
              <button type="button" onClick={() => applyPreset("today")}>
                Today
              </button>
              <button type="button" onClick={() => applyPreset(7)}>
                Last 7 days
              </button>
              <button type="button" onClick={() => applyPreset(30)}>
                Last 30 days
              </button>
              <button type="button" onClick={() => applyPreset("month")}>
                This month
              </button>
            </div>
            <div className="date-range-custom">
              <label>
                From
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => update("dateFrom", event.target.value)}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => update("dateTo", event.target.value)}
                />
              </label>
            </div>
            <div className="date-range-actions">
              <button
                className="date-range-clear"
                type="button"
                onClick={() => {
                  update("dateFrom", "");
                  update("dateTo", "");
                }}
              >
                Sil
              </button>
              <button
                className="date-range-apply"
                type="button"
                onClick={() => setDateOpen(false)}
              >
                Tətbiq et
              </button>
            </div>
          </div>
        )}
      </div>

      {FILTERS.map(([key, label]) => {
        const values = getOptions(key);
        const selectOptions =
          filters[key] && !values.includes(filters[key])
            ? [filters[key], ...values]
            : values;

        return (
          <select
            key={key}
            className="filter-pill"
            value={filters[key] || ""}
            onChange={(event) => update(key, event.target.value)}
          >
            <option value="">{label}</option>
            {selectOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        );
      })}

      <button
        type="button"
        className="filter-clear"
        onClick={() => dispatch(clearFilters())}
      >
        Clear all
      </button>

      {(barcodeError ||
        brandFamilyError ||
        skuNamesError ||
        formatsError ||
        segmentsError) && (
        <span role="alert">
          {(
            barcodeError ||
            brandFamilyError ||
            skuNamesError ||
            formatsError ||
            segmentsError
          ).message}{" "}
          — filter məlumatları yüklənmədi.
        </span>
      )}
    </div>
  );
}

export default InternalFilters;
