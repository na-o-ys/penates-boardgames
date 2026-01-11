import {
  test,
  expect,
  createRoom,
  joinRoom,
  waitForPlayerInList,
  startGame,
  waitForPhase,
  advancePhase,
  voteForPlayer,
  playAgain,
  type PlayerContext,
} from "./fixtures/test-helpers";

test.describe("フルゲームシナリオ", () => {
  test("FG-1: 3人プレイ基本シナリオ（ゲーム開始から結果まで）", async ({
    playerA,
    playerB,
    playerC,
  }) => {
    // ========================================
    // 1. 部屋作成と参加
    // ========================================
    const roomId = await createRoom(playerA.page, playerA.name);
    await joinRoom(playerB.page, playerB.name, roomId);
    await joinRoom(playerC.page, playerC.name, roomId);

    // 全員参加を確認
    for (const player of [playerA, playerB, playerC]) {
      await waitForPlayerInList(player.page, playerA.name);
      await waitForPlayerInList(player.page, playerB.name);
      await waitForPlayerInList(player.page, playerC.name);
    }

    // ========================================
    // 2. ゲーム開始
    // ========================================
    await startGame(playerA.page);

    // 全プレイヤーがゲームフェーズに移行
    for (const player of [playerA, playerB, playerC]) {
      // 夜フェーズまたは昼フェーズ（役職によって自動スキップの可能性）
      await expect(
        player.page
          .getByText("夜フェーズ")
          .or(player.page.getByText("議論フェーズ"))
      ).toBeVisible({ timeout: 15000 });
    }

    // ========================================
    // 3. 夜フェーズのアクション
    // ========================================
    // 各プレイヤーが自分の役職を確認できる
    for (const player of [playerA, playerB, playerC]) {
      // 役職カードまたは役職名が表示される
      await expect(
        player.page.getByText(/人狼|村人|占い師|怪盗|トラブルメーカー|吊人/)
      ).toBeVisible({ timeout: 10000 });
    }

    // 夜アクションの処理
    // アクションボタンがあればクリック、なければスキップ/自動進行を待つ
    for (const player of [playerA, playerB, playerC]) {
      const skipButton = player.page.getByRole("button", { name: "行動をスキップ" });
      const confirmButton = player.page.getByRole("button", { name: "確定" });

      // スキップまたは確定ボタンがあれば押す
      if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipButton.click();
      } else if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }
      // ボタンがない場合は自動進行を待つ
    }

    // ========================================
    // 4. 昼フェーズ（議論フェーズ）
    // ========================================
    // 昼フェーズへの遷移を待機
    await waitForPhase(playerA.page, "議論フェーズ");

    for (const player of [playerA, playerB, playerC]) {
      await waitForPhase(player.page, "議論フェーズ");
    }

    // ホストが投票フェーズへ進める
    await advancePhase(playerA.page, "投票フェーズへ進む");

    // ========================================
    // 5. 投票フェーズ
    // ========================================
    // 全プレイヤーが投票フェーズに移行
    for (const player of [playerA, playerB, playerC]) {
      await waitForPhase(player.page, "投票");
    }

    // 各プレイヤーが投票（ランダムに投票）
    const players: PlayerContext[] = [playerA, playerB, playerC];
    const names = [playerA.name, playerB.name, playerC.name];

    for (let i = 0; i < players.length; i++) {
      // 自分以外に投票
      const targetIndex = (i + 1) % players.length;
      const targetName = names[targetIndex];

      await voteForPlayer(players[i].page, targetName);
    }

    // ========================================
    // 6. 結果フェーズ
    // ========================================
    // 結果画面への遷移を待機（h1で勝利/敗北を確認）
    for (const player of players) {
      await expect(
        player.page.getByRole("heading", { name: "勝利", level: 1 })
          .or(player.page.getByRole("heading", { name: "敗北", level: 1 }))
      ).toBeVisible({ timeout: 15000 });
    }

    // 勝敗結果が表示される
    await expect(
      playerA.page
        .getByText("村人陣営の勝利")
        .or(playerA.page.getByText("人狼陣営の勝利"))
        .or(playerA.page.getByText("吊人の勝利"))
        .or(playerA.page.getByText("引き分け"))
    ).toBeVisible();

    // 全員の最終役職が公開される
    await expect(playerA.page.getByText("最終役職")).toBeVisible();

    // 中央カードが表示される
    await expect(playerA.page.getByText("中央カード")).toBeVisible();

    // ========================================
    // 7. もう一度遊ぶ
    // ========================================
    await playAgain(playerA.page);

    // 全プレイヤーがロビーに戻る（ロビーのh1ヘッダーで確認）
    for (const player of players) {
      await expect(
        player.page.getByRole("heading", { name: "ロビー", level: 1 })
      ).toBeVisible({ timeout: 10000 });
    }

    // プレイヤー一覧が維持されている
    for (const player of players) {
      await waitForPlayerInList(player.page, playerA.name);
      await waitForPlayerInList(player.page, playerB.name);
      await waitForPlayerInList(player.page, playerC.name);
    }
  });

  test("FG-2: リアルタイム同期の確認", async ({ playerA, playerB, playerC }) => {
    const roomId = await createRoom(playerA.page, playerA.name);

    // プレイヤーBが参加
    await joinRoom(playerB.page, playerB.name, roomId);

    // プレイヤーAの画面がリアルタイムで更新される
    await waitForPlayerInList(playerA.page, playerB.name);

    // プレイヤーCが参加
    await joinRoom(playerC.page, playerC.name, roomId);

    // 両方の画面がリアルタイムで更新される
    await waitForPlayerInList(playerA.page, playerC.name);
    await waitForPlayerInList(playerB.page, playerC.name);
  });

  test("FG-3: ゲーム開始時の全員同期", async ({ playerA, playerB, playerC }) => {
    const roomId = await createRoom(playerA.page, playerA.name);
    await joinRoom(playerB.page, playerB.name, roomId);
    await joinRoom(playerC.page, playerC.name, roomId);

    await waitForPlayerInList(playerA.page, playerC.name);

    // ホストがゲーム開始
    const startButton = playerA.page.getByRole("button", { name: "ゲーム開始" });
    await startButton.click();

    // 全プレイヤーが同時にゲームフェーズに移行することを確認
    const phasePromises = [playerA, playerB, playerC].map((player) =>
      expect(
        player.page
          .getByText("夜フェーズ")
          .or(player.page.getByText("議論フェーズ"))
      ).toBeVisible({ timeout: 15000 })
    );

    await Promise.all(phasePromises);
  });
});

