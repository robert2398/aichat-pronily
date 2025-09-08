import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Field from "./Field";
import PrimaryButton from "./PrimaryButton";
import DividerOr from "./DividerOr";
import GoogleButton from "./GoogleButton";
import Modal from "../ui/Modal";
import { useNavigate, useLocation } from "react-router-dom";

export default function SignUp(){
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState({ open: false, title: '', message: '' });
  const navigate = useNavigate();
  const location = useLocation();

  function stripStatusCode(text) {
    if (!text) return text;
    // remove leading status code like "400: " or "400 - " or "400:"
    return text.replace(/^\s*\d{3}\s*[:\-]\s*/,'').trim();
  }

  async function handleSignUp() {
    setError(null);
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const res = await fetch(`${base}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        // backend may return { error: "400: Email already registered" }
        const raw = data?.error || data?.message || 'Signup failed';
        const msg = stripStatusCode(raw);
        setModal({ open: true, title: 'Sign up failed', message: msg });
        setError(msg);
        return;
      }
  // on success show verification popup instead of navigating
  setModal({ open: true, title: 'Verification Sent', message: 'Email Verification sent on your Email' });
    } catch (err) {
      console.error('Signup error', err);
      const msg = err?.message || String(err) || 'Signup failed';
      setModal({ open: true, title: 'Sign up failed', message: msg });
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-pink-200 drop-shadow-lg">Create Account For Free &amp; Receive 25 Tokens!</h1>
      <div className="space-y-6">
        <Field label="Email Id" placeholder="Enter email" value={email} onChange={setEmail} />
        <Field label="Password" placeholder="Enter password" value={pw} onChange={setPw} type={show? 'text':'password'} rightIcon={show ? <Eye className="h-5 w-5"/> : <EyeOff className="h-5 w-5"/>} onRightIconClick={()=>setShow(v=>!v)} />
        <PrimaryButton onClick={handleSignUp} disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</PrimaryButton>
        <Modal open={modal.open} title={modal.title} onClose={() => setModal({ open: false, title: '', message: '' })}>
          {modal.message}
        </Modal>
        <DividerOr />
        <GoogleButton label="Continue with Google" />
  <p className="text-center text-sm text-white/70">Have an account? <button className="text-pink-400 hover:text-pink-300" onClick={()=>navigate('/signin',{state:{background:location}})}>Sign In</button></p>
      </div>
    </div>
  );
}
