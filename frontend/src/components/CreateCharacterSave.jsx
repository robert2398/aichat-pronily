import React, { useState, useEffect } from "react";
import ImageGenerationLoader from './ai/ImageGenerationLoader';
import InsufficientCoinsModal from './ui/InsufficientCoinsModal';
import Modal from './ui/Modal';
import { useLocation, useNavigate } from "react-router-dom";

export default function CreateCharacterSave({ character: propsCharacter = null, gender: propsGender = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { character: locCharacter = {}, gender: locGender = "female" } = (location.state || {});
  const character = propsCharacter || locCharacter || {};
  const gender = propsGender || locGender || "female";

  const [saveName, setSaveName] = useState(character.name || "");
  const [saveUsername, setSaveUsername] = useState("");
  const [saveBio, setSaveBio] = useState("");
  const [savePrivacy, setSavePrivacy] = useState("Private");
  const [enhancedPrompt, setEnhancedPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [showInsufficientCoinsModal, setShowInsufficientCoinsModal] = useState(false);
  const [modal, setModal] = useState({ open: false, title: '', message: '' });
  // animation state for create-character progress visualization
  const [animStep, setAnimStep] = useState('parse');
  const [animTimer, setAnimTimer] = useState(null);
  const [animating, setAnimating] = useState(false);

  const startAnimProgression = () => {
    const sequence = ['parse', 'style', 'pose', 'render', 'rig'];
    let idx = 0;
  try {
      if (animTimer) clearInterval(animTimer);
    } catch (e) {}
    const t = setInterval(() => {
      idx = Math.min(sequence.length - 1, idx + 1);
      setAnimStep(sequence[idx]);
    }, 320);
    setAnimTimer(t);
  };

  const stopAnimProgression = () => {
    try { if (animTimer) clearInterval(animTimer); } catch (e) {}
    setAnimTimer(null);
  };

  const titleTarget = gender === "female" ? "AI Girl" : gender === "male" ? "AI Boy" : "AI Person";

  const saveCharacter = async () => {
  console.debug('CreateCharacterSave: saveCharacter called');
    if (!saveName && !saveUsername) {
      setModal({ open: true, title: 'Missing name', message: 'Please enter a name or username.' });
      return;
    }
    setLoading(true);
    const characterName = saveName || saveUsername || "Unnamed";
  const payload = {
      name: characterName,
      username: saveUsername || undefined,
      bio: saveBio || undefined,
      gender,
      style: character.style,
      ethnicity: character.ethnicity,
      age: character.age,
      eye_colour: character.eye,
  // Prefer the already-computed label fields (set when the flow finished).
  // Fallback to legacy shapes (object or string) if the label fields are absent.
  hair_style: character.hair_style || ((character.hairStyle && (character.hairStyle.label || character.hairStyle.name)) || (typeof character.hairStyle === 'string' ? character.hairStyle : '')),
    hair_colour: character.hairColor,
  body_type: character.body_type || ((character.body && (character.body.label || character.body.name)) || (typeof character.body === 'string' ? character.body : '')),
  breast_size: character.breast_size || ((character.breast && (character.breast.label || character.breast.name)) || (typeof character.breast === 'string' ? character.breast : '')),
  butt_size: character.butt_size || ((character.butt && (character.butt.label || character.butt.name)) || (typeof character.butt === 'string' ? character.butt : '')),
      dick_size: gender === "male" ? character.dick_size || "" : "",
      personality: character.personality,
      voice_type: character.voice,
      relationship_type: character.relationship,
  // ensure clothing/features are safely serialized whether array or string
  clothing: Array.isArray(character.clothing) ? (character.clothing || []).join(", ") : (character.clothing ? String(character.clothing) : ""),
  special_features: Array.isArray(character.features) ? (character.features || []).join(", ") : (character.features ? String(character.features) : ""),
      enhanced_prompt: !!enhancedPrompt,
    };

    try {
      console.debug('CreateCharacterSave: prepared payload', payload);
      // prepare to send: prefer token from user sign-in; fallback to env token
      const stored = localStorage.getItem("pronily:auth:token");
      if (!stored) {
        console.debug('CreateCharacterSave: no auth token, persisting pending and redirecting to signin');
        // persist the pending payload so we can resume after sign-in
        try { localStorage.setItem('pronily:pending:create-character', JSON.stringify(payload)); } catch (e) {}
        // persist current form inputs so the UI can be restored after sign-in
        try {
          const formState = {
            saveName,
            saveUsername,
            saveBio,
            savePrivacy,
            enhancedPrompt,
          };
          localStorage.setItem('pronily:pending:create-character:form', JSON.stringify(formState));
        } catch (e) {}
        // immediately redirect to sign-in so user can authenticate and resume
        navigate('/signin', { state: { background: { pathname: '/create-character/save' } } });
        setLoading(false);
        return;
      }
      // backend expects: 'Authorization: bearer <access_token>' (lowercase 'bearer')
      const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();
      const authHeader = `bearer ${tokenOnly}`;
      const base = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '');

  // start animation progression while we wait
      setAnimating(true);
      setAnimStep('parse');
      startAnimProgression();

  const url = `${base.replace(/\/$/, '')}/characters/create`;
  console.debug('CreateCharacterSave: POST', url, 'auth present', !!stored);
  // validate payload stringify
  try { JSON.stringify(payload); } catch (e) { throw new Error('Payload not serializable: ' + e.message); }

  const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        if (res.status === 402) {
          // Handle insufficient coins gracefully
          setAnimating(false);
          stopAnimProgression();
          setShowInsufficientCoinsModal(true);
          return;
        }
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
  const data = await res.json();
  // finish animation
  setAnimStep('done');
  await new Promise((r) => setTimeout(r, 420));
  stopAnimProgression();
  setAnimating(false);
      try {
        localStorage.setItem("pronily:createdCharacter", JSON.stringify(data));
      } catch {}
      // return to My AI and signal it to refresh the character list
      navigate("/my-ai", { state: { refresh: true } });
    } catch (err) {
      stopAnimProgression();
      setAnimating(false);
  console.debug('CreateCharacterSave: saveCharacter error', err);
      setModal({ open: true, title: 'Save failed', message: (err && err.message) ? err.message : 'Failed to create character.' });
    } finally {
      setLoading(false);
    }
  };

  // On mount, check if there's a pending payload (user attempted save then was redirected to sign-in)
  React.useEffect(() => {
    let cancelled = false;
    const tryResume = async () => {
      if (resuming || loading) return;
      try {
    const raw = localStorage.getItem('pronily:pending:create-character');
    console.debug('CreateCharacterSave: resume check, pending raw=', raw ? '[present]' : '[none]');
    // if user is not signed in but we have a saved form, restore it so fields aren't lost
    const rawForm = localStorage.getItem('pronily:pending:create-character:form');
    const storedToken = localStorage.getItem('pronily:auth:token');
    if (!storedToken && rawForm) {
      try {
        const saved = JSON.parse(rawForm || '{}');
        if (saved && Object.keys(saved).length > 0 && !cancelled) {
          if (typeof saved.saveName !== 'undefined') setSaveName(saved.saveName || '');
          if (typeof saved.saveUsername !== 'undefined') setSaveUsername(saved.saveUsername || '');
          if (typeof saved.saveBio !== 'undefined') setSaveBio(saved.saveBio || '');
          if (typeof saved.savePrivacy !== 'undefined') setSavePrivacy(saved.savePrivacy || 'Private');
          if (typeof saved.enhancedPrompt !== 'undefined') setEnhancedPrompt(!!saved.enhancedPrompt);
        }
      } catch (e) {}
    }
        if (!raw) return;
        const pending = JSON.parse(raw || '{}');
        if (!pending || Object.keys(pending).length === 0) return;
        const stored = localStorage.getItem('pronily:auth:token');
        if (!stored) return; // still not signed in
        // clear pending to avoid duplicate submissions
        try { localStorage.removeItem('pronily:pending:create-character'); } catch (e) {}
  setResuming(true);
  setLoading(true);
  // start animation while submitting pending payload
  setAnimating(true);
  setAnimStep('parse');
  startAnimProgression();
  // submit the pending payload
        const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();
        const authHeader = `bearer ${tokenOnly}`;
        const base = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '');
  const url = `${base.replace(/\/$/, '')}/characters/create`;
        console.debug('CreateCharacterSave: resuming POST', url);
        try { JSON.stringify(pending); } catch (e) { throw new Error('Pending payload not serializable: ' + e.message); }
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
          body: JSON.stringify(pending),
        });
        console.debug('CreateCharacterSave: resume response status=', res && res.status);
        if (!res.ok) {
          if (res.status === 402) {
            // Handle insufficient coins gracefully
            setAnimating(false);
            stopAnimProgression();
            setShowInsufficientCoinsModal(true);
            return;
          }
          const text = await res.text();
          throw new Error(text || res.statusText || `HTTP ${res.status}`);
        }
  const data = await res.json();
  try { localStorage.setItem('pronily:createdCharacter', JSON.stringify(data)); } catch (e) {}
  // finish animation then navigate back to My AI so it can refresh
  setAnimStep('done');
  await new Promise((r) => setTimeout(r, 420));
  stopAnimProgression();
  setAnimating(false);
  // clear any pending saved form now that the create succeeded
  try { localStorage.removeItem('pronily:pending:create-character:form'); } catch (e) {}
  if (!cancelled) navigate('/my-ai', { state: { refresh: true } });
      } catch (err) {
        // Show a friendly popup if resuming failed (user can retry manually)
        console.debug('CreateCharacterSave: resume error', err);
        setModal({ open: true, title: 'Resume failed', message: (err && err.message) ? err.message : 'Failed to complete pending character creation.' });
      } finally {
        setLoading(false);
        setResuming(false);
      }
    };
    tryResume();
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[.02] p-8 relative">
        {animating && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#0f1021]/80 to-[#24243e]/80 backdrop-blur-sm rounded-2xl p-6">
            <ImageGenerationLoader step={animStep} />
          </div>
        )}
        <h2 className="mb-6 text-center font-semibold text-pink-400">Your AI {titleTarget} Setting</h2>

        <div className="grid gap-4">
          <label className="text-sm text-white/80">Name</label>
          <input value={saveName} onChange={(e) => setSaveName(e.target.value)} className="rounded-md p-3 bg-white/[.03] border border-white/10 text-white" />

          <label className="text-sm text-white/80">Username</label>
          <input value={saveUsername} onChange={(e) => setSaveUsername(e.target.value)} className="rounded-md p-3 bg-white/[.03] border border-white/10 text-white" />

          <label className="text-sm text-white/80">Bio</label>
          <textarea value={saveBio} onChange={(e) => setSaveBio(e.target.value)} rows={4} className="rounded-md p-3 bg-white/[.03] border border-white/10 text-white" />

          <label className="inline-flex items-center gap-3 mt-2 text-sm text-white/80">
            <input type="checkbox" checked={enhancedPrompt} onChange={(e) => setEnhancedPrompt(e.target.checked)} className="h-4 w-4 rounded border-white/20 bg-transparent" />
            <span>Enhanced prompt</span>
          </label>

          <label className="text-sm text-white/80">Privacy</label>
          <select value={savePrivacy} onChange={(e) => setSavePrivacy(e.target.value)} className="rounded-md p-3 bg-white/[.03] border border-white/10 text-white">
            <option>Private</option>
            <option>Public</option>
          </select>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button onClick={() => navigate(-1)} className="rounded-xl border border-white/10 bg-white/[.02] px-4 py-2 text-white">Cancel</button>
            <button onClick={saveCharacter} disabled={loading} className="rounded-xl bg-gradient-to-r from-pink-600 via-pink-400 to-indigo-500 px-4 py-2 font-semibold text-white">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </div>

        {/* Insufficient Coins Modal */}
        <InsufficientCoinsModal 
          open={showInsufficientCoinsModal} 
          onClose={() => setShowInsufficientCoinsModal(false)} 
        />
        {/* Standard project modal for errors/info */}
        <Modal open={modal.open} title={modal.title} onClose={() => setModal({ open: false, title: '', message: '' })}>
          {modal.message}
        </Modal>
      </div>
    </main>
  );
}