test.describe("投票と勝敗判定", () => {
  test("全員が同じプレイヤーに投票した場合", async ({ playerA, playerB, playerC }) => {
    const roomId = await createRoom(playerA.page, playerA.name);
    await joinRoom(playerB.page, playerB.name, roomId);
    await joinRoom(playerC.page, playerC.name, roomId);

    await waitForPlayerInList(playerA.page, playerC.name);
    await startGame(playerA.page);

    // 夜フェーズのアクションを処理
    for (const player of [playerA, playerB, playerC]) {
      const skipButton = player.page.getByRole("button", { name: "行動をスキップ" });
      if (await skipButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await skipButton.click();
      }
    }

    // 昼フェーズへの遷移を待機
    await waitForPhase(playerA.page, "議論フェーズ");

    // 投票フェーズへ
    await advancePhase(playerA.page, "投票フェーズへ進む");

    // 全員が同じプレイヤー（Charlie）に投票
    for (const player of [playerA, playerB, playerC]) {
      await waitForPhase(player.page, "投票");
    }

    await voteForPlayer(playerA.page, playerC.name);
    await voteForPlayer(playerB.page, playerC.name);
    await voteForPlayer(playerC.page, playerA.name); // Charlieは別の人に投票

    // 結果画面に遷移したことを確認（h1の勝利/敗北ヘッダーで判定）
    await expect(
      playerA.page.getByRole("heading", { name: "勝利", level: 1 })
        .or(playerA.page.getByRole("heading", { name: "敗北", level: 1 }))
    ).toBeVisible({ timeout: 15000 });

    // 処刑結果セクションが表示される
    await expect(
      playerA.page.getByText("処刑結果")
    ).toBeVisible();

    // 処刑者欄にCharlieの名前が表示される（bg-red-900/50のdiv内）
    await expect(
      playerA.page.locator(".bg-red-900\\/50").getByText(playerC.name)
    ).toBeVisible();
  });
});

test.describe("ページリロード耐性", () => {
  test("ゲーム中にリロードしても状態が復元される", async ({ playerA, playerB, playerC }) => {
    const roomId = await createRoom(playerA.page, playerA.name);
    await joinRoom(playerB.page, playerB.name, roomId);
    await joinRoom(playerC.page, playerC.name, roomId);

    await waitForPlayerInList(playerA.page, playerC.name);
    await startGame(playerA.page);

    // 夜フェーズを確認
    await expect(
      playerB.page.getByRole("heading", { name: "夜フェーズ", level: 1 })
    ).toBeVisible({ timeout: 15000 });

    // プレイヤーBがページをリロード
    await playerB.page.reload();

    // リロード後もゲーム状態（夜フェーズ）が復元される
    // 役職名が表示されていることを確認（夜フェーズの証拠）
    await expect(
      playerB.page.getByText(/人狼|村人|占い師|怪盗|トラブルメーカー|吊人/)
    ).toBeVisible({ timeout: 15000 });

    // 夜フェーズのヘッダーまたは行動UIが表示されていることを確認
    await expect(
      playerB.page.getByRole("heading", { name: "夜フェーズ", level: 1 })
        .or(playerB.page.getByRole("button", { name: "行動をスキップ" }))
    ).toBeVisible({ timeout: 5000 });
  });
});
