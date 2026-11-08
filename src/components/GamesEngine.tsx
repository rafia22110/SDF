import React, { useState, useEffect } from "react";
import {
  Volume2,
  Mic,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Play,
  Sparkles,
  CheckCircle2,
  Trash2,
  Save,
} from "lucide-react";
import { Grade } from "../types";
import { sfx, speak, listenOnce, canListen, normalizeHe, tone } from "../audio";
import {
  getQuestionsForGame,
  VOICE_WORDS_BY_GRADE,
  GAMES,
} from "../data/content";
import { AnalogClockSvg, ConfettiBurst } from "./AvatarSvg";

interface ActiveGameRunnerProps {
  gameId: string;
  grade: Grade;
  builds: Record<string, number[][]>;
  onSaveBuild: (name: string, grid: number[][]) => void;
  onExit: () => void;
  onFinish: (score: number, total: number) => void;
}

export function ActiveGameRunner({
  gameId,
  grade,
  builds,
  onSaveBuild,
  onExit,
  onFinish,
}: ActiveGameRunnerProps) {
  const meta = GAMES.find((g) => g.id === gameId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top Game Bar with RPG Checkpoint & XP Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sfx.click();
              onExit();
            }}
            className="btn-glow px-4 py-2 rounded-xl glass text-sm font-bold text-slate-700 hover:text-slate-900 flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חֲזָרָה לְעֵץ הַמְּיוּמָנוּיוֹת</span>
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>{meta?.emoji}</span>
              <span>{meta?.title || "מִשְׂחַק לְמִידָה"}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {meta?.skills} · מוּתְאָם לְכִיתָּה {grade}׳
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-extrabold">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            🚩 צֶ&apos;קְפּוֹינְט פָּעִיל (Checkpoint)
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800">
            ✨ +XP וְשָׁלָל (Loot)
          </span>
        </div>
      </div>

      {gameId === "voice-read" && (
        <VoiceReadGame grade={grade} onFinish={onFinish} onExit={onExit} />
      )}
      {gameId === "balloon-pop" && (
        <BalloonPopGame grade={grade} onFinish={onFinish} onExit={onExit} />
      )}
      {gameId === "word-builder" && (
        <WordBuilderGame grade={grade} onFinish={onFinish} onExit={onExit} />
      )}
      {gameId === "science-lab" && (
        <ScienceLabGame grade={grade} onFinish={onFinish} onExit={onExit} />
      )}
      {gameId === "robot-path" && (
        <RobotPathGame grade={grade} onFinish={onFinish} onExit={onExit} />
      )}
      {gameId === "memory-match" && (
        <MemoryMatchGame grade={grade} onFinish={onFinish} onExit={onExit} />
      )}
      {gameId === "pixel-studio" && (
        <PixelLightStudio
          builds={builds}
          onSaveBuild={onSaveBuild}
          onFinish={onFinish}
        />
      )}
      {(gameId === "letters-quiz" ||
        gameId === "numbers-quiz" ||
        gameId === "words-quiz" ||
        gameId === "science-quiz") && (
        <StandardQuizGame
          gameId={gameId}
          grade={grade}
          onFinish={onFinish}
          onExit={onExit}
        />
      )}
    </div>
  );
}

/* ============================================================================
   1. STANDARD MULTI-MODAL QUIZ GAME WITH CHECKPOINTS & GROWTH MINDSET
   ============================================================================ */
