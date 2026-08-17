import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';

const outDir = './public/assets/3d';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const outDirWeb = './apps/web/public/assets/3d';
if (!fs.existsSync(outDirWeb)) {
  fs.mkdirSync(outDirWeb, { recursive: true });
}

function exportGlb(mesh, filename) {
  const exporter = new GLTFExporter();
  exporter.parse(
    mesh,
    (gltf) => {
      const buf = Buffer.from(gltf);
      fs.writeFileSync(path.join(outDir, filename), buf);
      fs.writeFileSync(path.join(outDirWeb, filename), buf);
      console.log(`Exported ${filename} (${buf.length} bytes)`);
    },
    (err) => console.error(`Error exporting ${filename}`, err),
    { binary: true }
  );
}

// 1. Lens GLB (Cylinder geometry named "Cylinder")
const cylinderGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.35, 64);
cylinderGeo.computeBoundingBox();
const cylinderMesh = new THREE.Mesh(cylinderGeo, new THREE.MeshStandardMaterial());
cylinderMesh.name = 'Cylinder';
exportGlb(cylinderMesh, 'lens.glb');

// 2. Cube GLB (Box geometry named "Cube")
const cubeGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
cubeGeo.computeBoundingBox();
const cubeMesh = new THREE.Mesh(cubeGeo, new THREE.MeshStandardMaterial());
cubeMesh.name = 'Cube';
exportGlb(cubeMesh, 'cube.glb');

// 3. Bar GLB (Bar geometry named "Cube")
const barGeo = new THREE.BoxGeometry(3.5, 0.6, 0.35);
barGeo.computeBoundingBox();
const barMesh = new THREE.Mesh(barGeo, new THREE.MeshStandardMaterial());
barMesh.name = 'Cube';
exportGlb(barMesh, 'bar.glb');
