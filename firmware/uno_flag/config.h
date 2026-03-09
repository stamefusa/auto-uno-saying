#pragma once

// ============================================================
// デバイス選択
//   汎用ESP32:  BOARD_GENERIC_ESP32
//   M5Atom Lite: BOARD_M5ATOM_LITE
// ============================================================
//#define BOARD_GENERIC_ESP32
#define BOARD_M5ATOM_LITE

// ============================================================
// BLE 設定
// ============================================================
#define BLE_DEVICE_NAME     "UNO-DEVICE"
#define BLE_SERVICE_UUID    "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_CHAR_UUID       "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// ============================================================
// ピン設定
// ============================================================
#if defined(BOARD_M5ATOM_LITE)
  // M5Atom Lite: 内蔵RGB LED は FastLED (GPIO27) を使用するため
  //              外付け単色LEDを別途配線する場合はピン番号を変更してください
  #define LED_PIN    21   // 外付けLED (例: Grove端子)
  #define SERVO_PIN  22   // サーボ Signal (例: Grove端子)
#else
  // 汎用ESP32
  #define LED_PIN    2    // 内蔵LED (GPIO2)
  #define SERVO_PIN  25   // サーボ Signal
#endif

// ============================================================
// LED 設定
// ============================================================
#define LED_DURATION_MS     3000   // 点灯時間 [ms]

// ============================================================
// サーボ設定 (SG90)
// ============================================================
#define SERVO_ANGLE_OPEN    60     // 旗展開角度 [°]
#define SERVO_ANGLE_CLOSE   0      // 旗収納角度 [°]
#define SERVO_RETURN_MS     2000   // 展開 → 収納までの待機時間 [ms]
