import { SerialPort } from "serialport";
import { WebSocketServer } from "ws";

const SERIAL_PORT = process.env.SERIAL_PORT || "/dev/cu.usbmodem1101";
const BAUD_RATE = 115200;

// Connect to Arduino Nano Every
const arduino = new SerialPort({
    path: SERIAL_PORT,
    baudRate: BAUD_RATE
});

arduino.on("open", () => {
    console.log("Arduino connected:", SERIAL_PORT);
});

arduino.on("error", (error) => {
    console.error("Arduino error:", error.message);
});

// Create WebSocket server
const wss = new WebSocketServer({ port: 8081 });

wss.on("listening", () => {
    console.log("Hardware bridge listening on port 8081");
});

// Receive commands from VR application
wss.on("connection", (socket) => {
    console.log("VR application connected");

    socket.on("message", (data) => {
        const command = data.toString();

        if (command !== "1" && command !== "0") {
            return;
        }

        if (arduino.isOpen) {
            arduino.write(command);
            console.log("Sent to Arduino:", command);
        } else {
            console.log("Arduino is not connected");
        }
    });

    socket.on("close", () => {
        console.log("VR application disconnected");
    });
});

