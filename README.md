# vr_scent_colab

A Babylon.js scene with a flower you can "sniff": choosing **Sniff Me!**
tells an Arduino Nano Every to run a scent atomizer for 3 seconds.

- `vr_scent_colab.ino`: Arduino firmware. Reads single bytes over USB
  serial at 115200 baud: `1` = atomizer on for 3 seconds, `0` = off.
- `vr-app/`: the browser app (Vite + Babylon.js). It talks to the
  Arduino directly over USB, with no server or bridge in between.

## Running

```
cd vr-app
npm install   # once
npm run dev   # desktop: http://localhost:5173/
npm run quest # Quest 3: HTTPS on the LAN, prints the URL to open
```

`npm run quest` (`tools/serve_quest.sh`) serves over HTTPS on port 3443,
since WebUSB needs a secure context. It makes a self-signed certificate
for the Mac's Wi-Fi IP in gitignored `vr-app/.certs/` (remade when the IP
changes) and prints a URL like `https://10.197.40.1:3443/`. The Quest
must be on the same Wi-Fi. The Quest Browser warns about the certificate:
Advanced → Proceed (again whenever it's remade).

## Connecting the Arduino to the Quest 3

The Quest Browser doesn't support Web Serial, so the app uses Google's
[WebUSB serial polyfill](https://github.com/google/web-serial-polyfill).

1. Plug the Nano Every into the Quest's USB-C port with a **data** cable
   (charge-only cables won't show the device), using a USB-C adapter if
   needed.
2. Open the app URL in the Quest Browser.
3. Press **Connect Arduino** (bottom left) and pick the Arduino in the
   device list. The status line turns green: "Connected".
4. Click the flower, then **Sniff Me!**.

Connect before entering VR: the device picker only opens from a click on
the page. If the cable is pulled, the status says so and the app
reconnects by itself when it's plugged back in (no picker the second
time). **Disconnect Arduino** closes the connection on purpose and stops
automatic reconnection.

The Arduino's replies ("Atomizer ON - 3 seconds", ...) are logged to the
browser console.

## Testing on the Mac (no headset)

Plug the Arduino into the Mac and open the app in desktop Chrome or Edge
with **`?serial=native`**, e.g. `http://localhost:5173/?serial=native`.
This uses the browser's built-in Web Serial API with the same button and
the same bytes. (WebUSB can't open the Arduino on macOS, because the
system's serial driver already owns it.) The status line shows which mode
is active.

Only one program can have the port open: close the Arduino IDE's Serial
Monitor first.
