import React, { useState } from "react";
import Field from "./Field";
import PrimaryButton from "./PrimaryButton";
import Modal from "../ui/Modal";
import { useNavigate, useLocation } from "react-router-dom";

export default function ForgotPassword(){
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', message: '' });
  const navigate = useNavigate();
  const location = useLocation();

  const handleSend = async () => {
    if (!email || !email.includes('@')) {
      setModal({ open: true, title: 'Invalid email', message: 'Please enter a valid email address.' });
      return;
    }
    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const url = (base.endsWith('/') ? base.slice(0, -1) : base) + '/auth/password-reset/request';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      // Expecting: {"message": "If the e-mail exists, password was sent to email."}
      const data = await res.json().catch(()=>null);
      const msg = data && data.message ? data.message : (res.ok ? 'If the e-mail exists, password was sent to email.' : (data && (data.detail || data.error) ? (data.detail || data.error) : 'Request failed'));
      setModal({ open: true, title: 'Password Reset', message: msg });
    } catch (err) {
      setModal({ open: true, title: 'Network error', message: err && err.message ? err.message : 'Failed to send request.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold">Reset Password</h1>
      <div className="space-y-6">
        <Field label="Email Id" placeholder="Enter email" value={email} onChange={setEmail} />
        <PrimaryButton onClick={handleSend} disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</PrimaryButton>
  <p className="text-center text-sm text-white/70">Remembered your password? <button className="text-pink-400 hover:text-pink-300" onClick={()=>navigate('/signin',{state:{background:location, returnTo: '/'}})}>Sign In</button></p>
      </div>

      <Modal open={modal.open} title={modal.title} onClose={() => setModal({ open: false, title: '', message: '' })}>
        {modal.message}
      </Modal>
    </div>
  );
}
