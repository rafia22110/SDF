/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  AppState,
  IslandId,
  Profile,
  ClassState,
} from "./types";
import {
  DEFAULT_CLASS_STATE,
  createInitialProfile,
} from "./data/content";
import { sfx, setMuted, isMuted, speak } from "./audio";
import { ConfettiBurst } from "./components/AvatarSvg";
import { ActiveGameRunner } from "./components/GamesEngine";
import { SmartBoard } from "./components/SmartBoard";
import { TeacherPanel } from "./components/TeacherPanel";
import { ProfileModal } from "./components/ProfileModal";
import { StudentGamingHub } from "./components/StudentGamingHub";

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
      setAppState((prev) => ({
        ...prev,
        profile: {
          ...profile,
          islandsVisited: nextVisited,
          badges: nextBadges,
          xp: currentXp + 20,
        },
      }));
    }
  };

  const handleLaunchGame = (gameId: string) => {
    sfx.pop();
    setActiveGameId(gameId);
  };

  const handleFinishGame = (score: number, _total: number) => {
    const earnedStars = Math.max(3, score * 3);
    const earnedXp = Math.max(35, score * 20);
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

    const updatedMissions = appState.classState.missions.map((m) =>
      m.gameId === gameId ? { ...m, done: true } : m,
    );

    setAppState((prev) => ({
      ...prev,
      profile: {
        ...profile,
        stars: nextStars,
        totalStars: nextTotal,
        xp: nextXp,
        level: nextLevel,
        todayCount: profile.todayCount + 1,
        gamesPlayed: {
          ...profile.gamesPlayed,
          [gameId]: nextPlayedCount,
        },
        bestScores: {
          ...profile.bestScores,
          [gameId]: Math.max(profile.bestScores[gameId] || 0, score),
        },
        badges: nextBadges,
      },
      classState: {
        ...prev.classState,
        missions: updatedMissions,
      },
    }));

    setActiveGameId(null);
    setCelebrate(true);
    if (didLevelUp) {
      speak(
        `לבל אפ! עלית לרמה ${nextLevel} ${profile.name}! צברת ${earnedXp} נקודות ניסיון ו-${earnedStars} כוכבי שלל!`,
      );
    } else {
      speak(
        `כל הכבוד ${profile.name}! צברת ${earnedXp} נקודות ניסיון ו-${earnedStars} כוכבי שלל!`,
      );
    }
    setTimeout(() => setCelebrate(false), 3000);
  };

  const handleSaveBuild = (name: string, grid: number[][]) => {
    const nextBadges = profile.badges.includes("artist")
      ? profile.badges
      : [...profile.badges, "artist"];
    setAppState((prev) => ({
      ...prev,
      profile: {
        ...profile,
        badges: nextBadges,
        xp: currentXp + 30,
      },
      builds: {
        ...prev.builds,
        [name]: grid,
      },
    }));
  };

  const updateProfile = (next: Profile) => {
    setAppState((prev) => ({ ...prev, profile: next }));
  };

  const updateClassState = (next: ClassState) => {
    setAppState((prev) => ({ ...prev, classState: next }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ConfettiBurst active={celebrate} />

      {/* ====================================================================
         TOP BAR CONTRACT: 3 Zones separated by gap-8 (Frosted Glass Header)
         ==================================================================== */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-white/80 glass-strong sticky top-0 z-40">
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

        {/* Zone 2: 4 clean single-line text navigation links */}
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
            🌳 עֵץ הַמְּיוּמָנוּיוֹת (Skill Tree)
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
            ⚔️ קְווֶסְטִים וּקְרָבוֹת בּוֹס
          </a>
          <a
            href="#teacher"
            onClick={(e) => {
              e.preventDefault();
              sfx.click();
              setActiveGameId(null);
              setActiveTab("teacher");
            }}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
              activeTab === "teacher" && !activeGameId
                ? "text-sky-700 border-b-2 border-sky-600 font-bold"
                : ""
            }`}
          >
            נִיהוּל לַמּוֹרֶה
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              sfx.click();
              setShowProfileModal(true);
            }}
            className="btn-glow px-4 py-2 text-xs font-bold text-white bg-sky-600 rounded-xl hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            {profile.name} · LVL {currentLevel} · {profile.stars} ⭐
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
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
          קְווֶסְטִים וּבוֹס
        </button>
        <button
          onClick={() => {
            setActiveGameId(null);
            setActiveTab("teacher");
          }}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap ${
            activeTab === "teacher" ? "bg-sky-600 text-white" : "text-slate-600"
          }`}
        >
          לַמּוֹרֶה
        </button>
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
            onExit={() => setActiveGameId(null)}
            onFinish={handleFinishGame}
          />
        ) : activeTab === "board" ? (
          <SmartBoard
            students={appState.classState.students}
            userName={profile.name}
          />
        ) : activeTab === "islands" ? (
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
        ) : activeTab === "missions" ? (
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
        ) : (
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
          />
        )}
      </main>

      {/* Profile, Skins & Loot Shop Modal */}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onUpdateProfile={updateProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
