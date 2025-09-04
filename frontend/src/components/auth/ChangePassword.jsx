import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import Modal from '../ui/Modal';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modal, setModal] = useState({ open: false, title: '', message: '' });

  async function handleSave() {
    setError('');
    setSuccess('');

    if (!oldPassword || oldPassword.length < 8) return setError('Old password must be at least 8 characters');
    if (!newPassword || newPassword.length < 8) return setError('New password must be at least 8 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    try {
      const base = import.meta.env.VITE_API_BASE_URL || '';
      const url = (base.endsWith('/') ? base.slice(0, -1) : base) + '/auth/change-password';

      // try to read token from localStorage using common keys
      const stored = localStorage.getItem('pronily:auth:token') || localStorage.getItem('pronily:auth:access_token') || localStorage.getItem('access_token') || '';
      const token = stored ? stored.replace(/^bearer\s+/i, '').trim() : null;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = data && (data.detail || data.message || data.error) ? (data.detail || data.message || data.error) : res.statusText || 'Change password failed';
        const message = typeof msg === 'string' ? msg : JSON.stringify(msg);
        setModal({ open: true, title: 'Change password', message });
        return;
      }

      setModal({ open: true, title: 'Success', message: 'Password changed successfully' });
      // Optionally navigate back after a short delay
      setTimeout(() => navigate(-1), 900);
    } catch (err) {
      setError(err && err.message ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/5"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-3xl font-semibold">Change Password</h1>
        </div>
      </div>

      <div className="rounded-2xl p-8 bg-white/5 border border-white/5">
        <h2 className="text-pink-300 text-center text-xl mb-6">Change Password</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Old Password</label>
            <div className="relative">
              <input
                type={showOld ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter old password"
                className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-white/40 text-pink-100"
              />
              <button
                onClick={() => setShowOld((s) => !s)}
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2"
                aria-label={showOld ? 'Hide password' : 'Show password'}
                title={showOld ? 'Hide password' : 'Show password'}
              >
                {showOld ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-white/40 text-pink-100"
              />
              <button
                onClick={() => setShowNew((s) => !s)}
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2"
                aria-label={showNew ? 'Hide password' : 'Show password'}
                title={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Confirm new Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-white/40 text-pink-100"
              />
              <button
                onClick={() => setShowConfirm((s) => !s)}
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white p-2"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                title={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full rounded-xl px-6 py-4 bg-gradient-to-r from-pink-500 to-sky-400 text-[#0A011A] font-semibold disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
      <Modal open={modal.open} title={modal.title} onClose={() => setModal({ open: false, title: '', message: '' })}>
        {modal.message}
      </Modal>
    </main>
  );
}
