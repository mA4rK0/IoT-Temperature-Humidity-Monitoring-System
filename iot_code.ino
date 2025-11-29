#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  dht.begin();
  delay(2000);
  Serial.begin(115200);
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
  delay(2000);
}
