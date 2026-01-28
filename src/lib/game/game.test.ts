import { describe, it, expect } from "vitest";
import type { GameAction, GameState, Player, Role } from "./types";
import {
  createInitialGameState,
  addPlayer,
  updateConfig,
  startGameWithDistribution,
  executeNightAction,
  executeVote,
  advancePhase,
} from "./reducer";
import { resolveFinalRoles } from "./resolver";
import { calculateGameResult } from "./judge";
import { maskGameState, maskGameStateForWerewolf } from "./masking";

// ========================================
// テストヘルパー関数
// ========================================

function createTestPlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `プレイヤー${i + 1}`,
    isHost: i === 0,
    isConnected: true,
  }));
}

function setupGame(
  playerCount: number,
  roles: Role[]
): { state: GameState; players: Player[] } {
  const players = createTestPlayers(playerCount);
  let state = createInitialGameState("test-room");

  for (const player of players) {
    state = addPlayer(state, player);
  }

  state = updateConfig(state, { ...state.config, roles });

  return { state, players };
}

function createAction(
  actorId: string,
  type: GameAction["type"],
  targetIds: string[] = []
): GameAction {
  return {
    actorId,
    type,
    targetIds,
    timestamp: Date.now(),
  };
}

// ========================================
// シナリオテスト
// ========================================

