#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Pin Definitions to match diagram.json
const int PHASE_PIN = 34;    // pot1 -> Phase current simulation
const int NEUTRAL_PIN = 35;  // pot2 -> Neutral current simulation
const int TAMPER_PIN = 25;   // sw1  -> Bypass slide switch
const int RELAY_PIN = 27;    // relay1 -> Signal Input pin

// Network Configuration
const char* ssid = "Wokwi-GUEST"; // Wokwi's built-in virtual access point
const char* password = "";

// Paste your actual ngrok URL here (keep the /api/v1/telemetry routing suffix)
const char* serverUrl = "https://YOUR-UNIQUE-ID.ngrok-free.app/api/v1/telemetry";

unsigned long lastTransmissionTime = 0;
const unsigned long transmissionInterval = 3000; // Send telemetry every 3 seconds

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- Initializing Smart Meter IoT Firmware ---");

  pinMode(PHASE_PIN, INPUT);
  pinMode(NEUTRAL_PIN, INPUT);
  pinMode(TAMPER_PIN, INPUT_PULLUP);
  pinMode(RELAY_PIN, OUTPUT);

  // Default state: Keep the power on during initialization
  digitalWrite(RELAY_PIN, HIGH);

  // Initialize Wi-Fi Connection
  Serial.print("Connecting to virtual grid network: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[SUCCESS] Connected to Wi-Fi Network successfully!");
  Serial.print("IP Address assigned to Smart Meter: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Enforce a strict, non-blocking 3-second update window
  if (millis() - lastTransmissionTime >= transmissionInterval) {
    lastTransmissionTime = millis();

    // 1. Capture Raw Sensor Metrics
    int rawPhase = analogRead(PHASE_PIN);
    int rawNeutral = analogRead(NEUTRAL_PIN);
    int switchState = digitalRead(TAMPER_PIN);

    // 2. Perform Physical Conversions (0-4095 scale mapped to 0.0 - 5.0 Amps)
    float loadPhase = (rawPhase / 4095.0) * 5.0;
    float loadNeutral = (rawNeutral / 4095.0) * 5.0;

    // 3. Evaluate Local Hardware Tamper State
    int isTampered = 0;
    if (switchState == LOW) {
      loadNeutral = 0.0; // Overwrite engine forces reading to zero
      isTampered = 1;
      Serial.println("[ALERT] Local bypass detected. Forcing neutral line variable to 0.0A.");
    }

    // Print local diagnostics to console
    Serial.print("Local Readings -> Phase: "); Serial.print(loadPhase, 2);
    Serial.print("A | Neutral: "); Serial.print(loadNeutral, 2); Serial.println("A");

    // 4. Verify Network Connectivity Before Transmitting
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      
      // Target the public cloud gateway URL
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");

      // 5. Construct and Serialize the JSON Data Payload
      JsonDocument doc; 
      doc["account_id"] = "NEA-KTM-001"; // Hardcoded testing profile matching SQLite
      doc["load_phase"] = serialized(String(loadPhase, 2));
      doc["load_neutral"] = serialized(String(loadNeutral, 2));
      doc["is_tampered"] = isTampered;

      String requestBody;
      serializeJson(doc, requestBody);

      Serial.println("[TX] Uploading data payload to central API...");
      
      // Execute the high-speed network POST request
      int httpResponseCode = http.POST(requestBody);

      // 6. Handle the Server's Strategic Response
      if (httpResponseCode > 0) {
        String responseBody = http.getString();
        Serial.print("[RX] Server HTTP Status: "); Serial.print(httpResponseCode);
        Serial.print(" | Response: "); Serial.println(responseBody);

        // Parse the command sent back by the backend brain
        JsonDocument responseDoc;
        DeserializationError error = deserializeJson(responseDoc, responseBody);

        if (!error) {
          const char* command = responseDoc["command"];
          
          // Execute Cloud Decisions directly onto the physical actuators
          if (strcmp(command, "DISCONNECT") == 0) {
            Serial.println("[EXECUTE] Cloud mandated DISCONNECT! Cutting household power.");
            digitalWrite(RELAY_PIN, LOW); // Turn off LED load
          } else if (strcmp(command, "KEEP_ALIVE") == 0) {
            Serial.println("[EXECUTE] Cloud validated account. Keeping power active.");
            digitalWrite(RELAY_PIN, HIGH); // Keep LED load lit
          }
        }
      } else {
        Serial.print("[ERROR] Transmission failed. HTTP Code Error: ");
        Serial.println(httpResponseCode);
      }

      http.end(); // Clean up socket connection allocations
    } else {
      Serial.println("[ERROR] Wi-Fi link dropped. Retaining local safety protocols.");
    }
    Serial.println("----------------------------------------------");
  }
}