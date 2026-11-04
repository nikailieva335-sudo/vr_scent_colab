// Ultrasonic atomizer module (active-LOW), controlled from the Serial Monitor
// Type 1 = atomizer ON, 0 = atomizer OFF
//
// Wiring (Nano Every):
//   Module S -> D14 (pin labeled A0)
//   Module V -> 5V
//   Module G -> GND

const int ATOMIZER_PIN = 14;
const int ON  = LOW;    // module turns on when S is pulled LOW
const int OFF = HIGH;

void setup()
{
  digitalWrite(ATOMIZER_PIN, OFF);   // set level before enabling output
  pinMode(ATOMIZER_PIN, OUTPUT);

  Serial.begin(115200);
  while (!Serial) { }
  Serial.println("Type 1 for ON, 0 for OFF");
}

void loop()
{
  if (Serial.available() > 0)
  {
    char c = Serial.read();

    if (c == '1')
    {
      digitalWrite(ATOMIZER_PIN, ON);
      Serial.println("Atomizer ON");
    }
    else if (c == '0')
    {
      digitalWrite(ATOMIZER_PIN, OFF);
      Serial.println("Atomizer OFF");
    }
  }
}