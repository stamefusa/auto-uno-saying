# 技術スタック

## Webアプリ（`web/`）

| 項目 | 採用技術 | 備考 |
|---|---|---|
| フレームワーク | React 19 + Vite | SPA構成 |
| 言語 | TypeScript | strict モード |
| スタイリング | Tailwind CSS v4 | `@tailwindcss/vite` プラグイン経由 |
| 画像処理 | Canvas API（標準） | RGB→HSV変換 + UNO色相フィルタ（赤・青・緑・黄） + 白枠隣接チェック（積分画像）による `none/single/multiple` 判定。依存なし。 |
| BLE通信 | Web Bluetooth API | ブラウザ標準API（Chrome for Android必須） |
| デプロイ | Vercel | HTTPS自動付与・静的ホスティング |

## ESP32ファームウェア（`firmware/`）

| 項目 | 採用技術 | 備考 |
|---|---|---|
| 開発環境 | Arduino IDE または PlatformIO | 未確定 |
| BLE | ESP32 BLE Arduino ライブラリ | Peripheral として動作 |
| サーボ制御 | PWM（ESP32 ledc） | SG90想定 |

---

## 制約・前提

- Web Bluetooth API は **Chrome for Android** のみ対応（iOS Safari 非対応）
- カメラAPI・Web Bluetooth API はいずれも **HTTPS必須**
- 画像処理はすべてブラウザ内（端末内）で完結し、サーバー通信は行わない
