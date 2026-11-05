
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

function showSniffInvitation() {

  // Remove any existing invitation
  const oldPanel = document.getElementById("sniffPanel");

  if (oldPanel) {
    oldPanel.remove();
  }

  // Create panel
  const panel = document.createElement("div");
  panel.id = "sniffPanel";

  panel.style.position = "fixed";
  panel.style.top = "40px";
  panel.style.left = "50%";
  panel.style.transform = "translateX(-50%)";
  panel.style.background = "white";
  panel.style.padding = "25px 35px";
  panel.style.borderRadius = "18px";
  panel.style.textAlign = "center";
  panel.style.zIndex = "1000";
  panel.style.boxShadow = "0 5px 20px rgba(0,0,0,0.3)";
  panel.style.minWidth = "280px";

  // Invitation message
  const message = document.createElement("div");

  message.innerText = "Would you like to smell this flower?";

  message.style.fontSize = "20px";
  message.style.fontWeight = "bold";
  message.style.color = "#333";
  message.style.marginBottom = "18px";

  // Sniff button
  const button = document.createElement("button");

  button.innerText = "Sniff Me!";

  button.style.padding = "14px 30px";
  button.style.background = "#ff69a6";
  button.style.color = "white";
  button.style.fontSize = "22px";
  button.style.fontWeight = "bold";
  button.style.border = "none";
  button.style.borderRadius = "12px";
  button.style.cursor = "pointer";

  // Hover effects
  button.onmouseenter = () => {
    button.style.background = "#ff3f8e";
  };

  button.onmouseleave = () => {
    button.style.background = "#ff69a6";
  };

  // Sniff interaction
  button.addEventListener("click", () => {

    console.log("SNIFF ACTIVATED!");

    // Prevent repeated clicks on this button
    button.disabled = true;
    button.style.background = "#8a4fff";
    button.style.cursor = "default";
    button.style.opacity = "0.8";

    // Activate atomizer
    activateAtomizer();

    // Remove invitation after activation
    setTimeout(() => {
      panel.remove();
    }, 500);

  });

  // Add elements to panel
  panel.appendChild(message);
  panel.appendChild(button);

  document.body.appendChild(panel);
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
