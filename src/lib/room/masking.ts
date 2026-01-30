import type { PlayerId } from "../game/types";
import { ROLES } from "../game/types";
import { maskGameState, maskGameStateForWerewolf } from "../game/masking";
import type { ClientRoomState, RoomState } from "./types";

/**
 * サーバー側の RoomState をクライアント用にマスキングする
 */
export function maskRoomState(
  state: RoomState,
  playerId: PlayerId
): ClientRoomState {
  let clientGame = null;

  if (state.game) {
    // プレイヤーの役職に応じてマスキング
    const myRole = state.game.initialDistribution[playerId];
    if (myRole && ROLES[myRole].isWerewolfNightAlly) {
      clientGame = maskGameStateForWerewolf(state.game, playerId);
    } else {
      clientGame = maskGameState(state.game, playerId);
    }
  }

  return {
    roomId: state.roomId,
    members: state.members,
    config: state.config,
    playerStats: state.playerStats,
    roomStats: state.roomStats,
    game: clientGame,
  };
}
