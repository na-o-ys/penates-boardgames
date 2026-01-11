import { test as base, expect, type Page, type BrowserContext } from "@playwright/test";

/**
 * プレイヤーコンテキスト
 */
export interface PlayerContext {
  page: Page;
  context: BrowserContext;
  name: string;
}

/**
 * ゲームテスト用のカスタムフィクスチャ
 */
export const test = base.extend<{
  playerA: PlayerContext;
  playerB: PlayerContext;
  playerC: PlayerContext;
}>({
  playerA: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use({ page, context, name: "Alice" });
    await context.close();
  },
  playerB: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use({ page, context, name: "Bob" });
    await context.close();
  },
  playerC: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use({ page, context, name: "Charlie" });
    await context.close();
  },
});

export { expect };

/**
 * ランディングページでプレイヤー名を入力して部屋を作成
 */
export async function createRoom(page: Page, playerName: string): Promise<string> {
  await page.goto("/");
  await page.getByPlaceholder("プレイヤー名").fill(playerName);
  await page.getByRole("button", { name: "部屋を作成" }).click();

  // 部屋ページへのリダイレクトを待機
  await page.waitForURL(/\/room\/.+/);

  // URLから部屋IDを取得
  const url = page.url();
  const roomId = url.split("/room/")[1];
  return roomId;
}

/**
 * 既存の部屋に参加
 */
export async function joinRoom(page: Page, playerName: string, roomId: string): Promise<void> {
  await page.goto("/");
  await page.getByPlaceholder("プレイヤー名").fill(playerName);
  await page.getByPlaceholder("部屋ID").fill(roomId);
  await page.getByRole("button", { name: "参加" }).click();

  // 部屋ページへのリダイレクトを待機
  await page.waitForURL(`/room/${roomId}`);
}

/**
 * プレイヤー一覧に指定の名前が表示されるまで待機
 */
export async function waitForPlayerInList(page: Page, playerName: string): Promise<void> {
  await expect(page.getByText(playerName)).toBeVisible({ timeout: 10000 });
}

/**
 * 指定のフェーズになるまで待機
 */
export async function waitForPhase(page: Page, phaseText: string): Promise<void> {
  // フェーズのヘッダー（h1）を探す（例：「投票フェーズ」「議論フェーズ」など）
  // level: 1でh1のみを対象にする
  // 「フェーズ」が既に含まれている場合はそのまま使用
  const searchText = phaseText.includes("フェーズ") ? phaseText : `${phaseText}フェーズ`;
  await expect(
    page.getByRole("heading", { name: searchText, level: 1 })
  ).toBeVisible({ timeout: 15000 });
}

/**
 * ゲームを開始（ホストのみ）
 */
export async function startGame(page: Page): Promise<void> {
  await page.getByRole("button", { name: "ゲーム開始" }).click();
  // 夜フェーズまたは昼フェーズへの遷移を待機
  await expect(
    page.getByText("夜フェーズ").or(page.getByText("議論フェーズ"))
  ).toBeVisible({ timeout: 10000 });
}

/**
 * 役職を設定（ホストのみ）
 */
export async function setRoleCount(
  page: Page,
  role: string,
  count: number
): Promise<void> {
  const roleRow = page.locator(`[data-role="${role}"]`);
  const currentCount = await roleRow.locator("[data-count]").textContent();

  if (currentCount) {
    const current = parseInt(currentCount);
    const diff = count - current;

    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        await roleRow.getByRole("button", { name: "+" }).click();
      }
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) {
        await roleRow.getByRole("button", { name: "-" }).click();
      }
    }
  }
}

/**
 * 夜アクション: プレイヤーを選択
 */
export async function selectPlayer(page: Page, playerName: string): Promise<void> {
  await page.getByRole("button", { name: playerName }).click();
}

/**
 * 夜アクション: 中央カードを選択
 */
export async function selectCenterCard(page: Page, index: number): Promise<void> {
  await page.getByRole("button", { name: `中央${index + 1}` }).click();
}

/**
 * 夜アクション: 確定ボタンをクリック
 */
export async function confirmAction(page: Page): Promise<void> {
  await page.getByRole("button", { name: "確定" }).click();
}

/**
 * 夜アクション: スキップ
 */
export async function skipAction(page: Page): Promise<void> {
  await page.getByRole("button", { name: "行動をスキップ" }).click();
}

/**
 * 投票: プレイヤーに投票
 */
export async function voteForPlayer(page: Page, playerName: string): Promise<void> {
  // プレイヤーを選択
  await page.getByRole("button", { name: new RegExp(playerName) }).click();
  // 投票を確定
  await page.getByRole("button", { name: "投票する" }).click();
  // 投票完了を待機
  await expect(page.getByText("投票済み")).toBeVisible({ timeout: 5000 });
}

/**
 * フェーズ進行（ホストのみ）
 */
export async function advancePhase(page: Page, buttonText: string): Promise<void> {
  await page.getByRole("button", { name: buttonText }).click();
}

/**
 * 結果画面で勝者を確認
 */
export async function checkWinner(page: Page, expectedTeam: string): Promise<void> {
  await expect(page.getByText(`${expectedTeam}の勝利`)).toBeVisible({ timeout: 10000 });
}

/**
 * もう一度遊ぶ（ホストのみ）
 */
export async function playAgain(page: Page): Promise<void> {
  await page.getByRole("button", { name: "もう一度遊ぶ" }).click();
  // ロビーフェーズへの遷移を待機
  await expect(page.getByText("ロビー")).toBeVisible({ timeout: 10000 });
}

/**
 * 複数ページで同時にアクションを実行
 */
export async function parallelAction(
  pages: Page[],
  action: (page: Page) => Promise<void>
): Promise<void> {
  await Promise.all(pages.map(action));
}

/**
 * ページが特定のテキストを含むまで待機
 */
export async function waitForText(page: Page, text: string): Promise<void> {
  await expect(page.getByText(text)).toBeVisible({ timeout: 10000 });
}

/**
 * デバッグ用: 現在の画面をスクリーンショット
 */
export async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/${name}.png` });
}
