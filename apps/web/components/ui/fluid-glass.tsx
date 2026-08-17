'use client';

/* eslint-disable react/no-unknown-property */
import React, { useRef, useState, useEffect, memo, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import {
  useFBO,
  Preload,
  MeshTransmissionMaterial,
  Text,
} from '@react-three/drei';
import { easing } from 'maath';

export interface FluidGlassProps {
  mode?: 'lens' | 'bar' | 'cube';
  lensProps?: {
    scale?: number;
    ior?: number;
    thickness?: number;
    chromaticAberration?: number;
    anisotropy?: number;
    distortion?: number;
    temporalDistortion?: number;
    roughness?: number;
    transmission?: number;
    color?: string;
    attenuationColor?: string;
    attenuationDistance?: number;
  };
  barProps?: {
    navItems?: Array<{ label: string; link: string }>;
    scale?: number;
    ior?: number;
    thickness?: number;
    roughness?: number;
    transmission?: number;
    color?: string;
    attenuationColor?: string;
    attenuationDistance?: number;
  };
  cubeProps?: {
    scale?: number;
    ior?: number;
    thickness?: number;
    chromaticAberration?: number;
    anisotropy?: number;
    roughness?: number;
    transmission?: number;
    color?: string;
    attenuationColor?: string;
    attenuationDistance?: number;
  };
  className?: string;
  children?: React.ReactNode;
}

export default function FluidGlass({
  mode = 'lens',
  lensProps = {},
  barProps = {},
  cubeProps = {},
  className = '',
  children,
}: FluidGlassProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`relative w-full h-full min-h-[400px] overflow-hidden ${className}`}>
        {children}
      </div>
    );
  }

  const Wrapper = mode === 'bar' ? Bar : mode === 'cube' ? Cube : Lens;
  const rawOverrides = mode === 'bar' ? barProps : mode === 'cube' ? cubeProps : lensProps;

  const {
    navItems = [
      { label: 'VoiceOps', link: '#workspace' },
      { label: 'Intelligence', link: '#intelligence' },
      { label: 'Security', link: '#security' },
    ],
    ...modeProps
  } = rawOverrides as any;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 20], fov: 15 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'auto' }}
      >
        {mode === 'bar' && <NavItems items={navItems} />}
        <Wrapper modeProps={modeProps}>
          {children ? (
            <group position={[0, 0, 0]}>
              <Typography />
              <FloatingOrbs />
            </group>
          ) : (
            <group position={[0, 0, 0]}>
              <Typography />
              <FloatingOrbs />
            </group>
          )}
          <Preload all />
        </Wrapper>
      </Canvas>
    </div>
  );
}

const ModeWrapper = memo(function ModeWrapper({
  children,
  geometryType = 'cylinder',
  lockToBottom = false,
  followPointer = true,
  modeProps = {},
  ...props
}: {
  children?: React.ReactNode;
  geometryType?: 'cylinder' | 'cube' | 'bar';
  lockToBottom?: boolean;
  followPointer?: boolean;
  modeProps?: any;
  [key: string]: any;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const buffer = useFBO();
  const { viewport: vp } = useThree();
  const [scene] = useState(() => new THREE.Scene());

  const geometry = useMemo(() => {
    if (geometryType === 'cube') {
      const geo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
      geo.computeBoundingBox();
      return geo;
    }
    if (geometryType === 'bar') {
      const geo = new THREE.BoxGeometry(3.6, 0.7, 0.4);
      geo.computeBoundingBox();
      return geo;
    }
    // Default Cylinder/Lens
    const geo = new THREE.CylinderGeometry(1.3, 1.3, 0.35, 64);
    geo.computeBoundingBox();
    return geo;
  }, [geometryType]);

  const geoWidth = useMemo(() => {
    if (!geometry.boundingBox) geometry.computeBoundingBox();
    return (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x) || 1;
  }, [geometry]);

  useFrame((state, delta) => {
    const { gl, viewport, pointer, camera } = state;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);

    const destX = followPointer ? (pointer.x * v.width) / 2 : 0;
    const destY = lockToBottom ? -v.height / 2 + 0.2 : followPointer ? (pointer.y * v.height) / 2 : 0;
    
    if (ref.current) {
      easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta);

      if (modeProps.scale == null) {
        const maxWorld = v.width * 0.9;
        const desired = maxWorld / geoWidth;
        ref.current.scale.setScalar(Math.min(0.22, desired));
      }

      // Gentle interactive rotation on mouse movement
      ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, pointer.x * 0.35, 0.05);
      ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, Math.PI / 2 - pointer.y * 0.3, 0.05);
    }

    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
  });

  const {
    scale,
    ior = 1.15,
    thickness = 5,
    anisotropy = 0.01,
    chromaticAberration = 0.12,
    roughness = 0.05,
    transmission = 1,
    color = '#ffffff',
    attenuationColor = '#a855f7',
    attenuationDistance = 0.4,
    ...extraMat
  } = modeProps;

  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[vp.width, vp.height, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={buffer.texture} transparent opacity={0.9} />
      </mesh>
      <mesh
        ref={ref}
        scale={scale ?? 0.22}
        rotation-x={Math.PI / 2}
        geometry={geometry}
        {...props}
      >
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior}
          thickness={thickness}
          anisotropy={anisotropy}
          chromaticAberration={chromaticAberration}
          roughness={roughness}
          transmission={transmission}
          color={color}
          attenuationColor={attenuationColor}
          attenuationDistance={attenuationDistance}
          samples={8}
          resolution={512}
          {...extraMat}
        />
      </mesh>
    </>
  );
});