function StandardQuizGame({
  gameId,
  grade,
  onFinish,
}: {
  gameId: string;
  grade: Grade;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
}) {
  const questions = getQuestionsForGame(gameId, grade);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checkpointMode, setCheckpointMode] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);

  const q = questions[idx];

  useEffect(() => {
    if (q?.speak) {
      speak(q.speak);
    }
  }, [idx, q]);

  const advanceQuestion = () => {
    if (idx + 1 < questions.length) {
      setIdx((i) => i + 1);
      setSelected(null);
      setCheckpointMode(false);
      setShowHint(false);
    } else {
      sfx.win();
      setDone(true);
    }
  };

  const handleAnswer = (optIndex: number) => {
    if (selected !== null) return;
    setSelected(optIndex);

    if (optIndex === q.answer) {
      sfx.correct();
      setScore((s) => s + 1);
      setXpEarned((x) => x + 25);
      setCheckpointMode(false);
      setTimeout(() => {
        advanceQuestion();
      }, 1050);
    } else {
      sfx.wrong();
      setShake(true);
      setCheckpointMode(true);
      setShowHint(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  const handleTryAgainFromCheckpoint = () => {
    sfx.click();
    setSelected(null);
    setCheckpointMode(false);
    setXpEarned((x) => x + 5); // Growth mindset effort XP!
  };

  if (done) {
    return (
      <div className="glass-strong rounded-3xl p-8 text-center max-w-xl mx-auto animate-pop">
        <ConfettiBurst active={true} />
        <div className="text-6xl mb-3">🆙🌟</div>
        <div className="inline-block px-3 py-1 rounded-xl bg-sky-100 text-sky-800 text-xs font-extrabold mb-2">
          QUEST COMPLETE · +{xpEarned + 30} XP!
        </div>
        <h3 className="text-3xl font-extrabold text-slate-900 mb-2">
          כָּל הַכָּבוֹד! עָלִיתָ בְּמַד הַנִּיסָּיוֹן!
        </h3>
        <p className="text-slate-600 mb-6">
          פִּיצַּחְתָּ{" "}
          <span className="text-sky-600 font-bold tabular-nums">{score}</span>{" "}
          מִתּוֹךְ{" "}
          <span className="text-sky-600 font-bold tabular-nums">
            {questions.length}
          </span>{" "}
          צֶ&apos;קְפּוֹינְטִים וְאָסַפְתָּ שָׁלָל כּוֹכְבֵי אוֹר וְ-XP!
        </p>
        <button
          onClick={() => onFinish(score, questions.length)}
          className="btn-glow px-8 py-3.5 rounded-xl bg-sky-600 text-white font-bold text-base whitespace-nowrap shadow-sm"
        >
          🎁 אִיסּוּף שָׁלָל (Loot), XP וְסִיּוּם
        </button>
      </div>
    );
  }

  return (
    <div
      className={`glass-strong rounded-3xl p-6 md:p-8 max-w-3xl mx-auto ${
        shake ? "animate-shake" : ""
      }`}
    >
      {/* Progress & Checkpoint Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 mb-3 tabular-nums font-bold">
        <span className="flex items-center gap-1.5">
          <span>🚩 צֶ&apos;קְפּוֹינְט (Checkpoint) {idx + 1} מִתּוֹךְ {questions.length}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sky-700">✨ +{xpEarned} XP</span>
          <span className="text-amber-600">שָׁלָל: {score * 10} ⭐</span>
        </div>
      </div>
      <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
          style={{ width: `${((idx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Visual Display */}
      {q.display && (
        <div className="my-5 p-6 rounded-2xl bg-white/85 border border-slate-200/80 flex items-center justify-center min-h-[140px]">
          {q.display.kind === "emoji" && (
            <span className="text-7xl select-none animate-bounce-soft">
              {q.display.value}
            </span>
          )}
          {q.display.kind === "big" && (
            <span
              className="text-4xl md:text-5xl font-bold text-sky-600 nikud tracking-wide"
              dir="ltr"
            >
              {q.display.value}
            </span>
          )}
          {q.display.kind === "clock" && (
            <AnalogClockSvg h={q.display.h} m={q.display.m} size={150} />
          )}
          {q.display.kind === "sequence" && (
            <div className="flex items-center gap-4" dir="ltr">
              {q.display.items.map((item, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-2xl font-bold text-slate-900 tabular-nums"
                >
                  {item}
                </div>
              ))}
            </div>
          )}
          {q.display.kind === "count" && (
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-md">
              {Array.from({ length: q.display.n }, (_, i) => {
                const val = q.display?.kind === "count" ? q.display.value : "⭐";
                return (
                  <span key={i} className="text-4xl animate-pop">
                    {val}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Question Prompt & Buff / Audio Buttons */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 nikud">
          {q.prompt}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => speak(q.speak || q.prompt)}
            className="btn-glow p-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-600"
            title="הַשְׁמָעָה בְּקוֹל"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          {q.hint && (
            <button
              onClick={() => {
                sfx.click();
                setShowHint((h) => !h);
              }}
              className="btn-glow px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5"
              title="הפעל באף רמז"
            >
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>בָּאף רֶמֶז (Buff)</span>
            </button>
          )}
        </div>
      </div>

      {showHint && q.hint && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold nikud animate-pop">
          ✨ <strong>בָּאף הַהֶסְבֵּר הַחָכָם (Buff):</strong> {q.hint}
        </div>
      )}

      {/* Checkpoint / Try Again Banner on Wrong Answer (Growth Mindset) */}
      {checkpointMode && (
        <div className="mb-5 p-4 rounded-2xl bg-sky-50 border-2 border-sky-300 flex flex-wrap items-center justify-between gap-3 animate-pop">
          <div className="space-y-0.5">
            <div className="text-xs font-extrabold text-sky-900 flex items-center gap-1.5">
              <span>🚩 נְקוּדַת שְׁמִירָה (Checkpoint) — לֹא פְּסִילַת מִשְׂחָק!</span>
            </div>
            <p className="text-xs text-slate-600 nikud">
              בְּגֵיימִינְג טָעוּת הִיא הִזְדַּמְּנוּת לִלְחוֹץ <strong>Try Again</strong> חֲכָמִים וּמְנוּסִּים יוֹתֵר (+5 XP עַל הַתְמָדָה)!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTryAgainFromCheckpoint}
              className="btn-glow px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-extrabold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>🔄 Try Again (נַסֵּה שֵׁנִית)</span>
            </button>
            <button
              type="button"
              onClick={advanceQuestion}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold"
            >
              הַמְשֵׁךְ הָלְאָה
            </button>
          </div>
        </div>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {q.options.map((opt, i) => {
          const isChosen = selected === i;
          const isRight = i === q.answer;
          let styleClass =
            "bg-white/85 hover:bg-white border-slate-200/90 text-slate-800";
          if (selected !== null) {
            if (!checkpointMode && isRight) {
              styleClass =
                "bg-emerald-50 border-emerald-400 text-emerald-900";
            } else if (isChosen) {
              styleClass = "bg-rose-50 border-rose-400 text-rose-900";
            }
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={`btn-glow p-4 rounded-2xl border text-lg font-bold transition-all text-right flex items-center justify-between nikud ${styleClass}`}
            >
              <span>{opt}</span>
              {selected !== null && !checkpointMode && isRight && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   2. VOICE READING & SYLLABLES GAME (קוראים בקול רם)
   ============================================================================ */
function VoiceReadGame({
  grade,
  onFinish,
}: {
  grade: Grade;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
}) {
  const isYoung = grade === "א" || grade === "ב";
  const words = isYoung
    ? VOICE_WORDS_BY_GRADE.young
    : VOICE_WORDS_BY_GRADE.older;

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [listening, setListening] = useState(false);
  const [heardText, setHeardText] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"idle" | "ok" | "try">("idle");

  const current = words[idx];

  const handleListen = async () => {
    sfx.click();
    setListening(true);
    setHeardText(null);
    const res = await listenOnce(5000);
    setListening(false);
    if (res && res.transcript) {
      setHeardText(res.transcript);
      const normHeard = normalizeHe(res.transcript);
      const normTarget = normalizeHe(current.plain);
      if (normHeard.includes(normTarget) || normTarget.includes(normHeard)) {
        handleSuccess();
      } else {
        sfx.wrong();
        setFeedback("try");
      }
    } else {
      setHeardText("קְרִיאָה קוֹלִית אוּשְׁרָה!");
      handleSuccess();
    }
  };

  const handleSuccess = () => {
    sfx.correct();
    setFeedback("ok");
    setScore((s) => s + 1);
    setTimeout(() => {
      if (idx + 1 < words.length) {
        setIdx((i) => i + 1);
        setFeedback("idle");
        setHeardText(null);
      } else {
        sfx.win();
        onFinish(score + 1, words.length);
      }
    }, 1100);
  };

  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-2xl mx-auto text-center">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4 tabular-nums font-semibold">
        <span>
          מִילָּה {idx + 1} מִתּוֹךְ {words.length}
        </span>
        <span className="text-amber-600">הַצְלָחוֹת: {score} ⭐</span>
      </div>

      <div className="text-7xl my-4 animate-bounce-soft">{current.emoji}</div>
      <div className="text-5xl md:text-6xl font-bold text-sky-600 nikud mb-4">
        {current.vocalized}
      </div>
      <p className="text-sm text-slate-600 mb-6 nikud">{current.hint}</p>

      {/* Syllable breakdown buttons */}
      <div className="mb-8">
        <p className="text-xs text-slate-500 mb-2">
          לִחֲצוּ עַל הַהֲבָרוֹת כְּדֵי לִשְׁמוֹעַ אוֹתָן:
        </p>
        <div className="flex items-center justify-center gap-3">
          {current.syllables.map((syl, i) => (
            <button
              key={i}
              onClick={() => {
                sfx.pop();
                speak(syl, 0.75);
              }}
              className="btn-glow px-5 py-3 rounded-2xl bg-white/90 border border-sky-200 text-2xl font-bold text-slate-900 nikud hover:bg-sky-50"
            >
              {syl}
            </button>
          ))}
        </div>
      </div>

      {heardText && (
        <div className="mb-4 text-sm text-emerald-700 font-bold">
          🎙️ זוּהָה: &quot;{heardText}&quot;
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => speak(current.vocalized, 0.8)}
          className="btn-glow px-5 py-3 rounded-xl bg-white border border-slate-200 text-sky-600 font-bold flex items-center gap-2 whitespace-nowrap"
        >
          <Volume2 className="w-5 h-5" />
          <span>הַשְׁמַע מִילָּה</span>
        </button>

        <button
          onClick={handleListen}
          disabled={listening || feedback === "ok"}
          className="btn-glow px-6 py-3 rounded-xl bg-sky-600 text-white font-bold flex items-center gap-2 whitespace-nowrap shadow-sm"
        >
          <Mic className="w-5 h-5" />
          <span>
            {listening
              ? "מַקְשִׁיב..."
              : canListen()
                ? "קְרָא בַּמִּיקְרוֹפוֹן"
                : "קָרָאתִי בְּקוֹל רָם!"}
          </span>
        </button>

        <button
          onClick={handleSuccess}
          disabled={feedback === "ok"}
          className="btn-glow px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center gap-2 whitespace-nowrap"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>הִצְלַחְתִּי לִקְרוֹא</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   3. FLOATING BALLOON MATH GAME (בלוני המספרים המרחפים)
   ============================================================================ */
function BalloonPopGame({
  grade,
  onFinish,
}: {
  grade: Grade;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
}) {
  const isYoung = grade === "א" || grade === "ב";
  const rounds = isYoung
    ? [
        { q: "4 + 5", ans: 9, opts: [7, 9, 11, 8] },
        { q: "10 - 3", ans: 7, opts: [6, 7, 8, 5] },
        { q: "6 + 6", ans: 12, opts: [10, 12, 14, 13] },
        { q: "15 - 5", ans: 10, opts: [9, 10, 5, 11] },
        { q: "8 + 7", ans: 15, opts: [14, 15, 16, 13] },
      ]
    : [
        { q: "6 × 7", ans: 42, opts: [36, 42, 48, 49] },
        { q: "54 ÷ 6", ans: 9, opts: [8, 9, 7, 6] },
        { q: "8 × 9", ans: 72, opts: [64, 72, 81, 63] },
        { q: "45 + 38", ans: 83, opts: [73, 83, 85, 78] },
        { q: "100 - 36", ans: 64, opts: [64, 74, 54, 66] },
      ];

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [popped, setPopped] = useState<number | null>(null);

  const cur = rounds[idx];
  const balloonColors = [
    "from-sky-400 to-blue-600",
    "from-pink-400 to-rose-500",
    "from-amber-400 to-orange-500",
    "from-emerald-400 to-teal-500",
  ];

  const handlePop = (val: number) => {
    if (popped !== null) return;
    setPopped(val);
    const right = val === cur.ans;
    if (right) {
      sfx.pop();
      sfx.correct();
      setScore((s) => s + 1);
    } else {
      sfx.wrong();
    }
    setTimeout(() => {
      if (idx + 1 < rounds.length) {
        setIdx((i) => i + 1);
        setPopped(null);
      } else {
        sfx.win();
        onFinish(score + (right ? 1 : 0), rounds.length);
      }
    }, 950);
  };

  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-3xl mx-auto text-center">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4 tabular-nums font-semibold">
        <span>
          סִיבּוּב {idx + 1} מִתּוֹךְ {rounds.length}
        </span>
        <span className="text-amber-600">בָּלוֹנִים שֶׁפּוֹצְצוּ נָכוֹן: {score} 🎈</span>
      </div>

      <p className="text-sm text-slate-600 mb-2">
        פּוֹצְצוּ אֶת הַבָּלוֹן שֶׁמַּצִּיג אֶת הַתּוֹצָאָה שֶׁל:
      </p>
      <div
        className="text-4xl md:text-5xl font-bold text-sky-600 mb-10 tabular-nums"
        dir="ltr"
      >
        {cur.q} = ?
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6">
        {cur.opts.map((val, i) => {
          const isPopped = popped === val;
          return (
            <div key={i} className="flex flex-col items-center">
              <button
                onClick={() => handlePop(val)}
                style={{ animationDelay: `${i * 0.35}s` }}
                className={`animate-balloon btn-glow w-28 h-34 rounded-full bg-gradient-to-b ${
                  balloonColors[i % balloonColors.length]
                } shadow-md flex items-center justify-center text-3xl font-extrabold text-white border-2 border-white/80 tabular-nums transition-transform ${
                  isPopped ? "scale-125 opacity-0" : ""
                }`}
              >
                {val}
              </button>
              <div className="w-0.5 h-8 bg-slate-300 -mt-1" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   4. WORD BUILDER GAME (בוני המילים הזוהרות)
   ============================================================================ */
function WordBuilderGame({
  grade,
  onFinish,
}: {
  grade: Grade;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
}) {
  const isYoung = grade === "א" || grade === "ב";
  const items = isYoung
    ? [
        { word: "שמש", emoji: "☀️", hint: "מְאִירָה בַּשָּׁמַיִם" },
        { word: "כוכב", emoji: "⭐", hint: "מְנַצְנֵץ בַּלַּיְלָה" },
        { word: "ירח", emoji: "🌙", hint: "מֵאִיר בַּחֲשֵׁכָה" },
        { word: "ספר", emoji: "📖", hint: "קוֹרְאִים בּוֹ סִיפּוּרִים" },
      ]
    : [
        { word: "חללית", emoji: "🚀", hint: "מַמְרִיאָה לֶחָלָל" },
        { word: "גלקסיה", emoji: "🌌", hint: "מִילְיַארְדֵי כּוֹכָבִים יַחַד" },
        { word: "מעבדה", emoji: "🔬", hint: "מְקוֹם עֲרִיכַת הַנִּיסּוּיִים" },
        { word: "טלסקופ", emoji: "🔭", hint: "צוֹפִים בּוֹ בַּכּוֹכָבִים" },
      ];

  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [pickedIndices, setPickedIndices] = useState<number[]>([]);

  const cur = items[idx];
  const scrambled = React.useMemo(() => {
    const chars = cur.word.split("").map((ch, originalIdx) => ({ ch, originalIdx }));
    return [...chars].reverse().map((item, i, arr) =>
      i % 2 === 0 && i + 1 < arr.length ? arr[i + 1] : i % 2 === 1 ? arr[i - 1] : item,
    );
  }, [cur.word]);

  const builtWord = pickedIndices.map((pi) => scrambled[pi].ch).join("");

  const handlePickTile = (tileIdx: number) => {
    if (pickedIndices.includes(tileIdx)) return;
    sfx.place();
    const next = [...pickedIndices, tileIdx];
    setPickedIndices(next);

    if (next.length === scrambled.length) {
      const candidate = next.map((pi) => scrambled[pi].ch).join("");
      if (candidate === cur.word) {
        sfx.correct();
        speak(cur.word);
        setScore((s) => s + 1);
        setTimeout(() => {
          if (idx + 1 < items.length) {
            setIdx((i) => i + 1);
            setPickedIndices([]);
          } else {
            sfx.win();
            onFinish(score + 1, items.length);
          }
        }, 1000);
      } else {
        sfx.wrong();
        setTimeout(() => setPickedIndices([]), 650);
      }
    }
  };

  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-2xl mx-auto text-center">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-4 tabular-nums font-semibold">
        <span>
          מִילָּה {idx + 1} מִתּוֹךְ {items.length}
        </span>
        <span className="text-amber-600">הַצְלָחוֹת: {score} 🧩</span>
      </div>

      <div className="text-6xl my-3">{cur.emoji}</div>
      <p className="text-base text-slate-600 mb-6 nikud">{cur.hint}</p>

      {/* Answer slots */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        {cur.word.split("").map((_, slotIdx) => {
          const char = builtWord[slotIdx] || "";
          return (
            <div
              key={slotIdx}
              className="w-14 h-14 rounded-2xl bg-white border-2 border-sky-300 flex items-center justify-center text-2xl font-bold text-sky-700 shadow-xs"
            >
              {char}
            </div>
          );
        })}
      </div>

      {/* Scrambled letter buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {scrambled.map((tile, tIdx) => {
          const used = pickedIndices.includes(tIdx);
          return (
            <button
              key={tIdx}
              onClick={() => handlePickTile(tIdx)}
              disabled={used}
              className={`btn-glow w-14 h-14 rounded-2xl text-2xl font-bold transition-all ${
                used
                  ? "bg-slate-100 text-slate-300 border border-slate-200 scale-90"
                  : "bg-pink-50 border-2 border-pink-300 text-pink-800 hover:bg-pink-100"
              }`}
            >
              {tile.ch}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => {
            sfx.click();
            setPickedIndices([]);
          }}
          className="btn-glow px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>נַקֵּה אוֹתִיּוֹת</span>
        </button>
        <button
          onClick={() => speak(cur.word)}
          className="btn-glow px-4 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-700 flex items-center gap-1.5"
        >
          <Volume2 className="w-4 h-4" />
          <span>הַשְׁמַע רֶמֶז קוֹלִי</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   5. SCIENCE LAB SIMULATION (מעבדת המדע ומצבי הצבירה)
   ============================================================================ */
function ScienceLabGame({
  onFinish,
}: {
  grade: Grade;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
}) {
  const [temp, setTemp] = useState<number>(25);
  const [planetIdx, setPlanetIdx] = useState<number>(0);
  const [tasksCompleted, setTasksCompleted] = useState<string[]>([]);

  const stateOfMatter =
    temp <= 0 ? "solid" : temp >= 100 ? "gas" : "liquid";

  const planets = [
    { name: "כַּדּוּר הָאָרֶץ", gravity: 1.0, jumpHeight: 45, emoji: "🌍" },
    { name: "הַיָּרֵחַ", gravity: 0.16, jumpHeight: 92, emoji: "🌙" },
    { name: "מַאֲדִים", gravity: 0.38, jumpHeight: 74, emoji: "🔴" },
    { name: "צֶדֶק (יוּפִּיטֶר)", gravity: 2.5, jumpHeight: 18, emoji: "🪐" },
  ];

  const handleTempChange = (val: number) => {
    setTemp(val);
    if (val <= 0 && !tasksCompleted.includes("freeze")) {
      sfx.correct();
      setTasksCompleted((prev) => [...prev, "freeze"]);
    }
    if (val >= 100 && !tasksCompleted.includes("boil")) {
      sfx.correct();
      setTasksCompleted((prev) => [...prev, "boil"]);
    }
  };

  const handlePlanetSelect = (idx: number) => {
    sfx.click();
    setPlanetIdx(idx);
    if (!tasksCompleted.includes("gravity")) {
      setTasksCompleted((prev) => [...prev, "gravity"]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      <div className="lg:col-span-7 glass-strong rounded-3xl p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">
            תָּא הַנִּיסּוּיִים: מַצְּבֵי צְבִירָה שֶׁל מַיִם (H₂O)
          </h3>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-lg border ${
              stateOfMatter === "solid"
                ? "bg-sky-50 border-sky-200 text-sky-800"
                : stateOfMatter === "liquid"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            {stateOfMatter === "solid"
              ? "❄ מוּצָק (קֶרַח)"
              : stateOfMatter === "liquid"
                ? "💧 נוֹזֵל (מַיִם)"
                : "☁ גַּז (אֵדֵי מַיִם)"}
          </span>
        </div>

        {/* Particle Chamber Visual */}
        <div className="relative h-64 rounded-2xl bg-gradient-to-b from-sky-50/90 to-white/95 border border-slate-200/90 overflow-hidden flex items-center justify-center p-6">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 15 }, (_, i) => {
              const animClass =
                stateOfMatter === "solid"
                  ? "scale-95"
                  : stateOfMatter === "liquid"
                    ? "animate-bounce-soft"
                    : "animate-float -translate-y-3 scale-110";
              const colorClass =
                stateOfMatter === "solid"
                  ? "bg-sky-400 text-white"
                  : stateOfMatter === "liquid"
                    ? "bg-blue-500 text-white"
                    : "bg-amber-400 text-slate-950";
              return (
                <div
                  key={i}
                  style={{ animationDelay: `${(i % 5) * 0.15}s` }}
                  className={`w-9 h-9 rounded-full shadow-xs transition-all duration-500 flex items-center justify-center text-[10px] font-bold ${animClass} ${colorClass}`}
                >
                  H₂O
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-3 right-4 text-xs font-bold text-slate-500 tabular-nums">
            טֶמְפֵּרָטוּרָה נוֹכְחִית: {temp}°C
          </div>
        </div>

        {/* Gravity Mini-Simulator */}
        <div className="mt-6 pt-5 border-t border-slate-200/80">
          <h4 className="text-base font-bold text-slate-900 mb-3">
            סִימוּלָטוֹר כּוֹחַ הַמְּשִׁיכָה בְּמַעֲרֶכֶת הַשֶּׁמֶשׁ
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            {planets.map((p, i) => (
              <button
                key={p.name}
                onClick={() => handlePlanetSelect(i)}
                className={`btn-glow p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${
                  planetIdx === i
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                    : "bg-white/80 border-slate-200 text-slate-700"
                }`}
              >
                <span className="text-2xl">{p.emoji}</span>
                <span>{p.name}</span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  כְּבִידָה: {p.gravity}g
                </span>
              </button>
            ))}
          </div>
          <div className="p-3.5 rounded-xl bg-white/85 border border-slate-200/80 text-xs text-slate-700 flex items-center justify-between">
            <span>
              בְּ<strong>{planets[planetIdx].name}</strong> אסטרונאוט יקפוץ לגובה יחסי של:
            </span>
            <span className="text-emerald-700 font-bold text-sm tabular-nums">
              {planets[planetIdx].jumpHeight} ס״מ
            </span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 glass-strong rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            לוּחַ בְּקָרָה וּמְשִׂימוֹת חֵקֶר
          </h3>

          <div className="mb-6 p-4 rounded-2xl bg-white/85 border border-slate-200/80">
            <div className="flex items-center justify-between text-sm font-bold text-slate-800 mb-2">
              <label htmlFor="temp-slider">וַסָּת טֶמְפֵּרָטוּרָה:</label>
              <span className="text-sky-600 tabular-nums">{temp}°C</span>
            </div>
            <input
              id="temp-slider"
              type="range"
              min={-30}
              max={130}
              value={temp}
              onChange={(e) => handleTempChange(Number(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1 tabular-nums">
              <span>-30°C (קִפָּאוֹן)</span>
              <span>0°C</span>
              <span>100°C (רְתִיחָה)</span>
            </div>
          </div>

          <div className="space-y-2.5 mb-6">
            <p className="text-xs font-bold text-slate-700">
              הַשְׁלִימוּ אֶת 3 מְשִׂימוֹת הַמַּעְבָּדָה:
            </p>
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                tasksCompleted.includes("freeze")
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                  : "bg-white/80 border-slate-200 text-slate-600"
              }`}
            >
              <span>1. הַקְפִּיאוּ אֶת הַמַּיִם לְקֶרַח (0°C אוֹ פָּחוֹת)</span>
              <span>{tasksCompleted.includes("freeze") ? "✓ בּוּצַע" : "מַמְתִּין"}</span>
            </div>
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                tasksCompleted.includes("boil")
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                  : "bg-white/80 border-slate-200 text-slate-600"
              }`}
            >
              <span>2. הַרְתִּיחוּ אֶת הַמַּיִם לְאֵדִים (100°C אוֹ יוֹתֵר)</span>
              <span>{tasksCompleted.includes("boil") ? "✓ בּוּצַע" : "מַמְתִּין"}</span>
            </div>
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                tasksCompleted.includes("gravity")
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                  : "bg-white/80 border-slate-200 text-slate-600"
              }`}
            >
              <span>3. בִּדְקוּ אֶת כּוֹחַ הַמְּשִׁיכָה בְּכּוֹכַב לֶכֶת נוֹסָף</span>
              <span>{tasksCompleted.includes("gravity") ? "✓ בּוּצַע" : "מַמְתִּין"}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sfx.win();
            onFinish(Math.max(1, tasksCompleted.length), 3);
          }}
          className="btn-glow w-full py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm"
        >
          סִיּוּם נִיסּוּי וְקַבָּלַת כּוֹכְבֵי מַדָּע ({tasksCompleted.length}/3)
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   6. ROBOT LOGIC PATH GAME (מסלול רובוט האור)
   ============================================================================ */
function RobotPathGame({
  onFinish,
}: {
  grade: Grade;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
}) {
  const levels = [
    {
      size: 4,
      start: [0, 0],
      goal: [0, 3],
      rocks: [
        [0, 1],
        [1, 3],
      ],
    },
    {
      size: 4,
      start: [0, 0],
      goal: [3, 3],
      rocks: [
        [1, 0],
        [1, 1],
        [2, 3],
      ],
    },
  ];

  const [lvlIdx, setLvlIdx] = useState(0);
  const [commands, setCommands] = useState<Array<"U" | "D" | "L" | "R">>([]);
  const [robotPos, setRobotPos] = useState<[number, number]>(
    levels[0].start as [number, number],
  );
  const [status, setStatus] = useState<"planning" | "running" | "won" | "hit">(
    "planning",
  );

  const lvl = levels[lvlIdx];

  const addCmd = (dir: "U" | "D" | "L" | "R") => {
    if (status !== "planning" || commands.length >= 10) return;
    sfx.click();
    setCommands((prev) => [...prev, dir]);
  };

  const runProgram = () => {
    if (commands.length === 0) return;
    setStatus("running");
    let r = lvl.start[0];
    let c = lvl.start[1];
    setRobotPos([r, c]);

    commands.forEach((cmd, stepIdx) => {
      setTimeout(() => {
        if (cmd === "U") r = Math.max(0, r - 1);
        if (cmd === "D") r = Math.min(lvl.size - 1, r + 1);
        if (cmd === "L") c = Math.max(0, c - 1);
        if (cmd === "R") c = Math.min(lvl.size - 1, c + 1);

        setRobotPos([r, c]);
        sfx.place();

        const hitRock = lvl.rocks.some(([rr, rc]) => rr === r && rc === c);
        if (hitRock) {
          sfx.wrong();
          setStatus("hit");
          return;
        }

        if (stepIdx === commands.length - 1) {
          if (r === lvl.goal[0] && c === lvl.goal[1]) {
            sfx.win();
            setStatus("won");
            setTimeout(() => {
              if (lvlIdx + 1 < levels.length) {
                const nextLvl = levels[lvlIdx + 1];
                setLvlIdx((i) => i + 1);
                setCommands([]);
                setRobotPos(nextLvl.start as [number, number]);
                setStatus("planning");
              } else {
                onFinish(levels.length, levels.length);
              }
            }, 1000);
          } else {
            sfx.wrong();
            setStatus("hit");
          }
        }
      }, (stepIdx + 1) * 420);
    });
  };

  const resetLevel = () => {
    sfx.click();
    setCommands([]);
    setRobotPos(lvl.start as [number, number]);
    setStatus("planning");
  };

  const dirLabels: Record<"U" | "D" | "L" | "R", string> = {
    U: "⬆️ לְמַעְלָה",
    D: "⬇️ לְמַטָּה",
    R: "➡️ יָמִינָה",
    L: "⬅️ שְׂמֹאלָה",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-4xl mx-auto">
      <div className="md:col-span-6 glass-strong rounded-3xl p-6 flex flex-col items-center">
        <div className="text-sm font-bold text-slate-700 mb-4">
          שָׁלָב {lvlIdx + 1} מִתּוֹךְ {levels.length}: הוֹבִילוּ אֶת 🤖 אֶל 💎
        </div>
        <div
          className="grid grid-cols-4 gap-2.5 p-3 rounded-2xl bg-white/85 border border-slate-200"
          dir="ltr"
        >
          {Array.from({ length: lvl.size * lvl.size }, (_, idx) => {
            const r = Math.floor(idx / lvl.size);
            const c = idx % lvl.size;
            const isRobot = robotPos[0] === r && robotPos[1] === c;
            const isGoal = lvl.goal[0] === r && lvl.goal[1] === c;
            const isRock = lvl.rocks.some(([rr, rc]) => rr === r && rc === c);

            return (
              <div
                key={idx}
                className="w-16 h-16 rounded-xl bg-sky-50/70 border border-slate-200 flex items-center justify-center text-3xl"
              >
                {isRobot ? "🤖" : isGoal ? "💎" : isRock ? "☄️" : ""}
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-6 glass-strong rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">
            בִּחֲרוּ פְּקוּדוֹת תְּנוּעָה:
          </h3>
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {(["U", "D", "R", "L"] as const).map((d) => (
              <button
                key={d}
                onClick={() => addCmd(d)}
                className="btn-glow p-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-900 font-bold text-sm hover:bg-violet-100"
              >
                {dirLabels[d]}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 mb-2">
            תּוֹר הַפְּקוּדוֹת שֶׁלָּכֶם ({commands.length}/10):
          </p>
          <div className="min-h-[68px] p-3 rounded-xl bg-white/85 border border-slate-200 flex flex-wrap gap-2 mb-4">
            {commands.map((c, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-violet-100 text-xs font-bold text-violet-900"
              >
                {i + 1}. {dirLabels[c].split(" ")[0]}
              </span>
            ))}
          </div>

          {status === "hit" && (
            <p className="text-xs text-rose-600 font-bold mb-3">
              הָרוֹבּוֹט לֹא הִגִּיעַ לַגְּבִישׁ! לִחֲצוּ עַל אִיפּוּס וְנַסּוּ שׁוּב.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runProgram}
            disabled={commands.length === 0 || status === "running"}
            className="btn-glow flex-1 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <Play className="w-4 h-4" />
            <span>הַפְעֵל רוֹבּוֹט</span>
          </button>
          <button
            onClick={resetLevel}
            className="btn-glow px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>אִיפּוּס</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   7. MEMORY MATCH FLIP GAME (זיכרון גלקטי)
   ============================================================================ */
function MemoryMatchGame({
  onFinish,
}: {
  grade: Grade;
  onFinish: (score: number, total: number) => void;
  onExit: () => void;
}) {
  const pairs = [
    { id: 1, a: "אוֹר ☀️", b: "חוֹשֶׁךְ 🌙" },
    { id: 2, a: "חַם 🔥", b: "קַר 🧊" },
    { id: 3, a: "3 × 4", b: "12" },
    { id: 4, a: "כַּדּוּר הָאָרֶץ", b: "🌍" },
  ];

  const deck = React.useMemo(() => {
    const raw = pairs.flatMap((p) => [
      { uid: `${p.id}-a`, pairId: p.id, label: p.a },
      { uid: `${p.id}-b`, pairId: p.id, label: p.b },
    ]);
    return [raw[2], raw[5], raw[0], raw[7], raw[4], raw[1], raw[6], raw[3]];
  }, []);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);

  const handleCardClick = (index: number) => {
    if (
      flipped.length === 2 ||
      flipped.includes(index) ||
      matched.includes(deck[index].pairId)
    ) {
      return;
    }
    sfx.flip();
    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      const first = deck[next[0]];
      const second = deck[next[1]];
      if (first.pairId === second.pairId) {
        sfx.correct();
        const nextMatched = [...matched, first.pairId];
        setMatched(nextMatched);
        setFlipped([]);
        if (nextMatched.length === pairs.length) {
          sfx.win();
          setTimeout(() => onFinish(pairs.length, pairs.length), 800);
        }
      } else {
        setTimeout(() => setFlipped([]), 850);
      }
    }
  };

  return (
    <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-3xl mx-auto text-center">
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        מִצְאוּ אֶת כָּל הַזּוּגוֹת הַמַּתְאִימִים ({matched.length}/{pairs.length})
      </h3>
      <p className="text-xs text-slate-500 mb-6">
        הַתְאִימוּ בֵּין הֲפָכִים, תַּרְגִּילִים וְסְמָלִים!
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {deck.map((card, i) => {
          const isOpen =
            flipped.includes(i) || matched.includes(card.pairId);
          return (
            <button
              key={card.uid}
              onClick={() => handleCardClick(i)}
              className={`flip-card h-28 cursor-pointer ${
                isOpen ? "flipped" : ""
              }`}
            >
              <div className="flip-inner">
                <div className="flip-face bg-gradient-to-br from-sky-100 to-indigo-100 border border-sky-200 text-3xl text-sky-600 shadow-xs">
                  ✦
                </div>
                <div className="flip-face flip-back bg-white border-2 border-sky-400 text-slate-900 font-bold text-lg px-2 nikud shadow-sm">
                  {card.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
   8. PIXEL-LIGHT & MUSIC STUDIO (סטודיו פיקסל-אור ומוזיקה)
   ============================================================================ */
function PixelLightStudio({
  builds,
  onSaveBuild,
  onFinish,
}: {
  builds: Record<string, number[][]>;
  onSaveBuild: (name: string, grid: number[][]) => void;
  onFinish: (score: number, total: number) => void;
}) {
  const palette = [
    { id: 0, hex: "#f8fafc", label: "מַחַק" },
    { id: 1, hex: "#0ea5e9", label: "תכלת", freq: 523.25 },
    { id: 2, hex: "#ec4899", label: "ורוד", freq: 587.33 },
    { id: 3, hex: "#f59e0b", label: "זהב", freq: 659.25 },
    { id: 4, hex: "#10b981", label: "ירוק", freq: 783.99 },
    { id: 5, hex: "#8b5cf6", label: "סגול", freq: 880.0 },
  ];

  const [grid, setGrid] = useState<number[][]>(() =>
    Array.from({ length: 8 }, () => Array(8).fill(0)),
  );
  const [activeColor, setActiveColor] = useState<number>(1);
  const [artName, setArtName] = useState("כּוֹכַב הָאוֹר שֶׁלִּי");

  const paintCell = (r: number, c: number) => {
    const chosen = palette[activeColor];
    if (chosen?.freq) {
      tone(chosen.freq, 0.12, "sine", 0.12);
    } else {
      sfx.click();
    }
    setGrid((prev) =>
      prev.map((row, ri) =>
        ri === r ? row.map((val, ci) => (ci === c ? activeColor : val)) : row,
      ),
    );
  };

  const playMelodyFromArt = () => {
    let step = 0;
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell > 0) {
          const freq = palette[cell]?.freq || 523.25;
          tone(freq, 0.14, "triangle", 0.12, step * 0.11);
          step++;
        }
      });
    });
  };

  const handleSave = () => {
    if (!artName.trim()) return;
    sfx.win();
    onSaveBuild(artName.trim(), grid);
    onFinish(5, 5);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-4xl mx-auto">
      <div className="md:col-span-7 glass-strong rounded-3xl p-6 flex flex-col items-center">
        <div
          className="grid grid-cols-8 gap-1.5 p-3 rounded-2xl bg-white/90 border border-slate-200"
          dir="ltr"
        >
          {grid.map((row, r) =>
            row.map((val, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => paintCell(r, c)}
                style={{
                  backgroundColor:
                    val > 0 ? palette[val]?.hex : "#f1f5f9",
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-slate-200 transition-transform hover:scale-105 cursor-pointer"
                aria-label={`משבצת ${r + 1},${c + 1}`}
              />
            )),
          )}
        </div>
      </div>

      <div className="md:col-span-5 glass-strong rounded-3xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">
            פָּלֶטַת צְבָעִים וּצְלִילִים
          </h3>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {palette.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  sfx.click();
                  setActiveColor(p.id);
                }}
                className={`btn-glow p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  activeColor === p.id
                    ? "border-sky-500 bg-sky-50 text-slate-900"
                    : "border-slate-200 bg-white/80 text-slate-600"
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 border border-slate-300"
                  style={{
                    backgroundColor: p.hex,
                  }}
                />
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          <label className="block text-xs text-slate-600 font-semibold mb-1.5">
            שֵׁם הַיְּצִירָה:
          </label>
          <input
            type="text"
            value={artName}
            onChange={(e) => setArtName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm mb-4"
          />

          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={playMelodyFromArt}
              className="btn-glow flex-1 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-800 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>נַגֵּן אֶת הַצִּיּוּר</span>
            </button>
            <button
              onClick={() => {
                sfx.click();
                setGrid(Array.from({ length: 8 }, () => Array(8).fill(0)));
              }}
              className="btn-glow px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>נַקֵּה</span>
            </button>
          </div>

          {Object.keys(builds).length > 0 && (
            <div className="text-xs text-slate-500 mb-3">
              יְצִירוֹת שְׁמוּרוֹת בַּגָּלֶרְיָה: {Object.keys(builds).length}
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="btn-glow w-full py-3.5 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <Save className="w-4 h-4" />
          <span>שְׁמוֹר יְצִירָה וְקַבֵּל כּוֹכָבִים</span>
        </button>
      </div>
    </div>
  );
}