describe("ゲームシナリオテスト", () => {
  describe("シナリオ1: 村人陣営の勝利（人狼を処刑）", () => {
    it("占い師が人狼を発見し、投票で人狼を処刑する", () => {
      // 3人プレイ: 占い師、人狼、村人 + 中央2枚（村人、村人）
      const { state, players } = setupGame(3, [
        "SEER",
        "WEREWOLF",
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
      ]);

      // 固定配置でゲーム開始
      const distribution: Record<string, Role> = {
        "player-1": "SEER",
        "player-2": "WEREWOLF",
        "player-3": "VILLAGER",
        CENTER_0: "VILLAGER",
        CENTER_1: "VILLAGER",
      };

      let gameState = startGameWithDistribution(state, distribution);
      expect(gameState.phase).toBe("NIGHT");

      // 占い師がplayer-2を占う
      const seerAction = createAction("player-1", "SEER_LOOK_PLAYER", [
        "player-2",
      ]);
      gameState = executeNightAction(gameState, seerAction);

      // 占い師のアクション結果を確認
      const seerActionResult = gameState.actions.find(
        (a) => a.actorId === "player-1"
      );
      expect(seerActionResult?.result).toEqual(["WEREWOLF"]);

      // 人狼はスキップ（単独なので中央を見てもよいがスキップ）
      const werewolfAction = createAction("player-2", "SKIP", []);
      gameState = executeNightAction(gameState, werewolfAction);

      // 全員のアクションが完了したので昼フェーズへ自動遷移
      expect(gameState.phase).toBe("DAY");

      // 昼フェーズを終了して投票フェーズへ
      gameState = advancePhase(gameState);
      expect(gameState.phase).toBe("VOTING");

      // 全員がplayer-2（人狼）に投票
      gameState = executeVote(gameState, "player-1", "player-2");
      gameState = executeVote(gameState, "player-2", "player-1"); // 人狼は占い師に投票
      gameState = executeVote(gameState, "player-3", "player-2");

      // 全員投票完了で結果フェーズへ自動遷移
      expect(gameState.phase).toBe("FINISHED");

      // 最終結果を計算
      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);
      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // 人狼（player-2）が処刑される
      expect(result.executedPlayerIds).toContain("player-2");
      // 村人陣営の勝利
      expect(result.winningTeam).toBe("VILLAGE");
      expect(result.winners).toContain("player-1");
      expect(result.winners).toContain("player-3");
    });
  });

  describe("シナリオ2: 人狼陣営の勝利（人狼が生存）", () => {
    it("人狼が処刑を免れ、村人が処刑される", () => {
      // 3人プレイ: 人狼、村人、村人 + 中央2枚
      const { state, players } = setupGame(3, [
        "WEREWOLF",
        "VILLAGER",
        "VILLAGER",
        "SEER",
        "ROBBER",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "WEREWOLF",
        "player-2": "VILLAGER",
        "player-3": "VILLAGER",
        CENTER_0: "SEER",
        CENTER_1: "ROBBER",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 人狼は単独なので中央カードを見る
      const werewolfAction = createAction("player-1", "WEREWOLF_LOOK", [
        "CENTER_0",
      ]);
      gameState = executeNightAction(gameState, werewolfAction);

      // 人狼のアクション結果を確認（中央に占い師がある）
      const werewolfActionResult = gameState.actions.find(
        (a) => a.actorId === "player-1"
      );
      expect(werewolfActionResult?.result).toEqual(["SEER"]);

      // 夜フェーズ終了、昼フェーズへ
      expect(gameState.phase).toBe("DAY");

      // 投票フェーズへ
      gameState = advancePhase(gameState);

      // 人狼がうまく村人に誘導し、player-2が処刑される
      gameState = executeVote(gameState, "player-1", "player-2");
      gameState = executeVote(gameState, "player-2", "player-3");
      gameState = executeVote(gameState, "player-3", "player-2");

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);
      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // player-2（村人）が処刑される
      expect(result.executedPlayerIds).toContain("player-2");
      // 人狼陣営の勝利
      expect(result.winningTeam).toBe("WEREWOLF");
      expect(result.winners).toContain("player-1");
    });
  });

  describe("シナリオ3: 吊人の勝利（単独勝利）", () => {
    it("吊人が処刑されて単独勝利", () => {
      // 3人プレイ: 吊人、人狼、村人 + 中央2枚
      const { state, players } = setupGame(3, [
        "TANNER",
        "WEREWOLF",
        "VILLAGER",
        "SEER",
        "ROBBER",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "TANNER",
        "player-2": "WEREWOLF",
        "player-3": "VILLAGER",
        CENTER_0: "SEER",
        CENTER_1: "ROBBER",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 人狼は単独なので中央カードを見る
      const werewolfAction = createAction("player-2", "WEREWOLF_LOOK", [
        "CENTER_0",
      ]);
      gameState = executeNightAction(gameState, werewolfAction);

      // 夜フェーズ終了
      expect(gameState.phase).toBe("DAY");

      gameState = advancePhase(gameState);

      // 全員が吊人（player-1）に投票
      gameState = executeVote(gameState, "player-1", "player-2");
      gameState = executeVote(gameState, "player-2", "player-1");
      gameState = executeVote(gameState, "player-3", "player-1");

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);
      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // 吊人（player-1）が処刑される
      expect(result.executedPlayerIds).toContain("player-1");
      // 吊人の単独勝利
      expect(result.winningTeam).toBe("MINORITY");
      expect(result.winners).toEqual(["player-1"]);
    });
  });

  describe("シナリオ4: 平和村（人狼不在で誰も処刑しない）", () => {
    it("人狼がおらず全員バラバラ投票で村人陣営の勝利", () => {
      // 3人プレイ: 村人、村人、村人 + 中央2枚（人狼、人狼）
      const { state, players } = setupGame(3, [
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
        "WEREWOLF",
        "WEREWOLF",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "VILLAGER",
        "player-2": "VILLAGER",
        "player-3": "VILLAGER",
        CENTER_0: "WEREWOLF",
        CENTER_1: "WEREWOLF",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 村人は夜アクションがないので即座に昼フェーズへ
      expect(gameState.phase).toBe("DAY");

      gameState = advancePhase(gameState);

      // 全員バラバラに投票（処刑なし）
      gameState = executeVote(gameState, "player-1", "player-2");
      gameState = executeVote(gameState, "player-2", "player-3");
      gameState = executeVote(gameState, "player-3", "player-1");

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);
      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // 誰も処刑されない
      expect(result.executedPlayerIds).toEqual([]);
      // 村人陣営の勝利（平和村で誰も処刑しなかった）
      expect(result.winningTeam).toBe("VILLAGE");
    });
  });

  describe("シナリオ5: 怪盗による役職交換", () => {
    it("怪盗が人狼のカードを奪い、元人狼が処刑されて村人陣営の勝利", () => {
      // 3人プレイ: 怪盗、人狼、村人 + 中央2枚
      const { state, players } = setupGame(3, [
        "ROBBER",
        "WEREWOLF",
        "VILLAGER",
        "SEER",
        "TANNER",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "ROBBER",
        "player-2": "WEREWOLF",
        "player-3": "VILLAGER",
        CENTER_0: "SEER",
        CENTER_1: "TANNER",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 人狼は単独なので中央を見る
      const werewolfAction = createAction("player-2", "WEREWOLF_LOOK", [
        "CENTER_0",
      ]);
      gameState = executeNightAction(gameState, werewolfAction);

      // 怪盗がplayer-2（人狼）のカードを奪う
      const robberAction = createAction("player-1", "ROBBER_SWAP", ["player-2"]);
      gameState = executeNightAction(gameState, robberAction);

      // 怪盗のアクション結果を確認（人狼のカードを見る）
      const robberActionResult = gameState.actions.find(
        (a) => a.actorId === "player-1"
      );
      expect(robberActionResult?.result).toEqual(["WEREWOLF"]);

      // 夜フェーズ終了
      expect(gameState.phase).toBe("DAY");

      gameState = advancePhase(gameState);

      // 全員がplayer-2に投票
      gameState = executeVote(gameState, "player-1", "player-2");
      gameState = executeVote(gameState, "player-2", "player-1");
      gameState = executeVote(gameState, "player-3", "player-2");

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);

      // 役職交換後: player-1が人狼、player-2が怪盗
      expect(finalRoles["player-1"]).toBe("WEREWOLF");
      expect(finalRoles["player-2"]).toBe("ROBBER");

      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // player-2（今は怪盗）が処刑される
      expect(result.executedPlayerIds).toContain("player-2");
      // 人狼（player-1、元怪盗）が生存しているので人狼陣営の勝利
      expect(result.winningTeam).toBe("WEREWOLF");
    });

    it("怪盗が村人のカードを奪い、人狼が処刑されて村人陣営の勝利", () => {
      // 3人プレイ: 怪盗、人狼、村人 + 中央2枚
      const { state, players } = setupGame(3, [
        "ROBBER",
        "WEREWOLF",
        "VILLAGER",
        "SEER",
        "TANNER",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "ROBBER",
        "player-2": "WEREWOLF",
        "player-3": "VILLAGER",
        CENTER_0: "SEER",
        CENTER_1: "TANNER",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 人狼は単独なので中央を見る
      const werewolfAction = createAction("player-2", "WEREWOLF_LOOK", [
        "CENTER_0",
      ]);
      gameState = executeNightAction(gameState, werewolfAction);

      // 怪盗がplayer-3（村人）のカードを奪う
      const robberAction = createAction("player-1", "ROBBER_SWAP", ["player-3"]);
      gameState = executeNightAction(gameState, robberAction);

      expect(gameState.phase).toBe("DAY");

      gameState = advancePhase(gameState);

      // 全員がplayer-2（人狼）に投票
      gameState = executeVote(gameState, "player-1", "player-2");
      gameState = executeVote(gameState, "player-2", "player-1");
      gameState = executeVote(gameState, "player-3", "player-2");

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);

      // 役職交換後: player-1が村人、player-3が怪盗
      expect(finalRoles["player-1"]).toBe("VILLAGER");
      expect(finalRoles["player-3"]).toBe("ROBBER");
      expect(finalRoles["player-2"]).toBe("WEREWOLF");

      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // player-2（人狼）が処刑される
      expect(result.executedPlayerIds).toContain("player-2");
      // 村人陣営の勝利
      expect(result.winningTeam).toBe("VILLAGE");
    });
  });

  describe("シナリオ6: トラブルメーカーによる役職交換", () => {
    it("トラブルメーカーが人狼と村人を入れ替え、元村人が処刑される", () => {
      // 4人プレイ
      const { state, players } = setupGame(4, [
        "TROUBLEMAKER",
        "WEREWOLF",
        "VILLAGER",
        "VILLAGER",
        "SEER",
        "TANNER",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "TROUBLEMAKER",
        "player-2": "WEREWOLF",
        "player-3": "VILLAGER",
        "player-4": "VILLAGER",
        CENTER_0: "SEER",
        CENTER_1: "TANNER",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 人狼は単独なので中央を見る
      const werewolfAction = createAction("player-2", "WEREWOLF_LOOK", [
        "CENTER_0",
      ]);
      gameState = executeNightAction(gameState, werewolfAction);

      // トラブルメーカーがplayer-2（人狼）とplayer-3（村人）を入れ替え
      const troublemakerAction = createAction("player-1", "TROUBLEMAKER_SWAP", [
        "player-2",
        "player-3",
      ]);
      gameState = executeNightAction(gameState, troublemakerAction);

      // トラブルメーカーは結果を見ない
      const troublemakerResult = gameState.actions.find(
        (a) => a.actorId === "player-1"
      );
      expect(troublemakerResult?.result).toEqual([]);

      expect(gameState.phase).toBe("DAY");

      gameState = advancePhase(gameState);

      // player-2に投票（本人は自分が人狼だと思っている）
      gameState = executeVote(gameState, "player-1", "player-2");
      gameState = executeVote(gameState, "player-2", "player-3"); // 元人狼は無実を主張
      gameState = executeVote(gameState, "player-3", "player-2");
      gameState = executeVote(gameState, "player-4", "player-2");

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);

      // 役職交換後: player-2が村人、player-3が人狼
      expect(finalRoles["player-2"]).toBe("VILLAGER");
      expect(finalRoles["player-3"]).toBe("WEREWOLF");

      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // player-2（今は村人）が処刑される
      expect(result.executedPlayerIds).toContain("player-2");
      // 人狼（player-3、元村人）が生存しているので人狼陣営の勝利
      expect(result.winningTeam).toBe("WEREWOLF");
    });
  });

  describe("シナリオ7: 複数人狼の場合", () => {
    it("人狼が2人いて互いを確認し、1人が処刑されても人狼陣営は負ける", () => {
      // 4人プレイ: 人狼、人狼、村人、村人 + 中央2枚
      const { state, players } = setupGame(4, [
        "WEREWOLF",
        "WEREWOLF",
        "VILLAGER",
        "VILLAGER",
        "SEER",
        "ROBBER",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "WEREWOLF",
        "player-2": "WEREWOLF",
        "player-3": "VILLAGER",
        "player-4": "VILLAGER",
        CENTER_0: "SEER",
        CENTER_1: "ROBBER",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 人狼同士はお互いを確認できるのでスキップ
      const werewolf1Action = createAction("player-1", "SKIP", []);
      gameState = executeNightAction(gameState, werewolf1Action);

      const werewolf2Action = createAction("player-2", "SKIP", []);
      gameState = executeNightAction(gameState, werewolf2Action);

      expect(gameState.phase).toBe("DAY");

      gameState = advancePhase(gameState);

      // player-1（人狼）が処刑される
      gameState = executeVote(gameState, "player-1", "player-3");
      gameState = executeVote(gameState, "player-2", "player-3");
      gameState = executeVote(gameState, "player-3", "player-1");
      gameState = executeVote(gameState, "player-4", "player-1");

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);
      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // player-1（人狼）が処刑される
      expect(result.executedPlayerIds).toContain("player-1");
      // 人狼が1人でも処刑されたので村人陣営の勝利
      expect(result.winningTeam).toBe("VILLAGE");
    });
  });

  describe("シナリオ8: 占い師が中央カードを見る", () => {
    it("占い師が中央カード2枚を見て人狼がいないことを確認", () => {
      // 3人プレイ
      const { state } = setupGame(3, [
        "SEER",
        "VILLAGER",
        "VILLAGER",
        "WEREWOLF",
        "ROBBER",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "SEER",
        "player-2": "VILLAGER",
        "player-3": "VILLAGER",
        CENTER_0: "WEREWOLF",
        CENTER_1: "ROBBER",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 占い師が中央カード2枚を見る
      const seerAction = createAction("player-1", "SEER_LOOK_CENTER", [
        "CENTER_0",
        "CENTER_1",
      ]);
      gameState = executeNightAction(gameState, seerAction);

      // 占い師のアクション結果を確認
      const seerActionResult = gameState.actions.find(
        (a) => a.actorId === "player-1"
      );
      expect(seerActionResult?.result).toEqual(["WEREWOLF", "ROBBER"]);

      expect(gameState.phase).toBe("DAY");
    });
  });

  describe("シナリオ9: 平和村で村人処刑（全員敗北）", () => {
    it("人狼がおらず村人が処刑されると全員敗北", () => {
      // 3人プレイ: 村人、村人、村人 + 中央2枚（人狼、人狼）
      const { state, players } = setupGame(3, [
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
        "WEREWOLF",
        "WEREWOLF",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "VILLAGER",
        "player-2": "VILLAGER",
        "player-3": "VILLAGER",
        CENTER_0: "WEREWOLF",
        CENTER_1: "WEREWOLF",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 村人は夜アクションがないので即座に昼フェーズへ
      expect(gameState.phase).toBe("DAY");

      gameState = advancePhase(gameState);

      // player-1に2票集まり処刑される
      gameState = executeVote(gameState, "player-1", "player-2");
      gameState = executeVote(gameState, "player-2", "player-1");
      gameState = executeVote(gameState, "player-3", "player-1");

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);
      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // player-1（村人）が処刑される
      expect(result.executedPlayerIds).toContain("player-1");
      // 平和村で村人を処刑したので全員敗北（勝者なし）
      expect(result.winningTeam).toBeNull();
      expect(result.winners).toEqual([]);
    });
  });

  describe("シナリオ10: 同票による複数人処刑", () => {
    it("村人と吊人が同時に処刑された場合、吊人の勝利", () => {
      // 4人プレイ: 村人、村人、吊人、人狼 + 中央2枚
      const { state, players } = setupGame(4, [
        "VILLAGER",
        "VILLAGER",
        "TANNER",
        "WEREWOLF",
        "SEER",
        "ROBBER",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "VILLAGER",
        "player-2": "VILLAGER",
        "player-3": "TANNER",
        "player-4": "WEREWOLF",
        CENTER_0: "SEER",
        CENTER_1: "ROBBER",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 人狼は中央を見る
      const werewolfAction = createAction("player-4", "WEREWOLF_LOOK", [
        "CENTER_0",
      ]);
      gameState = executeNightAction(gameState, werewolfAction);

      expect(gameState.phase).toBe("DAY");

      gameState = advancePhase(gameState);

      // player-1とplayer-3に2票ずつ（同票）
      gameState = executeVote(gameState, "player-1", "player-3"); // 村人→吊人
      gameState = executeVote(gameState, "player-2", "player-1"); // 村人→村人
      gameState = executeVote(gameState, "player-3", "player-1"); // 吊人→村人
      gameState = executeVote(gameState, "player-4", "player-3"); // 人狼→吊人

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);
      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // player-1（村人）とplayer-3（吊人）の両方が処刑される
      expect(result.executedPlayerIds).toContain("player-1");
      expect(result.executedPlayerIds).toContain("player-3");
      expect(result.executedPlayerIds.length).toBe(2);
      // 吊人が処刑されたので吊人の勝利
      expect(result.winningTeam).toBe("MINORITY");
      expect(result.winners).toEqual(["player-3"]);
    });

    it("村人と人狼が同時に処刑された場合、村人陣営の勝利", () => {
      // 4人プレイ: 村人、村人、村人、人狼 + 中央2枚
      const { state, players } = setupGame(4, [
        "VILLAGER",
        "VILLAGER",
        "VILLAGER",
        "WEREWOLF",
        "SEER",
        "ROBBER",
      ]);

      const distribution: Record<string, Role> = {
        "player-1": "VILLAGER",
        "player-2": "VILLAGER",
        "player-3": "VILLAGER",
        "player-4": "WEREWOLF",
        CENTER_0: "SEER",
        CENTER_1: "ROBBER",
      };

      let gameState = startGameWithDistribution(state, distribution);

      // 人狼は中央を見る
      const werewolfAction = createAction("player-4", "WEREWOLF_LOOK", [
        "CENTER_0",
      ]);
      gameState = executeNightAction(gameState, werewolfAction);

      expect(gameState.phase).toBe("DAY");

      gameState = advancePhase(gameState);

      // player-1とplayer-4に2票ずつ（同票）
      gameState = executeVote(gameState, "player-1", "player-4"); // 村人→人狼
      gameState = executeVote(gameState, "player-2", "player-1"); // 村人→村人
      gameState = executeVote(gameState, "player-3", "player-4"); // 村人→人狼
      gameState = executeVote(gameState, "player-4", "player-1"); // 人狼→村人

      expect(gameState.phase).toBe("FINISHED");

      const playerIds = players.map((p) => p.id);
      const finalRoles = resolveFinalRoles(distribution, gameState.actions);
      const result = calculateGameResult(gameState.votes, distribution, finalRoles, playerIds);

      // player-1（村人）とplayer-4（人狼）の両方が処刑される
      expect(result.executedPlayerIds).toContain("player-1");
      expect(result.executedPlayerIds).toContain("player-4");
      expect(result.executedPlayerIds.length).toBe(2);
      // 人狼が処刑されたので村人陣営の勝利
      expect(result.winningTeam).toBe("VILLAGE");
      expect(result.winners).toContain("player-1");
      expect(result.winners).toContain("player-2");
      expect(result.winners).toContain("player-3");
    });
  });
});

describe("データマスキングテスト", () => {
  it("夜フェーズで自分の役職のみ見える", () => {
    const { state } = setupGame(3, [
      "SEER",
      "WEREWOLF",
      "VILLAGER",
      "VILLAGER",
      "VILLAGER",
    ]);

    const distribution: Record<string, Role> = {
      "player-1": "SEER",
      "player-2": "WEREWOLF",
      "player-3": "VILLAGER",
      CENTER_0: "VILLAGER",
      CENTER_1: "VILLAGER",
    };

    const gameState = startGameWithDistribution(state, distribution);

    const player1View = maskGameState(gameState, "player-1");
    expect(player1View.myRole).toBe("SEER");
    expect(player1View.finalRoles).toBeUndefined();

    const player2View = maskGameState(gameState, "player-2");
    expect(player2View.myRole).toBe("WEREWOLF");
  });

  it("人狼は仲間の人狼を確認できる", () => {
    const { state } = setupGame(4, [
      "WEREWOLF",
      "WEREWOLF",
      "VILLAGER",
      "VILLAGER",
      "SEER",
      "ROBBER",
    ]);

    const distribution: Record<string, Role> = {
      "player-1": "WEREWOLF",
      "player-2": "WEREWOLF",
      "player-3": "VILLAGER",
      "player-4": "VILLAGER",
      CENTER_0: "SEER",
      CENTER_1: "ROBBER",
    };

    const gameState = startGameWithDistribution(state, distribution);

    const player1View = maskGameStateForWerewolf(gameState, "player-1");
    expect(player1View.myRole).toBe("WEREWOLF");
    expect(player1View.fellowWerewolves).toEqual(["player-2"]);

    const player2View = maskGameStateForWerewolf(gameState, "player-2");
    expect(player2View.fellowWerewolves).toEqual(["player-1"]);

    // 村人は仲間情報がない
    const player3View = maskGameStateForWerewolf(gameState, "player-3");
    expect(player3View.fellowWerewolves).toBeUndefined();
  });

  it("結果フェーズで全情報が開示される", () => {
    const { state } = setupGame(3, [
      "SEER",
      "WEREWOLF",
      "VILLAGER",
      "VILLAGER",
      "VILLAGER",
    ]);

    const distribution: Record<string, Role> = {
      "player-1": "SEER",
      "player-2": "WEREWOLF",
      "player-3": "VILLAGER",
      CENTER_0: "VILLAGER",
      CENTER_1: "VILLAGER",
    };

    let gameState = startGameWithDistribution(state, distribution);

    // 占い師がplayer-2を占う
    gameState = executeNightAction(
      gameState,
      createAction("player-1", "SEER_LOOK_PLAYER", ["player-2"])
    );

    // 人狼はスキップ
    gameState = executeNightAction(
      gameState,
      createAction("player-2", "SKIP", [])
    );

    // 昼 → 投票
    gameState = advancePhase(gameState);

    // 全員がplayer-2に投票
    gameState = executeVote(gameState, "player-1", "player-2");
    gameState = executeVote(gameState, "player-2", "player-1");
    gameState = executeVote(gameState, "player-3", "player-2");

    expect(gameState.phase).toBe("FINISHED");

    const playerView = maskGameState(gameState, "player-3");

    // 全情報が開示される
    expect(playerView.finalRoles).toBeDefined();
    expect(playerView.allActions).toBeDefined();
    expect(playerView.allVotes).toBeDefined();
    expect(playerView.executedPlayerIds).toContain("player-2");
    expect(playerView.winningTeam).toBe("VILLAGE");
  });
});

describe("バリデーションテスト", () => {
  it("ロビーフェーズでアクションを実行できない", () => {
    const { state } = setupGame(3, [
      "SEER",
      "WEREWOLF",
      "VILLAGER",
      "VILLAGER",
      "VILLAGER",
    ]);

    // ロビーフェーズのまま
    expect(state.phase).toBe("LOBBY");

    const action = createAction("player-1", "SEER_LOOK_PLAYER", ["player-2"]);

    expect(() => executeNightAction(state, action)).toThrow();
  });

  it("同じプレイヤーが2回アクションできない", () => {
    const { state } = setupGame(3, [
      "SEER",
      "WEREWOLF",
      "VILLAGER",
      "VILLAGER",
      "VILLAGER",
    ]);

    const distribution: Record<string, Role> = {
      "player-1": "SEER",
      "player-2": "WEREWOLF",
      "player-3": "VILLAGER",
      CENTER_0: "VILLAGER",
      CENTER_1: "VILLAGER",
    };

    let gameState = startGameWithDistribution(state, distribution);

    // 1回目のアクション
    gameState = executeNightAction(
      gameState,
      createAction("player-1", "SEER_LOOK_PLAYER", ["player-2"])
    );

    // 2回目のアクションはエラー
    expect(() =>
      executeNightAction(
        gameState,
        createAction("player-1", "SEER_LOOK_PLAYER", ["player-3"])
      )
    ).toThrow("既にアクションを実行済みです");
  });

  it("役職に合わないアクションはエラー", () => {
    const { state } = setupGame(3, [
      "VILLAGER",
      "WEREWOLF",
      "SEER",
      "VILLAGER",
      "VILLAGER",
    ]);

    const distribution: Record<string, Role> = {
      "player-1": "VILLAGER",
      "player-2": "WEREWOLF",
      "player-3": "SEER",
      CENTER_0: "VILLAGER",
      CENTER_1: "VILLAGER",
    };

    const gameState = startGameWithDistribution(state, distribution);

    // 村人が占い師のアクションを実行しようとする
    expect(() =>
      executeNightAction(
        gameState,
        createAction("player-1", "SEER_LOOK_PLAYER", ["player-2"])
      )
    ).toThrow();
  });
});
