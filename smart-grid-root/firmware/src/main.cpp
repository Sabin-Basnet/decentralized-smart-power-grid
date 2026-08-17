#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const int PHASE_PIN = 34;
const int TAMPER_PIN = 25;
const int RELAY_PIN = 27;

const char* ssid = "Wokwi-GUEST";
const char* password = "";
const char* serverUrl = "http://host.wokwi.internal:8000/api/v1/telemetry";

unsigned long lastTransmissionTime = 0;
const unsigned long transmissionInterval = 3000;

void setup() {
  Serial.begin(115200);
  Serial.println("\n==============================================");
  Serial.println("--- Booting Local Smart Grid Core Firmware ---");
  Serial.println("==============================================");

  pinMode(PHASE_PIN, INPUT);
  pinMode(TAMPER_PIN, INPUT_PULLUP);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH);

  Serial.print("Connecting to virtual WiFi network");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[SUCCESS] Local network bridge active!");
  Serial.print("[INFO] Assigned Virtual IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (millis() - lastTransmissionTime >= transmissionInterval) {
    lastTransmissionTime = millis();

    int rawPhase = analogRead(PHASE_PIN);
    int switchState = digitalRead(TAMPER_PIN);
    float load = (rawPhase / 4095.0) * 5.0;
    float energy = load * 0.25;
    int isTampered = 0;

    if (switchState == LOW) {
      isTampered = 1;
      load = 0.0;
      energy = 0.0;
      Serial.println("[ALERT] Local bypass layout condition triggered.");
    }

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");

      JsonDocument doc;
      doc["device_id"] = "NEA-KTM-001";
      doc["load"] = load;
      doc["energy"] = energy;
      doc["is_tampered"] = isTampered;

      String requestBody;
      serializeJson(doc, requestBody);

      Serial.print("[TX] Sending data payload to FastAPI backend... ");
      int httpResponseCode = http.POST(requestBody);

      if (httpResponseCode > 0) {
        String responseBody = http.getString();
        Serial.print("Response Code [");
        Serial.print(httpResponseCode);
        Serial.println("]");
        Serial.print("[RX] Payload received: ");
        Serial.println(responseBody);

        JsonDocument responseDoc;
        deserializeJson(responseDoc, responseBody);
        bool isolateCircuit = responseDoc["isolate_circuit"] | false;

        if (isolateCircuit) {
          digitalWrite(RELAY_PIN, LOW);
          Serial.println("[SYSTEM STATUS] Safety system tripped. Relay OPEN.");
        } else {
          digitalWrite(RELAY_PIN, HIGH);
        }
      } else {
        Serial.print("[ERROR] Transmission failed. HTTP Connection Code: ");
        Serial.println(httpResponseCode);
      }

      http.end();
    } else {
      Serial.println("[NETWORK ERROR] Lost virtual WiFi linkage.");
    }

    Serial.println("----------------------------------------------");
  }
}