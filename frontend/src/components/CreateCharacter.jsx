import React, { useMemo, useState } from "react";
import { getAssets } from '../utils/assets'
import { useNavigate } from "react-router-dom";
import CreateCharacterSave from './CreateCharacterSave';

/** helpers */
const genSample = (n, pref = "") =>
  Array.from({ length: n }).map((_, i) => ({
    id: `${pref}${i + 1}`,
    name: `${pref}${i + 1}`,
    label: `${pref}${i + 1}`,
  }));

export default function CreateCharacter() {
  const navigate = useNavigate();

  // 1..8 like your design
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState("female"); // female | male | trans

  const [state, setState] = useState({
    /** step 1 */
    style: null, // "Realistic" | "Anime"
    /** step 2 */
    ethnicity: null,
    age: 23,
    eye: null,
    /** step 3 */
    hairStyle: null,
    hairColor: null,
    /** step 4 */
    body: null,
    breast: null, // hidden for male, optional for trans
    butt: null,
    /** step 5 */
    personality: null,
    voice: null,
    /** step 6 */
    relationship: null,
    /** step 7 */
    clothing: [],
    features: [],
  });

  const [finalPayload, setFinalPayload] = useState(null);

  const bump = (key, val) => setState((s) => ({ ...s, [key]: val }));
  const toggleArray = (key, val) =>
    setState((s) => ({
      ...s,
      [key]: s[key].includes(val) ? s[key].filter((x) => x !== val) : [...s[key], val],
    }));

  const isFemaleLike = gender !== "male";

  /** data */
  // Load images from assets using canonical folder names, fallback to hardcoded lists
  const ethnicityItems = useMemo(() => {
    const imgs = getAssets(gender === 'male' ? 'male' : 'female', 'ethnicity')
    if (imgs && imgs.length) return imgs
    return ["Asian", "Black", "White", "Latina", "Arab", "Indian"].map((x, i) => ({ id: `eth${i}`, label: x }))
  }, [gender])
  
  const hairStyleItems = useMemo(() => {
    const imgs = getAssets(gender === 'male' ? 'male' : 'female', 'hair-style')
    if (imgs && imgs.length) return imgs
    return ["Straight Long", "Straight Short", "Pigtails", "Hair Bun", "Ponytail"].map((x, i) => ({ id: `hair${i + 1}`, label: x }))
  }, [gender])
  
  const bodyTypeItems = useMemo(() => {
    const imgs = getAssets(gender === 'male' ? 'male' : 'female', 'body-type')
    if (imgs && imgs.length) return imgs
    return ["Slim", "Athletic", "Voluptuous", "Curvy", "Muscular", "Average"].map((x, i) => ({ id: `body${i + 1}`, label: x }))
  }, [gender])
  
  const breastSizeItems = useMemo(() => {
    if (gender === 'male') return []
    const imgs = getAssets('female', 'breast-size')
    if (imgs && imgs.length) return imgs
    return ["Flat", "Small", "Medium", "Large", "XL", "XXL"].map((x, i) => ({ id: `breast${i + 1}`, label: x }))
  }, [gender])
  
  const buttSizeItems = useMemo(() => {
    if (gender === 'male') return []
    const imgs = getAssets('female', 'butt-size')
    if (imgs && imgs.length) return imgs
    return ["Small", "Skinny", "Athletic", "Medium", "Large", "XL"].map((x, i) => ({ id: `butt${i + 1}`, label: x }))
  }, [gender])
  
  const characterItems = useMemo(() => {
    const imgs = getAssets(gender === 'male' ? 'male' : 'female', 'character')
    if (imgs && imgs.length) {
      // normalize any legacy filename label like 'Real' to the human-friendly 'Realistic'
      return imgs.map((it) => ({
        ...it,
        // prefer existing label property, fallback to name; map literal 'Real' (any case) -> 'Realistic'
        label: ((String(it.label || it.name || '').toLowerCase() === 'real') ? 'Realistic' : (it.label || it.name)),
      }))
    }
    return ["Realistic", "Anime"].map((x, i) => ({ id: `char${i + 1}`, label: x }))
  }, [gender])
  
  const outfitItems = useMemo(() => {
    if (gender !== 'male') return []
    const imgs = getAssets('male', 'outfit')
    return imgs || []
  }, [gender])

  const eyeColors = useMemo(() => ["Black", "Brown", "Red", "Yellow", "Green", "Purple", "Teal", "White"], []);
  
  // Legacy aliases for backward compatibility
  const hairStyles = hairStyleItems;
  const hairColors = eyeColors;
  const bodies = bodyTypeItems;
  const breasts = breastSizeItems;
  const butts = buttSizeItems;
  const personalities = useMemo(
    () =>
      [
        "Caregiver",
        "Sage",
        "Innocent",
        "Jester",
        "Temptress",
        "Dominate",
        "Lover",
        "Nympho",
        "Mean",
      ].map((x, i) => ({ id: `pers${i + 1}`, label: x })),
    []
  );
  const voices = useMemo(() => ["Emotive", "Caring", "Naughty", "Flirty", "Addictive", "Dominating", "Love"], []);
  const relationships = useMemo(
    () =>
      ["Stranger", "School Mate", "Colleague", "Mentor", "Girlfriend", "Sex Friend", "Wife", "Mistress", "Friend"].map((x, i) => ({
        id: `rel${i}`,
        label: x,
      })),
    []
  );
  // small emoji/icon map for nicer placeholders (used in the UI cards)
  const ICONS = {
    personality: {
      Caregiver: "🤱",
      Sage: "🧙‍♀️",
      Innocent: "🌼",
      Jester: "🤡",
      Temptress: "💋",
      Dominate: "💪",
      Lover: "❤️",
      Nympho: "🔥",
      Mean: "❄️",
    },
    voice: {
      Emotive: "😊",
      Caring: "🤗",
      Naughty: "😈",
      Flirty: "😉",
      Addictive: "🔥",
      Dominating: "😼",
      Love: "💘",
    },
    relationship: {
      Stranger: "👤",
      "School Mate": "🎓",
      Colleague: "💼",
      Mentor: "🧑‍🏫",
      Girlfriend: "❤️",
      "Sex Friend": "🔥",
      Wife: "💍",
      Mistress: "👑",
      Friend: "🤝",
    },
  };
  const clothings = useMemo(
    () => [
      "Bikini",
      "Skirt",
      "Cheerleader Outfit",
      "Pencil Dress",
      "Long Dress",
      "Soccer Uniform",
      "Fancy Dress",
      "Summer Dress",
      "Jeans",
      "Lab Coat",
      "Cowboy Outfit",
      "Corset",
      "Hoodie",
      "Leggings",
      "Ninja Outfit",
      "Pajamas",
      "Hijab",
      "Police Uniform",
    ],
    []
  );
  const features = useMemo(
    () => ["Public Hair", "Pregnant", "Glasses", "Freckles", "Tattoos", "Belly Piercing", "Nipple Piercing"],
    []
  );

  /** step validation */
  const isStepValid = (s = step) => {
    switch (s) {
      case 1:
        return !!state.style; // style required
      case 2:
        return !!state.ethnicity && !!state.eye && state.age >= 18;
      case 3:
        return !!state.hairStyle && !!state.hairColor;
      case 4: {
        const base = !!state.body && !!state.butt;
        if (!isFemaleLike) return base; // male: no breasts section
        // female/trans: breast optional (can be null)
        return base;
      }
      case 5:
        return !!state.personality && !!state.voice;
      case 6:
        return !!state.relationship;
      case 7:
        return state.clothing.length > 0 || state.features.length > 0; // at least one
      case 8:
        return true;
      default:
        return true;
    }
  };

  const next = () => setStep((v) => (isStepValid(v) ? Math.min(9, v + 1) : v));
  // Back should step back within the wizard, but if we're on step 1
  // navigate back to the previous route/page instead of staying on the same page.
  const back = () => {
    if (step > 1) {
      setStep((v) => Math.max(1, v - 1));
    } else {
      // go back in history when the user is on the first step
      navigate(-1);
    }
  };

  // finish now navigates to a dedicated save/confirmation page (separate route)
  const finish = () => {
    // build a cleaned payload for the save form and advance to an inline save step (9)
    const payload = {
      // basic selections
      gender,
      style: state.style,
      ethnicity: state.ethnicity,
      age: state.age,

      // eye
      eye_colour: state.eye,
      eye: state.eye,

      // hair
      hair_style: labelFor(hairStyles, state.hairStyle),
      hairStyle: state.hairStyle,
      hair_colour: state.hairColor,
      hairColor: state.hairColor,

      // body (both id and label)
      body_type: labelFor(bodies, state.body),
      body: state.body,
      breast_size: labelFor(breasts, state.breast),
      breast: state.breast,
      butt_size: labelFor(butts, state.butt),
      butt: state.butt,

      // genital size for male
      dick_size: gender === 'male' ? (state.dick_size || "") : "",

      // personality & voice
      personality: labelFor(personalities, state.personality),
      personality_id: state.personality,
      voice_type: state.voice,
      voice: state.voice,

      // relationship
      relationship_type: state.relationship,
      relationship: state.relationship,

      // clothing/features
      clothing: Array.isArray(state.clothing) ? state.clothing.join(", ") : state.clothing || "",
      clothing_array: Array.isArray(state.clothing) ? state.clothing : (state.clothing ? [state.clothing] : []),
      special_features: Array.isArray(state.features) ? state.features.join(", ") : state.features || "",
      features: Array.isArray(state.features) ? state.features : (state.features ? [state.features] : []),

      // extras
      enhanced_prompt: true,
    };
    setFinalPayload(payload);
    // go to the inline save step instead of directly calling any backend
    setStep(9);
  };

  // make the page title logical based on selected gender
  const titleTarget = gender === "female" ? "AI Girl" : gender === "male" ? "AI Boy" : "AI Person";

  // helper: find a label by id from a list of {id,label}
  const labelFor = (list, id) => {
    if (!id) return "N/A";
    const found = (list || []).find((x) => x.id === id || (x.name && String(x.name) === String(id)) || (x.label && String(x.label) === String(id)));
    if (found) return found.label || found.name || id;
    return id;
  };

  // find an item in a list by id/name/label (case-insensitive for name/label)
  const findItem = (list, value) => {
    if (!value || !list) return null;
    const v = String(value || '');
    return (list || []).find((x) => {
      if (!x) return false;
      if (x.id && x.id === v) return true;
      if (x.name && String(x.name) === v) return true;
      if (x.label && String(x.label) === v) return true;
      // case-insensitive match
      if (x.name && String(x.name).toLowerCase() === v.toLowerCase()) return true;
      if (x.label && String(x.label).toLowerCase() === v.toLowerCase()) return true;
      return false;
    }) || null;
  };

  /** small presentational wrapper */
  const StepWrapper = ({ title, children }) => (
    <div className="rounded-2xl border border-white/10 bg-white/[.02] p-6 sm:p-8">
      <h2 className="mb-6 text-center font-semibold text-pink-400">{title}</h2>
      {children}
    </div>
  );

  // Chip now supports optional `left` icon/node to match the design (small circular play / emoji)
  const Chip = ({ active, onClick, left = null, children }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-md border transition select-none ${
        active ? "bg-pink-600 text-white" : "text-white/80 bg-white/[.02] border-white/10 hover:border-white/20"
      }`}
    >
      {left && (
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm shadow-sm ${
            active ? "bg-white text-pink-600" : "bg-white/[.04]"
          }`}
        >
          {left}
        </span>
      )}
      <span>{children}</span>
    </button>
  );

  const SelectCard = ({ selected, label, onClick, icon, imgUrl }) => (
    <button
      onClick={onClick}
      className={`rounded-xl overflow-hidden border p-0 bg-white/[.015] text-center ${
        selected ? "ring-2 ring-pink-500" : "border-white/8 hover:border-white/20"
      }`}
    >
      <div className="h-28 flex items-center justify-center text-4xl bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.06),rgba(255,255,255,0)_70%)]">
        {imgUrl ? (
          <img src={imgUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          icon || "🎭"
        )}
      </div>
      <div className="px-2 py-2 text-sm text-white/80">{label}</div>
    </button>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      {/* header */}
      <section className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold">Create your own {titleTarget}</h1>
        <p className="mt-2 text-sm text-white/60">A guided flow to pick a character and tune personality, appearance and style.</p>

        {/* progress */}
        <div className="mt-6 flex justify-center">
          <nav className="inline-flex items-center gap-4" aria-label="Progress">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${
                    step === i + 1 ? "bg-pink-500 text-white" : i + 1 < step ? "bg-pink-400 text-white" : "bg-white/[.03] text-white/60"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 8 && <div className={`h-px w-8 ${i + 1 < step ? "bg-pink-400" : "bg-white/10"}`} />}
              </div>
            ))}
          </nav>
        </div>
      </section>

      <div className="mx-auto max-w-5xl">
        {/* gender tabs */}
        <div className="mb-6 flex items-center justify-center gap-8">
          {[
            ["female", "Female"],
            ["male", "Male"],
            ["trans", "Trans"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setGender(val)}
              className={`px-4 py-2 text-sm ${
                gender === val ? "border-b-2 border-pink-500 text-pink-300" : "text-white/70 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* steps */}
        {step === 1 && (
          <StepWrapper title="Choose Style">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {characterItems.map((c) => (
                <button
                  key={c.id || c.name}
                  onClick={() => bump("style", c.label || c.name)}
                  className={`group relative overflow-hidden rounded-2xl border bg-white/[.04] text-left ${
                    state.style === (c.label || c.name) ? "ring-2 ring-pink-500" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="h-56 w-full">
                    {c.url ? (
                      <img src={c.url} alt={c.name || c.label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute left-3 right-3 bottom-3 p-0">
                    <div className="px-3 pb-2">
                      <h3 className="text-sm font-semibold text-white drop-shadow-md">{c.label || c.name}</h3>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper title="Choose Ethnicity, Age & Eye Color">
            <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
              {ethnicityItems.map((e) => (
                <SelectCard
                  key={e.id || e.name}
                  label={e.label || e.name}
                  selected={state.ethnicity === (e.label || e.name)}
                  onClick={() => bump("ethnicity", e.label || e.name)}
                  icon={e.url ? <img src={e.url} alt={e.name} className="h-16 w-16 object-cover rounded-md" /> : "🌍"}
                />
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 text-white/70">Age</div>

              {/* compact 5-number carousel with center highlighted */}
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  onClick={() => bump("age", Math.max(18, state.age - 1))}
                  className="px-3 text-2xl text-white/70"
                  aria-label="decrease age"
                >
                  ‹
                </button>

                <div className="flex items-center gap-4">
                  {[-2, -1, 0, 1, 2].map((off) => {
                    const val = Math.max(18, Math.min(60, state.age + off));
                    const center = off === 0;
                    return (
                      <div
                        key={off}
                        onClick={() => bump("age", val)}
                        className={`cursor-pointer select-none rounded-md px-4 py-2 text-center transition ${
                          center
                            ? "bg-pink-500 text-white text-2xl font-semibold shadow-lg"
                            : "bg-white/[.03] text-white/80"
                        }`}
                      >
                        {val}
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => bump("age", Math.min(60, state.age + 1))}
                  className="px-3 text-2xl text-white/70"
                  aria-label="increase age"
                >
                  ›
                </button>
              </div>

              <div className="mt-2 text-xs text-white/60">Must be 18+</div>
            </div>

            <div className="mt-6">
              <div className="mb-2 text-sm text-white/70">Eye Color</div>
              <div className="flex flex-wrap items-center gap-6 justify-center">
                {eyeColors.map((c) => (
                  <div key={c} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => bump("eye", c)}
                      className={`rounded-md shadow-md transition ${state.eye === c ? "ring-2 ring-pink-500" : "border border-white/8"}`}
                      style={{ background: c.toLowerCase(), height: 48, width: 96 }}
                    />
                    <div className={`text-sm ${state.eye === c ? "text-white" : "text-white/80"}`}>{c}</div>
                  </div>
                ))}
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper title="Choose Hair Style & Color">
            <div className="mb-6 grid grid-cols-3 gap-4 md:grid-cols-6">
              {hairStyles.map((h) => (
                <SelectCard
                  key={h.id || h.name}
                  label={h.label || h.name}
                  selected={state.hairStyle === (h.id || h.name)}
                  onClick={() => bump("hairStyle", h.id || h.name)}
                  imgUrl={h.url}
                />
              ))}
            </div>

            <div>
              <div className="mb-2 text-sm text-white/70">Hair Color</div>
              <div className="flex flex-wrap items-center gap-6 justify-center">
                {hairColors.map((c) => (
                  <div key={c} className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => bump("hairColor", c)}
                      className={`rounded-md shadow-md transition ${state.hairColor === c ? "ring-2 ring-pink-500" : "border border-white/8"}`}
                      style={{ background: c.toLowerCase(), height: 48, width: 96 }}
                    />
                    <div className={`text-sm ${state.hairColor === c ? "text-white" : "text-white/80"}`}>{c}</div>
                  </div>
                ))}
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper title="Body Type & Sizes">
            <div className="mb-6 grid grid-cols-3 gap-4 md:grid-cols-6">
              {bodies.map((b) => (
                <SelectCard key={b.id || b.name} label={b.label || b.name} selected={state.body === (b.id || b.name)} onClick={() => bump("body", b.id || b.name)} imgUrl={b.url} />
              ))}
            </div>

            {isFemaleLike && (
              <>
                <h3 className="mb-3 text-sm text-white/70">Breast Size</h3>
                <div className="mb-6 grid grid-cols-3 gap-4 md:grid-cols-6">
                  {breasts.map((b) => (
                    <SelectCard key={b.id || b.name} label={b.label || b.name} selected={state.breast === (b.id || b.name)} onClick={() => bump("breast", b.id || b.name)} imgUrl={b.url} />
                  ))}
                </div>
              </>
            )}

            <h3 className="mb-3 text-sm text-white/70">Butt Size</h3>
            <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
              {butts.map((b) => (
                <SelectCard key={b.id} label={b.label} selected={state.butt === b.id} onClick={() => bump("butt", b.id)} icon={"🍑"} />
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 5 && (
          <StepWrapper title="Personality & Voice">
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {personalities.map((p) => {
                const selected = state.personality === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => bump("personality", p.id)}
                    className={`rounded-xl border p-5 text-center transition overflow-hidden ${
                      selected
                        ? "ring-2 ring-pink-500 bg-gradient-to-br from-white/[.02] to-pink-900/5"
                        : "bg-white/[.015] border-white/8 hover:border-white/20"
                    }`}
                  >
                    <div className="mb-3 text-3xl">{ICONS.personality[p.label] || "🎭"}</div>
                    <div className="mb-2 font-semibold text-white/90">{p.label}</div>
                    <div className="text-xs text-white/60">A short playful description of this personality.</div>
                  </button>
                );
              })}
            </div>

            <div>
              <div className="mb-2 text-sm text-white/70">Choose Voice</div>
              <div className="flex flex-wrap items-center gap-3">
                {voices.map((v) => (
                  <Chip key={v} active={state.voice === v} onClick={() => bump("voice", v)}>
                    <span className="mr-2 text-lg">{ICONS.voice[v] || "🔊"}</span>
                    {v}
                  </Chip>
                ))}
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 6 && (
          <StepWrapper title="Choose Relationship">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {relationships.map((r) => (
                <button
                  key={r.id}
                  onClick={() => bump("relationship", r.label)}
                  className={`rounded-xl border bg-white/[.015] p-5 text-left ${
                    state.relationship === r.label ? "ring-2 ring-pink-500" : "border-white/8 hover:border-white/20"
                  }`}
                >
                  <div className="mb-2 text-2xl">{ICONS.relationship[r.label] || "👥"}</div>
                  <div className="font-semibold text-white/90">{r.label}</div>
                  <div className="mt-1 text-xs text-white/60">Pick how you relate to each other.</div>
                </button>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 7 && (
          <StepWrapper title="Clothing & Special Features">
            <div className="mb-6">
              <div className="mb-2 text-sm text-white/70">Clothing</div>
              <div className="flex flex-wrap gap-3">
                {clothings.map((c) => (
                  <Chip key={c} active={state.clothing.includes(c)} onClick={() => toggleArray("clothing", c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm text-white/70">Special Features</div>
              <div className="flex flex-wrap gap-3">
                {features.map((f) => {
                  // keep it logical: hide "Pregnant" for male
                  if (gender === "male" && f === "Pregnant") return null;
                  return (
                    <Chip key={f} active={state.features.includes(f)} onClick={() => toggleArray("features", f)}>
                      {f}
                    </Chip>
                  );
                })}
              </div>
            </div>
          </StepWrapper>
        )}

  {step === 8 && (
          <StepWrapper title="Summary">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="col-span-1">
                <div className="overflow-hidden rounded-xl border bg-white/[.015] p-0">
                  {/* Style/Character preview - prefer character asset with matching label */}
                  <div className="flex h-64 items-end">
                    {(() => {
                      const charItem = findItem(characterItems, state.style) || findItem(characterItems, state.style === 'Anime' ? 'Anime' : state.style);
                      if (charItem && charItem.url) {
                        return <img src={charItem.url} alt={charItem.name || charItem.label} className="h-full w-full object-cover" />;
                      }
                      return <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.06),rgba(255,255,255,0)_70%)]" />;
                    })()}
                  </div>
                  <div className="px-3 py-2 text-center text-white/80">{state.style || "No style selected"}</div>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="rounded-md bg-white/[.03] p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded overflow-hidden bg-white/[.02]">
                    {/* Ethnicity thumbnail */}
                    {(() => {
                      const eth = findItem(ethnicityItems, state.ethnicity);
                      return eth && eth.url ? <img src={eth.url} alt={eth.name || eth.label} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/[.02]" />;
                    })()}
                  </div>
                  <div>Gender: {gender}</div>
                </div>

                <div className="rounded-md bg-white/[.03] p-4">Relationship: {state.relationship || "N/A"}</div>

                <div className="rounded-md bg-white/[.03] p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded overflow-hidden bg-white/[.02]">
                    {/* Hair style thumbnail */}
                    {(() => {
                      const h = findItem(hairStyleItems, state.hairStyle);
                      return h && h.url ? <img src={h.url} alt={h.name || h.label} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/[.02]" />;
                    })()}
                  </div>
                  <div>Hair: {labelFor(hairStyles, state.hairStyle)} {state.hairColor ? `(${state.hairColor})` : ""}</div>
                </div>

                <div className="rounded-md bg-white/[.03] p-4">Age: {state.age}</div>

                <div className="rounded-md bg-white/[.03] p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded overflow-hidden bg-white/[.02]">
                    {/* Body thumbnail */}
                    {(() => {
                      const b = findItem(bodyTypeItems, state.body);
                      return b && b.url ? <img src={b.url} alt={b.name || b.label} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/[.02]" />;
                    })()}
                  </div>
                  <div>Body: {labelFor(bodies, state.body)}</div>
                </div>

                {isFemaleLike && (
                  <div className="rounded-md bg-white/[.03] p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded overflow-hidden bg-white/[.02]">
                      {/* Breast thumbnail */}
                      {(() => {
                        const br = findItem(breastSizeItems, state.breast);
                        return br && br.url ? <img src={br.url} alt={br.name || br.label} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/[.02]" />;
                      })()}
                    </div>
                    <div>Breast: {labelFor(breasts, state.breast)}</div>
                  </div>
                )}

                <div className="rounded-md bg-white/[.03] p-4">Butt: {labelFor(butts, state.butt)}</div>

                <div className="rounded-md bg-white/[.03] p-4">Personality: {labelFor(personalities, state.personality)}</div>
                <div className="rounded-md bg-white/[.03] p-4">Voice: {state.voice || "N/A"}</div>
                <div className="rounded-md bg-white/[.03] p-4">Clothing: {state.clothing.join(", ") || "—"}</div>
                <div className="rounded-md bg-white/[.03] p-4">Features: {state.features.join(", ") || "—"}</div>
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 9 && (
          <div className="mt-6">
            <CreateCharacterSave character={finalPayload} gender={gender} />
          </div>
        )}

  {/* controls */}
        <div className="mt-8 flex items-center justify-center gap-6">
          <button onClick={back} className="rounded-xl border border-white/10 bg-white/[.02] px-6 py-3">
            Back
          </button>
          {step < 8 ? (
            <button
              onClick={next}
              disabled={!isStepValid()}
              className={`rounded-xl px-6 py-3 font-semibold text-white ${
                isStepValid()
                  ? "bg-gradient-to-r from-pink-600 via-pink-400 to-indigo-500"
                  : "bg-white/[.08] text-white/60 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          ) : step === 8 ? (
            <button
              onClick={finish}
              className="rounded-xl bg-gradient-to-r from-pink-600 via-pink-400 to-indigo-500 px-6 py-3 font-semibold text-white"
            >
              ✨ Bring My AI to Life
            </button>
          ) : null}
        </div>
  {/* (Save page moved to its own route: /create-character/save) */}
      </div>
    </main>
  );
}
