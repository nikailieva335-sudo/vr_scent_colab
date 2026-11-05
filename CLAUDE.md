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
  src/main.js           # scene, camera, WebXR, Sniff Me! panel, flower clicks
  src/flower.js         # flower meshes; parts tagged metadata {type: "flower"};
                        # BLOOM_HEIGHT and FLOWER_SCALE set its size
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

## WebXR and the Sniff Me! panel (`src/main.js`)

- `createDefaultXRExperienceAsync({ floorMeshes: [ground] })`: Enter VR
  button, controllers, thumbstick teleport. The VR start pose is set in
  `onInitialXRPoseSetObservable` to `(0, 0, -1.2)`, on the floor facing the
  flower: Babylon otherwise starts at the desktop ArcRotateCamera's position
  (2.5 m up) and adds the real head height on top.
- Flower clicks are a `POINTERPICK` observer on parts tagged
  `metadata.type === "flower"`. Controller trigger pulls go through
  `scene.simulatePointerUp`, which fires `POINTERPICK` too, so the same
  handler serves mouse and VR.
- The panel is Babylon GUI (`AdvancedDynamicTexture.CreateForMesh` on a
  1 × 0.5 m plane) 0.45 m above the flower's center sphere. Don't use
  `billboardMode`: Babylon billboards follow the camera's orientation, so
  in VR the panel turned and tilted with the head. Instead an
  `onBeforeRenderObservable` yaws it toward the active camera's position
  each frame (upright; the plane's front faces -Z).
- Panel behavior, unchanged from the original HTML overlay: clicking the
  flower replaces any open panel; the button fires once, turns purple and
  the panel closes after 500 ms.
- Flower: bloom at 1.2 m (`BLOOM_HEIGHT`), below standing eye height so you
  look down at the center; 75% of the original size (`FLOWER_SCALE`).

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

Work is on the branch `browser-serial` (pushed to origin, not merged into
`main` yet; open a PR when ready, like #1 and #2).

| Check | Status |
|---|---|
| Build, page loads in both modes | done |
| Mac, `?serial=native`: connect, sniff, unplug/replug auto-reconnect, disconnect/reconnect | verified on hardware |
| Quest 3, WebUSB polyfill (Arduino in the headset's USB-C): connect, sniff, unplug/replug, disconnect/reconnect | verified on hardware |
| Quest 3, immersive WebXR: start pose, flower → panel → Sniff Me! fires the atomizer, exit/re-enter VR keeps the connection, teleport | verified on hardware |

## Future ideas (not planned yet)

- **Distance-based trigger** instead of (or alongside) click → panel →
  button: as the user's head (the XR camera) gets close to the flower
  center, something visibly changes (e.g. the flower's color), and close
  enough fires the scent. Whether the current interaction sequence makes
  sense at all is still an open question.
- **Particle effects** fired at the same moment the scent is released.
