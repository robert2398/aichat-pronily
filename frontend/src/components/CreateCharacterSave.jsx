import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function CreateCharacterSave() {
  const location = useLocation();
  const navigate = useNavigate();
  const { character = {}, gender = "female" } = (location.state || {});

  const [saveName, setSaveName] = useState(character.name || "");
  const [saveUsername, setSaveUsername] = useState("");
  const [saveBio, setSaveBio] = useState("");
  const [savePrivacy, setSavePrivacy] = useState("Private");
  const [enhancedPrompt, setEnhancedPrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  const titleTarget = gender === "female" ? "AI Girl" : gender === "male" ? "AI Boy" : "AI Person";

  const saveCharacter = async () => {
    if (!saveName && !saveUsername) {
      alert("Please enter a name or username.");
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
      hair_style: character.hairStyle,
      hair_colour: character.hairColor,
      body_type: character.body,
      breast_size: character.breast,
      butt_size: character.butt,
      dick_size: gender === "male" ? character.dick_size || "" : "",
      personality: character.personality,
      voice_type: character.voice,
      relationship_type: character.relationship,
      clothing: (character.clothing || []).join(", "),
      special_features: (character.features || []).join(", "),
      enhanced_prompt: !!enhancedPrompt,
    };

    try {
      // prefer token from user sign-in; fallback to env token
      const stored = localStorage.getItem("pronily:auth:token");
      if (!stored) {
        // ask user to sign in
        alert("You must be signed in to save a character. Redirecting to sign in...");
        navigate('/signin', { state: { background: { pathname: '/create-character' } } });
        setLoading(false);
        return;
      }
      // backend expects: 'Authorization: bearer <access_token>' (lowercase 'bearer')
      const tokenOnly = stored.replace(/^bearer\s+/i, "").trim();
      const authHeader = `bearer ${tokenOnly}`;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/characters/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const data = await res.json();
      try {
        localStorage.setItem("pronily:createdCharacter", JSON.stringify(data));
      } catch {}
      navigate("/ai-chat/1");
    } catch (err) {
      alert("Failed to create character: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[.02] p-8">
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
      </div>
    </main>
  );
}
