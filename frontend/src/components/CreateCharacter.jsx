import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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

  const bump = (key, val) => setState((s) => ({ ...s, [key]: val }));
  const toggleArray = (key, val) =>
    setState((s) => ({
      ...s,
      [key]: s[key].includes(val) ? s[key].filter((x) => x !== val) : [...s[key], val],
    }));

  const isFemaleLike = gender !== "male";

  /** data */
  const ethnicities = useMemo(
    () => ["Asian", "Black", "White", "Latina", "Arab", "Indian"].map((x, i) => ({ id: `eth${i}`, label: x })),
    []
  );
  const eyeColors = useMemo(() => ["Black", "Brown", "Red", "Yellow", "Green", "Purple", "Teal", "White"], []);
  const hairStyles = useMemo(() => genSample(9, "Hair-"), []);
  const hairColors = eyeColors;
  const bodies = useMemo(() => ["Slim", "Athletic", "Voluptuous", "Curvy", "Muscular", "Average"].map((x, i) => ({ id: `body${i}`, label: x })), []);
  const breasts = useMemo(() => ["Flat", "Small", "Medium", "Large", "XL", "XXL"].map((x, i) => ({ id: `breast${i}`, label: x })), []);
  const butts = useMemo(() => ["Small", "Skinny", "Athletic", "Medium", "Large", "XL"].map((x, i) => ({ id: `butt${i}`, label: x })), []);
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
      ].map((x, i) => ({ id: `pers${i}`, label: x })),
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

  const next = () => setStep((v) => (isStepValid(v) ? Math.min(8, v + 1) : v));
  const back = () => setStep((v) => Math.max(1, v - 1));

  // finish now navigates to a dedicated save/confirmation page (separate route)
  const finish = () => {
    // pass current state to save page via location state
    navigate("/create-character/save", { state: { character: state, gender } });
  };

  // make the page title logical based on selected gender
  const titleTarget = gender === "female" ? "AI Girl" : gender === "male" ? "AI Boy" : "AI Person";

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

  const SelectCard = ({ selected, label, onClick, icon }) => (
    <button
      onClick={onClick}
      className={`rounded-xl overflow-hidden border p-0 bg-white/[.015] text-center ${
        selected ? "ring-2 ring-pink-500" : "border-white/8 hover:border-white/20"
      }`}
    >
      <div className="h-28 flex items-center justify-center text-4xl bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.06),rgba(255,255,255,0)_70%)]">
        {icon || "🎭"}
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
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full text-sm font-semibold ${
                    step === i + 1 ? "bg-pink-500 text-white" : i + 1 < step ? "bg-pink-400 text-white" : "bg-white/[.03] text-white/60"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 7 && <div className={`h-px w-8 ${i + 1 < step ? "bg-pink-400" : "bg-white/10"}`} />}
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
              {["Realistic", "Anime"].map((label) => (
                <button
                  key={label}
                  onClick={() => bump("style", label)}
                  className={`group relative overflow-hidden rounded-2xl border bg-white/[.04] text-left ${
                    state.style === label ? "ring-2 ring-pink-500" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="h-56 w-full bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.18),rgba(255,255,255,0)_70%)]" />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute left-3 right-3 bottom-3 p-0">
                    <div className="px-3 pb-2">
                      <h3 className="text-sm font-semibold text-white drop-shadow-md">{label}</h3>
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
              {ethnicities.map((e) => (
                <SelectCard
                  key={e.id}
                  label={e.label}
                  selected={state.ethnicity === e.label}
                  onClick={() => bump("ethnicity", e.label)}
                  icon={"🌍"}
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
                  key={h.id}
                  label={h.label}
                  selected={state.hairStyle === h.id}
                  onClick={() => bump("hairStyle", h.id)}
                  icon={"💇"}
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
                <SelectCard key={b.id} label={b.label} selected={state.body === b.id} onClick={() => bump("body", b.id)} icon={"🧍"} />
              ))}
            </div>

            {isFemaleLike && (
              <>
                <h3 className="mb-3 text-sm text-white/70">Breast Size</h3>
                <div className="mb-6 grid grid-cols-3 gap-4 md:grid-cols-6">
                  {breasts.map((b) => (
                    <SelectCard key={b.id} label={b.label} selected={state.breast === b.id} onClick={() => bump("breast", b.id)} icon={"🎯"} />
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
                  <div className="flex h-64 items-end bg-[radial-gradient(75%_60%_at_50%_30%,rgba(255,255,255,0.06),rgba(255,255,255,0)_70%)]" />
                  <div className="px-3 py-2 text-center text-white/80">{state.style || "No style selected"}</div>
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="rounded-md bg-white/[.03] p-4">Gender: {gender}</div>
                <div className="rounded-md bg-white/[.03] p-4">Relationship: {state.relationship || "N/A"}</div>
                <div className="rounded-md bg-white/[.03] p-4">Ethnicity: {state.ethnicity || "N/A"}</div>
                <div className="rounded-md bg-white/[.03] p-4">Age: {state.age}</div>
                <div className="rounded-md bg-white/[.03] p-4">Eyes: {state.eye || "N/A"}</div>
                <div className="rounded-md bg-white/[.03] p-4">Hair: {state.hairStyle || "N/A"} {state.hairColor ? `(${state.hairColor})` : ""}</div>
                <div className="rounded-md bg-white/[.03] p-4">Body: {state.body || "N/A"}</div>
                {isFemaleLike && <div className="rounded-md bg-white/[.03] p-4">Breast: {state.breast || "N/A"}</div>}
                <div className="rounded-md bg-white/[.03] p-4">Butt: {state.butt || "N/A"}</div>
                <div className="rounded-md bg-white/[.03] p-4">Personality: {state.personality || "N/A"}</div>
                <div className="rounded-md bg-white/[.03] p-4">Voice: {state.voice || "N/A"}</div>
                <div className="rounded-md bg-white/[.03] p-4">Clothing: {state.clothing.join(", ") || "—"}</div>
                <div className="rounded-md bg-white/[.03] p-4">Features: {state.features.join(", ") || "—"}</div>
              </div>
            </div>
          </StepWrapper>
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
          ) : (
            <button
              onClick={finish}
              className="rounded-xl bg-gradient-to-r from-pink-600 via-pink-400 to-indigo-500 px-6 py-3 font-semibold text-white"
            >
              ✨ Bring My AI to Life
            </button>
          )}
        </div>
  {/* (Save page moved to its own route: /create-character/save) */}
      </div>
    </main>
  );
}
