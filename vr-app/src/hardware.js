
const socket = new WebSocket("ws://localhost:8081");

socket.addEventListener("open", () => {
    console.log("Hardware bridge connected");
});

socket.addEventListener("error", () => {
    console.error("Hardware bridge connection failed");
});

export function activateAtomizer() {
    if (socket.readyState !== WebSocket.OPEN) {
        console.error("Cannot activate: Arduino is not connected");
        return;
    }

    socket.send("1");
}
