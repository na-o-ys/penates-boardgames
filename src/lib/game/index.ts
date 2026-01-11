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
  calculateExecutedPlayers,
  determineWinner,
  calculateGameResult,
} from "./judge";

// Reducer
export {
  createInitialGameState,
  addPlayer,
  removePlayer,
  updateConfig,
  startGame,
  startGameWithDistribution,
  executeNightAction,
  executeVote,
  advancePhase,
  resetGame,
  gameReducer,
  type GameActionType,
} from "./reducer";

// Masking
export { maskGameState, maskGameStateForWerewolf } from "./masking";
