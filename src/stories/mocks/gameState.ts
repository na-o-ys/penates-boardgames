import type { ClientGameState, Role } from "@/lib/game";
import type { ClientRoomState } from "@/lib/room";

const MOCK_PLAYERS = [
  { id: "p1", name: "太郎", isHost: true, isConnected: true },
  { id: "p2", name: "花子", isHost: false, isConnected: true },
  { id: "p3", name: "次郎", isHost: false, isConnected: true },
  { id: "p4", name: "美咲", isHost: false, isConnected: false },
] as const;

const MOCK_ROLES: Role[] = ["WEREWOLF", "SEER", "ROBBER", "VILLAGER", "TROUBLEMAKER", "HUNTER"];

const MOCK_CONFIG = {
  roles: MOCK_ROLES,
  nightDuration: 60,
  dayDuration: 300,
  votingDuration: 60,
  updatedAt: 0,
} as const;

/** ClientRoomState のベース（game: null = ロビー） */
const BASE_ROOM_STATE: ClientRoomState = {
  roomId: "test-room-id",
  members: MOCK_PLAYERS,
  config: MOCK_CONFIG,
  game: null,
};

/** ゲーム進行中の ClientGameState ベース */
const BASE_GAME_STATE: ClientGameState = {
  phase: "NIGHT",
  players: MOCK_PLAYERS,
  myRole: null,
  myActions: [],
  actionResults: [],
  hasActed: false,
  allActed: false,
  votedPlayers: [],
  myVote: null,
  phaseStartedAt: null,
};

/** ゲーム進行中の ClientRoomState を生成するヘルパー */
function withGame(game: ClientGameState): ClientRoomState {
  return {
    ...BASE_ROOM_STATE,
    game,
  };
}

// ========================================
// LOBBY (game: null)
// ========================================

export const lobbyHostState: ClientRoomState = {
  ...BASE_ROOM_STATE,
  game: null,
};

export const lobbyGuestState: ClientRoomState = {
  ...BASE_ROOM_STATE,
  game: null,
};

// ========================================
// NIGHT
// ========================================

export const nightSeerState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "SEER",
  hasActed: false,
  phaseStartedAt: Date.now(),
});

export const nightWerewolfState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "WEREWOLF",
  hasActed: false,
  fellowWerewolves: [],
  phaseStartedAt: Date.now(),
});

export const nightWerewolfWithFellowsState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "WEREWOLF",
  hasActed: false,
  fellowWerewolves: ["p2"],
  phaseStartedAt: Date.now(),
});

export const nightRobberState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "ROBBER",
  hasActed: false,
  phaseStartedAt: Date.now(),
});

export const nightTroublemakerState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "TROUBLEMAKER",
  hasActed: false,
  phaseStartedAt: Date.now(),
});

export const nightHunterState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "HUNTER",
  hasActed: false,
  phaseStartedAt: Date.now(),
});

export const nightVillagerState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "VILLAGER",
  hasActed: false,
  phaseStartedAt: Date.now(),
});

export const nightTannerState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "TANNER",
  hasActed: false,
  phaseStartedAt: Date.now(),
});

export const nightMadmanState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "MADMAN",
  hasActed: false,
  phaseStartedAt: Date.now(),
});

export const nightCiaState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "CIA",
  hasActed: false,
  fellowWerewolves: ["p2"],
  phaseStartedAt: Date.now(),
});

export const nightBakerState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "BAKER",
  hasActed: false,
  phaseStartedAt: Date.now(),
});

export const nightAlphaWolfState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "ALPHA_WOLF",
  hasActed: false,
  fellowWerewolves: [],
  revealedCenterRoles: {
    CENTER_0: "SEER",
    CENTER_1: "VILLAGER",
  },
  phaseStartedAt: Date.now(),
});

export const nightAlphaWolfWithFellowsState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "ALPHA_WOLF",
  hasActed: false,
  fellowWerewolves: ["p2"],
  revealedCenterRoles: {
    CENTER_0: "ROBBER",
    CENTER_1: "HUNTER",
  },
  phaseStartedAt: Date.now(),
});

export const nightActedState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "SEER",
  hasActed: true,
  myActions: [
    { actorId: "p1", type: "SEER_LOOK_PLAYER", targetIds: ["p2"], result: ["WEREWOLF"], timestamp: 0 },
  ],
  actionResults: [
    { type: "SEER_LOOK_PLAYER", targetIds: ["p2"], revealedRoles: ["WEREWOLF"] },
  ],
  phaseStartedAt: Date.now(),
});

export const nightActedSeerCenterState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "SEER",
  hasActed: true,
  myActions: [
    { actorId: "p1", type: "SEER_LOOK_CENTER", targetIds: ["CENTER_0", "CENTER_1"], result: ["SEER", "VILLAGER"], timestamp: 0 },
  ],
  actionResults: [
    { type: "SEER_LOOK_CENTER", targetIds: ["CENTER_0", "CENTER_1"], revealedRoles: ["SEER", "VILLAGER"] },
  ],
  phaseStartedAt: Date.now(),
});

