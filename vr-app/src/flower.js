
import {
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3
} from "@babylonjs/core";

// Height of the bloom above the ground, in meters: a little below a
// standing adult's eyes, so in VR you look down over the petals at the center
const BLOOM_HEIGHT = 1.35;

export function createFlower(scene) {

    // Create a shared pink material for the petals
    const petalMaterial = new StandardMaterial(
        "petalMaterial",
        scene
    );

    petalMaterial.diffuseColor = new Color3(1, 0.2, 0.5);

    // Create five petals
    for (let i = 0; i < 5; i++) {

        const angle = (i * 2 * Math.PI) / 5;

        const petal = MeshBuilder.CreateSphere(
            `petal${i}`,
            { diameter: 0.7 },
            scene
        );

        petal.scaling.y = 0.35;
        petal.scaling.z = 0.7;

        petal.position = new Vector3(
            Math.cos(angle) * 0.4,
            BLOOM_HEIGHT,
            Math.sin(angle) * 0.4
        );

        petal.rotation.y = -angle;
        petal.material = petalMaterial;

        // Make each petal clickable
        petal.isPickable = true;
        petal.metadata = { type: "flower" };
    }

    // Create flower center
    const center = MeshBuilder.CreateSphere(
        "flowerCenter",
        { diameter: 0.4 },
        scene
    );

    center.position.y = BLOOM_HEIGHT;

    const centerMaterial = new StandardMaterial(
        "centerMaterial",
        scene
    );

    centerMaterial.diffuseColor = new Color3(1, 0.8, 0.1);
    center.material = centerMaterial;

    // Make flower center clickable
    center.isPickable = true;
    center.metadata = { type: "flower" };

    // Create stem
    const stem = MeshBuilder.CreateCylinder(
        "stem",
        { height: BLOOM_HEIGHT, diameter: 0.08 },
        scene
    );

    stem.position.y = BLOOM_HEIGHT / 2;

    const stemMaterial = new StandardMaterial(
        "stemMaterial",
        scene
    );

    stemMaterial.diffuseColor = new Color3(0.1, 0.6, 0.2);
    stem.material = stemMaterial;

    // Make stem clickable too
    stem.isPickable = true;
    stem.metadata = { type: "flower" };

    return center;
}
