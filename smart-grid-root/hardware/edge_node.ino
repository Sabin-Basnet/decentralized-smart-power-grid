#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ======================== CONFIGURATION ========================
const char* SSID = "YOUR_WIFI_SSID";
const char* PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL = "http://192.168.1.100:8000/api/telemetry";
const char* NTP_SERVER = "pool.ntp.org";
const long GMT_OFFSET_SEC = 0;
const int DAYLIGHT_OFFSET_SEC = 0;

// ======================== PIN DEFINITIONS ========================
const int LOAD_SENSOR_PIN = 34;  // ADC pin for potentiometer (load simulation)
const int RELAY_PIN = 13;         // GPIO pin for relay control
const int LED_PIN = 2;            // Built-in LED for status

// ======================== GLOBAL STATE ========================
bool isAuthorized = true;         // Authorization flag (updated by backend)
unsigned long lastTelemetrySend = 0;
const unsigned long TELEMETRY_INTERVAL = 2000; // 2 seconds

// ======================== FUNCTION PROTOTYPES ========================
void setupWiFi();
void setupNTP();
void sendTelemetry();
void updateRelayStatus();
void handleIncomingData();

// ======================== SETUP ========================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("==================================================");
  Serial.println("Smart Grid Edge Node - ESP32 Initialization");
  Serial.println("==================================================");
  
  // Configure pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Relay OFF (NO contact open)
  digitalWrite(LED_PIN, LOW);
  
  // Setup Wi-Fi and NTP
  setupWiFi();
  setupNTP();
  
  Serial.println("Initialization Complete. Starting telemetry loop...");
  delay(1000);
}

// ======================== MAIN LOOP ========================
void loop() {
  // Send telemetry every 2 seconds
  if (millis() - lastTelemetrySend >= TELEMETRY_INTERVAL) {
    sendTelemetry();
    lastTelemetrySend = millis();
  }
  
  // Update relay status based on authorization flag
  updateRelayStatus();
  
  delay(100); // Small delay to prevent watchdog timeout
}

// ======================== WIFI SETUP ========================
void setupWiFi() {
  Serial.println("\n[WiFi] Connecting to: " + String(SSID));
  WiFi.mode(WIFI_STA);
  WiFi.begin(SSID, PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.println("[WiFi] IP Address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Failed to connect. Retrying in 10 seconds...");
    delay(10000);
    setupWiFi();
  }
}

// ======================== NTP TIME SYNC ========================
void setupNTP() {
  Serial.println("[NTP] Syncing time with NTP server...");
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
  
  time_t now = time(nullptr);
  int attempts = 0;
  while (now < 24 * 3600 && attempts < 20) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    attempts++;
  }
  
  Serial.println();
  Serial.println("[NTP] Current UTC Time: " + String(ctime(&now)));
}

// ======================== TELEMETRY TRANSMISSION ========================
void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Telemetry] WiFi disconnected. Attempting reconnect...");
    setupWiFi();
    return;
  }
  
  // Read analog input (simulating power load via potentiometer)
  int rawLoad = analogRead(LOAD_SENSOR_PIN);
  float normalizedLoad = (rawLoad / 4095.0) * 100.0; // Convert to percentage (0-100)
  float powerConsumptionKW = (normalizedLoad / 100.0) * 10.0; // Scale to 0-10 kW
  
  // Get current timestamp
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  char timestamp[30];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", timeinfo);
  
  // Create JSON payload
  DynamicJsonDocument doc(256);
  doc["device_id"] = "ESP32_GRID_NODE_001";
  doc["timestamp"] = timestamp;
  doc["power_consumption_kw"] = powerConsumptionKW;
  doc["load_percentage"] = normalizedLoad;
  doc["relay_status"] = isAuthorized ? "ACTIVE" : "DISCONNECTED";
  doc["authorization_flag"] = isAuthorized;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  // Send HTTP POST request
  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.print("[Telemetry] HTTP Response Code: ");
    Serial.println(httpResponseCode);
    
    String response = http.getString();
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      Serial.println("[Telemetry] Payload sent successfully!");
      Serial.println("[Telemetry] Payload: " + jsonPayload);
      
      // Parse response for authorization update
      DynamicJsonDocument responseDoc(256);
      DeserializationError error = deserializeJson(responseDoc, response);
      if (!error && responseDoc.containsKey("authorized")) {
        isAuthorized = responseDoc["authorized"].as<bool>();
        Serial.print("[Telemetry] Authorization updated: ");
        Serial.println(isAuthorized ? "TRUE" : "FALSE");
      }
    } else {
      Serial.println("[Telemetry] Error in response: " + response);
    }
  } else {
    Serial.print("[Telemetry] Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
}

// ======================== RELAY CONTROL ========================
void updateRelayStatus() {
  // Logic: If authorized, relay is ON (connected); if not, relay is OFF (disconnected)
  if (isAuthorized) {
    digitalWrite(RELAY_PIN, LOW);   // Relay ON (energize coil)
    digitalWrite(LED_PIN, HIGH);    // Status LED ON
  } else {
    digitalWrite(RELAY_PIN, HIGH);  // Relay OFF (de-energize coil)
    digitalWrite(LED_PIN, LOW);     // Status LED OFF
    Serial.println("[Relay] DISCONNECTED - Authorization revoked!");
  }
}
