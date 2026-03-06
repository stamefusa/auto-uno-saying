# UNO自動宣言装置

スマートフォンのインカメラで手札を認識し、残り1枚になったら自動でUNOを宣言するシステム。

---

## システム構成

```
web/        Webアプリ（カメラ認識 + BLE通信）
firmware/   ESP32ファームウェア（LED + サーボ制御）
docs/       要件定義・タスク管理ドキュメント
```

---

## 動作概要

1. Webアプリがスマートフォンのインカメラで手札を認識
2. 手札が2枚以上 → 1枚に変化したことを検知
3. 画面に「UNO」と表示
4. BLE経由でESP32へ通知
5. ESP32がLEDを点灯し、サーボモーターでUNO旗を展開

---

## 動作環境

| コンポーネント | 要件 |
|---|---|
| Webアプリ | Chrome for Android / HTTPS必須 |
| BLEデバイス | ESP32 / M5Atom Lite / AtomS3 Lite |
| サーボ | SG90（PWM制御） |
| 電源 | 単3×4 または USB 5V（サーボ用外部電源） |

---

## セットアップ

### Webアプリ

1. `web/` ディレクトリの内容をHTTPS環境へデプロイ
2. スマートフォンのChromeでアクセス
3. カメラ使用許可を承認
4. BLE接続ボタンからESP32と接続

### ESP32ファームウェア

1. `firmware/` ディレクトリをArduino IDE または PlatformIOで開く
2. ESP32ボードへ書き込み
3. サーボ・LEDを配線し、外部電源を接続（GND共通）

---

## 制約事項

- Chrome for Android 専用（iOS Safari 非対応）
- HTTPS 環境が必須（Web Bluetooth API の要件）
- 照明条件・カードの重なり方により認識精度が変動する
