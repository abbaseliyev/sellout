import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useLogin } from "../../../api/hooks/useLogin.js";
import { setCredentials } from "../../../store/authSlice.js";
import Login1 from "./components/Login1/Login1";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [responseError, setResponseError] = useState("");

  const handleLogin = (credentials) => {
    setResponseError("");
    loginMutation.mutate(credentials, {
      onSuccess: (data) => {
        if (!data || typeof data !== "object") {
          setResponseError("Serverdən daxilolma məlumatları düzgün alınmadı.");
          return;
        }

        const { token, refreshToken, expiresAt } = data;

        if (!token || !refreshToken || !expiresAt) {
          setResponseError("Serverdən daxilolma məlumatları düzgün alınmadı.");
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("expiresAt", expiresAt);
        dispatch(setCredentials({ token, refreshToken, expiresAt }));
        navigate("/dashboard");
      },
    });
  };

  const requestError = loginMutation.error;
  const errorMessage =
    responseError ||
    requestError?.response?.data?.message ||
    requestError?.response?.data?.title ||
    (requestError && "Daxil olmaq mümkün olmadı. Yenidən cəhd edin.");

  return (
    <Login1
      onSubmit={handleLogin}
      isPending={loginMutation.isPending}
      errorMessage={errorMessage}
    />
  );
}