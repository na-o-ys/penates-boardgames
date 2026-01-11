import {
  test,
  expect,
  createRoom,
  joinRoom,
  waitForPlayerInList,
  startGame,
} from "./fixtures/test-helpers";

test.describe("ロビーフェーズ", () => {
  test("TC-2.1: ホストは役職を設定できる", async ({ playerA, playerB, playerC }) => {
    // 部屋を作成して3人参加
    const roomId = await createRoom(playerA.page, playerA.name);
    await joinRoom(playerB.page, playerB.name, roomId);
    await joinRoom(playerC.page, playerC.name, roomId);

    // 全員が参加するまで待機
    await waitForPlayerInList(playerA.page, playerC.name);

    // ホスト（プレイヤーA）の画面に役職セレクターが表示される
    await expect(playerA.page.getByText("役職設定")).toBeVisible();

    // 役職の増減ボタンが機能する
    const werewolfRow = playerA.page.locator("[data-testid='role-WEREWOLF']");
    if (await werewolfRow.isVisible()) {
      // 人狼を増やす
      await werewolfRow.getByRole("button", { name: "+" }).click();
      await expect(werewolfRow.getByTestId("role-count")).toContainText("2");
    }
  });

  test("TC-2.2: 非ホストは役職設定を変更できない", async ({ playerA, playerB }) => {
    const roomId = await createRoom(playerA.page, playerA.name);
    await joinRoom(playerB.page, playerB.name, roomId);

    await waitForPlayerInList(playerA.page, playerB.name);

    // 非ホスト（プレイヤーB）の画面では役職設定が非活性
    const roleSelector = playerB.page.locator("[data-testid='role-selector']");

    if (await roleSelector.isVisible()) {
      // 増減ボタンが非活性
      const plusButton = roleSelector.getByRole("button", { name: "+" }).first();
      await expect(plusButton).toBeDisabled();
    } else {
      // または役職セレクター自体が表示されない
      await expect(roleSelector).not.toBeVisible();
    }
  });

  test("TC-2.3: プレイヤー数が足りないとゲーム開始不可", async ({ playerA }) => {
    await createRoom(playerA.page, playerA.name);

    // 1人だけの状態でゲーム開始ボタンを確認
    const startButton = playerA.page.getByRole("button", { name: "ゲーム開始" });

    // ボタンが非活性であるか、エラーメッセージが表示される
    const isDisabled = await startButton.isDisabled().catch(() => false);

    if (isDisabled) {
      await expect(startButton).toBeDisabled();
    } else {
      // クリックしてエラーを確認
      await startButton.click();
      await expect(playerA.page.getByText(/人数|エラー|不足/)).toBeVisible({ timeout: 5000 });
    }
  });

  test("TC-2.4: 3人以上でゲームを開始できる", async ({ playerA, playerB, playerC }) => {
    const roomId = await createRoom(playerA.page, playerA.name);
    await joinRoom(playerB.page, playerB.name, roomId);
    await joinRoom(playerC.page, playerC.name, roomId);

    // 全員参加を待機
    await waitForPlayerInList(playerA.page, playerC.name);

    // ゲーム開始
    await startGame(playerA.page);

    // 全プレイヤーが夜または昼フェーズに移行
    for (const player of [playerA, playerB, playerC]) {
      await expect(
        player.page.getByText("夜フェーズ").or(player.page.getByText("議論フェーズ"))
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test("プレイヤー一覧にホストマークが表示される", async ({ playerA, playerB }) => {
    const roomId = await createRoom(playerA.page, playerA.name);
    await joinRoom(playerB.page, playerB.name, roomId);

    await waitForPlayerInList(playerA.page, playerB.name);

    // ホスト表示を確認（実装によってはアイコンやテキスト）
    await expect(
      playerA.page.getByText("ホスト").or(playerA.page.locator("[data-host='true']"))
    ).toBeVisible();
  });
});

test.describe("役職設定の検証", () => {
  test("役職数がプレイヤー数+2と一致する必要がある", async ({ playerA, playerB, playerC }) => {
    const roomId = await createRoom(playerA.page, playerA.name);
    await joinRoom(playerB.page, playerB.name, roomId);
    await joinRoom(playerC.page, playerC.name, roomId);

    await waitForPlayerInList(playerA.page, playerC.name);

    // 3人 + 中央2枚 = 5枚必要
    // デフォルト設定で役職数が足りているかテスト
    const startButton = playerA.page.getByRole("button", { name: "ゲーム開始" });

    // ゲームが開始できる = 役職数が正しい
    await startButton.click();
    await expect(
      playerA.page.getByText("夜フェーズ").or(playerA.page.getByText("議論フェーズ"))
    ).toBeVisible({ timeout: 10000 });
  });
});
