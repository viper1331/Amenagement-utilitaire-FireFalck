import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import type { EquipmentModule } from '@pkg/data';
import type { IssueSeverity } from '@pkg/core';
import { useEditorStore } from '../../state/useEditorStore';
import { deriveWalkwayStatus } from '../../utils/walkway';

THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const createModuleMaterial = (module: EquipmentModule): THREE.MeshStandardMaterial => {
  const colorSeed = module.tags?.join('-') ?? module.sku;
  const hue = Math.abs(hashString(colorSeed)) % 360;
  const color = new THREE.Color(`hsl(${hue}, 65%, 55%)`);
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.1,
    roughness: 0.6,
    transparent: true,
    opacity: 0.88,
  });
};

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

type Vector3 = [number, number, number];

const DEFAULT_WALKWAY_LENGTH_MM = 6000;

const walkwayAppearance: Record<'clear' | IssueSeverity, {
  readonly fill: number;
  readonly opacity: number;
  readonly border: number;
  readonly borderOpacity: number;
}> = {
  clear: { fill: 0x38bdf8, opacity: 0.14, border: 0x0ea5e9, borderOpacity: 0.45 },
  info: { fill: 0x22d3ee, opacity: 0.16, border: 0x0284c7, borderOpacity: 0.5 },
  warning: { fill: 0xf97316, opacity: 0.2, border: 0xea580c, borderOpacity: 0.65 },
  critical: { fill: 0xef4444, opacity: 0.24, border: 0xb91c1c, borderOpacity: 0.75 },
};

