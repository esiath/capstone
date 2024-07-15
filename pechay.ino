#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include "DHTesp.h"

const char* ssid = "Chaenelle";
const char* password = "@Iceangel1011";

#define DHTPIN D5
#define DHTTYPE DHTesp::DHT11  // Use DHTesp library definition

DHTesp dht;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nWiFi connected");

  // Initialize DHT sensor
  dht.setup(DHTPIN, DHTTYPE);  // Setup DHT sensor with pin and type
}

void loop() {
  float h = dht.getHumidity();
  float t = dht.getTemperature();
  int soil1 = analogRead(A0);  // Soil moisture sensor 1 connected to A0

  if (isnan(h) || isnan(t)) {
    Serial.println("Failed to read from DHT sensor!");
    delay(1000);
    return;
  }

  // HTTP request
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    // Construct URL and payload
    String url = "http://192.168.32.101:3000/saveSensor";
    String payload = "s1=" + String(soil1) + "&s2=" + String(soil1) + "&temp=" + String(t) + "&hum=" + String(h);

    Serial.print("[HTTP] POST to ");
    Serial.println(url);

    // Begin HTTP request with WiFi client and URL
    WiFiClient client;
    http.begin(client, url); // Use WiFiClient as the first argument

    http.addHeader("Content-Type", "application/x-www-form-urlencoded");

    int httpCode = http.POST(payload);

    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_OK) {
        String response = http.getString();
        Serial.println(response);
      }
    } else {
      Serial.printf("[HTTP] POST failed, error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  }

  delay(5000);  // Adjust delay as needed
}
