import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: localStorage.getItem("token"),
  refreshToken: localStorage.getItem("refreshToken"),
  expiresAt: localStorage.getItem("expiresAt"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, { payload }) {
      state.token = payload.token;
      state.refreshToken = payload.refreshToken;
      state.expiresAt = payload.expiresAt;
    },
    clearCredentials(state) {
      state.token = null;
      state.refreshToken = null;
      state.expiresAt = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
