import type { Mission, Profile } from '../types';

export interface RewardProfile extends Profile {
  claimedMissionIds?: string[];
  settledGameRunIds?: string[];
}

export interface MissionLaunchContext {
  missionId: string;
  studentId: string;
}

export interface GameCompletion {
  runId: string;
  gameId: string;
  score: number;
  total: number;
  retryCount: number;
  missionContext?: MissionLaunchContext;
}

export interface RewardBreakdown {
  gameXp: number;
  persistenceXp: number;
  missionXp: number;
  totalXp: number;
  stars: number;
  missionId: string | null;
}

export interface RewardSettlement {
  profile: RewardProfile;
  reward: RewardBreakdown;
  applied: boolean;
}

export const REWARD_POLICY = {
  minimumGameXp: 35,
  xpPerCorrectAnswer: 20,
  xpPerRetry: 5,
  minimumStars: 3,
  starsPerCorrectAnswer: 3,
  xpPerLevel: 100,
} as const;

function naturalNumber(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

export function getProfileXp(profile: Profile): number {
  return profile.xp ??
    profile.totalStars * 10 + Object.keys(profile.gamesPlayed).length * 25;
}

export function getLevel(xp: number): number {
  return Math.max(1, Math.floor(xp / REWARD_POLICY.xpPerLevel) + 1);
}

export function resolveRewardMission(
  completion: GameCompletion,
  missions: readonly Mission[],
): Mission | undefined {
  const context = completion.missionContext;
  if (!context?.missionId || !context.studentId) return undefined;
  return missions.find((mission) =>
    mission.id === context.missionId &&
    mission.gameId === completion.gameId &&
    !mission.done &&
    (mission.studentId === 'all' || mission.studentId === context.studentId)
  );
}

export function calculateGameRewards(
  completion: GameCompletion,
  claimedMissionIds: readonly string[] = [],
  mission?: Mission,
): RewardBreakdown {
  const total = naturalNumber(completion.total, 'total');
  const score = naturalNumber(completion.score, 'score');
  const retries = naturalNumber(completion.retryCount, 'retryCount');
  if (total === 0 || score > total) throw new Error('Invalid game result');
  const eligibleMission = mission
    ? resolveRewardMission(completion, [mission])
    : undefined;
  const rewardMission = eligibleMission &&
    !claimedMissionIds.includes(eligibleMission.id)
    ? eligibleMission
    : undefined;
  const gameXp = Math.max(
    REWARD_POLICY.minimumGameXp,
    score * REWARD_POLICY.xpPerCorrectAnswer,
  );
  const persistenceXp = retries * REWARD_POLICY.xpPerRetry;
  const missionXp = rewardMission
    ? naturalNumber(rewardMission.xpReward ?? 0, 'mission.xpReward')
    : 0;
  const stars = Math.max(
    REWARD_POLICY.minimumStars,
    score * REWARD_POLICY.starsPerCorrectAnswer,
  );
  return {
    gameXp, persistenceXp, missionXp,
    totalXp: gameXp + persistenceXp + missionXp,
    stars, missionId: rewardMission?.id ?? null,
  };
}

export function settleGameRewards(
  profile: RewardProfile,
  completion: GameCompletion,
  mission?: Mission,
): RewardSettlement {
  if (!completion.runId.trim() || !completion.gameId.trim()) {
    throw new Error('Missing game run identity');
  }
  const reward = calculateGameRewards(
    completion, profile.claimedMissionIds ?? [], mission,
  );
  if ((profile.settledGameRunIds ?? []).includes(completion.runId)) {
    return { profile, reward, applied: false };
  }
  const nextXp = getProfileXp(profile) + reward.totalXp;
  const nextTotalStars = profile.totalStars + reward.stars;
  const badges = new Set(profile.badges);
  badges.add('first-star');
  if (completion.gameId === 'numbers-quiz' ||
      completion.gameId === 'balloon-pop') badges.add('math-whiz');
  if (nextTotalStars >= 50) badges.add('super-star');
  return {
    applied: true,
    reward,
    profile: {
      ...profile,
      xp: nextXp,
      level: getLevel(nextXp),
      stars: profile.stars + reward.stars,
      totalStars: nextTotalStars,
      todayCount: profile.todayCount + 1,
      gamesPlayed: {
        ...profile.gamesPlayed,
        [completion.gameId]: (profile.gamesPlayed[completion.gameId] ?? 0) + 1,
      },
      bestScores: {
        ...profile.bestScores,
        [completion.gameId]: Math.max(
          profile.bestScores[completion.gameId] ?? 0, completion.score,
        ),
      },
      badges: [...badges],
      claimedMissionIds: reward.missionId
        ? [...(profile.claimedMissionIds ?? []), reward.missionId]
        : [...(profile.claimedMissionIds ?? [])],
      settledGameRunIds: [
        ...(profile.settledGameRunIds ?? []), completion.runId,
      ],
    },
  };
}
