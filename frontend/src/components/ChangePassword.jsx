import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSave() {
    if (!newPassword) return alert('Enter a new password');
    if (newPassword !== confirmPassword) return alert('Passwords do not match');
    // TODO: wire up API call. For now, show success and go back.
    alert('Password changed');
    navigate(-1);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full bg-[#201424] flex items-center justify-center text-pink-300"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-3xl font-semibold">Change Password</h1>
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
                placeholder="Enter"
                className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100"
              />
              <button
                onClick={() => setShowOld((s) => !s)}
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                aria-label="toggle"
              >
                👁️
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
                placeholder="Enter"
                className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100"
              />
              <button
                onClick={() => setShowNew((s) => !s)}
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                aria-label="toggle"
              >
                👁️
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
                placeholder="Enter"
                className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100"
              />
              <button
                onClick={() => setShowConfirm((s) => !s)}
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                aria-label="toggle"
              >
                👁️
              </button>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={handleSave}
              className="w-full rounded-xl px-6 py-4 bg-gradient-to-r from-pink-500 to-sky-400 text-[#0A011A] font-semibold"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
