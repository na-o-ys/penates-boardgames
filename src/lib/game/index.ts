// Types
export * from "./types";

// Distribution
export { distributeRoles, distributeRolesFixed, distributeRolesWithSeed } from "./distribution";

// Validation
export {
  validateAction,
  validateVote,
  hasPlayerActed,
  haveAllPlayersActed,
  haveAllPlayersVoted,
  getValidActionTypes,
  SKIP_VOTE,
  type ValidationError,
  type ValidationResult,
} from "./validator";

// Resolver
export {
  resolveFinalRoles,
  getActionResult,
  hasMultipleWerewolves,
  getWerewolfPlayerIds,
} from "./resolver";

// Judge
export {
  countVotes,
  type VoteCount,
  calculateExecutedPlayers,
  determineWinner,
  calculateGameResult,
} from "./judge";

// Reducer
export {
  startGame,
  startGameWithDistribution,
  executeNightAction,
  executeVote,
  executeHunterRevenge,
  advancePhase,
  calculateStats,
} from "./reducer";

// Masking
export { maskGameState, maskGameStateForWerewolf } from "./masking";

// Revealed Roles
export { buildRevealedInfo, getSwapReason, type RevealedInfo } from "./revealedRoles";
