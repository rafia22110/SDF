import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  Box,
  Play,
  Volume2,
  Sparkles,
  RotateCcw,
  Layers,
  Eye,
  Compass,
  Upload,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Gamepad2,
  Sun,
  Moon,
  X,
  FileText,
  Trophy,
} from "lucide-react";
import {
  Pdf3DModelData,
  Pdf3DTheme,
  Pdf3DKnowledgeNode,
  PDF_3D_THEME_META,
  getLocalPdf3DModels,
  buildPdf3DModelFromFile,
  deletePdf3DModel,
} from "../services/pdf3dModelBuilder";
import { sfx, speak } from "../audio";
import { BoardCategory, pushItemToSmartBoard } from "./SmartBoard";

/**
 * Creates a procedural radial-gradient contact shadow texture on an HTMLCanvasElement
 * so every 3D object feels grounded on the floor without external image assets.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
    grad.addColorStop(0, "rgba(2, 6, 23, 0.65)");
    grad.addColorStop(0.55, "rgba(2, 6, 23, 0.25)");
    grad.addColorStop(1, "rgba(2, 6, 23, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Creates a crisp numbered badge sprite texture ("1", "2", "3", "4") for PDF knowledge nodes
 */
function createNodeBadgeTexture(
  label: string,
  accentHex: string,
  collected: boolean,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fillStyle = collected ? "#10b981" : accentHex;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "900 52px Heebo, Rubik, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(collected ? "✓" : label, 64, 67);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a composite multi-part procedural 3D model (`THREE.Group`) for the given `Pdf3DTheme`.
 * Uses `ExtrudeGeometry` with bevels, `LatheGeometry`, `TubeGeometry`, and varied PBR materials.
 */
function buildProceduralSceneGroup(
  theme: Pdf3DTheme,
  wireframe: boolean,
): {
  rootGroup: THREE.Group;
  explodableParts: Array<{ obj: THREE.Object3D; basePos: THREE.Vector3; dir: THREE.Vector3 }>;
  animatedTick: (elapsed: number) => void;
} {
  const rootGroup = new THREE.Group();
  const explodableParts: Array<{
    obj: THREE.Object3D;
    basePos: THREE.Vector3;
    dir: THREE.Vector3;
  }> = [];

  const registerExplodable = (obj: THREE.Object3D, dir: THREE.Vector3) => {
    explodableParts.push({
      obj,
      basePos: obj.position.clone(),
      dir: dir.clone().normalize(),
    });
  };

  // Shared Beveled Pedestal Platform (ExtrudeGeometry) grounded at y=0
  const baseShape = new THREE.Shape();
  const sides = 8;
  const radius = 5.4;
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    if (i === 0) baseShape.moveTo(x, y);
    else baseShape.lineTo(x, y);
  }
  const pedestalGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 3,
  });
  pedestalGeo.rotateX(Math.PI / 2);

  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.55,
    wireframe,
  });
  const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestalMesh.position.y = 0.35;
  pedestalMesh.receiveShadow = true;
  rootGroup.add(pedestalMesh);

  // Glowing Rim Ring on Pedestal
  const rimGeo = new THREE.TorusGeometry(5.15, 0.07, 16, 64);
  rimGeo.rotateX(Math.PI / 2);
  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PDF_3D_THEME_META[theme].accentHex),
    emissive: new THREE.Color(PDF_3D_THEME_META[theme].accentHex),
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.8,
    wireframe,
  });
  const rimMesh = new THREE.Mesh(rimGeo, rimMat);
  rimMesh.position.y = 0.42;
  rootGroup.add(rimMesh);

  const animatedCallbacks: Array<(elapsed: number) => void> = [];

  if (theme === "solar-system") {
    // 1. Central Sun Core + Corona Ring
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, 2.2, 0);
    const sunMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.25,
      metalness: 0.1,
      wireframe,
    });
    const sunSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.15, 32, 32),
      sunMat,
    );
    sunGroup.add(sunSphere);

    const coronaRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.06, 16, 48),
      new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xfbbf24,
        emissiveIntensity: 0.7,
        roughness: 0.2,
        wireframe,
      }),
    );
    sunGroup.add(coronaRing);
    rootGroup.add(sunGroup);
    registerExplodable(sunGroup, new THREE.Vector3(0, 1, 0));

    // 2. Orbiting Earth + Moon Group
    const earthPivot = new THREE.Group();
    earthPivot.position.set(0, 2.2, 0);
    const earthGroup = new THREE.Group();
    earthGroup.position.set(2.5, 0, 0);
    const earthMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 28, 28),
      new THREE.MeshStandardMaterial({
        color: 0x0ea5e9,
        roughness: 0.35,
        metalness: 0.2,
        wireframe,
      }),
    );
    earthGroup.add(earthMesh);

    // Continents band on Earth
    const continentRing = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.46, 1),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        roughness: 0.7,
        metalness: 0.05,
        wireframe,
      }),
    );
    continentRing.scale.set(1.02, 0.75, 0.95);
    earthGroup.add(continentRing);

    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.8,
        wireframe,
      }),
    );
    moonMesh.position.set(0.75, 0.2, 0);
    earthGroup.add(moonMesh);
    earthPivot.add(earthGroup);
    rootGroup.add(earthPivot);
    registerExplodable(earthGroup, new THREE.Vector3(1, 0.4, 0));

    // 3. Mars + Rover Tower
    const marsPivot = new THREE.Group();
    marsPivot.position.set(0, 2.2, 0);
    const marsGroup = new THREE.Group();
    marsGroup.position.set(-3.2, 0.25, 1.2);
    const marsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        roughness: 0.65,
        metalness: 0.15,
        wireframe,
      }),
    );
    marsGroup.add(marsMesh);
    marsPivot.add(marsGroup);
    rootGroup.add(marsPivot);
    registerExplodable(marsGroup, new THREE.Vector3(-1, 0.5, 0.5));

    // 4. Saturn + Multi-Band Rings
    const saturnPivot = new THREE.Group();
    saturnPivot.position.set(0, 2.2, 0);
    const saturnGroup = new THREE.Group();
    saturnGroup.position.set(0, 0.45, -3.7);
    const saturnSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.58, 28, 28),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.4,
        metalness: 0.3,
        wireframe,
      }),
    );
    saturnGroup.add(saturnSphere);

    const saturnRing = new THREE.Mesh(
      new THREE.RingGeometry(0.78, 1.25, 48),
      new THREE.MeshStandardMaterial({
        color: 0xfde68a,
        side: THREE.DoubleSide,
        roughness: 0.35,
        metalness: 0.4,
        wireframe,
      }),
    );
    saturnRing.rotation.x = Math.PI / 2.4;
    saturnGroup.add(saturnRing);
    saturnPivot.add(saturnGroup);
    rootGroup.add(saturnPivot);
    registerExplodable(saturnGroup, new THREE.Vector3(0, 0.5, -1));

    // 5. Space Telescope (LatheGeometry barrel + solar wings)
    const lathePts = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.22, 0.05),
      new THREE.Vector2(0.22, 0.65),
      new THREE.Vector2(0.32, 0.95),
      new THREE.Vector2(0.28, 1.0),
    ];
    const scopeGeo = new THREE.LatheGeometry(lathePts, 24);
    const scopeMesh = new THREE.Mesh(
      scopeGeo,
      new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.85,
        roughness: 0.2,
        wireframe,
      }),
    );
    scopeMesh.position.set(2.8, 3.2, 2.1);
    scopeMesh.rotation.z = Math.PI / 3;
    rootGroup.add(scopeMesh);
    registerExplodable(scopeMesh, new THREE.Vector3(0.8, 0.8, 0.8));

    animatedCallbacks.push((elapsed) => {
      sunSphere.rotation.y = elapsed * 0.4;
      coronaRing.rotation.x = elapsed * 0.7;
      coronaRing.rotation.y = elapsed * 0.5;
      earthPivot.rotation.y = elapsed * 0.45;
      earthGroup.rotation.y = elapsed * 1.4;
      marsPivot.rotation.y = elapsed * 0.32;
      saturnPivot.rotation.y = elapsed * 0.22;
      scopeMesh.position.y = 3.2 + Math.sin(elapsed * 2) * 0.15;
    });
  } else if (theme === "water-cycle") {
    // 1. Mountain Terrain + Snow Cap
    const mountainGroup = new THREE.Group();
    mountainGroup.position.set(-1.6, 0.45, -1.0);
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.75,
      metalness: 0.1,
      wireframe,
    });
    const peak1 = new THREE.Mesh(new THREE.ConeGeometry(1.75, 2.9, 7), rockMat);
    peak1.position.y = 1.45;
    mountainGroup.add(peak1);

    const snowCap = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 1.15, 7),
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.35,
        metalness: 0.1,
        wireframe,
      }),
    );
    snowCap.position.y = 2.38;
    mountainGroup.add(snowCap);

    const peak2 = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.1, 6), rockMat);
    peak2.position.set(1.4, 1.05, -0.4);
    mountainGroup.add(peak2);
    rootGroup.add(mountainGroup);
    registerExplodable(mountainGroup, new THREE.Vector3(-0.7, 0.6, -0.5));

    // 2. Flowing River (TubeGeometry)
    const riverCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.3, 2.2, -0.6),
      new THREE.Vector3(-0.6, 1.3, 0.1),
      new THREE.Vector3(0.4, 0.65, 0.9),
      new THREE.Vector3(1.9, 0.52, 1.6),
    ]);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 40, 0.24, 12, false);
    const riverMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1.0,
      wireframe,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    rootGroup.add(riverMesh);
    registerExplodable(riverMesh, new THREE.Vector3(0.3, 0.5, 0.5));

    // 3. Ocean Basin
    const oceanMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.2, 0.32, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        roughness: 0.12,
        metalness: 0.2,
        clearcoat: 1.0,
        wireframe,
      }),
    );
    oceanMesh.position.set(1.8, 0.55, 1.5);
    rootGroup.add(oceanMesh);
    registerExplodable(oceanMesh, new THREE.Vector3(0.8, 0.2, 0.8));

    // 4. Volumetric 3D Cloud Cluster + Sun
    const cloudGroup = new THREE.Group();
    cloudGroup.position.set(0.2, 3.6, -0.2);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.4,
      metalness: 0.05,
      wireframe,
    });
    const puffOffsets = [
      [0, 0, 0, 0.65],
      [0.55, -0.08, 0.15, 0.5],
      [-0.55, -0.05, -0.1, 0.52],
      [0.2, 0.25, -0.2, 0.48],
    ];
    for (const [px, py, pz, pr] of puffOffsets) {
      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(pr, 20, 20),
        cloudMat,
      );
      puff.position.set(px, py, pz);
      cloudGroup.add(puff);
    }
    rootGroup.add(cloudGroup);
    registerExplodable(cloudGroup, new THREE.Vector3(0, 1, 0));

    // 5. Animated Rain Droplets
    const dropsGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const drop = new THREE.Mesh(
        new THREE.ConeGeometry(0.08, 0.28, 12),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.5,
          wireframe,
        }),
      );
      drop.position.set(
        -0.3 + (i % 4) * 0.35,
        2.1 + Math.floor(i / 4) * 0.6,
        -0.2 + (i % 2) * 0.3,
      );
      dropsGroup.add(drop);
    }
    rootGroup.add(dropsGroup);
    registerExplodable(dropsGroup, new THREE.Vector3(0, 0.7, 0.4));

    animatedCallbacks.push((elapsed) => {
      cloudGroup.position.x = 0.2 + Math.sin(elapsed * 0.8) * 0.35;
      dropsGroup.children.forEach((d, idx) => {
        d.position.y = 1.6 + (((elapsed * 1.4 + idx * 0.3) % 1.6));
      });
    });
  } else if (theme === "geometry-crystal") {
    // 1. Central Beveled Hexagonal Prism (ExtrudeGeometry)
    const hexShape = new THREE.Shape();
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * 0.95;
      const y = Math.sin(a) * 0.95;
      if (i === 0) hexShape.moveTo(x, y);
      else hexShape.lineTo(x, y);
    }
    const prismGeo = new THREE.ExtrudeGeometry(hexShape, {
      depth: 1.9,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.1,
      bevelSegments: 3,
    });
    prismGeo.rotateX(Math.PI / 2);
    const prismMesh = new THREE.Mesh(
      prismGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.18,
        metalness: 0.35,
        clearcoat: 1.0,
        wireframe,
      }),
    );
    prismMesh.position.set(0, 2.4, 0);
    rootGroup.add(prismMesh);
    registerExplodable(prismMesh, new THREE.Vector3(0, 1, 0));

    // 2. Golden Pyramid (4-sided Cone)
    const pyramidMesh = new THREE.Mesh(
      new THREE.ConeGeometry(1.15, 1.85, 4),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.25,
        metalness: 0.75,
        wireframe,
      }),
    );
    pyramidMesh.position.set(-2.3, 1.4, 1.2);
    rootGroup.add(pyramidMesh);
    registerExplodable(pyramidMesh, new THREE.Vector3(-1, 0.4, 0.6));

    // 3. Sculpted Lathe Chalice / Cylinder of Revolution
    const lathePts = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.65, 0.05),
      new THREE.Vector2(0.32, 0.55),
      new THREE.Vector2(0.75, 1.35),
      new THREE.Vector2(0.55, 1.75),
    ];
    const latheMesh = new THREE.Mesh(
      new THREE.LatheGeometry(lathePts, 32),
      new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        roughness: 0.3,
        metalness: 0.5,
        wireframe,
      }),
    );
    latheMesh.position.set(2.3, 0.48, 1.1);
    rootGroup.add(latheMesh);
    registerExplodable(latheMesh, new THREE.Vector3(1, 0.4, 0.5));

    // 4. Floating Icosahedron & TorusKnot
    const icoMesh = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.8, 0),
      new THREE.MeshStandardMaterial({
        color: 0x34d399,
        roughness: 0.25,
        metalness: 0.65,
        wireframe,
      }),
    );
    icoMesh.position.set(0, 3.55, 0);
    rootGroup.add(icoMesh);
    registerExplodable(icoMesh, new THREE.Vector3(0, 1.2, 0));

    animatedCallbacks.push((elapsed) => {
      icoMesh.rotation.y = elapsed * 0.8;
      icoMesh.rotation.x = elapsed * 0.4;
      pyramidMesh.rotation.y = elapsed * 0.35;
    });
  } else if (theme === "hebrew-temple") {
    // 1. Four Sculpted Marble Columns (LatheGeometry)
    const colPoints = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.45, 0.05),
      new THREE.Vector2(0.35, 0.25),
      new THREE.Vector2(0.3, 2.2),
      new THREE.Vector2(0.48, 2.45),
    ];
    const colGeo = new THREE.LatheGeometry(colPoints, 20);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.15,
      wireframe,
    });
    const colPositions = [
      [-2.2, 0.45, -1.8],
      [2.2, 0.45, -1.8],
      [-2.2, 0.45, 1.8],
      [2.2, 0.45, 1.8],
    ];
    colPositions.forEach(([cx, cy, cz]) => {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(cx, cy, cz);
      rootGroup.add(col);
      registerExplodable(col, new THREE.Vector3(cx, 0.4, cz));
    });

    // 2. Central Floating Scroll of Light (ExtrudeGeometry + Rollers)
    const scrollGroup = new THREE.Group();
    scrollGroup.position.set(0, 1.9, 0);
    const parchment = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 1.45, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        roughness: 0.55,
        metalness: 0.1,
        wireframe,
      }),
    );
    scrollGroup.add(parchment);

    const rollerGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.85, 20);
    const rollerMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85,
      wireframe,
    });
    const leftRoller = new THREE.Mesh(rollerGeo, rollerMat);
    leftRoller.position.x = -1.1;
    scrollGroup.add(leftRoller);
    const rightRoller = new THREE.Mesh(rollerGeo, rollerMat);
    rightRoller.position.x = 1.1;
    scrollGroup.add(rightRoller);
    rootGroup.add(scrollGroup);
    registerExplodable(scrollGroup, new THREE.Vector3(0, 1, 0));

    animatedCallbacks.push((elapsed) => {
      scrollGroup.position.y = 1.9 + Math.sin(elapsed * 1.8) * 0.14;
      scrollGroup.rotation.y = Math.sin(elapsed * 0.6) * 0.25;
    });
  } else if (theme === "human-cell") {
    // 1. Translucent Cell Membrane Bowl
    const membraneMesh = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 32, 24, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65),
      new THREE.MeshPhysicalMaterial({
        color: 0x14b8a6,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 1.0,
        side: THREE.DoubleSide,
        wireframe,
      }),
    );
    membraneMesh.position.y = 2.1;
    rootGroup.add(membraneMesh);
    registerExplodable(membraneMesh, new THREE.Vector3(0, -0.6, 0));

    // 2. Nucleus Core
    const nucleusMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 28, 28),
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.45,
        roughness: 0.3,
        metalness: 0.3,
        wireframe,
      }),
    );
    nucleusMesh.position.set(0, 1.85, 0);
    rootGroup.add(nucleusMesh);
    registerExplodable(nucleusMesh, new THREE.Vector3(0, 1, 0));

    // 3. Double Helix DNA Spiral
    const dnaGroup = new THREE.Group();
    dnaGroup.position.set(0, 2.9, 0);
    for (let i = 0; i < 10; i++) {
      const angle = i * 0.55;
      const y = (i - 5) * 0.22;
      const rung = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 1.1, 10),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x38bdf8 : 0xf43f5e,
          roughness: 0.3,
          metalness: 0.5,
          wireframe,
        }),
      );
      rung.position.set(0, y, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = angle;
      dnaGroup.add(rung);
    }
    rootGroup.add(dnaGroup);
    registerExplodable(dnaGroup, new THREE.Vector3(0, 1.2, 0));

    animatedCallbacks.push((elapsed) => {
      dnaGroup.rotation.y = elapsed * 0.9;
      nucleusMesh.scale.setScalar(1 + Math.sin(elapsed * 2.5) * 0.05);
    });
  } else {
    // robot-lab
    const robotGroup = new THREE.Group();
    robotGroup.position.set(0, 0.48, 0);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      roughness: 0.25,
      metalness: 0.8,
      wireframe,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.85,
      roughness: 0.15,
      wireframe,
    });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.0), metalMat);
    torso.position.y = 1.2;
    robotGroup.add(torso);
    registerExplodable(torso, new THREE.Vector3(0, 0.5, 0));

    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 0.9), metalMat);
    head.position.y = 2.55;
    robotGroup.add(head);
    registerExplodable(head, new THREE.Vector3(0, 1.2, 0));

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 0.95), visorMat);
    visor.position.y = 2.58;
    robotGroup.add(visor);
    registerExplodable(visor, new THREE.Vector3(0, 1.2, 0.6));

    const leftArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 0.9, 8, 16),
      metalMat,
    );
    leftArm.position.set(-1.05, 1.35, 0);
    robotGroup.add(leftArm);
    registerExplodable(leftArm, new THREE.Vector3(-1, 0.3, 0));

    const rightArm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.22, 0.9, 8, 16),
      metalMat,
    );
    rightArm.position.set(1.05, 1.35, 0);
    robotGroup.add(rightArm);
    registerExplodable(rightArm, new THREE.Vector3(1, 0.3, 0));

    rootGroup.add(robotGroup);
    animatedCallbacks.push((elapsed) => {
      head.rotation.y = Math.sin(elapsed * 1.5) * 0.3;
      visor.rotation.y = head.rotation.y;
      leftArm.rotation.x = Math.sin(elapsed * 2) * 0.35;
      rightArm.rotation.x = -Math.sin(elapsed * 2) * 0.35;
    });
  }

  return {
    rootGroup,
    explodableParts,
    animatedTick: (elapsed: number) => {
      for (const cb of animatedCallbacks) cb(elapsed);
    },
  };
}

