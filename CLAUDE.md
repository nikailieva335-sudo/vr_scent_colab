# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A Babylon.js scene with a flower you can "sniff": choosing **Sniff Me!**
tells an Arduino Nano Every to run a scent atomizer for 3 seconds. The
target is a **Meta Quest 3** with the Arduino plugged straight into the
headset's USB-C port: no laptop or server in the loop. Desktop Chrome on
the Mac is the second target, for testing without the headset.

## Layout

```
vr_scent_colab.ino      # Arduino firmware (atomizer on pin 14, active LOW)
vr-app/                 # browser app, Vite + Babylon.js from npm
  src/main.js           # scene, camera, Sniff Me! panel, flower click handling
  src/flower.js         # flower meshes; parts tagged metadata {type: "flower"}
  src/hardware.js       # USB serial transport, activateAtomizer()
  src/connectionPanel.js# Connect/Disconnect Arduino button + status line
  tools/serve_quest.sh  # npm run quest (HTTPS on the LAN)
  vite.config.js        # only turns on HTTPS when serve_quest.sh passes a cert
```

## Arduino protocol

One ASCII byte, **no newline**, 115200 baud 8N1: `1` = atomizer on for 3
seconds (ignored while already on), `0` = off immediately. The firmware
answers with status lines ("Atomizer ON - 3 seconds", ...); the app only
logs them to the console. Keep the bytes exactly like this: the firmware
reads byte by byte and needs no changes for transport work.

## Serial transport (`src/hardware.js`)

The browser talks to the Arduino directly. There used to be a Node
WebSocket→serial bridge (`hardware-bridge.js`, `serialport`, `ws`); it was
removed and is only in git history.

- **Default: WebUSB via `web-serial-polyfill`** (Google, archived, v1.0.15).
  The Quest Browser has no working native Web Serial: tested on the
  headset, only the polyfill connected. Don't switch to native just because
  `navigator.serial` exists.
- **`?serial=native`: the browser's Web Serial API**, for desktop Chrome on
  the Mac. WebUSB can't open the Arduino on macOS (the OS serial driver
  owns it). Same requestPort/getPorts/open API and streams as the polyfill.

Behavior: the first connect needs a click (device picker), so it happens on
the page before entering VR. Writes are chained in order. An unplug
(read loop error, failed write or USB `disconnect` event) shows "Connection
lost"; a replug reopens the granted device automatically via `getPorts()`
unless the user pressed **Disconnect Arduino**.

Polyfill quirks found in its source: it reports stream errors as plain
strings (use `errorText()`, not `error.message`), and its `close()` fails
while the streams are locked, so `closePort()` releases the reader (waits
for the read loop) before closing.

## Running

```
cd vr-app
npm install
npm run dev     # desktop: http://localhost:5173/?serial=native
npm run quest   # Quest 3: HTTPS on port 3443, prints the URL
```

`npm run quest` mirrors vbc-webxr's: self-signed certificate for the Mac's
LAN IP in gitignored `vr-app/.certs/`, remade when the IP changes; the Quest
Browser warns once (Advanced → Proceed). WebUSB and WebXR both need a
secure context; `localhost` counts as one, so `npm run dev` stays plain HTTP.

There's no lint, type check or test suite; `npx vite build` is the check.

### npm quirks on the Mac

- After `npm install`, Vite can fail with "Cannot find native binding": the
  lockfile is shared with a collaborator on another platform and npm skips
  rolldown's macOS binding. Fix without touching the lockfile:
  `npm install --no-save @rolldown/binding-darwin-arm64@<rolldown version>`.
- npm 10.8 rewrites `package-lock.json` (strips `libc` fields). Don't commit
  that churn; for real dependency changes use `npx npm@11 install ...`,
  which leaves a clean diff.
- Node is 20.17; Vite 8 asks for 20.19+ and warns, but runs.

## Current status (2026-11-05)

Work is on the local branch `browser-serial`, **not pushed**: push only
after it's verified on both the Quest and the Mac.

| Check | Status |
|---|---|
| Build, page loads in both modes | done |
| Mac, `?serial=native`: connect, sniff, unplug/replug auto-reconnect, disconnect/reconnect | verified on hardware |
| Quest, WebUSB polyfill: connect, sniff, unplug/replug | not yet tested |
| Inside immersive WebXR | not built yet |

Next: **WebXR** (`createDefaultXRExperienceAsync`, ground as floor,
teleport), keeping the serial connection across entering/leaving VR, and
rebuilding the Sniff Me! panel (currently an HTML overlay in `main.js`,
invisible in the headset) as a Babylon GUI panel (`@babylonjs/gui` at the
same version as core) with the same behavior. Whether the click → panel →
button interaction sequence makes sense is to be discussed separately;
don't redesign it while porting.
