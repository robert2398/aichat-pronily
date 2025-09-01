import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  function handleChange(e) {
    const { name, value } = e.target;
    setUser((s) => ({ ...s, [name]: value }));
  }

  function handleSave() {
    // Simple persistence: update pronily:auth:raw if present, otherwise set a lightweight user key.
    try {
      const raw = localStorage.getItem("pronily:auth:raw");
      if (raw) {
        const r = JSON.parse(raw);
        // Try to patch a user object in various shapes
        if (r.user) r.user = { ...r.user, ...user };
        else if (r.data && r.data.user) r.data.user = { ...r.data.user, ...user };
        else r = { ...r, user: { ...r.user, ...user } };
        localStorage.setItem("pronily:auth:raw", JSON.stringify(r));
      } else {
        // fallback
        localStorage.setItem("user", JSON.stringify(user));
      }
      // reflect back to header via storage event in other tabs; in same tab Header polls localStorage
      // show a minimal confirmation and go back to home or stay
      alert("Profile updated");
    } catch (e) {
      console.warn("Failed to save profile", e);
      alert("Failed to save profile");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pt-2 pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full bg-[#201424] flex items-center justify-center text-pink-300"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-3xl font-semibold">Profile</h1>
      </div>

      <h2 className="text-pink-300 mb-4">Personal Information</h2>

      <div className="rounded-2xl p-8 bg-white/5 border border-white/5">
        <div className="grid grid-cols-12 gap-6 items-start">
          <div className="col-span-12 md:col-span-3 flex justify-center">
            <div className="rounded-full w-40 h-40 overflow-hidden ring-2 ring-pink-400">
              <img
                src={user.avatar || "/img/Logo.svg"}
                alt={user.full_name || "avatar"}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">Email Id</label>
                <input
                  name="email"
                  value={user.email}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Username</label>
                <input
                  name="username"
                  value={user.username}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Gender</label>
                <input
                  name="gender"
                  value={user.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Birth Date</label>
                <input
                  name="birth_date"
                  value={user.birth_date}
                  onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 bg-white/5 border border-white/5 placeholder-pink-200 text-pink-100"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-3 rounded-xl px-6 py-3 bg-gradient-to-r from-pink-500 to-sky-400 text-[#0A011A] font-semibold"
              >
                ✨ Update Profile
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
              <button className="w-full rounded-xl px-6 py-3 border border-pink-400 text-pink-300">Delete Account</button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription bar */}
      <div className="rounded-2xl p-6 bg-white/5 border border-white/5 mt-18 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-6">
          <div className="w-12 h-12 text-pink-400 text-3xl">👑</div>
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
          <button className="rounded-xl px-6 py-3 bg-gradient-to-r from-pink-500 to-sky-400 text-[#0A011A] font-semibold">💎 {subscription.status ? 'Manage Subscription' : 'Upgrade to Premium'}</button>
        </div>
      </div>
    </main>
  );
}
