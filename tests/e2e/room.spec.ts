import { test, expect, createRoom, joinRoom, waitForPlayerInList } from "./fixtures/test-helpers";

test.describe("部屋作成・参加フロー", () => {
  test("TC-1.1: 部屋を作成できる", async ({ playerA }) => {
    const { page, name } = playerA;

    await page.goto("/");

    // ランディングページが表示される
    await expect(page.getByText("ワンナイト人狼")).toBeVisible();

    // プレイヤー名を入力
    await page.getByPlaceholder("プレイヤー名").fill(name);

    // 部屋を作成
    await page.getByRole("button", { name: "部屋を作成" }).click();

    // 部屋ページにリダイレクト
    await expect(page).toHaveURL(/\/room\/.+/);

    // 部屋IDが表示される
    await expect(page.getByText(/部屋ID/)).toBeVisible();

    // 自分がプレイヤー一覧に表示される
    await expect(page.getByText(name)).toBeVisible();
  });

  test("TC-1.2: 既存の部屋に参加できる", async ({ playerA, playerB }) => {
    // プレイヤーAが部屋を作成
    const roomId = await createRoom(playerA.page, playerA.name);

    // プレイヤーBが参加
    await joinRoom(playerB.page, playerB.name, roomId);

    // プレイヤーBの画面に両方のプレイヤーが表示される
    await expect(playerB.page.getByText(playerA.name)).toBeVisible();
    await expect(playerB.page.getByText(playerB.name)).toBeVisible();

    // プレイヤーAの画面にもプレイヤーBが表示される（リアルタイム更新）
    await waitForPlayerInList(playerA.page, playerB.name);
  });

  test("TC-1.3: 存在しない部屋への参加はエラー", async ({ playerA }) => {
    const { page, name } = playerA;

    await page.goto("/");
    await page.getByPlaceholder("プレイヤー名").fill(name);
    await page.getByPlaceholder("部屋ID").fill("invalid-room-id-12345");
    await page.getByRole("button", { name: "参加" }).click();

    // エラーメッセージが表示される
    await expect(page.getByText(/見つかりません|エラー/)).toBeVisible({ timeout: 5000 });
  });

  test("TC-1.4: 3人が部屋に参加できる", async ({ playerA, playerB, playerC }) => {
    // プレイヤーAが部屋を作成
    const roomId = await createRoom(playerA.page, playerA.name);

    // プレイヤーB, Cが参加
    await joinRoom(playerB.page, playerB.name, roomId);
    await joinRoom(playerC.page, playerC.name, roomId);

    // 全プレイヤーの画面に3人が表示される
    for (const player of [playerA, playerB, playerC]) {
      await waitForPlayerInList(player.page, playerA.name);
      await waitForPlayerInList(player.page, playerB.name);
      await waitForPlayerInList(player.page, playerC.name);
    }
  });
});

test.describe("ランディングページ", () => {
  test("プレイヤー名が空の場合はボタンが非活性", async ({ page }) => {
    await page.goto("/");

    // プレイヤー名が空の状態
    const createButton = page.getByRole("button", { name: "部屋を作成" });
    const joinButton = page.getByRole("button", { name: "参加" });

    // ボタンが非活性（または存在しない）であることを確認
    // 実装によってはdisabled属性またはクリック不可
    await expect(createButton).toBeDisabled();
    await expect(joinButton).toBeDisabled();
  });

  test("部屋ID入力欄は参加時のみ必要", async ({ page }) => {
    await page.goto("/");

    await page.getByPlaceholder("プレイヤー名").fill("TestPlayer");

    // 部屋作成ボタンは有効
    await expect(page.getByRole("button", { name: "部屋を作成" })).toBeEnabled();

    // 部屋IDが空の場合、参加ボタンは非活性
    await expect(page.getByRole("button", { name: "参加" })).toBeDisabled();

    // 部屋IDを入力すると参加ボタンが有効に
    await page.getByPlaceholder("部屋ID").fill("some-room-id");
    await expect(page.getByRole("button", { name: "参加" })).toBeEnabled();
  });
});
