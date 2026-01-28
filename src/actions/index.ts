// Room actions
export {
  createRoomAction,
  joinRoomAction,
  leaveRoomAction,
  kickPlayerAction,
  updateGameConfigAction,
  checkRoomExistsAction,
  createTestRoomAction,
  type ActionResult,
} from "./room";

// Game actions
export {
  startGameAction,
  submitNightActionAction,
  autoSkipNightActionAction,
  submitVoteAction,
  autoVoteAction,
  submitHunterRevengeAction,
  autoHunterRevengeAction,
  advancePhaseAction,
  resetGameAction,
  getClientGameStateAction,
  getCurrentPlayerIdAction,
} from "./game";
