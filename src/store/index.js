import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice.js";
import filtersReducer from "./filtersSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filters: filtersReducer,
  },
});