export const nightActedRobberState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "ROBBER",
  hasActed: true,
  myActions: [
    { actorId: "p1", type: "ROBBER_SWAP", targetIds: ["p2"], result: ["WEREWOLF"], timestamp: 0 },
  ],
  actionResults: [
    { type: "ROBBER_SWAP", targetIds: ["p2"], revealedRoles: ["WEREWOLF"] },
  ],
  phaseStartedAt: Date.now(),
});

export const nightReceivedBreadState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "VILLAGER",
  hasActed: true,
  allActed: false,
  myActions: [
    { actorId: "p1", type: "SKIP", targetIds: [], result: [], timestamp: 0 },
  ],
  actionResults: [
    { type: "SKIP", targetIds: [], revealedRoles: [] },
  ],
  receivedBread: true,
  phaseStartedAt: Date.now(),
});

export const nightWhiteRobberState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "WHITE_ROBBER",
  hasActed: false,
  phaseStartedAt: Date.now(),
});

export const nightReceivedNoticeState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "NIGHT",
  myRole: "VILLAGER",
  hasActed: true,
  allActed: false,
  myActions: [
    { actorId: "p1", type: "SKIP", targetIds: [], result: [], timestamp: 0 },
  ],
  actionResults: [
    { type: "SKIP", targetIds: [], revealedRoles: [] },
  ],
  receivedNotice: true,
  phaseStartedAt: Date.now(),
});

// ========================================
// DAY
// ========================================

export const dayReceivedBreadState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "DAY",
  myRole: "VILLAGER",
  hasActed: true,
  allActed: true,
  myActions: [
    { actorId: "p1", type: "SKIP", targetIds: [], result: [], timestamp: 0 },
  ],
  actionResults: [
    { type: "SKIP", targetIds: [], revealedRoles: [] },
  ],
  receivedBread: true,
  phaseStartedAt: Date.now(),
});

export const dayReceivedNoticeState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "DAY",
  myRole: "VILLAGER",
  hasActed: true,
  allActed: true,
  myActions: [
    { actorId: "p1", type: "SKIP", targetIds: [], result: [], timestamp: 0 },
  ],
  actionResults: [
    { type: "SKIP", targetIds: [], revealedRoles: [] },
  ],
  receivedNotice: true,
  phaseStartedAt: Date.now(),
});

export const dayNormalState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "DAY",
  myRole: "SEER",
  myActions: [
    { actorId: "p1", type: "SEER_LOOK_PLAYER", targetIds: ["p2"], result: ["WEREWOLF"], timestamp: 0 },
  ],
  actionResults: [
    { type: "SEER_LOOK_PLAYER", targetIds: ["p2"], revealedRoles: ["WEREWOLF"] },
  ],
  phaseStartedAt: Date.now(),
});

export const dayRobberSwapState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "DAY",
  myRole: "ROBBER",
  myActions: [
    { actorId: "p1", type: "ROBBER_SWAP", targetIds: ["p2"], result: ["WEREWOLF"], timestamp: 0 },
  ],
  actionResults: [
    { type: "ROBBER_SWAP", targetIds: ["p2"], revealedRoles: ["WEREWOLF"] },
  ],
  phaseStartedAt: Date.now(),
});

// ========================================
// VOTING
// ========================================

export const votingNotVotedState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "VOTING",
  myRole: "SEER",
  myActions: [
    { actorId: "p1", type: "SEER_LOOK_PLAYER", targetIds: ["p2"], result: ["WEREWOLF"], timestamp: 0 },
  ],
  actionResults: [
    { type: "SEER_LOOK_PLAYER", targetIds: ["p2"], revealedRoles: ["WEREWOLF"] },
  ],
  votedPlayers: ["p3"],
  myVote: null,
  phaseStartedAt: Date.now(),
});

export const votingVotedState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "VOTING",
  myRole: "SEER",
  myActions: [
    { actorId: "p1", type: "SEER_LOOK_PLAYER", targetIds: ["p2"], result: ["WEREWOLF"], timestamp: 0 },
  ],
  actionResults: [
    { type: "SEER_LOOK_PLAYER", targetIds: ["p2"], revealedRoles: ["WEREWOLF"] },
  ],
  votedPlayers: ["p1", "p3"],
  myVote: "p2",
  phaseStartedAt: Date.now(),
});

export const votingRobberNotVotedState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "VOTING",
  myRole: "ROBBER",
  myActions: [
    { actorId: "p1", type: "ROBBER_SWAP", targetIds: ["p2"], result: ["WEREWOLF"], timestamp: 0 },
  ],
  actionResults: [
    { type: "ROBBER_SWAP", targetIds: ["p2"], revealedRoles: ["WEREWOLF"] },
  ],
  votedPlayers: [],
  myVote: null,
  phaseStartedAt: Date.now(),
});