/* ============================================================================
   INLINE 3D CARD PREVIEW FOR SMARTBOARD PDF CARDS
   ============================================================================ */

export function Pdf3DInlineCardBanner({
  fileName,
  title,
  category,
  onOpen3DStudio,
}: {
  fileName?: string;
  title: string;
  category: BoardCategory;
  onOpen3DStudio: () => void;
}) {
  return (
    <div className="mt-2.5 p-3 rounded-2xl bg-slate-900 text-white border border-sky-400/50 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-lg shrink-0">
          🧊
        </div>
        <div>
          <div className="text-xs font-extrabold text-sky-300">
            הָפוֹךְ PDF לְמוֹדֶל תְּלַת־מֵמַדִּי וּמִשְׂחַק חֵקֶר (Three.js 3D)
          </div>
          <div className="text-[11px] text-slate-300 truncate max-w-[230px]">
            {fileName || title} · {category}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          sfx.win();
          onOpen3DStudio();
        }}
        className="btn-glow px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shrink-0"
      >
        <Box className="w-3.5 h-3.5" />
        <span>שַׁגֵּר לְמַעְבָּדָה 3D</span>
      </button>
    </div>
  );
}

/* ============================================================================
   MAIN INTERACTIVE 3D PDF STUDIO & PLAYABLE 3D QUEST GAME
   ============================================================================ */

