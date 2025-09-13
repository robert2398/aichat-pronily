import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "./ui/Modal";
import { ChevronLeft } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    full_name: "",
    email: "",
    username: "",
    gender: "",
    birth_date: "",
    avatar: "",
  });
  const [subscription, setSubscription] = useState({ status: null, plan_name: null, loading: true, error: null });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, title: '', message: '' });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  // compute max allowed birth date (today - 18 years) in YYYY-MM-DD
  const _eighteen = new Date();
  _eighteen.setFullYear(_eighteen.getFullYear() - 18);
  const maxBirthDate = _eighteen.toISOString().split('T')[0];

  useEffect(() => {
    // Try to read the same auth shapes Header uses
    function parseRaw(raw) {
      try {
        const r = JSON.parse(raw);
        let u = r?.user ?? r?.data?.user ?? r?.data ?? r ?? null;
        if (u && u.user) u = u.user;
        return u || null;
      } catch (e) {
        return null;
      }
    }

    let parsed = null;
    const raw = localStorage.getItem("pronily:auth:raw");
    if (raw) parsed = parseRaw(raw);
    if (!parsed) {
      const alt = localStorage.getItem("user");
      if (alt) parsed = parseRaw(alt);
    }
    const email = localStorage.getItem("pronily:auth:email");
    if (!parsed && email) parsed = { email };

    if (parsed) {
      setUser((u) => ({
        ...u,
        full_name: parsed.full_name || parsed.name || parsed.fullName || "",
        email: parsed.email || "",
        username: parsed.username || parsed.user_name || "",
        gender: parsed.gender || parsed.sex || "",
        birth_date: parsed.birth_date || parsed.dob || "",
        avatar: parsed.avatar || parsed.profile_picture || parsed.picture || "",
      }));
    }
  }, []);

  useEffect(() => {
    // fetch subscription status from backend
    async function loadSubscription() {
      try {
        const token = localStorage.getItem('pronily:auth:access_token') || localStorage.getItem('pronily:auth:token') || localStorage.getItem('access_token');
        const headers = { 'Accept': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Use absolute URL so the fetch is visible in the browser network tab and not affected by relative routing
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/subscription/status";
        console.debug('[Settings] loadSubscription - calling', url, 'with token?', !!token);

        const res = await fetch(url, { headers, credentials: 'include' });
        console.debug('[Settings] loadSubscription - response status', res.status);
        if (!res.ok) throw new Error(`Status ${res.status}`);

        // Try to parse JSON only if the response looks like JSON
        const contentType = res.headers.get('content-type') || '';
        let data = {};
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          // non-JSON response (HTML or empty) — log and treat as no subscription
          const text = await res.text();
          console.warn('[Settings] loadSubscription - expected JSON but got:', contentType, text.slice(0, 200));
          throw new Error('Non-JSON response');
        }

        setSubscription({ status: Boolean(data.status), plan_name: data.plan_name || null, loading: false, error: null });
      } catch (err) {
        console.warn('Failed to load subscription status', err);
        setSubscription({ status: false, plan_name: null, loading: false, error: err.message || 'Failed' });
      }
    }

    loadSubscription();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        setProfileLoading(true);
        const base = import.meta.env.VITE_API_BASE_URL || "";
        if (!base) console.warn('VITE_API_BASE_URL not set - using relative path');
        const url = `${base.replace(/\/$/, '')}/user/get-profile`;
        const stored = localStorage.getItem('pronily:auth:token') || localStorage.getItem('pronily:auth:access_token') || localStorage.getItem('access_token');
        const headers = {};
        if (stored) headers['Authorization'] = `Bearer ${stored.replace(/^bearer\s+/i, '').trim()}`;

        const res = await fetch(url, { headers, credentials: 'include' });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        // map backend response to local user shape
        setUser((u) => ({
          ...u,
          full_name: data.full_name || u.full_name,
          email: data.email || data.email_id || u.email,
          username: data.username || u.username,
          gender: data.gender || u.gender,
          birth_date: data.birth_date || u.birth_date,
          avatar: data.profile_image_url || u.avatar,
        }));
        try {
          localStorage.setItem('pronily:profile', JSON.stringify({ full_name: data.full_name, profile_image_url: data.profile_image_url, email: data.email, username: data.username }));
        } catch (e) {}
      } catch (err) {
        console.warn('Failed to load profile', err);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setUser((s) => ({ ...s, [name]: value }));
  }

  function handleSave() {
    // Upload profile to backend (including selected file) and persist locally on success/failure
    // Validate birth date - user must be at least 18
    if (user.birth_date) {
      // accept YYYY-MM-DD or DD-MM-YYYY
      function parseDate(s) {
        if (!s) return null;
        // yyyy-mm-dd
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s);
        // dd-mm-yyyy
        if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
          const [d, m, y] = s.split('-').map(Number);
          return new Date(y, m - 1, d);
        }
        // fallback
        const d = new Date(s);
        return isNaN(d) ? null : d;
      }

      const bd = parseDate(user.birth_date);
      if (!bd) {
        setModal({ open: true, title: 'Invalid date', message: 'Birth date is invalid.' });
        return;
      }
      const eighteen = new Date();
      eighteen.setFullYear(eighteen.getFullYear() - 18);
      // if birth date is after cutoff, user is under 18
      if (bd > eighteen) {
        setModal({ open: true, title: 'Age restriction', message: 'You must be at least 18 years old.' });
        return;
      }
    }

    return (async () => {
      setUploading(true);
      try {
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const url = `${base.replace(/\/$/, '')}/user/add-update-profile`;
        const stored = localStorage.getItem('pronily:auth:token') || localStorage.getItem('pronily:auth:access_token') || localStorage.getItem('access_token');
        const token = stored ? stored.replace(/^bearer\s+/i, '').trim() : null;

        const fd = new FormData();
        fd.append('full_name', user.full_name || '');
        if (user.email) fd.append('email', user.email);
        fd.append('username', user.username || '');
        fd.append('gender', user.gender || '');
        fd.append('birth_date', user.birth_date || '');
        if (selectedFile) fd.append('file', selectedFile);

        const res = await fetch(url, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: fd,
        });

        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();

        // update UI with returned profile
        setUser((u) => ({
          ...u,
          full_name: data.full_name || u.full_name,
          email: data.email || data.email_id || u.email,
          username: data.username || u.username,
          gender: data.gender || u.gender,
          birth_date: data.birth_date || u.birth_date,
          avatar: data.profile_image_url || u.avatar,
        }));

        try {
          localStorage.setItem('pronily:profile', JSON.stringify({ full_name: data.full_name, profile_image_url: data.profile_image_url, email: data.email, username: data.username }));
        } catch (e) {}

        // persist to localStorage similar to previous behavior
        try {
          const raw = localStorage.getItem('pronily:auth:raw');
          if (raw) {
            let r = JSON.parse(raw);
            if (r.user) r.user = { ...r.user, ...data };
            else if (r.data && r.data.user) r.data.user = { ...r.data.user, ...data };
            else r = { ...r, user: { ...(r.user || {}), ...data } };
            localStorage.setItem('pronily:auth:raw', JSON.stringify(r));
          } else {
            localStorage.setItem('user', JSON.stringify({ ...(JSON.parse(localStorage.getItem('user') || '{}')), ...data }));
          }
        } catch (e) {}

  setSelectedFile(null);
  setModal({ open: true, title: 'Profile updated', message: 'Your profile was updated successfully.' });
      } catch (err) {
        console.warn('Failed to save profile', err);
        // fallback to local persistence
        try {
          const raw = localStorage.getItem('pronily:auth:raw');
          if (raw) {
            const r = JSON.parse(raw);
            if (r.user) r.user = { ...r.user, ...user };
            else if (r.data && r.data.user) r.data.user = { ...r.data.user, ...user };
            else localStorage.setItem('pronily:auth:raw', JSON.stringify({ ...r, user: { ...(r.user || {}), ...user } }));
          } else {
            localStorage.setItem('user', JSON.stringify(user));
          }
        } catch (e) {}
  setModal({ open: true, title: 'Save failed', message: 'Failed to save profile.' });
      } finally {
        setUploading(false);
      }
    })();
  }

  return (
    <>
    <main className="mx-auto max-w-7xl px-4 pt-2 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 hover:bg-white/5"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-3xl font-semibold">Profile</h1>
        </div>
      </div>

      <h2 className="text-pink-300 mb-4">Personal Information</h2>

      <div className="rounded-2xl p-8 bg-white/5 border border-white/5">
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 md:col-span-3 flex flex-col items-center">
            <div className="rounded-full w-40 h-40 overflow-hidden ring-2 ring-pink-400">
              <img
                // prefer the freshly selected file preview, then the profile avatar (mapped from profile_image_url), then a local placeholder
                src={selectedFile ? URL.createObjectURL(selectedFile) : (user.avatar || "/img/Pornily.png")}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/Pornily.png'; }}
                alt={user.full_name || "avatar"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Show the user's name (from full_name) under the avatar for clearer profile header */}
            <div className="mt-3 flex flex-col items-center gap-2 w-full">
              <div className="text-sm text-white/70">Name</div>
              <div className="text-lg font-semibold text-pink-100">{user.full_name || '—'}</div>
              <label className="text-xs text-white/60">Profile picture</label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 bg-white/5 px-3 py-2 rounded-md w-full justify-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files && e.target.files[0])}
                  className="hidden"
                />
                {selectedFile ? selectedFile.name : 'Choose file'}
              </label>
              {/* Upload handled by 'Update Profile' button to keep behavior consistent */}
            </div>
          </div>

          <div className="col-span-12 md:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">Email Id</label>
                <input
                  name="email"
                  value={user.email}
                  readOnly
                  className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100 opacity-80 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Name</label>
                <input
                  name="full_name"
                  value={user.full_name}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Gender</label>
                <div className="relative">
                  <style>{`
                    /* Style the closed select to match dark settings background */
                    .settings-select { background: rgba(255,255,255,0.03); color: #f8f7fb; }
                    /* Make native option text dark so it's visible on typical native white dropdowns */
                    .settings-select option { color: #0A011A; }
                    .settings-select:focus { outline: none; box-shadow: 0 0 0 3px rgba(139,92,246,0.12); }
                  `}</style>
                  <select
                    name="gender"
                    value={user.gender || ''}
                    onChange={handleChange}
                    className="settings-select appearance-none w-full rounded-xl px-4 py-3 border border-white/5 placeholder-pink-200 text-pink-100"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="trans">Trans</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/60">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Birth Date</label>
                <input
                  type="date"
                  name="birth_date"
                  value={user.birth_date || ''}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSave}
                disabled={uploading}
                aria-busy={uploading}
                className={"inline-flex items-center gap-3 rounded-xl px-6 py-3 bg-gradient-to-r from-pink-500 to-sky-400 text-[#0A011A] font-semibold active:scale-95 transition-transform " + (uploading ? 'opacity-80 cursor-wait' : 'hover:scale-[1.02]')}
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-[#0A011A]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>✨ Update Profile</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional sections: Password / Delete Account */}
  <div className="grid grid-cols-12 gap-6 mt-8 items-stretch">
          <div className="col-span-12 md:col-span-7">
          <h3 className="text-pink-300 mb-4">Password</h3>
          <div className="rounded-2xl p-6 pb-4 bg-white/5 border border-white/5 h-full flex flex-col">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-lg bg-pink-500/80 flex items-center justify-center text-white text-2xl">🔒</div>
            </div>

            <div className="mb-6 rounded-md bg-pink-500/80 p-4 text-white">
              <div className="text-sm">
                set a new password for this account. Feel free to do so if you wish to use standard email/password login.
              </div>
            </div>

              <div className="mt-4">
                <button
                  onClick={() => navigate('/change-password')}
                  className="inline-flex items-center justify-center gap-3 w-full rounded-xl px-6 py-3 bg-gradient-to-r from-pink-500 to-sky-400 text-[#0A011A] font-semibold"
                >
                  ✨ Change Password
                </button>
              </div>
          </div>
        </div>

        <div className="col-span-12 md:col-span-5">
          <h3 className="text-pink-300 mb-4">Delete Account</h3>
          <div className="rounded-2xl p-6 pb-4 bg-white/5 border border-white/5 text-center h-full flex flex-col">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-lg bg-pink-500/80 flex items-center justify-center text-white text-2xl">🗑️</div>
            </div>

            <div className="mb-6 rounded-md bg-pink-500/80 p-4 text-white">
              <div className="text-sm">
                You have an option to delete your account, but beware, <span className="text-pink-300">you will not be able to access it</span> if you proceed.
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                className="w-full rounded-xl px-6 py-3 border border-pink-400 text-pink-300"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription bar */}
        <div className="relative mt-18">
          {/* Decorative glow */}
          <div
            aria-hidden
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{ boxShadow: '0 8px 40px rgba(139,92,246,0.18)', zIndex: 0 }}
          />

          <div
            className="relative rounded-2xl p-6 border border-white/10 overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, rgba(79,70,229,0.12), rgba(236,72,153,0.08) 45%, rgba(14,165,233,0.06))',
              zIndex: 1,
            }}
          >
            {/* Inline styles for sparkle and shimmer */}
            <style>{`
              .sparkle { position: absolute; width:10px; height:10px; border-radius:50%; background: radial-gradient(circle, #fff 0%, rgba(255,255,255,0.7) 30%, rgba(255,192,255,0.15) 60%, transparent 61%); transform: translate(-50%, -50%); animation: sparkle 2s linear infinite; }
              .sparkle.s1 { left: 22px; top: 10px; animation-delay: 0s; }
              .sparkle.s2 { left: 44px; top: 6px; animation-delay: 0.4s; }
              .sparkle.s3 { left: 30px; top: 26px; animation-delay: 0.8s; }
              @keyframes sparkle { 0% { opacity:0; transform: translate(-50%,-50%) scale(0.6); } 40% { opacity:1; transform: translate(-50%,-55%) scale(1.05);} 100% { opacity:0; transform: translate(-50%,-50%) scale(0.6); } }

              .shimmer-btn { background-size: 200% 100%; animation: shimmer 3s linear infinite; }
              @keyframes shimmer { 0% { background-position: 0% 0%; } 100% { background-position: 200% 0%; } }
            `}</style>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start md:items-center gap-6 relative">
                <div className="relative w-12 h-12 text-3xl flex items-center justify-center">
                  <div className="text-pink-400 text-3xl">👑</div>
                  <span className="sparkle s1" />
                  <span className="sparkle s2" />
                  <span className="sparkle s3" />
                </div>

                <div>
                  <h4 className="text-pink-300">Subscription{subscription.plan_name ? ` — ${subscription.plan_name}` : ''}</h4>
                  {subscription.loading ? (
                    <p className="text-white/70 text-sm">Checking subscription status…</p>
                  ) : subscription.error ? (
                    <p className="text-white/70 text-sm">Unable to load subscription status.</p>
                  ) : subscription.status ? (
                    <div className="text-white/70 text-sm whitespace-pre-line">
                      {`Upgrade to Premium+ and supercharge your creativity with:

  💬 Smarter, more immersive AI Character Chats.

  🧑‍🎨 Advanced tools to design richer AI Characters.

  🎥 Priority access to next-gen AI Images & Videos with faster rendering.

  ✨ Take your AI world-building to the next level—upgrade now and unlock the ultimate creative playground!`}
                    </div>
                  ) : (
                    <div className="text-white/70 text-sm whitespace-pre-line">
                      {`Step into the future of AI creativity!
  You’re missing out on the magic:

  💬 AI Character Chat – Talk to lifelike AI characters anytime.

  🧑‍🎨 Create AI Characters – Design and bring your own unique personalities to life.

  🎥 AI Images & Videos – Turn your imagination into stunning visuals.

  👉 Subscribe to Premium today and unlock the tools to create, chat, and bring your ideas to life like never before!`}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-auto">
                <button
                  className="rounded-xl px-6 py-3 text-[#0A011A] font-semibold shimmer-btn"
                  style={{ backgroundImage: 'linear-gradient(90deg,#8B5CF6 0%, #EC4899 50%, #06B6D4 100%)' }}
                >
                  💎 {subscription.status ? 'Manage Subscription' : 'Upgrade to Premium'}
                </button>
              </div>
            </div>
          </div>
        </div>
    </main>

    {/* Confirm delete modal (matches design) */}
  <Modal open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} hideFooter>
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-[#14061a] border border-white/10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-lg bg-pink-500/80 flex items-center justify-center text-white text-3xl">🗑️</div>
        </div>
        <h3 className="text-pink-300 mb-4 text-xl font-semibold">Delete Account</h3>
        <p className="text-white/70 mb-6">After deleting your account you have 30 days to reactivate it or it will be definitive</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setConfirmDeleteOpen(false)}
            className="rounded-xl px-6 py-3 border border-white/10 text-white/70"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              try {
                const base = import.meta.env.VITE_API_BASE_URL || '';
                const token = localStorage.getItem('pronily:auth:token') || localStorage.getItem('pronily:auth:access_token') || localStorage.getItem('access_token');
                const headers = { 'Accept': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const url = `${base.replace(/\/$/, '')}/user/delete-account`;
                const res = await fetch(url, { method: 'POST', headers, credentials: 'include' });
                if (!res.ok) throw new Error('Failed');
                setConfirmDeleteOpen(false);
                setModal({ open: true, title: 'Account deleted', message: 'Your account deletion has been scheduled.' });
              } catch (e) {
                console.warn('Delete failed', e);
                setModal({ open: true, title: 'Delete failed', message: 'Could not delete account.' });
              }
            }}
            className="rounded-xl px-6 py-3 bg-gradient-to-r from-pink-500 to-sky-400 text-[#0A011A] font-semibold"
          >
            Yes Delete
          </button>
        </div>
      </div>
    </Modal>

    <Modal open={modal.open} title={modal.title} onClose={() => setModal({ open: false, title: '', message: '' })}>
      {modal.message}
    </Modal>
    </>
  );
}