function Lens({ modeProps, ...p }: any) {
  return <ModeWrapper geometryType="cylinder" followPointer modeProps={modeProps} {...p} />;
}

function Cube({ modeProps, ...p }: any) {
  return <ModeWrapper geometryType="cube" followPointer modeProps={modeProps} {...p} />;
}

function Bar({ modeProps = {}, ...p }: any) {
  const defaultMat = {
    transmission: 1,
    roughness: 0,
    thickness: 10,
    ior: 1.15,
    color: '#ffffff',
    attenuationColor: '#a855f7',
    attenuationDistance: 0.25,
  };

  return (
    <ModeWrapper
      geometryType="bar"
      lockToBottom
      followPointer={false}
      modeProps={{ ...defaultMat, ...modeProps }}
      {...p}
    />
  );
}

function NavItems({ items }: { items: Array<{ label: string; link: string }> }) {
  const group = useRef<THREE.Group>(null!);
  const { viewport, camera } = useThree();

  const DEVICE = {
    mobile: { max: 639, spacing: 0.2, fontSize: 0.035 },
    tablet: { max: 1023, spacing: 0.24, fontSize: 0.035 },
    desktop: { max: Infinity, spacing: 0.3, fontSize: 0.035 },
  };
  const getDevice = () => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    return w <= DEVICE.mobile.max ? 'mobile' : w <= DEVICE.tablet.max ? 'tablet' : 'desktop';
  };

  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    setDevice(getDevice());
    const onResize = () => setDevice(getDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { spacing, fontSize } = DEVICE[device];

  useFrame(() => {
    if (!group.current) return;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);
    group.current.position.set(0, -v.height / 2 + 0.2, 15.1);

    group.current.children.forEach((child, i) => {
      child.position.x = (i - (items.length - 1) / 2) * spacing;
    });
  });

  const handleNavigate = (link: string) => {
    if (!link || typeof window === 'undefined') return;
    link.startsWith('#') ? (window.location.hash = link) : (window.location.href = link);
  };

  return (
    <group ref={group} renderOrder={10}>
      {items.map(({ label, link }) => (
        <Text
          key={label}
          fontSize={fontSize}
          color="#e9d5ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0}
          outlineBlur={0.2}
          outlineColor="#000000"
          outlineOpacity={0.6}
          renderOrder={10}
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate(link);
          }}
          onPointerOver={() => {
            if (typeof document !== 'undefined') document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            if (typeof document !== 'undefined') document.body.style.cursor = 'auto';
          }}
        >
          {label}
        </Text>
      ))}
    </group>
  );
}

function FloatingOrbs() {
  const orb1 = useRef<THREE.Mesh>(null!);
  const orb2 = useRef<THREE.Mesh>(null!);
  const orb3 = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (orb1.current) {
      orb1.current.position.x = Math.sin(t * 0.6) * 2.5;
      orb1.current.position.y = Math.cos(t * 0.8) * 1.5;
    }
    if (orb2.current) {
      orb2.current.position.x = Math.cos(t * 0.7) * 3 - 1;
      orb2.current.position.y = Math.sin(t * 0.5) * 1.8;
    }
    if (orb3.current) {
      orb3.current.position.x = Math.sin(t * 0.4) * 2 + 1;
      orb3.current.position.y = -Math.cos(t * 0.6) * 1.2;
    }
  });

  return (
    <group position={[0, 0, 5]}>
      <mesh ref={orb1} scale={0.7}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#a855f7" emissive="#9333ea" emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={orb2} scale={0.5}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={orb3} scale={0.4}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={0.7} />
      </mesh>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
    </group>
  );
}

function Typography() {
  const DEVICE = {
    mobile: { fontSize: 0.22 },
    tablet: { fontSize: 0.45 },
    desktop: { fontSize: 0.65 },
  };
  const getDevice = () => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    return w <= 639 ? 'mobile' : w <= 1023 ? 'tablet' : 'desktop';
  };

  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    setDevice(getDevice());
    const onResize = () => setDevice(getDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const { fontSize } = DEVICE[device];

  return (
    <Text
      position={[0, 0, 8]}
      fontSize={fontSize}
      letterSpacing={0.08}
      outlineWidth={0}
      outlineBlur={0.25}
      outlineColor="#000000"
      outlineOpacity={0.7}
      color="#c084fc"
      anchorX="center"
      anchorY="middle"
    >
      VOICEOPS
    </Text>
  );
}
