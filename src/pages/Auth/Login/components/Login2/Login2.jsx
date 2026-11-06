import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLogin } from "../../../../../api/hooks/useLogin.js";
import "./Login2.css";

function Login2() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const email = location.state?.email || "";
  const password = location.state?.password || "";


  if (!email || !password) {
    navigate("/login");
  }

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return; 

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join("");

    if (code.length < otp.length) {
      setError("Kodu tam daxil et!");
      return;
    }
    setError("");
    setSuccess("");
    loginMutation.mutate(
      {
        email,
        password,
        otp: code,
      },
      {
        onSuccess: ({ token, refreshToken, expiresAt }) => {
          localStorage.setItem("token", token);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("expiresAt", expiresAt);

          setSuccess("Uğurla təsdiqləndi!");
          navigate("/dashboard");
        },
      },
    );
  };

  const requestError = loginMutation.error;
  const errorMessage =
    error ||
    requestError?.response?.data?.message ||
    requestError?.response?.data?.title ||
    (requestError && "Kod yanlışdır və ya serverə qoşulmaq mümkün olmadı!");

  return (
    <div className="container">
      <div className="box">
        <h2>SelloutData</h2>
        <p className="subtitle">
          {email
            ? `${email} ünvanına göndərilən kodu daxil et`
            : "E-poçtunuza göndərilən kodu daxil edin"}
        </p>

        <div className="otp-wrapper">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => (inputsRef.current[index] = el)}
              className="otp-input"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          className="button"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Yoxlanılır..." : "Verify"}
        </button>

        {success && <p className="success">{success}</p>}
        {errorMessage && <p className="error">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default Login2;