/**
 * UNO自動宣言装置 — ESP32ファームウェア
 *
 * [必要なライブラリ（Arduino IDE > ライブラリマネージャーでインストール）]
 *   - ESP32Servo by Kevin Harrington  (検索: "ESP32Servo")
 *   ※ BLEライブラリはESP32ボードパッケージに同梱
 *
 * [動作]
 *   1. BLE Peripheral としてアドバタイズ（デバイス名: UNO-DEVICE）
 *   2. Webアプリからの書き込み (0x01) を受信
 *   3. LED を LED_DURATION_MS 間点灯
 *   4. サーボを SERVO_ANGLE_OPEN まで回転（旗展開）
 *   5. SERVO_RETURN_MS 後にサーボを SERVO_ANGLE_CLOSE へ戻す（旗収納）
 *
 * [配線]
 *   LED    : LED_PIN → LED → 抵抗(220Ω) → GND
 *   サーボ : 赤=5V(外部電源), 茶=GND(ESP32&外部電源共通), 橙=SERVO_PIN
 *
 * [電源]
 *   サーボは外部電源(単3×4 or USB5V)を使用。
 *   ESP32とサーボのGNDを必ず共通化すること。
 */

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
// LED制御
// ================================================================
void ledOn() {
  digitalWrite(LED_PIN, HIGH);
  g_ledOffAt  = millis() + LED_DURATION_MS;
  g_ledActive = true;
  Serial.printf("[LED] ON (%d ms)\n", LED_DURATION_MS);
}

void ledUpdate() {
  if (g_ledActive && millis() >= g_ledOffAt) {
    digitalWrite(LED_PIN, LOW);
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

  BLEServer*     pServer  = BLEDevice::createServer();
  BLEService*    pService = pServer->createService(BLE_SERVICE_UUID);
  BLECharacteristic* pChar = pService->createCharacteristic(
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

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  Serial.printf("[LED] pin=%d\n", LED_PIN);

  g_servo.attach(SERVO_PIN);
  g_servo.write(SERVO_ANGLE_CLOSE);
  Serial.printf("[Servo] pin=%d, 初期角度=%d°\n", SERVO_PIN, SERVO_ANGLE_CLOSE);

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
