# 素材画像一覧

## 役職カード画像

| ファイル名 | 役職 | 推奨サイズ | 用途 | 備考 |
|-----------|------|-----------|------|------|
| `werewolf.png` | 人狼 | 200x280px | 役職表示 | 赤/黒系の配色推奨 |
| `villager.png` | 村人 | 200x280px | 役職表示 | 緑/茶系の配色推奨 |
| `seer.png` | 占い師 | 200x280px | 役職表示 | 紫/青系の配色推奨 |
| `robber.png` | 怪盗 | 200x280px | 役職表示 | 灰/黒系の配色推奨 |
| `troublemaker.png` | トラブルメーカー | 200x280px | 役職表示 | オレンジ/黄系推奨 |
| `tanner.png` | 吊人 | 200x280px | 役職表示 | 茶/ベージュ系推奨 |

## カード共通素材

| ファイル名 | 用途 | 推奨サイズ | 備考 |
|-----------|------|-----------|------|
| `card-back.png` | カード裏面 | 200x280px | 未公開カード表示用 |
| `card-frame.png` | カード枠 | 220x300px | 透過PNG、装飾用 |

## アイコン画像

| ファイル名 | 用途 | 推奨サイズ | 備考 |
|-----------|------|-----------|------|
| `werewolf-icon.png` | 人狼アイコン | 64x64px | 役職選択・一覧用 |
| `villager-icon.png` | 村人アイコン | 64x64px | 役職選択・一覧用 |
| `seer-icon.png` | 占い師アイコン | 64x64px | 役職選択・一覧用 |
| `robber-icon.png` | 怪盗アイコン | 64x64px | 役職選択・一覧用 |
| `troublemaker-icon.png` | TMアイコン | 64x64px | 役職選択・一覧用 |
| `tanner-icon.png` | 吊人アイコン | 64x64px | 役職選択・一覧用 |

## UI素材

| ファイル名 | 用途 | 推奨サイズ | 備考 |
|-----------|------|-----------|------|
| `moon.png` | 夜フェーズ背景 | 128x128px | 夜フェーズアイコン |
| `sun.png` | 昼フェーズ背景 | 128x128px | 昼フェーズアイコン |
| `vote.png` | 投票アイコン | 64x64px | 投票フェーズ用 |
| `crown.png` | ホストマーク | 32x32px | ホストプレイヤー表示 |
| `check.png` | 完了マーク | 32x32px | アクション完了表示 |
| `timer.png` | タイマーアイコン | 48x48px | 残り時間表示 |

## 勝敗表示

| ファイル名 | 用途 | 推奨サイズ | 備考 |
|-----------|------|-----------|------|
| `victory-village.png` | 村人陣営勝利 | 400x200px | 結果画面用 |
| `victory-werewolf.png` | 人狼陣営勝利 | 400x200px | 結果画面用 |
| `victory-tanner.png` | 吊人勝利 | 400x200px | 結果画面用 |
| `defeat.png` | 敗北表示 | 400x200px | 結果画面用 |

## 背景画像

| ファイル名 | 用途 | 推奨サイズ | 備考 |
|-----------|------|-----------|------|
| `bg-lobby.jpg` | ロビー背景 | 1920x1080px | 圧縮推奨 |
| `bg-night.jpg` | 夜フェーズ背景 | 1920x1080px | 暗めの画像 |
| `bg-day.jpg` | 昼フェーズ背景 | 1920x1080px | 明るめの画像 |
| `bg-result.jpg` | 結果画面背景 | 1920x1080px | |

---

## ディレクトリ構成

```
public/
├── images/
│   ├── roles/
│   │   ├── werewolf.png
│   │   ├── villager.png
│   │   ├── seer.png
│   │   ├── robber.png
│   │   ├── troublemaker.png
│   │   └── tanner.png
│   ├── icons/
│   │   ├── werewolf-icon.png
│   │   ├── villager-icon.png
│   │   ├── seer-icon.png
│   │   ├── robber-icon.png
│   │   ├── troublemaker-icon.png
│   │   └── tanner-icon.png
│   ├── ui/
│   │   ├── card-back.png
│   │   ├── card-frame.png
│   │   ├── moon.png
│   │   ├── sun.png
│   │   ├── vote.png
│   │   ├── crown.png
│   │   ├── check.png
│   │   └── timer.png
│   ├── results/
│   │   ├── victory-village.png
│   │   ├── victory-werewolf.png
│   │   ├── victory-tanner.png
│   │   └── defeat.png
│   └── backgrounds/
│       ├── bg-lobby.jpg
│       ├── bg-night.jpg
│       ├── bg-day.jpg
│       └── bg-result.jpg
```

---

## 画像仕様

### フォーマット
- **カード・アイコン**: PNG (透過対応)
- **背景**: JPG (ファイルサイズ削減)

### 解像度
- Retinaディスプレイ対応のため、表示サイズの2倍で作成推奨
- 例: 100x140px表示 → 200x280pxで作成

### ファイルサイズ目安
| 種類 | 目安サイズ |
|------|-----------|
| 役職カード | 50-100KB |
| アイコン | 5-20KB |
| 背景画像 | 200-500KB |

### カラーパレット推奨

| 陣営 | メインカラー | サブカラー |
|------|-------------|-----------|
| 村人陣営 | `#22C55E` (緑) | `#16A34A` |
| 人狼陣営 | `#DC2626` (赤) | `#991B1B` |
| 吊人 | `#D97706` (琥珀) | `#92400E` |

---

## 現在の実装状況

現在はCSS/Tailwindで絵文字ベースの仮実装:

| 役職 | 現在の表示 |
|------|-----------|
| 人狼 | 🐺 |
| 村人 | 👨‍🌾 |
| 占い師 | 🔮 |
| 怪盗 | 🦹 |
| トラブルメーカー | 🔀 |
| 吊人 | 😵 |

画像素材を用意後、`RoleCard.tsx`を更新して差し替え予定。