// ========================================
// FINISHED
// ========================================

export const resultVillageWinState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "FINISHED",
  myRole: "SEER",
  initialRoles: {
    p1: "SEER",
    p2: "WEREWOLF",
    p3: "ROBBER",
    p4: "VILLAGER",
    CENTER_0: "TROUBLEMAKER",
    CENTER_1: "HUNTER",
  },
  finalRoles: {
    p1: "SEER",
    p2: "WEREWOLF",
    p3: "ROBBER",
    p4: "VILLAGER",
    CENTER_0: "TROUBLEMAKER",
    CENTER_1: "HUNTER",
  },
  allActions: [
    { actorId: "p1", type: "SEER_LOOK_PLAYER", targetIds: ["p2"], result: ["WEREWOLF"], timestamp: 0 },
    { actorId: "p3", type: "ROBBER_SWAP", targetIds: ["p4"], result: ["VILLAGER"], timestamp: 0 },
  ],
  allVotes: { p1: "p2", p2: "p1", p3: "p2", p4: "p2" },
  executedPlayerIds: ["p2"],
  winners: ["p1", "p3", "p4"],
  winningTeam: "VILLAGE",
});

export const resultWerewolfWinState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "FINISHED",
  myRole: "SEER",
  initialRoles: {
    p1: "SEER",
    p2: "WEREWOLF",
    p3: "ROBBER",
    p4: "VILLAGER",
    CENTER_0: "TROUBLEMAKER",
    CENTER_1: "HUNTER",
  },
  finalRoles: {
    p1: "SEER",
    p2: "WEREWOLF",
    p3: "ROBBER",
    p4: "VILLAGER",
    CENTER_0: "TROUBLEMAKER",
    CENTER_1: "HUNTER",
  },
  allActions: [],
  allVotes: { p1: "p3", p2: "p1", p3: "p4", p4: "p3" },
  executedPlayerIds: ["p3"],
  winners: ["p2"],
  winningTeam: "WEREWOLF",
});

export const resultSwappedState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "FINISHED",
  myRole: "ROBBER",
  initialRoles: {
    p1: "ROBBER",
    p2: "WEREWOLF",
    p3: "SEER",
    p4: "VILLAGER",
    CENTER_0: "TROUBLEMAKER",
    CENTER_1: "HUNTER",
  },
  finalRoles: {
    p1: "WEREWOLF",
    p2: "ROBBER",
    p3: "SEER",
    p4: "VILLAGER",
    CENTER_0: "TROUBLEMAKER",
    CENTER_1: "HUNTER",
  },
  allActions: [
    { actorId: "p1", type: "ROBBER_SWAP", targetIds: ["p2"], result: ["WEREWOLF"], timestamp: 0 },
    { actorId: "p3", type: "SEER_LOOK_PLAYER", targetIds: ["p1"], result: ["WEREWOLF"], timestamp: 0 },
  ],
  allVotes: { p1: "p3", p2: "p1", p3: "p1", p4: "p1" },
  executedPlayerIds: ["p1"],
  winners: ["p2", "p3", "p4"],
  winningTeam: "VILLAGE",
});

// ========================================
// HUNTER_REVENGE
// ========================================

export const hunterRevengeExecutedState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "HUNTER_REVENGE",
  myRole: "HUNTER",
  isExecutedHunter: true,
  executedHunterIds: ["p1"],
  hunterRevengeChosen: {},
  allVotes: { p1: "p2", p2: "p3", p3: "p1", p4: "p1" },
  phaseStartedAt: Date.now(),
});

export const hunterRevengeWaitingState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "HUNTER_REVENGE",
  myRole: "SEER",
  isExecutedHunter: false,
  executedHunterIds: ["p2"],
  hunterRevengeChosen: {},
  allVotes: { p1: "p2", p2: "p3", p3: "p2", p4: "p2" },
  myActions: [
    { actorId: "p1", type: "SEER_LOOK_PLAYER", targetIds: ["p3"], result: ["ROBBER"], timestamp: 0 },
  ],
  actionResults: [
    { type: "SEER_LOOK_PLAYER", targetIds: ["p3"], revealedRoles: ["ROBBER"] },
  ],
  phaseStartedAt: Date.now(),
});

export const hunterRevengeChosenState: ClientRoomState = withGame({
  ...BASE_GAME_STATE,
  phase: "HUNTER_REVENGE",
  myRole: "HUNTER",
  isExecutedHunter: true,
  executedHunterIds: ["p1"],
  hunterRevengeChosen: { p1: true },
  allVotes: { p1: "p2", p2: "p3", p3: "p1", p4: "p1" },
  phaseStartedAt: Date.now(),
});
