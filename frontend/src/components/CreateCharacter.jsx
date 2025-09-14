import React, { useMemo, useState } from "react";
import { getAssets } from '../utils/assets'
import { useNavigate } from "react-router-dom";
// explicit canonical style images (Vite ?url imports)
import realFemaleStyle from '../../assets/create character/real/real female/style/style.jpg?url'
import realMaleStyle from '../../assets/create character/real/real male/style/style.jpg?url'
import realTransStyle from '../../assets/create character/real/real trans/style/style.png?url'
import animeFemaleStyle from '../../assets/create character/anime/anime female/style/style.jpg?url'
import animeMaleStyle from '../../assets/create character/anime/anime male/style/style.jpg?url'
import animeTransStyle from '../../assets/create character/anime/anime trans/style/style.png?url'
import CreateCharacterSave from './CreateCharacterSave';

export default function CreateCharacter() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState('female');

  const [state, setState] = useState({
    style: null,
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
    // extras
    dick_size: null,
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
  // characterItems must be declared before other asset lists that reference it
  const characterItems = useMemo(() => {
    // Prefer a dedicated 'style' folder under each category (e.g. assets/.../female/style)
    const imgs = getAssets(gender === 'male' ? 'male' : (gender === 'trans' ? 'trans' : 'female'), 'style')
    if (imgs && imgs.length) {
      // first try folder, then id, then name for tokens 'real' or 'anime'
      const mapped = imgs.map((it, idx) => {
        const hay = [it.folder, it.id, it.name, it.label].filter(Boolean).join(' ').toLowerCase()
        let variant = null
        if (hay.includes('real')) variant = 'Realistic'
        else if (hay.includes('anime')) variant = 'Anime'
        return {
          ...it,
          variant,
          label: variant || (it.label || it.name),
        }
      })

      // if none of the items had a detectable variant and there are exactly two items,
      // assume first is Realistic and second is Anime — this matches the common asset layout
      if (!mapped.some(m => m.variant) && mapped.length === 2) {
        mapped[0].variant = 'Realistic'
        mapped[1].variant = 'Anime'
        mapped[0].label = mapped[0].variant
        mapped[1].label = mapped[1].variant
      }

      // ensure Realistic appears before Anime in the listing regardless of discovery order
      const order = { Realistic: 0, Anime: 1 };
      mapped.sort((a, b) => {
        const oa = order[a.variant] ?? 2;
        const ob = order[b.variant] ?? 2;
        return oa - ob;
      });

      // canonical static fallback: if discovery didn't yield two explicit variant+url
      // entries, prefer the explicit imports so we guarantee left=Realistic, right=Anime
      const hasTwo = mapped.length === 2 && mapped.every(m => m.variant && m.url);
      if (!hasTwo) {
        const canonical = {
          female: [
            { id: 'real_female_style', label: 'Realistic', variant: 'Realistic', url: realFemaleStyle },
            { id: 'anime_female_style', label: 'Anime', variant: 'Anime', url: animeFemaleStyle },
          ],
          male: [
            { id: 'real_male_style', label: 'Realistic', variant: 'Realistic', url: realMaleStyle },
            { id: 'anime_male_style', label: 'Anime', variant: 'Anime', url: animeMaleStyle },
          ],
          trans: [
            { id: 'real_trans_style', label: 'Realistic', variant: 'Realistic', url: realTransStyle },
            { id: 'anime_trans_style', label: 'Anime', variant: 'Anime', url: animeTransStyle },
          ],
        };
        return canonical[gender === 'male' ? 'male' : gender === 'trans' ? 'trans' : 'female'];
      }

      return mapped
    }
    return ["Realistic", "Anime"].map((x, i) => ({ id: `char${i + 1}`, label: x, variant: x }))
  }, [gender, state.style])

  // Load images from assets using canonical folder names, fallback to hardcoded lists
  const ethnicityItems = useMemo(() => {
    const imgs = getAssets(gender === 'male' ? 'male' : 'female', 'ethnicity')
    if (imgs && imgs.length) {
      const sel = characterItems.find(it => it.id === state.style)
      const selVariant = sel && sel.variant ? sel.variant : null
      if (!selVariant) return imgs
      const filtered = imgs.filter(it => {
        const hay = [it.folder, it.id, it.name, it.label].filter(Boolean).join(' ').toLowerCase()
        if (hay.includes('real')) return selVariant === 'Realistic'
        if (hay.includes('anime')) return selVariant === 'Anime'
        return false
      })
      return filtered.length ? filtered : imgs
    }
    return ["Asian", "Black", "White", "Latina", "Arab", "Indian"].map((x, i) => ({ id: `eth${i}`, label: x }))
  }, [gender, state.style])
  
  const hairStyleItems = useMemo(() => {
    const imgs = getAssets(gender === 'male' ? 'male' : 'female', 'hair-style')
    if (imgs && imgs.length) {
      const sel = characterItems.find(it => it.id === state.style)
      const selVariant = sel && sel.variant ? sel.variant : null
      if (!selVariant) return imgs
      const filtered = imgs.filter(it => {
        const hay = [it.folder, it.id, it.name, it.label].filter(Boolean).join(' ').toLowerCase()
        if (hay.includes('real')) return selVariant === 'Realistic'
        if (hay.includes('anime')) return selVariant === 'Anime'
        return false
      })
      return filtered.length ? filtered : imgs
    }
    return ["Straight Long", "Straight Short", "Pigtails", "Hair Bun", "Ponytail"].map((x, i) => ({ id: `hair${i + 1}`, label: x }))
  }, [gender, state.style])
  
  const bodyTypeItems = useMemo(() => {
    const imgs = getAssets(gender === 'male' ? 'male' : 'female', 'body-type')
    if (imgs && imgs.length) {
      const sel = characterItems.find(it => it.id === state.style)
      const selVariant = sel && sel.variant ? sel.variant : null
      if (!selVariant) return imgs
      const filtered = imgs.filter(it => {
        const hay = [it.folder, it.id, it.name, it.label].filter(Boolean).join(' ').toLowerCase()
        if (hay.includes('real')) return selVariant === 'Realistic'
        if (hay.includes('anime')) return selVariant === 'Anime'
        return false
      })
      return filtered.length ? filtered : imgs
    }
    return ["Slim", "Athletic", "Voluptuous", "Curvy", "Muscular", "Average"].map((x, i) => ({ id: `body${i + 1}`, label: x }))
  }, [gender, state.style])
  
  const breastSizeItems = useMemo(() => {
    if (gender === 'male') return []
    const imgs = getAssets('female', 'breast-size')
    if (imgs && imgs.length) {
      const sel = characterItems.find(it => it.id === state.style)
      const selVariant = sel && sel.variant ? sel.variant : null
      if (!selVariant) return imgs
      const filtered = imgs.filter(it => {
        const hay = [it.folder, it.id, it.name, it.label].filter(Boolean).join(' ').toLowerCase()
        if (hay.includes('real')) return selVariant === 'Realistic'
        if (hay.includes('anime')) return selVariant === 'Anime'
        return false
      })
      return filtered.length ? filtered : imgs
    }
    return ["Flat", "Small", "Medium", "Large", "XL", "XXL"].map((x, i) => ({ id: `breast${i + 1}`, label: x }))
  }, [gender, state.style])
  
  const buttSizeItems = useMemo(() => {
    if (gender === 'male') return []
    const imgs = getAssets('female', 'butt-size')
    if (imgs && imgs.length) {
      const sel = characterItems.find(it => it.id === state.style)
      const selVariant = sel && sel.variant ? sel.variant : null
      if (!selVariant) return imgs
      const filtered = imgs.filter(it => {
        const hay = [it.folder, it.id, it.name, it.label].filter(Boolean).join(' ').toLowerCase()
        if (hay.includes('real')) return selVariant === 'Realistic'
        if (hay.includes('anime')) return selVariant === 'Anime'
        return false
      })
      return filtered.length ? filtered : imgs
    }
    return ["Small", "Skinny", "Athletic", "Medium", "Large", "XL"].map((x, i) => ({ id: `butt${i + 1}`, label: x }))
  }, [gender, state.style])
  
  
  
  const outfitItems = useMemo(() => {
    if (gender !== 'male') return []
    const imgs = getAssets('male', 'outfit')
    if (imgs && imgs.length) {
      const sel = characterItems.find(it => it.id === state.style)
      const selVariant = sel && sel.variant ? sel.variant : null
      if (!selVariant) return imgs
      const filtered = imgs.filter(it => {
        const hay = [it.folder, it.id, it.name, it.label].filter(Boolean).join(' ').toLowerCase()
        if (hay.includes('real')) return selVariant === 'Realistic'
        if (hay.includes('anime')) return selVariant === 'Anime'
        return false
      })
      return filtered.length ? filtered : imgs
    }
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

  // inline eggplant SVG used as fallback for male dick-size
  const EggplantIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 3c0 0-2 0-4 2-1 1-1.5 2.3-1.2 3.8.3 1.5 1.2 3.2 2 4.4.8 1.2 1.9 2.5 1.9 4.1 0 2.2-1.9 4-4 4-1.6 0-3.2-.8-4.6-2.2-1.9-1.9-3.7-4.5-5-7.1-1.1-2.2-1.7-4.4-1.5-6.3.2-1.7 1.2-3.2 2.7-4.1C9.9 1.8 11.4 1 13 1c1.7 0 3.4.6 4.7 1.9C19.7 4.2 21 3 21 3z" fill="#8B5CF6"/>
      <path d="M15 7s-1 1-2 0c0 0 .5-1 2 0z" fill="#6D28D9"/>
      <path d="M7 17c.5.6 1.6 1.4 2.8 1.4 1.3 0 2.5-.6 3.7-1.8 1.5-1.5 2.9-3.5 3.9-5.2.4-.7.6-1.5.5-2.3-.1-.8-.6-1.5-1.2-2-1.1-.9-2.7-.6-3.9.5-1.2 1.2-2.1 2.8-3 4.3-.8 1.2-1.8 2.7-2.8 3.6-.7.6-.6 1.1.0 1.5z" fill="#C084FC" opacity="0.9"/>
    </svg>
  );
  // Clothing: keep existing male list intact; for female/trans provide the expanded list
  const clothings = useMemo(() => {
    if (gender === 'male') {
      return [
        "Suit & Shirt",
        "Pant & Sweater",
        "Chef",
        "Blazer & T-Shirt",
        "Police",
        "Denim & Khakis",
        "Tennis Outfit",
        "Military",
        "Waiter",
        "Tee & Leather Pants",
        "Summer Dress",
        "Jeans",
        "Shorts & Henley",
        "Jacket & Chinos",
        "Surfer",
        "Cowboy Outfit",
        "Basket Ball",
        "Hip-Hop",
        "Long Coat",
        "Hoodie",
        "Cowboy",
        "Ninja Outfit",
        "Astronaut",
        "Polo & Lines Pants",
        "Ski",
      ];
    }

    // female & trans: use the expanded list provided by the user (keeps commonly used entries too)
    return [
      "Bikini",
      "Skirt",
      "Cheerleader Outfit",
      "Pencil Dress",
      "Long Dress",
      "Soccer Uniform",
      "Tennis Outfit",
      "Wedding Dress",
      "Fancy Dress",
      "Witch costume",
      "Summer Dress",
      "Jeans",
      "Maid Outfits",
      "Medieval Armor",
      "Lab Coat",
      "Cowboy Outfit",
      "Princess Outfit",
      "Corset",
      "Long Coat",
      "Hoodie",
      "Leggings",
      "Ninja Outfit",
      "Pajamas",
      "Hijab",
      "Police Uniform",
    ];
  }, [gender]);

  // Special features: expand per user's request. "Pregnant" is hidden for male in the UI already.
  const features = useMemo(() => [
    "Public Hair",
    "Pregnant",
    "Freckles",
    "Tattoos",
    "Belly Piercing",
    "Nipple Piercing",
    "Glass",
  ], []);

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
        // Body required for all. For male users require dick_size, for female/trans require butt.
        if (gender === 'male') {
          return !!state.body && !!state.dick_size;
        }
        // female/trans: butt required, breast optional
        return !!state.body && !!state.butt;
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
  style: labelFor(characterItems, state.style),
  style_id: state.style,
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
      className={`rounded-xl overflow-hidden border p-0 bg-white/[.015] text-center shadow-sm ${
        selected ? "ring-2 ring-pink-500" : "border-white/8 hover:border-white/20"
      }`}
    >
      {/* Taller tile: white/top area for icon fallbacks, image covers when present */}
      <div className="h-48 w-full relative">
        {imgUrl ? (
          <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.02),rgba(255,255,255,0)_70%)]">
            <img src={imgUrl} alt={label} className="h-full w-full object-cover" />
          </div>
        ) : (
          // dark/translucent inner box with centered emoji to match theme
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-b from-black/6 to-black/12">
            <div className="rounded-md bg-white/[.04] p-3 shadow-inner">
              <div className="flex items-center justify-center" style={{ width: 56, height: 56 }}>
                {icon || <span className="text-3xl">🎭</span>}
              </div>
            </div>
          </div>
        )}

        {/* bottom label bar */}
        <div className="absolute left-0 right-0 bottom-0 px-4 py-3 bg-gradient-to-t from-black/60 to-black/10">
          <div className="text-center text-sm text-white/90 font-semibold">{label}</div>
        </div>
      </div>
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
  {/* gender tabs: only visible on step 1 (choose style) */}
  {step === 1 && (
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
        )}

        {/* small persistent indicator for chosen gender on subsequent steps */}
        {step !== 1 && (
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-md px-3 py-1 text-sm bg-white/[.02] border border-white/8 text-white/80">Gender: {gender === 'female' ? 'Female' : gender === 'male' ? 'Male' : 'Trans'}</div>
          </div>
        )}

        {/* steps */}
        {step === 1 && (
          <StepWrapper title="Choose Style">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {characterItems.map((c) => (
                <button
                  key={c.id || c.name}
                  onClick={() => bump("style", c.id)}
                  className={`group relative overflow-hidden rounded-2xl border bg-white/[.04] text-left ${
                    state.style === c.id ? "ring-2 ring-pink-500" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="h-150 w-full">
                    {c.url ? (
                      <img src={c.url} alt={c.name || c.label} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute left-3 right-3 bottom-3 p-0">
                    <div className="px-3 pb-2">
                      <h3 className="text-sm font-semibold text-white drop-shadow-md">{c.variant || c.label || c.name}</h3>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper title="Choose Ethnicity, Age & Eye Color">
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
              {ethnicityItems.map((e) => (
                <SelectCard
                  key={e.id || e.name}
                  label={e.label || e.name}
                  selected={state.ethnicity === e.id}
                  onClick={() => bump("ethnicity", e.id)}
                  imgUrl={e.url}
                  icon={!e.url && "🌍"}
                />
              ))}
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 text-white/70">Age</div>

              {/* compact 5-number carousel with center highlighted */}
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  onClick={() => bump("age", Math.max(18, state.age - 1))}
                  className="px-3 text-2xl text-white/70 rounded-md bg-white/[.02] hover:bg-white/[.04]"
                  aria-label="decrease age"
                >
                  ‹
                </button>

                <div className="flex items-center gap-4">
                  {[-2, -1, 0, 1, 2].map((off) => {
                    const val = Math.max(18, Math.min(60, state.age + off));
                    const center = off === 0;
                    return (
                      <button
                        key={off}
                        onClick={() => bump("age", val)}
                        className={`cursor-pointer select-none rounded-md px-4 py-2 text-center transition ${
                          center
                            ? "bg-pink-500 text-white text-2xl font-semibold shadow-lg"
                            : "bg-white/[.03] text-white/80"
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => bump("age", Math.min(60, state.age + 1))}
                  className="px-3 text-2xl text-white/70 rounded-md bg-white/[.02] hover:bg-white/[.04]"
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
            <div className="mb-6 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
              {hairStyles.map((h) => (
                <SelectCard
                  key={h.id || h.name}
                  label={h.label || h.name}
                  selected={state.hairStyle === (h.label || h.name)}
                  onClick={() => bump("hairStyle", h.label || h.name)}
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
            <div className="mb-6 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
              {bodies.map((b) => (
                <SelectCard key={b.id || b.name} label={b.label || b.name} selected={state.body === (b.label || b.name)} onClick={() => bump("body", b.label || b.name)} imgUrl={b.url} />
              ))}
            </div>

            {isFemaleLike && (
              <>
                <h3 className="mb-3 text-sm text-white/70">Breast Size</h3>
                <div className="mb-6 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
                  {breasts.map((b) => (
                    <SelectCard key={b.id || b.name} label={b.label || b.name} selected={state.breast === (b.label || b.name)} onClick={() => bump("breast", b.label || b.name)} imgUrl={b.url} />
                  ))}
                </div>
              </>
            )}

            {gender === 'male' ? (
              <>
                <h3 className="mb-3 text-sm text-white/70">Dick Size</h3>
                {/* debug: show raw assets discovery */}
                {(() => {
                  const raw = getAssets('male', 'dick-size');
                  const items = (raw && raw.length ? raw : ["Small", "Medium", "Large", "XL", "XXL"]).map((d, idx) => (typeof d === 'string' ? { id: `dick${idx}`, label: d } : d));
                  return (
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
                      {items.map((item) => (
                        <SelectCard
                          key={item.id}
                          label={item.label || item.name}
                          selected={state.dick_size === item.id}
                          onClick={() => bump('dick_size', item.id)}
                          imgUrl={item.url}
                          // use a dark tile with centered emoji to match the theme when no image
                          icon={!item.url && <span className="text-3xl">🍆</span>}
                        />
                      ))}
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                <h3 className="mb-3 text-sm text-white/70">Butt Size</h3>
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
                  {butts.map((b) => (
                    <SelectCard
                      key={b.id || b.name}
                      label={b.label || b.name}
                      selected={state.butt === b.id}
                      onClick={() => bump("butt", b.id)}
                      imgUrl={b.url}
                      icon={!b.url && "🍑"}
                    />
                  ))}
                </div>
              </>
            )}
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
            {(() => {
              // ------- data & helpers ----------------------------------------------
              const styleItem = findItem(characterItems, state.style) || characterItems?.[0];
              const ethnicityItem = findItem(ethnicityItems, state.ethnicity);
              const hairStyleItem = findItem(hairStyles, state.hairStyle);
              const bodyItem = findItem(bodies, state.body);
              const breastItem = isFemaleLike ? findItem(breasts, state.breast) : null;
              const buttItem = findItem(butts, state.butt);

              const relationship = state.relationship || "Girlfriend";
              const voice = state.voice || "Emotive";
              const hairColor = state.hairColor || "Green";
              const age = state.age || 24;
              const body = labelFor(bodies, state.body) || "Slim";
              const firstFeature = (state.features && state.features[0]) || "Tattoos";
              const eye = state.eye || "Red";
              const clothingFirst = (state.clothing && state.clothing[0]) || "Bikini";
              const personalityLabel = labelFor(personalities, state.personality) || "Temptress";

              const thumbItems = [
                { item: ethnicityItem, fallback: "Asian" },
                { item: hairStyleItem, fallback: "Braided" },
                { item: bodyItem, fallback: "Slim" },
                ...(isFemaleLike ? [{ item: breastItem, fallback: "Flat" }] : []),
                { item: buttItem, fallback: "Small" },
              ];

              const Stat = ({ className = "", icon = null, title = "", value = "" }) => (
                <div className={`rounded-2xl bg-white/[.03] border border-white/10 p-5 shadow-sm ${className}`}>
                  <div className="flex items-center gap-3">
                    {icon && <div className="text-2xl">{icon}</div>}
                    <div className="text-white font-semibold">{value}</div>
                  </div>
                  <div className="mt-2 text-xs text-white/70">{title}</div>
                </div>
              );

              return (
                <>
                  {/* 5x7 grid; items placed in DOM order to land in exact cells */}
                  <div className="grid grid-cols-5 gap-6 [grid-auto-rows:minmax(0,1fr)]">
                    {/* 1) BIG PREVIEW — 2x3 */}
                    <div className="col-span-2 row-span-3 rounded-2xl border-4 border-pink-500 overflow-hidden bg-white/[.02]">
                      <div className="relative aspect-[3/4] w-full">
                        {styleItem?.url ? (
                          <img src={styleItem.url} alt={styleItem.name || styleItem.label} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.10),rgba(255,255,255,0)_70%)]" />
                        )}
                      </div>
                      <div className="bg-pink-600 text-white text-center font-semibold py-3">
                        {labelFor(characterItems, state.style) || "Realistic"}
                      </div>
                    </div>

                    {/* 2) GIRLFRIEND — 2x1 (goes in row1, cols 3-4) */}
                    <div className="col-span-2 row-span-1 rounded-2xl bg-white/[.03] border border-white/10 p-6 flex items-center gap-3">
                      <div className="text-2xl">❤️</div>
                      <div className="text-white font-semibold">{relationship}</div>
                    </div>

                    {/* 3) HAIR COLOR — 1x1 (row1, col5) */}
                    <Stat title="Hairs" value={hairColor} className="col-span-1 row-span-1" icon="🎨" />

                    {/* 4) VOICE — 1x1 (row2, col3) */}
                    <Stat title="Voice" value={voice} className="col-span-1 row-span-1" icon="▶️" />

                    {/* 5) EYE COLOR — 1x1 (row2, col4) */}
                    <Stat title="Eye Color" value={eye} className="col-span-1 row-span-1" icon="👁️" />

                    {/* 6) PERSONALITY — 1x1 (row2, col5) */}
                    <Stat title="" value={personalityLabel} className="col-span-1 row-span-1" icon="😏" />

                    {/* 7) AGE — 1x1 (row3, col3) */}
                    <Stat title="Age" value={age} className="col-span-1 row-span-1" icon="📅" />

                    {/* 8) CLOTHING — 1x1 (row3, col4) */}
                    <Stat title="Clothing" value={clothingFirst} className="col-span-1 row-span-1" icon="🧥" />

                    {/* 9) SPECIAL FEATURES — 1x1 (row3, col5) */}
                    <Stat title="Special Features" value={firstFeature} className="col-span-1 row-span-1" icon="✨" />
                  </div>

                  {/* Thumbnails strip */}
                  <div className="mt-6 grid grid-cols-5 gap-6">
                    {thumbItems.map(({ item, fallback }, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[.02]">
                        <div className="h-28 w-full">
                          {item?.url ? (
                            <img src={item.url} alt={item.label || item.name || fallback} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-white/[.02]" />
                          )}
                        </div>
                        <div className="bg-pink-600 text-white text-center font-semibold py-2">
                          {item?.label || item?.name || fallback}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
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