export const SceneCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const orbitControlsRef = useRef<OrbitControls>();
  const transformControlsRef = useRef<TransformControls>();
  const pointerLockControlsRef = useRef<PointerLockControls>();
  const moduleGroupRef = useRef<THREE.Group>(new THREE.Group());
  const moduleMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const measureLineRef = useRef<THREE.Line>(
    new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0xfffb00, linewidth: 2 }),
    ),
  );
  const walkwayMeshRef = useRef<THREE.Mesh>();

  const project = useEditorStore((state) => state.project);
  const vehicle = useEditorStore((state) => state.vehicle);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const setSelection = useEditorStore((state) => state.setSelection);
  const addModule = useEditorStore((state) => state.addModule);
  const updatePlacement = useEditorStore((state) => state.updatePlacement);
  const catalog = useEditorStore((state) => state.catalog);
  const viewMode = useEditorStore((state) => state.viewMode);
  const setViewMode = useEditorStore((state) => state.setViewMode);
  const measure = useEditorStore((state) => state.measure);
  const pushMeasurePoint = useEditorStore((state) => state.pushMeasurePoint);
  const clearMeasure = useEditorStore((state) => state.clearMeasure);
  const translationSnap = useEditorStore((state) => state.translationSnap);
  const walkwayMinWidth = useEditorStore((state) => state.walkwayMinWidth);
  const evaluation = useEditorStore((state) => state.evaluation);
  const rotationSnap = project?.settings.snap.rotation_deg ?? 5;
  const walkwayTargetX = project?.settings.viewport?.target_mm?.[0];
  const walkwayLength = vehicle?.interiorBox?.length_mm ?? DEFAULT_WALKWAY_LENGTH_MM;

  const walkwayStatus = useMemo(
    () => deriveWalkwayStatus(evaluation?.issues),
    [evaluation],
  );

  const moduleLookup = useMemo(
    () => new Map<string, EquipmentModule>(catalog.map((entry) => [entry.sku, entry])),
    [catalog],
  );
  const moduleLookupRef = useRef(moduleLookup);
  const selectedIdsRef = useRef(selectedIds);
  const measureRef = useRef(measure);
  const updatePlacementRef = useRef(updatePlacement);
  const pushMeasurePointRef = useRef(pushMeasurePoint);
  const setSelectionRef = useRef(setSelection);
  const setViewModeRef = useRef(setViewMode);
  const addModuleRef = useRef(addModule);
  const clearMeasureRef = useRef(clearMeasure);

  useEffect(() => {
    moduleLookupRef.current = moduleLookup;
  }, [moduleLookup]);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  useEffect(() => {
    measureRef.current = measure;
  }, [measure]);

  useEffect(() => {
    updatePlacementRef.current = updatePlacement;
  }, [updatePlacement]);

  useEffect(() => {
    pushMeasurePointRef.current = pushMeasurePoint;
  }, [pushMeasurePoint]);

  useEffect(() => {
    setSelectionRef.current = setSelection;
  }, [setSelection]);

  useEffect(() => {
    setViewModeRef.current = setViewMode;
  }, [setViewMode]);

  useEffect(() => {
    addModuleRef.current = addModule;
  }, [addModule]);

  useEffect(() => {
    clearMeasureRef.current = clearMeasure;
  }, [clearMeasure]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1120');
    scene.add(moduleGroupRef.current);
    scene.add(measureLineRef.current);

    const camera = new THREE.PerspectiveCamera(60, width / height, 1, 20000);
    camera.up.set(0, 0, 1);
    camera.position.set(3500, -2800, 2100);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (error) {
      console.error('Unable to initialise WebGL renderer', error);
      container.textContent = 'WebGL non disponible sur cet environnement.';
      return () => {
        container.textContent = '';
      };
    }
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.target.set(1500, 0, 900);

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.setMode('translate');
    const { translationSnap: initialSnap, project: currentProject } = useEditorStore.getState();
    const initialRotationSnap = currentProject?.settings.snap.rotation_deg ?? 5;
    transformControls.setTranslationSnap(initialSnap);
    transformControls.setRotationSnap(toRadians(initialRotationSnap));
    transformControls.addEventListener('dragging-changed', (event: THREE.Event & { value?: boolean }) => {
      orbitControls.enabled = !event.value;
      if (!event.value) {
        const object = transformControls.object as THREE.Mesh | null;
        if (!object) {
          return;
        }
        const id = object.userData.instanceId as string | undefined;
        const module = moduleLookupRef.current.get(object.userData.moduleSku);
        if (!id || !module) {
          return;
        }
        const { position, rotation } = extractPlacementTransform(object, module);
        updatePlacementRef.current(id, { position_mm: position, rotation_deg: rotation });
      }
    });
    transformControls.addEventListener('objectChange', () => {
      const object = transformControls.object as THREE.Mesh | null;
      if (!object) {
        return;
      }
      const id = object.userData.instanceId as string | undefined;
      const module = moduleLookupRef.current.get(object.userData.moduleSku);
      if (!id || !module) {
        return;
      }
      const { position, rotation } = extractPlacementTransform(object, module);
      updatePlacementRef.current(id, { position_mm: position, rotation_deg: rotation }, { skipHistory: true });
    });
    scene.add(transformControls);

    const pointerControls = new PointerLockControls(camera, renderer.domElement);
    pointerControls.addEventListener('unlock', () => setViewModeRef.current('orbit'));

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(4000, -4000, 5000);
    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 0.4);
    rimLight.position.set(-3000, 4000, 2000);
    scene.add(ambient, keyLight, rimLight);

    const grid = new THREE.GridHelper(8000, 32, 0x1f2937, 0x1f2937);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);

    const axes = new THREE.AxesHelper(1200);
    scene.add(axes);

    const walkwayGeometry = new THREE.PlaneGeometry(1, 1);
    const walkwayMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const walkwayMesh = new THREE.Mesh(walkwayGeometry, walkwayMaterial);
    walkwayMesh.name = 'walkway-overlay';
    walkwayMesh.position.set(0, 0, 1);
    walkwayMesh.renderOrder = 1;

    const walkwayBorderGeometry = new THREE.PlaneGeometry(1, 1);
    const walkwayBorder = new THREE.LineSegments(
      new THREE.EdgesGeometry(walkwayBorderGeometry),
      new THREE.LineBasicMaterial({
        color: 0x0ea5e9,
        transparent: true,
        opacity: 0.45,
        depthTest: false,
        depthWrite: false,
      }),
    );
    walkwayBorder.position.set(0, 0, 0.5);
    walkwayMesh.add(walkwayBorder);
    walkwayMesh.userData.walkwayBorder = walkwayBorder;
    walkwayBorderGeometry.dispose();
    scene.add(walkwayMesh);
    walkwayMeshRef.current = walkwayMesh;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const groundPoint = new THREE.Vector3();

    const onPointerDown = (event: PointerEvent) => {
      if (!renderer.domElement.contains(event.target as Node)) {
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      if (measureRef.current.active) {
        if (raycaster.ray.intersectPlane(groundPlane, groundPoint)) {
          pushMeasurePointRef.current([groundPoint.x, groundPoint.y, groundPoint.z]);
        }
        return;
      }

      const intersections = raycaster.intersectObjects(moduleGroupRef.current.children, false);
      if (intersections.length > 0) {
        const instanceId = intersections[0].object.userData.instanceId as string | undefined;
        if (instanceId) {
          const currentSelection = selectedIdsRef.current;
          if (event.shiftKey) {
            const next = currentSelection.includes(instanceId)
              ? currentSelection.filter((id) => id !== instanceId)
              : [...currentSelection, instanceId];
            setSelectionRef.current(next);
          } else {
            setSelectionRef.current([instanceId]);
          }
        }
      } else {
        setSelectionRef.current([]);
      }
    };

    const animate = () => {
      orbitControls.update();
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };

    let animationFrame = requestAnimationFrame(animate);

    const handleResize = () => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      renderer.setSize(nextWidth, nextHeight);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    orbitControlsRef.current = orbitControls;
    transformControlsRef.current = transformControls;
    pointerLockControlsRef.current = pointerControls;

    const meshesForCleanup = moduleMeshesRef.current;

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      cancelAnimationFrame(animationFrame);
      transformControls.dispose();
      orbitControls.dispose();
      pointerControls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
      const walkway = walkwayMeshRef.current;
      if (walkway) {
        scene.remove(walkway);
        walkway.traverse((object) => {
          const meshLike = object as {
            geometry?: THREE.BufferGeometry;
            material?: THREE.Material | THREE.Material[];
          };
          if (meshLike.geometry) {
            meshLike.geometry.dispose();
          }
          if (Array.isArray(meshLike.material)) {
            meshLike.material.forEach((material) => material.dispose());
          } else if (meshLike.material) {
            meshLike.material.dispose();
          }
        });
        walkwayMeshRef.current = undefined;
      }
      meshesForCleanup.forEach((mesh) => {
        mesh.geometry.dispose();
        const material = mesh.material as THREE.Material;
        material.dispose();
      });
      meshesForCleanup.clear();
    };
  }, []);

  useEffect(() => {
    const transformControls = transformControlsRef.current;
    if (transformControls) {
      transformControls.setTranslationSnap(translationSnap);
      transformControls.setRotationSnap(toRadians(rotationSnap));
    }
  }, [translationSnap, rotationSnap]);

  useEffect(() => {
    const walkway = walkwayMeshRef.current;
    if (!walkway) {
      return;
    }
    const width = Math.max(0, walkwayMinWidth);
    walkway.visible = width > 0;
    walkway.scale.y = width > 0 ? width : 1;
  }, [walkwayMinWidth]);

  useEffect(() => {
    const walkway = walkwayMeshRef.current;
    if (!walkway) {
      return;
    }
    walkway.scale.x = walkwayLength;
    walkway.position.x = walkwayTargetX ?? walkwayLength / 2;
  }, [walkwayLength, walkwayTargetX]);

  useEffect(() => {
    const walkway = walkwayMeshRef.current;
    if (!walkway) {
      return;
    }
    const material = walkway.material;
    if (Array.isArray(material)) {
      return;
    }
    const border = walkway.userData.walkwayBorder as THREE.LineSegments | undefined;
    const borderMaterial = border?.material;
    if (borderMaterial && Array.isArray(borderMaterial)) {
      return;
    }
    const key: 'clear' | IssueSeverity = walkwayStatus.severity ?? 'clear';
    const appearance = walkwayAppearance[key];
    const meshMaterial = material as THREE.MeshBasicMaterial;
    meshMaterial.color.setHex(appearance.fill);
    meshMaterial.opacity = appearance.opacity;
    meshMaterial.needsUpdate = true;
    if (borderMaterial instanceof THREE.LineBasicMaterial) {
      borderMaterial.color.setHex(appearance.border);
      borderMaterial.opacity = appearance.borderOpacity;
      borderMaterial.needsUpdate = true;
    }
  }, [walkwayStatus.severity, walkwayStatus.issues.length]);

  useEffect(() => {
    const placements = project?.placements ?? [];
    const group = moduleGroupRef.current;
    const meshes = moduleMeshesRef.current;
    const transformControls = transformControlsRef.current;

    const activeIds = new Set<string>();

    placements.forEach((placement) => {
      const module = moduleLookup.get(placement.moduleSku);
      if (!module) {
        return;
      }
      activeIds.add(placement.instanceId);
      let mesh = meshes.get(placement.instanceId);
      if (!mesh) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = createModuleMaterial(module);
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.instanceId = placement.instanceId;
        mesh.userData.moduleSku = module.sku;
        const edges = new THREE.LineSegments(
          new THREE.EdgesGeometry(geometry),
          new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 1 }),
        );
        mesh.add(edges);
        group.add(mesh);
        meshes.set(placement.instanceId, mesh);
      }
      mesh.scale.set(module.bbox_mm.length_mm, module.bbox_mm.width_mm, module.bbox_mm.height_mm);
      mesh.position.set(
        placement.position_mm[0],
        placement.position_mm[1],
        placement.position_mm[2] + module.bbox_mm.height_mm / 2,
      );
      mesh.rotation.set(
        toRadians(placement.rotation_deg[0]),
        toRadians(placement.rotation_deg[1]),
        toRadians(placement.rotation_deg[2]),
      );
      mesh.userData.locked = placement.locked;
    });

    meshes.forEach((mesh, id) => {
      if (!activeIds.has(id)) {
        const material = mesh.material as THREE.Material;
        material.dispose();
        mesh.geometry.dispose();
        group.remove(mesh);
        meshes.delete(id);
        if (transformControls?.object === mesh) {
          transformControls.detach();
        }
      }
    });
  }, [project, moduleLookup]);

  useEffect(() => {
    const meshes = moduleMeshesRef.current;
    const transformControls = transformControlsRef.current;
    if (!transformControls) {
      return;
    }
    transformControls.detach();
    if (selectedIds.length === 1) {
      const mesh = meshes.get(selectedIds[0]);
      if (mesh && !mesh.userData.locked) {
        transformControls.attach(mesh);
      }
    }
    meshes.forEach((mesh, id) => {
      const material = mesh.material as THREE.MeshStandardMaterial;
      const selected = selectedIds.includes(id);
      material.emissive.setHex(selected ? 0xef4444 : 0x000000);
      material.opacity = mesh.userData.locked ? 0.6 : selected ? 0.95 : 0.88;
    });
  }, [selectedIds]);

  useEffect(() => {
    const line = measureLineRef.current;
    const geometry = line.geometry as THREE.BufferGeometry;
    const points = measure.points;
    if (!points.length) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
      line.visible = false;
      return;
    }
    const positions = new Float32Array(points.length * 3);
    points.forEach((point, index) => {
      positions[index * 3] = point[0];
      positions[index * 3 + 1] = point[1];
      positions[index * 3 + 2] = point[2];
    });
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setDrawRange(0, points.length);
    geometry.computeBoundingSphere();
    line.visible = true;
  }, [measure.points]);

  useEffect(() => {
    const pointerControls = pointerLockControlsRef.current;
    const orbitControls = orbitControlsRef.current;
    if (!pointerControls || !orbitControls) {
      return;
    }
    if (viewMode === 'fpv') {
      orbitControls.enabled = false;
      pointerControls.lock();
    } else {
      pointerControls.unlock();
      orbitControls.enabled = true;
    }
  }, [viewMode]);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const sku = event.dataTransfer.getData('application/module-sku');
    if (!sku) {
      return;
    }
    addModuleRef.current(sku, [0, 0, 0], [0, 0, 0]);
    clearMeasureRef.current();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="scene-canvas"
      data-testid="scene-canvas"
    />
  );
};

const extractPlacementTransform = (mesh: THREE.Mesh, module: EquipmentModule) => {
  const position: Vector3 = [
    mesh.position.x,
    mesh.position.y,
    mesh.position.z - module.bbox_mm.height_mm / 2,
  ];
  const euler = new THREE.Euler().setFromQuaternion(mesh.quaternion, 'XYZ');
  const rotation: Vector3 = [
    THREE.MathUtils.radToDeg(euler.x),
    THREE.MathUtils.radToDeg(euler.y),
    THREE.MathUtils.radToDeg(euler.z),
  ];
  return { position, rotation };
};
