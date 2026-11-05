
const int ATOMIZER_PIN = 14;

const int ATOMIZER_ON  = LOW;
const int ATOMIZER_OFF = HIGH;

// duration of scent release in milliseconds
const unsigned long ATOMIZER_DURATION_MS = 3000;

bool atomizerActive = false;
unsigned long activationStartTime = 0;


void turnAtomizerOff()
{
    digitalWrite(ATOMIZER_PIN, ATOMIZER_OFF);

    if (atomizerActive)
    {
        atomizerActive = false;
        Serial.println("Atomizer OFF");
    }
}


// Turn atomizer ON for 3 seconds
void activateAtomizer()
{
    if (atomizerActive)
    {
        Serial.println("Atomizer already active");
        return;
    }

    digitalWrite(ATOMIZER_PIN, ATOMIZER_ON);

    activationStartTime = millis();
    atomizerActive = true;

    Serial.println("Atomizer ON - 3 seconds");
}


void setup()
{

    digitalWrite(ATOMIZER_PIN, ATOMIZER_OFF);
    pinMode(ATOMIZER_PIN, OUTPUT);

    digitalWrite(ATOMIZER_PIN, ATOMIZER_OFF);
    Serial.begin(115200);

    Serial.println("Atomizer controller ready");
    Serial.println("Send 1 = ON for 3 seconds");
    Serial.println("Send 0 = OFF immediately");
}


void loop()
{

    while (Serial.available() > 0)
    {
        char command = Serial.read();

        if (command == '1')
        {
            activateAtomizer();
        }
        else if (command == '0')
        {
            turnAtomizerOff();
        }
    }

    if (atomizerActive &&
        millis() - activationStartTime >= ATOMIZER_DURATION_MS)
    {
        turnAtomizerOff();
    }
}
