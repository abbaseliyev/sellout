import { useState } from "react";
import "./Login1.css";

function Login1({ onSubmit, isPending, errorMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();
    if (!email || !password) {
      setError("Xanaları düzgün doldur!");
      return;
    }

    setError("");
    onSubmit({ email, password });
  };

  return (
    <div className="container">
      <div className="box">
        <h2>SelloutData</h2>
        <p className="subtitle">Sign in to access your company dashboard</p>

        <form onSubmit={handleLogin}>
          <div className="input-icon">
            <h4>Email</h4>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
            />
          </div>

          <div className="password-field">
            <h4>Password</h4>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input password-input"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="button" disabled={isPending}>
            {isPending ? "Daxil olunur..." : "Sign in"}
          </button>
        </form>

        {(error || errorMessage) && (
          <p className="error">{error || errorMessage}</p>
        )}
      </div>
    </div>
  );
}

export default Login1;