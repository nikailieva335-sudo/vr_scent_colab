
import {
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3
} from "@babylonjs/core";

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
            1.5,
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

    center.position.y = 1.5;

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
        { height: 1.5, diameter: 0.08 },
        scene
    );

    stem.position.y = 0.75;

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
