/**
 * UNO自動宣言装置 — ESP32ファームウェア (M5Atom Lite専用)
 *
 * [必要なライブラリ（Arduino IDE > ライブラリマネージャーでインストール）]
 *   - FastLED by Daniel Garcia  (検索: "FastLED")
 *   - ESP32Servo by Kevin Harrington  (検索: "ESP32Servo")
 *   ※ BLEライブラリはESP32ボードパッケージに同梱
 *
 * [動作]
 *   1. BLE Peripheral としてアドバタイズ（デバイス名: UNO-DEVICE）
 *   2. Webアプリからの書き込み (0x01) を受信
 *   3. 内蔵RGB LEDを LED_DURATION_MS 間点灯
 *   4. サーボを SERVO_ANGLE_OPEN まで回転（旗展開）
 *   5. SERVO_RETURN_MS 後にサーボを SERVO_ANGLE_CLOSE へ戻す（旗収納）
 *
 * [配線]
 *   サーボ : 赤=5V(外部電源), 茶=GND(M5Atom&外部電源共通), 橙=G26(Grove)
 *
 * [電源]
 *   サーボは外部電源(単3×4 or USB5V)を使用。
 *   M5AtomとサーボのGNDを必ず共通化すること。
 */

#include <FastLED.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <ESP32Servo.h>
#include "config.h"

// ---- 状態管理 ----
static volatile bool g_unoTriggered  = false;

static bool          g_ledActive     = false;
static unsigned long g_ledOffAt      = 0;

static bool          g_servoActive   = false;
static unsigned long g_servoReturnAt = 0;

static CRGB g_leds[LED_NUM_LEDS];
static Servo g_servo;

// ================================================================
// BLE書き込みコールバック
// ================================================================
class UnoCharCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic* pChar) override {
    String val = pChar->getValue();
    if (val.length() > 0 && static_cast<uint8_t>(val[0]) == 0x01) {
      g_unoTriggered = true;
      Serial.println("[BLE] 0x01 received → UNO triggered");
    }
  }
};

// ================================================================
// LED制御（FastLED）
// ================================================================
void ledOn() {
  g_leds[0] = CRGB::Red;
  FastLED.show();
  g_ledOffAt  = millis() + LED_DURATION_MS;
  g_ledActive = true;
  Serial.printf("[LED] ON (%d ms)\n", LED_DURATION_MS);
}

void ledUpdate() {
  if (g_ledActive && millis() >= g_ledOffAt) {
    g_leds[0] = CRGB::Black;
    FastLED.show();
    g_ledActive = false;
    Serial.println("[LED] OFF");
  }
}

// ================================================================
// サーボ制御
// ================================================================
void servoOpen() {
  g_servo.write(SERVO_ANGLE_OPEN);
  g_servoReturnAt = millis() + SERVO_RETURN_MS;
  g_servoActive   = true;
  Serial.printf("[Servo] → %d° (旗展開)\n", SERVO_ANGLE_OPEN);
}

void servoUpdate() {
  if (g_servoActive && millis() >= g_servoReturnAt) {
    g_servo.write(SERVO_ANGLE_CLOSE);
    g_servoActive = false;
    Serial.printf("[Servo] → %d° (旗収納)\n", SERVO_ANGLE_CLOSE);
  }
}

// ================================================================
// BLE Peripheral セットアップ
// ================================================================
void setupBLE() {
  BLEDevice::init(BLE_DEVICE_NAME);

  BLEServer*         pServer  = BLEDevice::createServer();
  BLEService*        pService = pServer->createService(BLE_SERVICE_UUID);
  BLECharacteristic* pChar    = pService->createCharacteristic(
    BLE_CHAR_UUID,
    BLECharacteristic::PROPERTY_WRITE
  );
  pChar->setCallbacks(new UnoCharCallbacks());

  pService->start();

  BLEAdvertising* pAdv = BLEDevice::getAdvertising();
  pAdv->addServiceUUID(BLE_SERVICE_UUID);
  pAdv->setScanResponse(false);
  BLEDevice::startAdvertising();

  Serial.printf("[BLE] Advertising as \"%s\"\n", BLE_DEVICE_NAME);
  Serial.printf("  Service UUID : %s\n", BLE_SERVICE_UUID);
  Serial.printf("  Char    UUID : %s\n", BLE_CHAR_UUID);
}

// ================================================================
// setup / loop
// ================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  // FastLED 初期化
  FastLED.addLeds<WS2812B, LED_FASTLED_PIN, GRB>(g_leds, LED_NUM_LEDS);
  FastLED.setBrightness(LED_BRIGHTNESS);
  g_leds[0] = CRGB::Black;
  FastLED.show();
  Serial.printf("[LED] FastLED ready (pin=%d, brightness=%d)\n", LED_FASTLED_PIN, LED_BRIGHTNESS);

  // サーボ初期化（収納位置で待機）
  g_servo.attach(SERVO_PIN);
  g_servo.write(SERVO_ANGLE_CLOSE);
  Serial.printf("[Servo] pin=%d, 初期角度=%d°\n", SERVO_PIN, SERVO_ANGLE_CLOSE);

  // BLE起動
  setupBLE();

  Serial.println("=== UNO Flag ready ===");
}

void loop() {
  if (g_unoTriggered) {
    g_unoTriggered = false;
    ledOn();
    servoOpen();
  }

  ledUpdate();
  servoUpdate();

  delay(10);
}
