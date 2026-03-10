#pragma once

// ============================================================
// BLE 設定
// ============================================================
#define BLE_DEVICE_NAME     "UNO-DEVICE"
#define BLE_SERVICE_UUID    "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_CHAR_UUID       "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// ============================================================
// LED設定（M5Atom Lite 内蔵RGB LED / WS2812B）
// ============================================================
#define LED_FASTLED_PIN    27    // M5Atom Lite 内蔵WS2812B
#define LED_NUM_LEDS       1
#define LED_BRIGHTNESS     80   // 0–255（明るすぎる場合は下げる）
#define LED_DURATION_MS    3000  // 点灯時間 [ms]

// ============================================================
// サーボ設定 (SG90)
// ============================================================
#define SERVO_PIN          22   // M5Atom Lite Grove端子 (G22)
#define SERVO_ANGLE_OPEN   60   // 旗展開角度 [°]
#define SERVO_ANGLE_CLOSE  160    // 旗収納角度 [°]
#define SERVO_RETURN_MS    2000  // 展開 → 収納までの待機時間 [ms]
