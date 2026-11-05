import { serial as usbSerial } from "web-serial-polyfill";

// Talks to the Arduino Nano Every directly from the browser over USB.
// On the Quest the native Web Serial API doesn't work, so we go through
// Google's WebUSB serial polyfill (tested with their serial terminal).
//
// Protocol (unchanged from the old Node bridge): one ASCII byte, no newline.
//   "1" = atomizer on for 3 seconds, "0" = off immediately.
// The Arduino answers with status lines, which we only log to the console.
//
// ?serial=native uses the browser's own Web Serial API instead, for testing
// in desktop Chrome on the Mac (where the OS serial driver owns the Arduino,
// so WebUSB can't open it). Both have the same requestPort/getPorts/open API.

const BAUD_RATE = 115200;

const useNative = new URLSearchParams(location.search).get("serial") === "native";

// Which serial API to use, and where its connect/disconnect events come from
const serialApi = useNative ? navigator.serial : navigator.usb && usbSerial;
const deviceEvents = useNative ? navigator.serial : navigator.usb;

const encoder = new TextEncoder();

let port = null;
let writer = null;
let reader = null;
let readLoopDone = Promise.resolve();
let writeQueue = Promise.resolve();

// Set once the user has connected, cleared by an explicit disconnect.
// While set, a replugged Arduino is reopened automatically.
let wantConnected = false;

const statusListeners = new Set();
let status = {
    state: "disconnected",
    message: `Not connected (${useNative ? "native Web Serial" : "WebUSB"})`
};

function setStatus(state, message) {
    status = { state, message };
    console.log(`Arduino: ${message}`);
    statusListeners.forEach((listener) => listener(status));
}

export function onStatusChange(listener) {
    statusListeners.add(listener);
    listener(status);
}

// The polyfill reports stream errors as plain strings, not Error objects
function errorText(error) {
    return error?.message ?? String(error);
}

export function isConnected() {
    return status.state === "connected";
}

// Opens a port and starts reading from it. Shared by the button and by
// automatic reconnection.
async function openPort(newPort) {
    setStatus("connecting", "Connecting...");

    await newPort.open({ baudRate: BAUD_RATE });

    port = newPort;
    writer = port.writable.getWriter();
    writeQueue = Promise.resolve();

    readLoopDone = readLoop(port);

    setStatus("connected", "Connected");
}

// Must be called from a user gesture (button click): it shows the browser's
// USB device picker.
export async function connectArduino() {
    if (!serialApi) {
        setStatus(
            "error",
            useNative
                ? "Web Serial isn't available. Use desktop Chrome or Edge, over HTTPS or localhost."
                : "WebUSB isn't available. Use the Quest Browser or Chrome, over HTTPS or localhost."
        );
        return;
    }

    let newPort;

    try {
        newPort = await serialApi.requestPort();
    } catch (error) {
        // NotFoundError: the picker was closed without choosing a device
        setStatus(
            "disconnected",
            error.name === "NotFoundError" ? "No device selected" : `Couldn't request device: ${errorText(error)}`
        );
        return;
    }

    try {
        await openPort(newPort);
        wantConnected = true;
    } catch (error) {
        setStatus(
            "error",
            `Couldn't open device: ${errorText(error)}` +
                (useNative ? "" : " (On a desktop, add ?serial=native to the URL.)")
        );
    }
}

export async function disconnectArduino() {
    wantConnected = false;
    await closePort();
    setStatus("disconnected", "Disconnected");
}

async function closePort() {
    const oldPort = port;
    port = null;

    // The polyfill's close() fails while the streams are locked, so let
    // the read loop finish and release its reader first
    if (reader) {
        await reader.cancel().catch(() => {});
    }

    await readLoopDone;

    if (writer) {
        writer.releaseLock();
        writer = null;
    }

    if (oldPort) {
        await oldPort.close().catch(() => {});
    }
}

async function readLoop(readPort) {
    const decoder = new TextDecoder();
    let line = "";

    reader = readPort.readable.getReader();

    let readError = null;

    try {
        while (true) {
            const { value, done } = await reader.read();

            if (done) {
                break;
            }

            line += decoder.decode(value, { stream: true });

            let newline;
            while ((newline = line.indexOf("\n")) >= 0) {
                console.log("Arduino says:", line.slice(0, newline).trim());
                line = line.slice(newline + 1);
            }
        }
    } catch (error) {
        readError = error;
    } finally {
        reader.releaseLock();
        reader = null;
    }

    // Reading fails when the cable is pulled. Not awaited: closing the
    // port waits for this loop to finish.
    if (readError && port === readPort) {
        handleLostConnection(readError);
    }
}

async function handleLostConnection(error) {
    // The read loop, a failed write and the USB disconnect event can all
    // report the same unplug
    if (!port) {
        return;
    }

    await closePort();
    setStatus(
        "error",
        `Connection lost (${errorText(error)}). Plug the Arduino back in to reconnect.`
    );
}

// Sends one command. Writes are chained so they reach the Arduino in order.
function sendCommand(command) {
    if (!isConnected()) {
        setStatus(status.state, "Not connected: press Connect Arduino first");
        return;
    }

    const activeWriter = writer;

    writeQueue = writeQueue
        .then(() => activeWriter.write(encoder.encode(command)))
        .catch(async (error) => {
            console.error("Arduino write failed:", error);

            if (writer === activeWriter) {
                await handleLostConnection(error);
            }
        });
}

export function activateAtomizer() {
    sendCommand("1");
}

// Unplugging: the read loop usually notices first, this covers the rest.
// Replugging: reopen the device if the user hadn't disconnected on purpose.
// Only devices the user already granted show up in getPorts(), so this
// needs no picker.
if (deviceEvents) {
    deviceEvents.addEventListener("disconnect", async () => {
        if (port && wantConnected) {
            const ports = await serialApi.getPorts();

            if (ports.length === 0) {
                await handleLostConnection(new Error("device unplugged"));
            }
        }
    });

    deviceEvents.addEventListener("connect", async () => {
        if (!wantConnected || port) {
            return;
        }

        const ports = await serialApi.getPorts();

        if (ports.length === 0) {
            return;
        }

        try {
            await openPort(ports[0]);
        } catch (error) {
            setStatus("error", `Couldn't reopen device: ${errorText(error)}`);
        }
    });
}