export function Pdf3DModelStudio({
  initialModel,
  authorName,
  onClose,
  onEarnRewards,
}: {
  initialModel?: Pdf3DModelData | null;
  authorName: string;
  onClose?: () => void;
  onEarnRewards?: (xp: number, stars: number) => void;
}) {
  const [models, setModels] = useState<Pdf3DModelData[]>(() =>
    getLocalPdf3DModels(),
  );
  const [activeModel, setActiveModel] = useState<Pdf3DModelData>(
    () => initialModel || getLocalPdf3DModels()[0],
  );

  // Studio vs Playable 3D Quest Game Mode
  const [interactionMode, setInteractionMode] = useState<"studio" | "game">(
    "studio",
  );
  const [gameState, setGameState] = useState<
    "title" | "playing" | "quiz" | "victory"
  >("title");
  const [collectedNodeIds, setCollectedNodeIds] = useState<string[]>([]);
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);
  const [activeQuizNode, setActiveQuizNode] =
    useState<Pdf3DKnowledgeNode | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  // 3D Viewport Controls State
  const [exploded, setExploded] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [nightLighting, setNightLighting] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  // Refs synced into the Three.js animation loop
  const explodedRef = useRef(exploded);
  explodedRef.current = exploded;
  const autoRotateRef = useRef(autoRotate);
  autoRotateRef.current = autoRotate;
  const modeRef = useRef(interactionMode);
  modeRef.current = interactionMode;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const collectedIdsRef = useRef<string[]>(collectedNodeIds);
  collectedIdsRef.current = collectedNodeIds;
  const keysPressedRef = useRef<Record<string, boolean>>({});
  const playerTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.55, 3.6));

  useEffect(() => {
    if (initialModel) {
      setActiveModel(initialModel);
    }
  }, [initialModel]);

  useEffect(() => {
    const syncModels = () => setModels(getLocalPdf3DModels());
    window.addEventListener("iyey_or_pdf3d_updated", syncModels);
    return () => window.removeEventListener("iyey_or_pdf3d_updated", syncModels);
  }, []);

  const showStudioToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Keyboard listener for 3D Quest Game Mode (WASD / Arrow Keys)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Main Three.js WebGL Scene Setup & Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    const themeMeta = PDF_3D_THEME_META[activeModel.theme];
    const bgHex = nightLighting ? themeMeta.skyTop : "#e0f2fe";
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.028);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    camera.position.set(0, 5.6, 10.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });

    // Mandatory isSoftwareGl Guard
    const gl = renderer.getContext();
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const rendererStr = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
      : "";
    const isSoftwareGl =
      /SwiftShader|Software|llvmpipe|Eval|Basic Render Driver/i.test(
        rendererStr,
      );

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      isSoftwareGl ? 1.0 : Math.min(window.devicePixelRatio, 2),
    );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = nightLighting ? 1.15 : 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Studio IBL Environment via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 4;
    controls.maxDistance = 22;
    controls.target.set(0, 1.6, 0);

    // Three-Point Studio Lighting + Hemisphere Fill
    const hemiLight = new THREE.HemisphereLight(
      nightLighting ? 0x38bdf8 : 0xffffff,
      nightLighting ? 0x0f172a : 0x94a3b8,
      nightLighting ? 0.75 : 1.1,
    );
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(
      0xfffbeb,
      nightLighting ? 1.8 : 2.2,
    );
    keyLight.position.set(7, 12, 8);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(
      new THREE.Color(themeMeta.accentHex),
      2.2,
      18,
    );
    rimLight.position.set(-5, 4, -5);
    scene.add(rimLight);

    // Grounded Contact Shadow Disc
    const shadowTex = createContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 13),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.02;
    scene.add(shadowPlane);

    // Build Procedural 3D Scene for the Active PDF Theme
    const built = buildProceduralSceneGroup(activeModel.theme, wireframe);
    scene.add(built.rootGroup);

    // Build 4 Interactive 3D PDF Knowledge Beacons around the island
    const beaconPositions = [
      new THREE.Vector3(-3.3, 1.15, 2.2),
      new THREE.Vector3(3.3, 1.15, 2.2),
      new THREE.Vector3(-3.1, 1.15, -2.4),
      new THREE.Vector3(3.1, 1.15, -2.4),
    ];

    const beaconMeshes: THREE.Object3D[] = [];
    const nodes = activeModel.nodes.slice(0, 4);

    nodes.forEach((node, idx) => {
      const pos = beaconPositions[idx % beaconPositions.length];
      const beaconGroup = new THREE.Group();
      beaconGroup.position.copy(pos);
      beaconGroup.userData = { nodeIndex: idx, nodeId: node.id };

      const isCollected = collectedIdsRef.current.includes(node.id);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: isCollected ? 0x10b981 : new THREE.Color(node.colorHex),
        emissive: isCollected ? 0x059669 : new THREE.Color(node.colorHex),
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.7,
      });
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.46, 0),
        crystalMat,
      );
      crystal.userData = { nodeIndex: idx, nodeId: node.id };
      beaconGroup.add(crystal);

      // Numbered Sprite above crystal
      const badgeTex = createNodeBadgeTexture(
        String(idx + 1),
        node.colorHex,
        isCollected,
      );
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: badgeTex, transparent: true }),
      );
      sprite.scale.set(0.85, 0.85, 1);
      sprite.position.set(0, 0.85, 0);
      sprite.userData = { nodeIndex: idx, nodeId: node.id };
      beaconGroup.add(sprite);

      scene.add(beaconGroup);
      beaconMeshes.push(beaconGroup);
    });

    // 3D Player Explorer Robot for Playable Quest Game Mode
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0.55, 3.6);
    playerTargetRef.current.set(0, 0.55, 3.6);

    const playerBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.45, 8, 16),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.25,
        metalness: 0.7,
      }),
    );
    playerBody.position.y = 0.45;
    playerGroup.add(playerBody);

    const playerCrown = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.05, 12, 24),
      new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.7,
      }),
    );
    playerCrown.rotation.x = Math.PI / 2;
    playerCrown.position.y = 0.95;
    playerGroup.add(playerCrown);
    scene.add(playerGroup);

    // Raycaster for clicking 3D Beacons or Click-to-Move on the pedestal
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (ev: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(beaconMeshes, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && obj.userData?.nodeIndex === undefined) {
          obj = obj.parent;
        }
        const clickedIndex = obj?.userData?.nodeIndex;
        if (typeof clickedIndex === "number") {
          sfx.pop();
          setActiveNodeIndex(clickedIndex);
          const targetNode = nodes[clickedIndex];
          if (targetNode) {
            if (modeRef.current === "game" && gameStateRef.current === "playing") {
              playerTargetRef.current.copy(
                beaconPositions[clickedIndex % beaconPositions.length],
              );
            } else {
              speak(`${targetNode.title}. ${targetNode.fact}`);
            }
          }
        }
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);

    // Animation Loop
    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      built.animatedTick(elapsed);

      // Smooth Explode / Assemble interpolation
      const targetOffset = explodedRef.current ? 1.35 : 0;
      for (const part of built.explodableParts) {
        const desired = part.basePos
          .clone()
          .addScaledVector(part.dir, targetOffset);
        part.obj.position.lerp(desired, 0.08);
      }

      // Rotate & bob the 4 PDF Knowledge Beacons
      beaconMeshes.forEach((bGroup, idx) => {
        const baseY = beaconPositions[idx % beaconPositions.length].y;
        bGroup.position.y = baseY + Math.sin(elapsed * 2.4 + idx) * 0.16;
        if (bGroup.children[0]) {
          bGroup.children[0].rotation.y = elapsed * 1.4 + idx;
        }
      });

      // Handle 3D Explorer Player movement in Game Mode
      playerGroup.visible = modeRef.current === "game";
      if (modeRef.current === "game" && gameStateRef.current === "playing") {
        const speed = 4.2 * delta;
        const keys = keysPressedRef.current;
        if (keys["KeyW"] || keys["ArrowUp"]) {
          playerTargetRef.current.z -= speed;
        }
        if (keys["KeyS"] || keys["ArrowDown"]) {
          playerTargetRef.current.z += speed;
        }
        if (keys["KeyA"] || keys["ArrowLeft"]) {
          playerTargetRef.current.x -= speed;
        }
        if (keys["KeyD"] || keys["ArrowRight"]) {
          playerTargetRef.current.x += speed;
        }
        // Clamp to pedestal radius
        const len2D = Math.hypot(
          playerTargetRef.current.x,
          playerTargetRef.current.z,
        );
        if (len2D > 4.4) {
          playerTargetRef.current.x = (playerTargetRef.current.x / len2D) * 4.4;
          playerTargetRef.current.z = (playerTargetRef.current.z / len2D) * 4.4;
        }
        playerGroup.position.lerp(playerTargetRef.current, 0.15);
        playerCrown.rotation.z = elapsed * 2.5;

        // Check proximity to uncollected PDF Knowledge Beacons
        nodes.forEach((node, idx) => {
          if (collectedIdsRef.current.includes(node.id)) return;
          const bPos = beaconPositions[idx % beaconPositions.length];
          const dist = Math.hypot(
            playerGroup.position.x - bPos.x,
            playerGroup.position.z - bPos.z,
          );
          if (dist < 0.95) {
            sfx.correct();
            setActiveNodeIndex(idx);
            setActiveQuizNode(node);
            setGameState("quiz");
          }
        });
      }

      controls.autoRotate =
        autoRotateRef.current && modeRef.current === "studio";
      controls.autoRotateSpeed = 1.1;
      controls.update();

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      controls.dispose();
      shadowTex.dispose();
      envTarget.dispose();
      renderer.dispose();
    };
  }, [activeModel, wireframe, nightLighting, collectedNodeIds]);

  const handleUploadNewPdfTo3D = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const createdModel = await buildPdf3DModelFromFile(file, {
        authorName,
      });
      setModels(getLocalPdf3DModels());
      setActiveModel(createdModel);
      setCollectedNodeIds([]);
      setActiveNodeIndex(0);

      // Also push a live 3D card onto the SmartBoard
      pushItemToSmartBoard({
        id: `pdf3d-card-${Date.now()}`,
        type: "flashcard",
        title: createdModel.title,
        content: createdModel.summary,
        answer: `${createdModel.nodes.length} תחנות ידע תלת־ממדיות חולצו מתוך "${file.name}"`,
        emoji: PDF_3D_THEME_META[createdModel.theme].emoji,
        category: createdModel.category,
        color: "cyan",
        fontSize: "normal",
        pinned: true,
        x: 65,
        y: 65,
        author: authorName,
        fileName: file.name,
        sourceLabel: "מודל 3D מ-PDF",
      });

      sfx.win();
      showStudioToast(
        `הקובץ "${file.name}" הפך למודל 3D חי ולמשחק חקר תלת־ממדי!`,
      );
    } catch (err) {
      console.error(err);
      showStudioToast("שגיאה בעיבוד קובץ ה-PDF למודל תלת־ממדי.");
    } finally {
      setUploadingPdf(false);
      e.target.value = "";
    }
  };

  const handleSwitchThemeLive = (nextTheme: Pdf3DTheme) => {
    sfx.click();
    setActiveModel((prev) => ({
      ...prev,
      theme: nextTheme,
      category: PDF_3D_THEME_META[nextTheme].category,
    }));
  };

  const handleNudgeExplorer = (dx: number, dz: number) => {
    playerTargetRef.current.x = Math.max(
      -4.2,
      Math.min(4.2, playerTargetRef.current.x + dx),
    );
    playerTargetRef.current.z = Math.max(
      -4.2,
      Math.min(4.2, playerTargetRef.current.z + dz),
    );
  };

  const handleAnswerNodeQuiz = (optionIndex: number) => {
    if (!activeQuizNode) return;
    if (optionIndex === activeQuizNode.correctIndex) {
      sfx.win();
      const nextCollected = Array.from(
        new Set([...collectedNodeIds, activeQuizNode.id]),
      );
      setCollectedNodeIds(nextCollected);
      setQuizFeedback(null);
      setActiveQuizNode(null);

      if (nextCollected.length >= activeModel.nodes.slice(0, 4).length) {
        setGameState("victory");
        onEarnRewards?.(120, 15);
        speak("כל הכבוד! אספתם את כל גבישי הידע מתוך מסמך ה-PDF והשלמתם את המשימה התלת ממדית!");
      } else {
        setGameState("playing");
        showStudioToast("תשובה נכונה! גביש הידע נאסף — המשיכו לגביש הבא!");
      }
    } else {
      sfx.wrong();
      setQuizFeedback("לא מדויק — קראו שוב את הקטע שחולץ מה-PDF ונסו שנית!");
    }
  };

  const currentNode =
    activeModel.nodes[activeNodeIndex] || activeModel.nodes[0];

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-sky-400/60 bg-slate-950 text-white shadow-2xl flex flex-col">
      {/* ====================================================================
         TOP HEADER BAR (Model Switcher, PDF Upload, Mode Switcher)
         ==================================================================== */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-xl">
            {PDF_3D_THEME_META[activeModel.theme].emoji}
          </div>
          <div>
            <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
              <span>אֻלְפַּן מוֹדֶלִים וּמִשְׂחֲקֵי 3D מִקִּבְצֵי PDF</span>
              <span>·</span>
              <span>{activeModel.fileName}</span>
            </div>
            <h3 className="text-base md:text-lg font-extrabold text-white nikud">
              {activeModel.title}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Switch between saved/built-in 3D PDF Models */}
          <select
            value={activeModel.id}
            onChange={(e) => {
              const found = models.find((m) => m.id === e.target.value);
              if (found) {
                sfx.click();
                setActiveModel(found);
                setCollectedNodeIds([]);
                setActiveNodeIndex(0);
              }
            }}
            aria-label="בחר מודל PDF תלת-ממדי"
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-sky-200"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {PDF_3D_THEME_META[m.theme].emoji} {m.title}
              </option>
            ))}
          </select>

          {/* Upload any PDF file to convert into a live 3D Model & Game */}
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleUploadNewPdfTo3D}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            disabled={uploadingPdf}
            className="btn-glow px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>
              {uploadingPdf ? "מְחַלֵּץ PDF ל-3D..." : "+ הַעֲלֵה PDF לִיצִירַת מוֹדֶל 3D"}
            </span>
          </button>

          {/* Studio vs Playable 3D Quest Game Toggle */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                setInteractionMode("studio");
              }}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 ${
                interactionMode === "studio"
                  ? "bg-sky-500 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>מַעְבָּדָה 3D</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.pop();
                setInteractionMode("game");
                setGameState("title");
              }}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 ${
                interactionMode === "game"
                  ? "bg-amber-400 text-slate-950"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>מִשְׂחַק חֵקֶר 3D ({collectedNodeIds.length}/4)</span>
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white"
              title="סגור אולפן 3D"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
         DOMINANT 3D WEBGL VIEWPORT + SOLID/OPAQUE OVERLAYS (Zero backdrop-filter)
         ==================================================================== */}
      <div className="relative w-full h-[500px] md:h-[560px] bg-slate-950 overflow-hidden select-none">
        {/* Three.js Canvas Mount */}
        <div ref={mountRef} className="w-full h-full" />

        {/* Toast Notification */}
        {toastMsg && (
          <div
            style={{ backgroundColor: "rgba(15, 23, 42, 0.94)" }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl border border-emerald-400 text-xs font-extrabold text-emerald-300 flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Top-Right Extracted PDF Page Inspector Card (Compact Opaque Card) */}
        {currentNode && interactionMode === "studio" && (
          <div
            style={{ backgroundColor: "rgba(15, 23, 42, 0.92)" }}
            className="absolute top-3 right-3 z-20 w-72 md:w-80 p-3.5 rounded-2xl border border-sky-400/40 shadow-xl space-y-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[11px] font-extrabold">
                תַּחֲנַת יֶדַע {activeNodeIndex + 1} מִתּוֹךְ ה-PDF
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    speak(`${currentNode.title}. ${currentNode.fact}`)
                  }
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 text-sky-300 hover:text-white"
                  title="הקרא בקול"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-xs font-extrabold text-white nikud">
              {currentNode.title}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed nikud">
              {currentNode.fact}
            </p>

            {/* Quick Node Selector Pills 1..4 */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {activeModel.nodes.slice(0, 4).map((nd, idx) => (
                <button
                  key={nd.id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setActiveNodeIndex(idx);
                  }}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-extrabold transition-colors ${
                    activeNodeIndex === idx
                      ? "bg-sky-500 text-slate-950"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  עמ׳ {idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GAME MODE OVERLAYS: 1. Title Screen */}
        {interactionMode === "game" && gameState === "title" && (
          <div
            style={{ backgroundColor: "rgba(15, 23, 42, 0.88)" }}
            className="absolute inset-0 z-20 flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border-2 border-amber-400/70 text-center space-y-4 shadow-2xl">
              <div className="text-5xl">🚀🧊</div>
              <h4 className="text-xl font-extrabold text-white nikud">
                מַסַּע חֵקֶר תְּלַת־מֵמַדִּי בְּתוֹךְ ה-PDF!
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed nikud">
                הָפַכְנוּ אֶת הַמִּסְמָךְ <strong>&quot;{activeModel.fileName}&quot;</strong> לְעוֹלָם תְּלַת־מֵמַדִּי חַי! הָנִיעוּ אֶת חוֹקֵר הָאוֹר בְּעֶזְרַת מַקָּשֵׁי הַחִיצִּים / WASD (אוֹ לִחֲצוּ עַל גְּבִישֵׁי הַיֶּדַע 1–4 בַּמֶּרְחָב) וּפִתְרוּ אֶת 4 הַחִידוֹת מֵהַמִּסְמָךְ!
              </p>
              <button
                type="button"
                onClick={() => {
                  sfx.win();
                  setCollectedNodeIds([]);
                  setGameState("playing");
                }}
                className="btn-glow w-full py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>הַתְחֵל מַסַּע חֵקֶר בְּתוֹךְ הַמּוֹדֶל!</span>
              </button>
            </div>
          </div>
        )}

        {/* GAME MODE OVERLAYS: 2. Playing HUD + On-Screen D-Pad */}
        {interactionMode === "game" && gameState === "playing" && (
          <>
            <div
              style={{ backgroundColor: "rgba(15, 23, 42, 0.92)" }}
              className="absolute top-3 right-3 z-20 px-4 py-2.5 rounded-2xl border border-amber-400/50 flex items-center gap-3 text-xs font-extrabold"
            >
              <span className="text-amber-300">
                💎 גְּבִישֵׁי PDF שֶׁנֶּאֶסְפוּ: {collectedNodeIds.length} / 4
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-sky-300">
                הִשְׁתַּמְּשׁוּ בְּ-WASD / חִיצִּים אוֹ לִחֲצוּ עַל גְּבִישׁ 1–4
              </span>
            </div>

            {/* Touch / Click D-Pad for moving the 3D Explorer */}
            <div
              style={{ backgroundColor: "rgba(15, 23, 42, 0.9)" }}
              className="absolute bottom-16 left-4 z-20 p-2 rounded-2xl border border-slate-700 grid grid-cols-3 gap-1 w-28"
            >
              <div />
              <button
                type="button"
                onClick={() => handleNudgeExplorer(0, -0.9)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-sky-600 text-white text-xs font-bold text-center"
              >
                ▲
              </button>
              <div />
              <button
                type="button"
                onClick={() => handleNudgeExplorer(-0.9, 0)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-sky-600 text-white text-xs font-bold text-center"
              >
                ◀
              </button>
              <div className="flex items-center justify-center text-[10px] text-sky-400 font-bold">
                3D
              </div>
              <button
                type="button"
                onClick={() => handleNudgeExplorer(0.9, 0)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-sky-600 text-white text-xs font-bold text-center"
              >
                ▶
              </button>
              <div />
              <button
                type="button"
                onClick={() => handleNudgeExplorer(0, 0.9)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-sky-600 text-white text-xs font-bold text-center"
              >
                ▼
              </button>
              <div />
            </div>
          </>
        )}

        {/* GAME MODE OVERLAYS: 3. Extracted PDF Crystal Quiz Modal */}
        {interactionMode === "game" &&
          gameState === "quiz" &&
          activeQuizNode && (
            <div
              style={{ backgroundColor: "rgba(15, 23, 42, 0.9)" }}
              className="absolute inset-0 z-30 flex items-center justify-center p-4"
            >
              <div className="max-w-lg w-full p-6 rounded-3xl bg-slate-900 border-2 border-sky-400 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-xl bg-sky-500/20 text-sky-300 text-xs font-extrabold">
                    📖 קטע מתוך ה-PDF · {activeQuizNode.title}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      speak(
                        `${activeQuizNode.fact}. ${activeQuizNode.question}`,
                      )
                    }
                    className="p-2 rounded-xl bg-slate-800 text-sky-300 hover:text-white"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200 leading-relaxed nikud">
                  {activeQuizNode.fact}
                </div>

                <h4 className="text-base font-extrabold text-amber-300 nikud">
                  ❓ {activeQuizNode.question}
                </h4>

                {quizFeedback && (
                  <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 text-xs font-bold">
                    {quizFeedback}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  {activeQuizNode.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAnswerNodeQuiz(idx)}
                      className="text-right px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-sky-600 border border-slate-700 text-xs font-bold text-white transition-colors"
                    >
                      {idx + 1}. {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        {/* GAME MODE OVERLAYS: 4. Victory Celebration Modal */}
        {interactionMode === "game" && gameState === "victory" && (
          <div
            style={{ backgroundColor: "rgba(15, 23, 42, 0.9)" }}
            className="absolute inset-0 z-30 flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border-2 border-emerald-400 text-center space-y-4 shadow-2xl">
              <Trophy className="w-14 h-14 text-amber-400 mx-auto" />
              <h4 className="text-2xl font-extrabold text-white nikud">
                ניצחון! השלמתם את חקר ה-PDF התלת־ממדי!
              </h4>
              <p className="text-xs text-slate-300">
                אספתם את כל 4 גבישי הידע מתוך <strong>{activeModel.fileName}</strong> וזכיתם ב-<strong>+120 XP</strong> ו-<strong>+15 ⭐ כוכבי אור</strong>!
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setCollectedNodeIds([]);
                    setGameState("playing");
                  }}
                  className="btn-glow px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs"
                >
                  שחק שוב
                </button>
                <button
                  type="button"
                  onClick={() => setInteractionMode("studio")}
                  className="btn-glow px-5 py-2.5 rounded-xl bg-slate-800 text-white font-extrabold text-xs"
                >
                  חזור למעבדה 3D
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
           COMPACT COLLAPSIBLE BOTTOM CONTROL DOCK (<= 12% viewport height, opaque)
           ================================================================== */}
        <div
          style={{ backgroundColor: "rgba(15, 23, 42, 0.94)" }}
          className="absolute bottom-2 left-2 right-2 z-20 rounded-2xl border border-slate-700/90 px-3 py-2 shadow-xl"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* 6 Live 3D Archetype Theme Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(Object.keys(PDF_3D_THEME_META) as Pdf3DTheme[]).map((th) => {
                const meta = PDF_3D_THEME_META[th];
                const isSelected = activeModel.theme === th;
                return (
                  <button
                    key={th}
                    type="button"
                    onClick={() => handleSwitchThemeLive(th)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap flex items-center gap-1 transition-colors ${
                      isSelected
                        ? "bg-sky-500 text-slate-950"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span>{meta.emoji}</span>
                    <span>{meta.name.replace(" 3D", "")}</span>
                  </button>
                );
              })}
            </div>

            {/* 3D Manipulation Controls */}
            <div className="flex items-center gap-1.5">
              {!dockCollapsed && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setExploded((x) => !x);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 ${
                      exploded
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>{exploded ? "הַרְכֵּב חֲלָקִים" : "פָּרֵק מוֹדֶל 3D"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setWireframe((w) => !w);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                      wireframe
                        ? "bg-pink-500 text-white"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    רֶנְטְגֶּן רֶשֶׁת
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setAutoRotate((r) => !r);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                      autoRotate
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    }`}
                  >
                    סִיבּוּב אוֹטוֹמָטִי
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setNightLighting((n) => !n);
                    }}
                    className="p-1.5 rounded-xl bg-slate-800 text-amber-300 hover:bg-slate-700"
                    title="החלף תאורת אולפן יום / לילה"
                  >
                    {nightLighting ? (
                      <Sun className="w-3.5 h-3.5" />
                    ) : (
                      <Moon className="w-3.5 h-3.5" />
                    )}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setDockCollapsed((c) => !c)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                title={dockCollapsed ? "הרחב סרגל 3D" : "מזער סרגל 3D"}
              >
                {dockCollapsed ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
