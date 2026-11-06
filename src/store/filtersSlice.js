import { createSlice } from "@reduxjs/toolkit";

export const EMPTY_FILTERS = {
  dateFrom: "",
  dateTo: "",
  store: "",
  barcode: "",
  brandFamily: "",
  skuName: "",
  format: "",
  segment: "",
  category: "",
  brand: "",
};

const filtersSlice = createSlice({
  name: "filters",
  initialState: EMPTY_FILTERS,
  reducers: {
    updateFilters(state, { payload }) {
      Object.assign(state, payload);
    },
    clearFilters() {
      return EMPTY_FILTERS;
    },
  },
});

export const { updateFilters, clearFilters } = filtersSlice.actions;
export default filtersSlice.reducer;
