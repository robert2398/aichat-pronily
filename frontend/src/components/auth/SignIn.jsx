import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Field from "./Field";
import PrimaryButton from "./PrimaryButton";
import DividerOr from "./DividerOr";
import GoogleButton from "./GoogleButton";
import { useNavigate, useLocation } from "react-router-dom";

export default function SignIn(){
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async () => {
    setError("");

    // Basic client-side validation
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!pw || pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch((base.endsWith("/") ? base.slice(0, -1) : base) + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });

      const data = await res.json().catch(()=>null);
      if (!res.ok) {
        // Try to emit a useful message from response body
        const msg = data && (data.detail || data.message || data.error) ? (data.detail || data.message || data.error) : res.statusText || "Login failed";
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        setLoading(false);
        return;
      }

      // Persist full raw response so Header (and other parts) can parse user info
      localStorage.setItem('pronily:auth:raw', JSON.stringify(data || {}));

      // Find token in common fields and save normalized token if present
      const token = data && (data.access_token || data.token || data.access || data.auth_token || (data.data && data.data.token));
      if (token) {
        // normalize to a Bearer string if not already present
        const normalized = typeof token === 'string' && token.toLowerCase().startsWith('bearer') ? token : `Bearer ${token}`;
        localStorage.setItem('pronily:auth:token', normalized);
      }

      // Save user email for convenience
      localStorage.setItem('pronily:auth:email', email);

      // Redirect to the saved return location (preferred), then background, then root
      const state = location.state || {};
      const returnTo = state.returnTo || (state.background && state.background.pathname ? (state.background.pathname + (state.background.search || "")) : null);
      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else {
        navigate('/', { replace: true });
      }

    } catch (err) {
      setError(err && err.message ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Sign In</h1>
      <div className="space-y-6">
        <Field label="Email Id" placeholder="Enter email" value={email} onChange={setEmail} />
        <Field label="Password" placeholder="Enter password" value={pw} onChange={setPw} type={show? 'text':'password'} rightIcon={show ? <Eye className="h-5 w-5"/> : <EyeOff className="h-5 w-5"/>} onRightIconClick={()=>setShow(v=>!v)} />
        <div className="flex items-center justify-between text-sm text-white/80">
          <label className="inline-flex items-center gap-2 select-none"><input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent"/> Remember Me</label>
          <button className="text-pink-400 hover:text-pink-300" onClick={()=>navigate('/forgot-password',{state:{background:location}})}>Forgot password?</button>
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <PrimaryButton onClick={handleLogin} disabled={loading}>{loading ? 'Signing in...' : 'Login'}</PrimaryButton>
        <DividerOr />
        <GoogleButton label="Continue with Google" />
  <p className="text-center text-sm text-white/70">Don’t have an account? <button className="text-pink-400 hover:text-pink-300" onClick={()=>navigate('/signup',{state:{background:location}})}>Sign Up</button></p>
      </div>
    </div>
  );
}
