#include <config.h>

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  dht.begin();
  delay(2000);
  Serial.begin(115200);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
}

void loop() {
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(humidity) || isnan(temp)) {
    Serial.println("Failed to read data from DHT22!");
  } else {
    Serial.print("Temperature: ");
    Serial.print(temp);
    Serial.print(" °C | Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Authorization", String("Bearer ") + DEVICE_SECRET);

    String json = "{\"device_id\":\"esp32-01\",\"temperature\":";
    json += temp;
    json += ",\"humidity\":";
    json += humidity;
    json += "}";

    int httpCode = http.POST(json);
    String payload = http.getString();

    Serial.print("HTTP Status: ");
    Serial.println(httpCode);
    Serial.println(payload);

    http.end();
  }

  delay(5000);
}