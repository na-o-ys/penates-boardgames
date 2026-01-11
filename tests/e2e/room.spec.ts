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

test.describe("直接URL訪問", () => {
  test("TC-1.5: ルームURLに直接アクセスすると入室画面が表示される", async ({ playerA, playerB }) => {
    // プレイヤーAが部屋を作成
    const roomId = await createRoom(playerA.page, playerA.name);

    // プレイヤーBがルームURLに直接アクセス
    await playerB.page.goto(`/room/${roomId}`);

    // 入室画面が表示される
    await expect(playerB.page.getByText("ルームに入室")).toBeVisible();
    await expect(playerB.page.getByPlaceholder("プレイヤー名を入力")).toBeVisible();
    await expect(playerB.page.getByRole("button", { name: "入室する" })).toBeVisible();
  });

  test("TC-1.6: 入室画面からプレイヤー名を入力して入室できる", async ({ playerA, playerB }) => {
    // プレイヤーAが部屋を作成
    const roomId = await createRoom(playerA.page, playerA.name);

    // プレイヤーBがルームURLに直接アクセス
    await playerB.page.goto(`/room/${roomId}`);

    // 入室画面が表示される
    await expect(playerB.page.getByText("ルームに入室")).toBeVisible();

    // プレイヤー名を入力
    await playerB.page.getByPlaceholder("プレイヤー名を入力").fill(playerB.name);

    // 入室ボタンをクリック
    await playerB.page.getByRole("button", { name: "入室する" }).click();

    // ロビー画面に遷移
    await expect(playerB.page.getByRole("heading", { name: "ロビー" })).toBeVisible({ timeout: 5000 });

    // 両方のプレイヤーが表示される
    await expect(playerB.page.getByText(playerA.name)).toBeVisible();
    await expect(playerB.page.getByText(playerB.name)).toBeVisible();

    // プレイヤーAの画面にもプレイヤーBが表示される（リアルタイム更新）
    await waitForPlayerInList(playerA.page, playerB.name);
  });

  test("TC-1.7: 存在しないルームURLにアクセスするとエラー表示", async ({ playerA }) => {
    // 存在しないルームURLにアクセス
    await playerA.page.goto("/room/non-existent-room-id-12345");

    // エラーが表示される
    await expect(playerA.page.getByText("エラー")).toBeVisible({ timeout: 5000 });
  });

  test("TC-1.8: 入室済みのプレイヤーがURLにアクセスするとロビーが表示される", async ({ playerA }) => {
    // プレイヤーAが部屋を作成
    const roomId = await createRoom(playerA.page, playerA.name);

    // ロビー画面を確認
    await expect(playerA.page.getByRole("heading", { name: "ロビー" })).toBeVisible();

    // 同じURLに再度アクセス
    await playerA.page.goto(`/room/${roomId}`);

    // 入室画面ではなくロビーが表示される
    await expect(playerA.page.getByRole("heading", { name: "ロビー" })).toBeVisible();
    await expect(playerA.page.getByText("ルームに入室")).not.toBeVisible();
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
