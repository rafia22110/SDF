/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { GraduationCap, Lock, ShieldCheck, Sparkles } from "lucide-react";
import {
  AppState,
  IslandId,
  Profile,
  ClassState,
  UserRole,
} from "./types";
import {
  DEFAULT_CLASS_STATE,
  GAMES,
  createInitialProfile,
} from "./data/content";
import { sfx, setMuted, isMuted, speak } from "./audio";
import { ConfettiBurst } from "./components/AvatarSvg";
import { ActiveGameRunner } from "./components/GamesEngine";
import { SmartBoard } from "./components/SmartBoard";
import { TeacherPanel } from "./components/TeacherPanel";
import { ProfileModal } from "./components/ProfileModal";
import { StudentGamingHub } from "./components/StudentGamingHub";
import { AuthModal } from "./components/AuthModal";
import { SeasonalIslandsSection } from "./components/SeasonalIslandsSection";
import { LegalFooter } from "./components/LegalFooterModals";
import {
  RegisteredAccount,
  SeasonalIslandRecord,
  SeasonalQuestItem,
  getSavedAccount,
  syncStudentProgressToPocketBase,
} from "./services/pocketbaseService";

const STORAGE_KEY = "iyey_or_state_v1";

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as AppState;
          if (parsed && parsed.profile && parsed.classState) {
            return parsed;
          }
        }
      } catch {
        /* ignore storage error */
      }
    }
    return {
      profile: createInitialProfile(),
      classState: DEFAULT_CLASS_STATE,
      builds: {},
    };
  });

  const [account, setAccount] = useState<RegisteredAccount | null>(() =>
    getSavedAccount(),
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeSeasonalReward, setActiveSeasonalReward] = useState<{
    quest: SeasonalQuestItem;
    island: SeasonalIslandRecord;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    "board" | "islands" | "missions" | "teacher"
  >("board");
  const [selectedIsland, setSelectedIsland] = useState<IslandId | null>(null);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [soundMuted, setSoundMuted] = useState(isMuted());
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch {
      /* ignore */
    }
  }, [appState]);

  const profile = appState.profile || createInitialProfile();
  const currentRole: UserRole = account?.role || profile.role || "student";
  const isTeacher = currentRole === "teacher";

  // Ensure a non-teacher cannot remain on the teacher tab
  useEffect(() => {
    if (activeTab === "teacher" && !isTeacher) {
      setActiveTab("board");
    }
  }, [activeTab, isTeacher]);

  const currentXp =
    profile.xp ??
    profile.totalStars * 10 + Object.keys(profile.gamesPlayed).length * 25;
  const currentLevel = Math.max(1, Math.floor(currentXp / 100) + 1);

  const handleToggleMute = () => {
    const next = !soundMuted;
    setMuted(next);
    setSoundMuted(next);
    if (!next) sfx.click();
  };

  const handleSelectIsland = (id: IslandId | null) => {
    sfx.whoosh();
    setSelectedIsland(id);
    if (id && !profile.islandsVisited.includes(id)) {
      const nextVisited = [...profile.islandsVisited, id];
      const nextBadges = [...profile.badges];
      if (nextVisited.length >= 3 && !nextBadges.includes("island-explorer")) {
        nextBadges.push("island-explorer");
      }
      if (nextVisited.length >= 6 && !nextBadges.includes("world-traveler")) {
        nextBadges.push("world-traveler");
      }
      const nextProfile: Profile = {
        ...profile,
        islandsVisited: nextVisited,
        badges: nextBadges,
        xp: currentXp + 20,
      };
      setAppState((prev) => ({
        ...prev,
        profile: nextProfile,
      }));
      syncStudentProgressToPocketBase({
        account,
        profile: nextProfile,
        islandId: id,
        stageId: "visit-island",
        xpEarned: 20,
        starsEarned: 0,
        completed: true,
      });
    }
  };

  const handleLaunchGame = (gameId: string) => {
    sfx.pop();
    setActiveGameId(gameId);
  };

  const handleLaunchSeasonalQuest = (
    quest: SeasonalQuestItem,
    island: SeasonalIslandRecord,
  ) => {
    setActiveSeasonalReward({ quest, island });
    setActiveGameId(quest.gameId);
  };

  const handleFinishGame = (score: number, _total: number) => {
    const seasonalBonusStars = activeSeasonalReward?.quest.starsReward || 0;
    const seasonalBonusXp = activeSeasonalReward?.quest.xpReward || 0;
    const earnedStars = Math.max(3, score * 3) + seasonalBonusStars;
    const earnedXp = Math.max(35, score * 20) + seasonalBonusXp;
    const nextStars = profile.stars + earnedStars;
    const nextTotal = profile.totalStars + earnedStars;
    const nextXp = currentXp + earnedXp;
    const prevLevel = currentLevel;
    const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);
    const didLevelUp = nextLevel > prevLevel;

    const gameId = activeGameId || "letters-quiz";
    const nextPlayedCount = (profile.gamesPlayed[gameId] || 0) + 1;

    const nextBadges = [...profile.badges];
    if (!nextBadges.includes("first-star")) nextBadges.push("first-star");
    if (
      (gameId === "numbers-quiz" || gameId === "balloon-pop") &&
      !nextBadges.includes("math-whiz")
    ) {
      nextBadges.push("math-whiz");
    }
    if (nextTotal >= 50 && !nextBadges.includes("super-star")) {
      nextBadges.push("super-star");
    }

    const nextOwnedAccessories = [...profile.ownedAccessories];
    let nextAvatar = profile.avatar;
    if (
      activeSeasonalReward?.quest.rewardSkinId &&
      !nextOwnedAccessories.includes(activeSeasonalReward.quest.rewardSkinId)
    ) {
      nextOwnedAccessories.push(activeSeasonalReward.quest.rewardSkinId);
      nextAvatar = {
        ...profile.avatar,
        accessory: activeSeasonalReward.quest.rewardSkinId,
      };
    }

    const updatedMissions = appState.classState.missions.map((m) =>
      m.gameId === gameId ? { ...m, done: true } : m,
    );

    const updatedProfile: Profile = {
      ...profile,
      stars: nextStars,
      totalStars: nextTotal,
      xp: nextXp,
      level: nextLevel,
      todayCount: profile.todayCount + 1,
      ownedAccessories: nextOwnedAccessories,
      avatar: nextAvatar,
      gamesPlayed: {
        ...profile.gamesPlayed,
        [gameId]: nextPlayedCount,
      },
      bestScores: {
        ...profile.bestScores,
        [gameId]: Math.max(profile.bestScores[gameId] || 0, score),
      },
      badges: nextBadges,
    };

    setAppState((prev) => ({
      ...prev,
      profile: updatedProfile,
      classState: {
        ...prev.classState,
        missions: updatedMissions,
      },
    }));

    const matchedGame = GAMES.find((g) => g.id === gameId);
    syncStudentProgressToPocketBase({
      account,
      profile: updatedProfile,
      islandId:
        activeSeasonalReward?.island.slug || matchedGame?.island || "letters",
      stageId: activeSeasonalReward?.quest.id || gameId,
      xpEarned: earnedXp,
      starsEarned: earnedStars,
      completed: true,
    });

    setActiveSeasonalReward(null);
    setActiveGameId(null);
    setCelebrate(true);
    if (didLevelUp) {
      speak(
        `עלית שלב לרמה ${nextLevel} ${profile.name}! צברת ${earnedXp} נקודות אור ו-${earnedStars} כוכבי אוצר!`,
      );
    } else {
      speak(
        `כל הכבוד ${profile.name}! צברת ${earnedXp} נקודות אור ו-${earnedStars} כוכבי אוצר!`,
      );
    }
    setTimeout(() => setCelebrate(false), 3000);
  };

  const handleSaveBuild = (name: string, grid: number[][]) => {
    const nextBadges = profile.badges.includes("artist")
      ? profile.badges
      : [...profile.badges, "artist"];
    const updatedProfile: Profile = {
      ...profile,
      badges: nextBadges,
      xp: currentXp + 30,
    };
    setAppState((prev) => ({
      ...prev,
      profile: updatedProfile,
      builds: {
        ...prev.builds,
        [name]: grid,
      },
    }));
    syncStudentProgressToPocketBase({
      account,
      profile: updatedProfile,
      islandId: "create",
      stageId: `pixel-build-${name}`,
      xpEarned: 30,
      starsEarned: 0,
      completed: true,
    });
  };

  const updateProfile = (next: Profile) => {
    setAppState((prev) => ({ ...prev, profile: next }));
    syncStudentProgressToPocketBase({
      account,
      profile: next,
      islandId: "profile",
      stageId: "update-profile",
      xpEarned: 0,
      starsEarned: 0,
      completed: true,
    });
  };

  const updateClassState = (next: ClassState) => {
    setAppState((prev) => ({ ...prev, classState: next }));
  };

  const handleAuthSuccess = (acc: RegisteredAccount) => {
    setAccount(acc);
    const updatedProfile: Profile = {
      ...profile,
      name: acc.name || profile.name,
      grade: acc.grade || profile.grade,
      role: acc.role,
      plan: acc.plan,
      classCode: acc.class_code,
    };
    setAppState((prev) => ({
      ...prev,
      profile: updatedProfile,
      classState: acc.class_code
        ? { ...prev.classState, code: acc.class_code }
        : prev.classState,
    }));
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ConfettiBurst active={celebrate} />

      {/* ====================================================================
         TOP BAR CONTRACT: Frosted Glass Header with Strict Teacher/Student RBAC
         ==================================================================== */}
      <header className="flex items-center justify-between gap-6 px-6 py-3.5 border-b border-white/80 glass-strong sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            sfx.click();
            setActiveGameId(null);
            setActiveTab("board");
          }}
          className="text-xl font-extrabold tracking-tight text-sky-700 whitespace-nowrap shrink-0"
        >
          אִיֵּי אוֹר
        </a>

        {/* Zone 2: Clean navigation links (Teacher tab hidden unless role === "teacher"!) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a
            href="#board"
            onClick={(e) => {
              e.preventDefault();
              sfx.click();
              setActiveGameId(null);
              setActiveTab("board");
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === "board" && !activeGameId
                ? "text-sky-700 border-b-2 border-sky-600 font-bold"
                : ""
            }`}
          >
            לוּחַ הַמַּסָּע וְהָאִיסּוּף
          </a>
          <a
            href="#islands"
            onClick={(e) => {
              e.preventDefault();
              sfx.click();
              setActiveGameId(null);
              setActiveTab("islands");
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === "islands" && !activeGameId
                ? "text-sky-700 border-b-2 border-sky-600 font-bold"
                : ""
            }`}
          >
            🌳 עֵץ הַמְּיוּמָנוּיוֹת
          </a>
          <a
            href="#missions"
            onClick={(e) => {
              e.preventDefault();
              sfx.click();
              setActiveGameId(null);
              setActiveTab("missions");
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === "missions" && !activeGameId
                ? "text-sky-700 border-b-2 border-sky-600 font-bold"
                : ""
            }`}
          >
            ⚔️ מְשִׂימוֹת וּקְרָבוֹת בּוֹס
          </a>

          {isTeacher && (
            <a
              href="#teacher"
              onClick={(e) => {
                e.preventDefault();
                sfx.click();
                setActiveGameId(null);
                setActiveTab("teacher");
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1 ${
                activeTab === "teacher" && !activeGameId
                  ? "text-sky-700 border-b-2 border-sky-600 font-bold"
                  : ""
              }`}
            >
              <GraduationCap className="w-4 h-4 text-sky-600" />
              <span>נִיהוּל לַמּוֹרֶה</span>
            </a>
          )}
        </nav>

        {/* Zone 3: Free Registration / Role Switcher + Player Profile Pill */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setShowAuthModal(true);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-extrabold border flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              account
                ? isTeacher
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-white/90 border-sky-300 text-sky-800 hover:bg-sky-50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {account
                ? isTeacher
                  ? `מוֹרֶה: ${account.name}`
                  : currentRole === "parent"
                    ? `הוֹרֶה: ${account.name}`
                    : `תַּלְמִיד/ה: ${account.name}`
                : "רִישׁוּם חִינָּמִי / כְּנִיסַת מוֹרֶה"}
            </span>
          </button>

          <button
            onClick={() => {
              sfx.click();
              setShowProfileModal(true);
            }}
            className="btn-glow px-4 py-2 text-xs font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            {profile.name} · רָמָה {currentLevel} · {profile.stars} ⭐
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar (Teacher tab hidden unless isTeacher!) */}
      <div className="md:hidden flex items-center justify-around gap-1 px-3 py-2 border-b border-slate-200/80 glass text-xs font-bold">
        <button
          onClick={() => {
            setActiveGameId(null);
            setActiveTab("board");
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeTab === "board" ? "bg-sky-600 text-white" : "text-slate-600"
          }`}
        >
          לוּחַ הַמַּסָּע
        </button>
        <button
          onClick={() => {
            setActiveGameId(null);
            setActiveTab("islands");
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeTab === "islands" ? "bg-sky-600 text-white" : "text-slate-600"
          }`}
        >
          עֵץ מְיוּמָנוּיוֹת
        </button>
        <button
          onClick={() => {
            setActiveGameId(null);
            setActiveTab("missions");
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeTab === "missions" ? "bg-sky-600 text-white" : "text-slate-600"
          }`}
        >
          מְשִׂימוֹת וּבוֹס
        </button>
        {isTeacher && (
          <button
            onClick={() => {
              setActiveGameId(null);
              setActiveTab("teacher");
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
              activeTab === "teacher"
                ? "bg-sky-600 text-white"
                : "text-slate-600"
            }`}
          >
            לַמּוֹרֶה
          </button>
        )}
      </div>

      {/* ====================================================================
         MAIN VIEWPORT CONTENT
         ==================================================================== */}
      <main className="flex-1">
        {activeGameId ? (
          <ActiveGameRunner
            gameId={activeGameId}
            grade={profile.grade}
            builds={appState.builds}
            onSaveBuild={handleSaveBuild}
            onExit={() => {
              setActiveSeasonalReward(null);
              setActiveGameId(null);
            }}
            onFinish={handleFinishGame}
          />
        ) : activeTab === "board" ? (
          <div className="space-y-6">
            <div className="max-w-7xl mx-auto px-4 pt-5">
              <SeasonalIslandsSection
                account={account}
                onRequireAuth={() => setShowAuthModal(true)}
                onLaunchSeasonalQuest={handleLaunchSeasonalQuest}
              />
            </div>
            <SmartBoard
              students={appState.classState.students}
              userName={profile.name}
            />
          </div>
        ) : activeTab === "islands" ? (
          <div className="space-y-4">
            <div className="max-w-7xl mx-auto px-4 pt-5">
              <SeasonalIslandsSection
                account={account}
                onRequireAuth={() => setShowAuthModal(true)}
                onLaunchSeasonalQuest={handleLaunchSeasonalQuest}
              />
            </div>
            <StudentGamingHub
              mode="skill-tree"
              profile={profile}
              classState={appState.classState}
              selectedIsland={selectedIsland}
              soundMuted={soundMuted}
              onSelectIsland={handleSelectIsland}
              onLaunchGame={handleLaunchGame}
              onUpdateProfile={updateProfile}
              onOpenProfileModal={() => setShowProfileModal(true)}
              onToggleMute={handleToggleMute}
              onSwitchToBoard={() => setActiveTab("board")}
            />
          </div>
        ) : activeTab === "missions" ? (
          <div className="space-y-4">
            <div className="max-w-7xl mx-auto px-4 pt-5">
              <SeasonalIslandsSection
                account={account}
                onRequireAuth={() => setShowAuthModal(true)}
                onLaunchSeasonalQuest={handleLaunchSeasonalQuest}
              />
            </div>
            <StudentGamingHub
              mode="quests"
              profile={profile}
              classState={appState.classState}
              selectedIsland={selectedIsland}
              soundMuted={soundMuted}
              onSelectIsland={handleSelectIsland}
              onLaunchGame={handleLaunchGame}
              onUpdateProfile={updateProfile}
              onOpenProfileModal={() => setShowProfileModal(true)}
              onToggleMute={handleToggleMute}
              onSwitchToBoard={() => setActiveTab("board")}
            />
          </div>
        ) : isTeacher ? (
          <TeacherPanel
            classState={appState.classState}
            onUpdateClass={updateClassState}
            onLaunchGame={(gid) => {
              setActiveGameId(gid);
            }}
            onSelectIsland={(islandId) => {
              handleSelectIsland(islandId);
              setActiveTab("islands");
            }}
            onSwitchToBoard={() => setActiveTab("board")}
          />
        ) : (
          <div className="max-w-lg mx-auto my-12 p-6 rounded-3xl glass-strong border-2 border-amber-300 text-center space-y-4">
            <Lock className="w-10 h-10 text-amber-600 mx-auto" />
            <h2 className="text-lg font-extrabold text-slate-900">
              אֵזוֹר זֶה מוּגָן לְמוֹרִים בִּלְבַד
            </h2>
            <p className="text-xs text-slate-600">
              כְּדֵי לְהִיכָּנֵס לְנִיהוּל הַכִּיתָּה, הִתְחַבְּרוּ עִם חֶשְׁבּוֹן מוֹרֶה.
            </p>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="btn-glow px-5 py-2.5 rounded-xl bg-sky-600 text-white font-extrabold text-xs"
            >
              כְּנִיסַת מוֹרֶה
            </button>
          </div>
        )}
      </main>

      {/* Child & School Privacy Policy + Terms of Use Footer */}
      <LegalFooter onOpenAuth={() => setShowAuthModal(true)} />

      {/* Profile, Outfits & Treasures Shop Modal */}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onUpdateProfile={updateProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Free Registration & Role Separation Modal (Student / Teacher / Parent) */}
      {showAuthModal && (
        <AuthModal
          profile={profile}
          account={account}
          onSuccess={handleAuthSuccess}
          onLogout={() => {
            setAccount(null);
            setAppState((prev) => ({
              ...prev,
              profile: prev.profile
                ? { ...prev.profile, role: "student" }
                : prev.profile,
            }));
            setShowAuthModal(false);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
