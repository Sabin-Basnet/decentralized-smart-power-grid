#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Pin Definitions matching your diagram.json
const int PHASE_PIN = 34;    // pot1
const int NEUTRAL_PIN = 35;  // pot2
const int TAMPER_PIN = 25;   // sw1
const int RELAY_PIN = 27;    // relay1

// Virtual Wokwi WiFi Credentials
const char* ssid = "Wokwi-GUEST"; 
const char* password = "";

// Route targeting your local FastAPI backend server on port 8000
const char* serverUrl = "http://host.wokwi.internal:8000/api/v1/telemetry";




unsigned long lastTransmissionTime = 0;
const unsigned long transmissionInterval = 3000; // Send telemetry every 3 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("\n==============================================");
  Serial.println("--- Booting Local Smart Grid Core Firmware ---");
  Serial.println("==============================================");

  // Pin Configuration
  pinMode(PHASE_PIN, INPUT);
  pinMode(NEUTRAL_PIN, INPUT);
  pinMode(TAMPER_PIN, INPUT_PULLUP);
  pinMode(RELAY_PIN, OUTPUT);

  // Armed state by default (grid electricity flowing)
  digitalWrite(RELAY_PIN, HIGH);

  // Initialize Network Connection
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
  // Enforce asynchronous transmission timing loop
  if (millis() - lastTransmissionTime >= transmissionInterval) {
    lastTransmissionTime = millis();

    // 1. Read hardware sensory parameters
    int rawPhase = analogRead(PHASE_PIN);
    int rawNeutral = analogRead(NEUTRAL_PIN);
    int switchState = digitalRead(TAMPER_PIN);

    // 2. Convert raw 12-bit ADC metrics (0-4095) into physical Amperage values (0-5A)
    float loadPhase = (rawPhase / 4095.0) * 5.0;
    float loadNeutral = (rawNeutral / 4095.0) * 5.0;

    // 3. Evaluate local tamper physical bypass line states
    int isTampered = 0;
    if (switchState == LOW) {
      loadNeutral = 0.0; // Emulate a zeroed unmetered return line path
      isTampered = 1;
      Serial.println("[ALERT] Local bypass layout condition triggered.");
    }

    // 4. Construct and transmit telemetry JSON payload via HTTP POST
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");

      // Serialize data fields using the ArduinoJson document map
      JsonDocument doc; 
      doc["account_id"] = "NEA-KTM-001";
      doc["load_phase"] = serialized(String(loadPhase, 2));
      doc["load_neutral"] = serialized(String(loadNeutral, 2));
      doc["is_tampered"] = isTampered;

      String requestBody;
      serializeJson(doc, requestBody);
      
      Serial.print("[TX] Sending data payload to FastAPI backend... ");
      int httpResponseCode = http.POST(requestBody);

      // 5. Evaluate response feedback control loops back from your Python layer
      if (httpResponseCode > 0) {
        String responseBody = http.getString();
        Serial.print("Response Code ["); Serial.print(httpResponseCode); Serial.println("]");
        Serial.print("[RX] Payload received: "); Serial.println(responseBody);

        // Parse command string from server response mapping
        JsonDocument responseDoc;
        deserializeJson(responseDoc, responseBody);
        const char* command = responseDoc["command"];
          
        if (strcmp(command, "DISCONNECT") == 0) {
          digitalWrite(RELAY_PIN, LOW); // Trip the physical safety latch
          Serial.println("[SYSTEM STATUS] Safety system tripped. Relay OPEN.");
        } else if (strcmp(command, "KEEP_ALIVE") == 0) {
          digitalWrite(RELAY_PIN, HIGH); // Re-engage grid contactor
        }
      } else {
        Serial.print("[ERROR] Transmission failed. HTTP Connection Code: ");
        Serial.println(httpResponseCode);
      }
      
      http.end(); // Clear socket memory allocations
    } else {
      Serial.println("[NETWORK ERROR] Lost virtual WiFi linkage.");
    }
    Serial.println("----------------------------------------------");
  }
}