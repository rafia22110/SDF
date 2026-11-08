import React, { useState } from "react";
import { Award, ShoppingBag, UserCheck } from "lucide-react";
import { Grade, Profile } from "../types";
import {
  ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_SHAPES,
  BADGES,
  GRADES,
} from "../data/content";
import { sfx } from "../audio";
import { AvatarSvg } from "./AvatarSvg";

interface ProfileModalProps {
  profile: Profile;
  onUpdateProfile: (next: Profile) => void;
  onClose: () => void;
}

export function ProfileModal({
  profile,
  onUpdateProfile,
  onClose,
}: ProfileModalProps) {
  const [name, setName] = useState(profile.name);
  const [grade, setGrade] = useState<Grade>(profile.grade);
  const [shape, setShape] = useState(profile.avatar.shape);
  const [color, setColor] = useState(profile.avatar.color);
  const [accessory, setAccessory] = useState<string | null>(
    profile.avatar.accessory,
  );

  const handleBuyOrEquip = (accId: string, price: number) => {
    const owned = profile.ownedAccessories.includes(accId);
    if (owned) {
      sfx.click();
      const nextAcc = accessory === accId ? null : accId;
      setAccessory(nextAcc);
      onUpdateProfile({
        ...profile,
        name,
        grade,
        avatar: { shape, color, accessory: nextAcc },
      });
    } else if (profile.stars >= price) {
      sfx.win();
      setAccessory(accId);
      onUpdateProfile({
        ...profile,
        name,
        grade,
        stars: profile.stars - price,
        ownedAccessories: [...profile.ownedAccessories, accId],
        avatar: { shape, color, accessory: accId },
      });
    } else {
      sfx.wrong();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.correct();
    onUpdateProfile({
      ...profile,
      name: name.trim() || profile.name,
      grade,
      avatar: { shape, color, accessory },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-3xl w-full border border-white animate-pop my-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <AvatarSvg config={{ shape, color, accessory }} size={64} />
            <div>
              <h3 className="text-2xl font-bold text-slate-900 nikud">{name}</h3>
              <p className="text-xs text-slate-600">
                כִּיתָּה {grade}׳ · כּוֹכָבִים זְמִינִים:{" "}
                <strong className="text-amber-600 tabular-nums">
                  {profile.stars} ⭐
                </strong>{" "}
                · רֶצֶף יָמִים:{" "}
                <strong className="text-sky-600 tabular-nums">
                  {profile.streak} 🔥
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold"
          >
            סְגוֹר ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Name & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-600 font-semibold mb-1">
                הַשֵּׁם שֶׁלִּי:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 font-semibold mb-1">
                בְּחִירַת כִּיתָּה (מַתְאִים אֶת רָמַת הַמִּשְׂחָקִים):
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {GRADES.map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => {
                      sfx.click();
                      setGrade(g);
                    }}
                    className={`py-2 rounded-xl font-bold text-sm border ${
                      grade === g
                        ? "bg-sky-600 text-white border-sky-600"
                        : "bg-white/80 text-slate-700 border-slate-200 hover:bg-white"
                    }`}
                  >
                    {g}׳
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Shape & Color Customizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-600 font-semibold mb-2">
                דְּמוּת הָאוֹר שֶׁלִּי:
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_SHAPES.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => {
                      sfx.click();
                      setShape(s.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      shape === s.id
                        ? "bg-sky-50 border-sky-400 text-sky-900"
                        : "bg-white/80 border-slate-200 text-slate-700"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-600 font-semibold mb-2">
                צֶבַע חֲלִיפַת הֶחָלָל:
              </label>
              <div className="flex items-center gap-2.5">
                {AVATAR_COLORS.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      sfx.click();
                      setColor(c.id);
                    }}
                    style={{ backgroundColor: c.hex }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      color === c.id
                        ? "border-slate-900 scale-115"
                        : "border-white"
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Star Accessory Shop */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <span>חֲנוּת אֲבִיזְרֵי הַכּוֹכָבִים:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {ACCESSORIES.map((acc) => {
                const owned = profile.ownedAccessories.includes(acc.id);
                const equipped = accessory === acc.id;
                return (
                  <button
                    type="button"
                    key={acc.id}
                    onClick={() => handleBuyOrEquip(acc.id, acc.price)}
                    className={`btn-glow p-3 rounded-2xl border text-center flex flex-col items-center gap-1 ${
                      equipped
                        ? "bg-amber-50 border-amber-400 text-slate-900"
                        : owned
                          ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                          : "bg-white/80 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-2xl">{acc.emoji}</span>
                    <span className="text-xs font-bold nikud">{acc.name}</span>
                    <span className="text-[11px] font-semibold text-amber-600 tabular-nums">
                      {equipped
                        ? "מוּלְבָּשׁ ✓"
                        : owned
                          ? "בִּרְשׁוּתְךָ"
                          : `${acc.price} ⭐`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Badges Showcase */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              <span>עִיטּוּרֵי הַכָּבוֹד שֶׁלִּי:</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BADGES.map((b) => {
                const unlocked = profile.badges.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                      unlocked
                        ? "bg-sky-50/90 border-sky-200 text-slate-900"
                        : "bg-white/50 border-slate-200/60 text-slate-400 opacity-65"
                    }`}
                  >
                    <span className="text-2xl">{b.icon}</span>
                    <div>
                      <div className="text-xs font-bold nikud">{b.name}</div>
                      <div className="text-[11px] text-slate-500 nikud">
                        {b.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="btn-glow px-6 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm flex items-center gap-2 shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>שְׁמוֹר פְּרוֹפִיל וַחֲזוֹר</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
