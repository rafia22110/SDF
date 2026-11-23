import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Flame,
  Gift,
  Lock,
  Play,
  Snowflake,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  FALLBACK_SEASONAL_ISLANDS,
  RegisteredAccount,
  SeasonalIslandRecord,
  SeasonalQuestItem,
  fetchSeasonalIslands,
  getCompletedSeasonalQuests,
  markSeasonalQuestCompleted,
} from "../services/pocketbaseService";
import { sfx, speak } from "../audio";

interface SeasonalIslandsSectionProps {
  account: RegisteredAccount | null;
  onRequireAuth: () => void;
  onLaunchSeasonalQuest: (
    quest: SeasonalQuestItem,
    island: SeasonalIslandRecord,
  ) => void;
}

export function SeasonalIslandsSection({
  account,
  onRequireAuth,
  onLaunchSeasonalQuest,
}: SeasonalIslandsSectionProps) {
  const [islands, setIslands] = useState<SeasonalIslandRecord[]>(
    FALLBACK_SEASONAL_ISLANDS,
  );
  const [activeSlug, setActiveSlug] = useState<string>("hanukkah-2026");
  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    getCompletedSeasonalQuests(),
  );

  useEffect(() => {
    fetchSeasonalIslands().then((list) => {
      if (list && list.length > 0) {
        setIslands(list);
      }
    });
  }, []);

  const currentIsland =
    islands.find((i) => i.slug === activeSlug) || islands[0];
  const isHanukkah = currentIsland.slug === "hanukkah-2026";
  const isEnglish = currentIsland.language === "en";

  const handleClickQuest = (quest: SeasonalQuestItem) => {
    if (currentIsland.requires_registration && !account) {
      sfx.pop();
      onRequireAuth();
      return;
    }
    sfx.win();
    const updated = markSeasonalQuestCompleted(quest.id);
    setCompletedIds(updated);
    if (isHanukkah) {
      speak(`יצאנו למשימת ${quest.title}!`);
    }
    onLaunchSeasonalQuest(quest, currentIsland);
  };

  return (
    <section
      dir={isEnglish ? "ltr" : "rtl"}
      className={`rounded-3xl p-5 md:p-7 border-2 shadow-sm transition-all space-y-5 ${
        isHanukkah
          ? "bg-gradient-to-br from-amber-50/95 via-white/95 to-sky-50/95 border-amber-300"
          : "bg-gradient-to-br from-sky-50/95 via-white/95 to-indigo-50/95 border-sky-300"
      }`}
    >
      {/* Top Banner + Seasonal Campaign Switcher (Hanukkah 5787 vs Christmas 2026) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                isHanukkah
                  ? "bg-amber-400 text-slate-950"
                  : "bg-sky-600 text-white"
              }`}
            >
              {isHanukkah ? (
                <Flame className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Snowflake className="w-3.5 h-3.5" />
              )}
              <span>
                {isHanukkah
                  ? "אי עונתי מיוחד לחנוכה תשפ״ז · חינם ברישום בלבד!"
                  : "Seasonal Campaign · Free Registered Access"}
              </span>
            </span>

            {account ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                {isEnglish
                  ? `Unlocked for ${account.name}`
                  : `פתוח עבור ${account.name} (רשום חינם ✓)`}
              </span>
            ) : (
              <button
                type="button"
                onClick={onRequireAuth}
                className="px-3 py-0.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-900 text-[11px] font-extrabold flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                <span>
                  {isEnglish
                    ? "Free Sign-Up Required to Save Stars"
                    : "לחצו לרישום חינמי מהיר לפתיחת כל 8 הנרות"}
                </span>
              </button>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 nikud">
            {currentIsland.title}
          </h2>
          <p className="text-xs text-slate-600 nikud">
            {isHanukkah
              ? "8 מְשִׂימוֹת אוֹר (נֵר לְיוֹם: חִידוֹת נִיקּוּד, סְבִיבוֹן מָתֵמָטִי בְּלוּחַ הַמֵּאָה וּקְרַב בּוֹס 'נִיצְחוֹן הָאוֹר' שֶׁפּוֹתֵחַ אֶת כֶּתֶר אוֹר הַמַּכַּבִּים!)."
              : "12 Winter Countdown Quests: Math, Reading & Science challenges that unlock the special Winter Spark Outfit!"}
          </p>
        </div>

        {/* Island Switcher Pills + Presentation Link */}
        <div className="flex flex-wrap items-center gap-2">
          {islands.map((isl) => {
            const selected = isl.slug === currentIsland.slug;
            const hanukkahTab = isl.slug === "hanukkah-2026";
            return (
              <button
                key={isl.slug}
                type="button"
                onClick={() => {
                  sfx.click();
                  setActiveSlug(isl.slug);
                }}
                className={`btn-glow px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border ${
                  selected
                    ? hanukkahTab
                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                      : "bg-sky-600 text-white border-sky-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {hanukkahTab ? (
                  <Flame className="w-3.5 h-3.5" />
                ) : (
                  <Snowflake className="w-3.5 h-3.5" />
                )}
                <span>
                  {hanukkahTab
                    ? "חֲנֻכָּה תשפ״ז (עברית)"
                    : "Christmas 2026 (English)"}
                </span>
              </button>
            );
          })}

          {currentIsland.presentation_url && (
            <a
              href={currentIsland.presentation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glow px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>
                {isEnglish ? "Interactive Slides" : "מַצֶּגֶת חֲנֻכָּה חַיָּה"}
              </span>
            </a>
          )}
        </div>
      </div>

      {/* Quests Grid (8 Candles for Hanukkah / 12 Days for Christmas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {currentIsland.quests_json.map((q) => {
          const isDone = completedIds.includes(q.id);
          return (
            <div
              key={q.id}
              className={`p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 transition-all ${
                q.isBoss
                  ? "bg-amber-50/95 border-amber-400 shadow-xs"
                  : isDone
                    ? "bg-emerald-50/90 border-emerald-300"
                    : "bg-white/90 border-slate-200/90 hover:border-sky-300"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${
                      q.isBoss
                        ? "bg-rose-600 text-white"
                        : isHanukkah
                          ? "bg-amber-100 text-amber-900"
                          : "bg-sky-100 text-sky-900"
                    }`}
                  >
                    {isHanukkah ? `נֵר ${q.day}` : `Day ${q.day}`}
                  </span>
                  <span className="text-[11px] font-extrabold text-amber-600 tabular-nums">
                    +{q.xpReward} נְקוּדּוֹת אוֹר · +{q.starsReward} ⭐
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900 nikud">
                  {q.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed nikud">
                  {q.desc}
                </p>

                {q.rewardSkinId && (
                  <div className="pt-1 flex items-center gap-1 text-[11px] font-extrabold text-violet-700">
                    <Gift className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isEnglish
                        ? "Boss Reward: Winter Spark Outfit!"
                        : "פְּרַס בּוֹס: תַּלְבּוֹשֶׁת כֶּתֶר אוֹר הַמַּכַּבִּים!"}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleClickQuest(q)}
                className={`btn-glow w-full py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 ${
                  isDone
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : q.isBoss
                      ? "bg-amber-500 hover:bg-amber-400 text-slate-950"
                      : "bg-sky-600 hover:bg-sky-500 text-white"
                }`}
              >
                {isDone ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isEnglish ? "Completed! Play Again" : "הַנֵּר דּוֹלֵק! שַׂחֵק שׁוּב"}
                    </span>
                  </>
                ) : q.isBoss ? (
                  <>
                    <Trophy className="w-4 h-4" />
                    <span>
                      {isEnglish
                        ? "Start Finale Boss!"
                        : "הַדְלֵק נֵר שְׁמִינִי וְקַבֵּל כֶּתֶר!"}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      {isEnglish ? "Start Quest" : `הַדְלֵק נֵר ${q.day}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
