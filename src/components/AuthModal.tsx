import React, { useState } from "react";
import {
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
  LogOut,
  KeyRound,
} from "lucide-react";
import { Grade, Profile, UserRole } from "../types";
import { GRADES } from "../data/content";
import {
  RegisteredAccount,
  logoutPocketBase,
  registerOrLoginPocketBase,
} from "../services/pocketbaseService";
import { sfx } from "../audio";

interface AuthModalProps {
  profile: Profile;
  account: RegisteredAccount | null;
  onSuccess: (account: RegisteredAccount) => void;
  onLogout: () => void;
  onClose: () => void;
}

export function AuthModal({
  profile,
  account,
  onSuccess,
  onLogout,
  onClose,
}: AuthModalProps) {
  const [role, setRole] = useState<UserRole>(
    account?.role || profile.role || "student",
  );
  const [name, setName] = useState(account?.name || profile.name || "");
  const [email, setEmail] = useState(account?.email || "");
  const [password, setPassword] = useState("");
  const [grade, setGrade] = useState<Grade>(
    account?.grade || profile.grade || "ב",
  );
  const [classCode, setClassCode] = useState(
    account?.class_code || profile.classCode || "אור-2026",
  );
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const { account: saved, syncedToBackend } =
        await registerOrLoginPocketBase({
          name: name.trim() || profile.name,
          email: email.trim(),
          password: password.trim() || undefined,
          role,
          grade,
          classCode: role === "student" ? classCode : "",
          currentProfile: profile,
        });
      sfx.win();
      setFeedback(
        syncedToBackend
          ? "הרישום החינמי הושלם וסונכרן בהצלחה לשרת PocketBase!"
          : "הרישום החינמי הושלם בהצלחה (plan: free_registered)!",
      );
      onSuccess(saved);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-xl w-full border-2 border-sky-300 shadow-2xl animate-pop my-6 space-y-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-extrabold">
                חִינָּם לְגַמְרֵי בְּרִישׁוּם בִּלְבַד · plan: free_registered
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1 nikud">
                כְּנִיסָה וְרִישׁוּם מָהִיר לְאִיֵּי אוֹר
              </h3>
              <p className="text-xs text-slate-600">
                הַפְרָדַת הַרְשָׁאוֹת בְּטוּחָה (תַּלְמִיד / מוֹרֶה / הוֹרֶה) וּפְתִיחַת אִיֵּי חֲנֻכָּה וְחוֹרֶף!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector: Student vs Teacher vs Parent */}
        <div className="space-y-2">
          <label className="block text-xs font-extrabold text-slate-700">
            1. בִּחֲרוּ אֶת הַתַּפְקִיד שֶׁלָּכֶם בַּמַּעֲרֶכֶת:
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {(
              [
                {
                  id: "student",
                  title: "תַּלְמִיד / תַּלְמִידָה",
                  sub: "מִשְׂחָקִים, אִיִּים וּכְתַב חִידָה",
                  icon: Sparkles,
                },
                {
                  id: "teacher",
                  title: "מוֹרֶה / מוֹרָה",
                  sub: "גִּישָׁה לְנִיהוּל כִּיתָּה וּמְשִׂימוֹת",
                  icon: GraduationCap,
                },
                {
                  id: "parent",
                  title: "הוֹרֶה",
                  sub: "מַעֲקָב הִתְקַדְּמוּת וְתִרְגּוּל בַּבַּיִת",
                  icon: Users,
                },
              ] as const
            ).map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setRole(r.id);
                  }}
                  className={`p-3 rounded-2xl border-2 text-right transition-all flex flex-col gap-1 ${
                    active
                      ? "bg-sky-50 border-sky-600 text-sky-950 shadow-xs"
                      : "bg-white/85 border-slate-200 text-slate-700 hover:bg-white"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "text-sky-600" : "text-slate-400"
                    }`}
                  />
                  <span className="text-xs font-extrabold nikud">{r.title}</span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {r.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                שֵׁם פְּרָטִי / כִּינּוּי:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="למשל: אורי / המורה דנה"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                כְּתוֹבֶת אִימֵייל (לִשְׁמִירַת הַהִתְקַדְּמוּת):
              </label>
              <input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.edu"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                כִּיתָּה:
              </label>
              <div className="grid grid-cols-6 gap-1">
                {GRADES.map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`py-2 rounded-xl font-extrabold text-xs border ${
                      grade === g
                        ? "bg-sky-600 text-white border-sky-600"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    {g}׳
                  </button>
                ))}
              </div>
            </div>

            {role === "student" ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  קוֹד כִּיתָּה (אוֹפְּצְיוֹנָלִי — מֵהַמּוֹרֶה):
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="למשל: אור-2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                  <span>סִיסְמָה (אוֹפְּצְיוֹנָלִי לְ-PocketBase):</span>
                </label>
                <input
                  type="password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="לפחות 8 תווים (אופציונלי)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900"
                />
              </div>
            )}
          </div>

          {feedback && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-900">
              {feedback}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
            {account ? (
              <button
                type="button"
                onClick={() => {
                  logoutPocketBase();
                  onLogout();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>הִתְנַתֵּק מֵחֶשְׁבּוֹן ({account.email})</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-500">
                🔒 לְלֹא פִּרְסוֹמוֹת · מוּתְאָם לִילָדִים וּבָתֵּי סֵפֶר
              </span>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-glow px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {busy
                  ? "שׁוֹמֵר וּמְסַנְכְּרֵן..."
                  : "אִישּׁוּר וּכְנִיסָה חִינָּמִית לְאִיֵּי אוֹר"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
