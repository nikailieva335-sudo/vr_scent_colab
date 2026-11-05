import {
    connectArduino,
    disconnectArduino,
    isConnected,
    onStatusChange
} from "./hardware.js";

const STATUS_COLORS = {
    disconnected: "#bbb",
    connecting: "#ffd24d",
    connected: "#4cd964",
    error: "#ff6b6b"
};

// Connect/disconnect button and status line, bottom left of the page.
// Connecting needs a click (the browser only shows the USB device picker
// from a user gesture), so this has to happen before entering VR.
export function createConnectionPanel() {

    const panel = document.createElement("div");

    panel.style.position = "fixed";
    panel.style.left = "20px";
    panel.style.bottom = "20px";
    panel.style.background = "rgba(0, 0, 0, 0.7)";
    panel.style.padding = "12px 16px";
    panel.style.borderRadius = "12px";
    panel.style.zIndex = "1000";
    panel.style.maxWidth = "320px";
    panel.style.fontFamily = "sans-serif";

    const button = document.createElement("button");

    button.style.padding = "10px 18px";
    button.style.fontSize = "16px";
    button.style.fontWeight = "bold";
    button.style.border = "none";
    button.style.borderRadius = "8px";
    button.style.cursor = "pointer";

    const statusText = document.createElement("div");

    statusText.style.marginTop = "8px";
    statusText.style.fontSize = "14px";

    button.addEventListener("click", async () => {
        button.disabled = true;

        if (isConnected()) {
            await disconnectArduino();
        } else {
            await connectArduino();
        }

        button.disabled = false;
    });

    onStatusChange((status) => {
        const connected = status.state === "connected";

        button.innerText = connected ? "Disconnect Arduino" : "Connect Arduino";
        button.style.background = connected ? "#555" : "#ff69a6";
        button.style.color = "white";

        statusText.innerText = status.message;
        statusText.style.color = STATUS_COLORS[status.state];
    });

    panel.appendChild(button);
    panel.appendChild(statusText);

    document.body.appendChild(panel);
}
