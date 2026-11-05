
import { activateAtomizer } from "./hardware.js";

import {
  Engine,
  Scene,
  Vector3,
  HemisphericLight,
  ArcRotateCamera,
  MeshBuilder,
  StandardMaterial,
  Color3,
  PointerEventTypes
} from "@babylonjs/core";

import {
  AdvancedDynamicTexture,
  Button,
  Rectangle,
  StackPanel,
  TextBlock
} from "@babylonjs/gui";

import "./style.css";
import { createFlower } from "./flower.js";
import { createConnectionPanel } from "./connectionPanel.js";

// Get application container
const app = document.querySelector("#app");

// Create canvas
const canvas = document.createElement("canvas");
canvas.id = "renderCanvas";
app.appendChild(canvas);

// Initialize Babylon.js
const engine = new Engine(canvas, true);
const scene = new Scene(engine);

scene.clearColor = new Color3(0.05, 0.05, 0.1).toColor4(1);

// Camera
const camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 2,
  Math.PI / 2.5,
  5,
  new Vector3(0, 1, 0),
  scene
);

camera.attachControl(canvas, true);

// Lighting
const light = new HemisphericLight(
  "light",
  new Vector3(0, 1, 0),
  scene
);

light.intensity = 1;

// Ground
const ground = MeshBuilder.CreateGround(
  "ground",
  { width: 10, height: 10 },
  scene
);

const groundMaterial = new StandardMaterial("groundMaterial", scene);
groundMaterial.diffuseColor = new Color3(0.2, 0.4, 0.2);
ground.material = groundMaterial;

// Create flower
createFlower(scene);

// Connect Arduino button
createConnectionPanel();


// ------------------------------------
// FLOWER SNIFF INTERACTION
// ------------------------------------

// A 3D panel next to the flower (Babylon GUI), so it also shows in VR.
// Desktop mouse clicks and VR controller rays both work on it.

let sniffPanel = null;

function closeSniffInvitation() {

  if (sniffPanel) {
    scene.onBeforeRenderObservable.remove(sniffPanel.turnObserver);
    sniffPanel.texture.dispose();
    sniffPanel.plane.dispose();
    sniffPanel = null;
  }
}

function showSniffInvitation() {

  // Remove any existing invitation
  closeSniffInvitation();

  // Panel mesh beside the flower
  const plane = MeshBuilder.CreatePlane(
    "sniffPanel",
    { width: 1, height: 0.5 },
    scene
  );

  plane.position = new Vector3(1.3, 1.7, 0);

  // Keep it upright and turned toward where the viewer stands. (Babylon's
  // billboard modes follow the camera's orientation, so in VR the panel
  // turned and tilted with every head movement.) The plane's front faces -Z.
  const turnObserver = scene.onBeforeRenderObservable.add(() => {
    const toViewer = scene.activeCamera.globalPosition.subtract(plane.position);
    plane.rotation.y = Math.atan2(-toViewer.x, -toViewer.z);
  });

  const texture = AdvancedDynamicTexture.CreateForMesh(plane, 1024, 512);

  // White rounded card
  const card = new Rectangle("sniffCard");

  card.background = "white";
  card.cornerRadius = 36;
  card.thickness = 0;
  card.shadowColor = "rgba(0, 0, 0, 0.3)";
  card.shadowBlur = 20;

  texture.addControl(card);

  const stack = new StackPanel("sniffStack");
  card.addControl(stack);

  // Invitation message
  const message = new TextBlock("sniffMessage", "Would you like to smell this flower?");

  message.color = "#333";
  message.fontSize = 52;
  message.fontWeight = "bold";
  message.height = "140px";
  message.textWrapping = true;
  message.width = "900px";

  stack.addControl(message);

  // Sniff button
  const button = Button.CreateSimpleButton("sniffButton", "Sniff Me!");

  button.width = "440px";
  button.height = "150px";
  button.paddingTop = "20px";
  button.background = "#ff69a6";
  button.color = "white";
  button.fontSize = 64;
  button.fontWeight = "bold";
  button.thickness = 0;
  button.cornerRadius = 30;

  stack.addControl(button);

  let activated = false;

  // Hover effects
  button.onPointerEnterObservable.add(() => {
    if (!activated) {
      button.background = "#ff3f8e";
    }
  });

  button.onPointerOutObservable.add(() => {
    if (!activated) {
      button.background = "#ff69a6";
    }
  });

  // Sniff interaction
  button.onPointerClickObservable.add(() => {

    // Prevent repeated clicks on this button
    if (activated) {
      return;
    }

    activated = true;

    console.log("SNIFF ACTIVATED!");

    button.background = "#8a4fff";
    button.alpha = 0.8;
    button.hoverCursor = "default";

    // Activate atomizer
    activateAtomizer();

    // Remove invitation after activation
    const thisPanel = sniffPanel;

    setTimeout(() => {
      if (sniffPanel === thisPanel) {
        closeSniffInvitation();
      }
    }, 500);
  });

  sniffPanel = { plane, texture, turnObserver };
}


// ------------------------------------
// DETECT FLOWER CLICKS
// ------------------------------------

scene.onPointerObservable.add((pointerInfo) => {

  if (pointerInfo.type === PointerEventTypes.POINTERPICK) {

    const pickedMesh = pointerInfo.pickInfo?.pickedMesh;

    if (pickedMesh?.metadata?.type === "flower") {

      console.log("Flower selected!");

      showSniffInvitation();
    }
  }
});


// ------------------------------------
// WEBXR
// ------------------------------------

// Adds the Enter VR button, controllers and teleporting on the ground.
// The Arduino connection lives on the page, so it stays open while
// entering and leaving VR.
async function setupXR() {

  if (!navigator.xr) {
    console.log("WebXR not available: desktop only");
    return;
  }

  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [ground]
  });

  // Babylon starts the headset at the desktop camera's position (2.5 m up)
  // and then adds the real head height. Start on the floor instead, a step
  // in front of the flower, facing it.
  xr.baseExperience.onInitialXRPoseSetObservable.add((xrCamera) => {
    xrCamera.position.set(0, 0, -1.2);
  });
}

setupXR().catch((error) => {
  console.error("WebXR setup failed:", error);
});


// ------------------------------------
// RENDER LOOP
// ------------------------------------

engine.runRenderLoop(() => {
  scene.render();
});


// ------------------------------------
// RESIZE
// ------------------------------------

window.addEventListener("resize", () => {
  engine.resize();
});
