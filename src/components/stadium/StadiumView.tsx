import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Joystick } from 'react-joystick-component';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Html, Grid, Billboard, Text, Box, Image, Decal, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { X, MessageSquare, Send, Settings2, Users } from 'lucide-react';

interface PlayerState {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: number;
  message?: string;
  gender?: 'male' | 'female';
  expression?: 'smile' | 'sad' | 'angry' | 'surprised';
  facialHair?: 'none' | 'mustache' | 'short_beard' | 'long_beard';
  facialHairColor?: string;
  shirtColor?: string;
  pantsColor?: string;
  skinColor?: string;
  hairColor?: string;
  hairType?: string;
  hatType?: string;
  hatColor?: string;
  eyeColor?: string;
  shirtType?: string;
  pantsType?: string;
  shoeColor?: string;
  shoeType?: string;
  glassesType?: string;
  glassesColor?: string;
}

interface MediaData {
  url: string;
  startedAt: number;
}

const joystickMovement = { x: 0, y: 0 };

interface BaseAvatarProps {
  player: PlayerState;
  leftArmRef?: React.RefObject<THREE.Group | null>;
  rightArmRef?: React.RefObject<THREE.Group | null>;
  leftLegRef?: React.RefObject<THREE.Group | null>;
  rightLegRef?: React.RefObject<THREE.Group | null>;
}

const BaseAvatar = ({ player, leftArmRef, rightArmRef, leftLegRef, rightLegRef }: BaseAvatarProps) => {
  const gender = player.gender || 'male';
  const expression = player.expression || 'smile';
  const facialHair = player.facialHair || 'none';
  const facialHairColor = player.facialHairColor || player.hairColor || '#2d1b0a';
  const skinColor = player.skinColor || '#f8c07a';
  const shirtColor = player.shirtColor || '#3b82f6';
  const pantsColor = player.pantsColor || '#1e293b';
  const hairColor = player.hairColor || '#2d1b0a';
  const hairType = player.hairType || 'short';
  const hatType = player.hatType || 'none';
  const hatColor = player.hatColor || '#ef4444';
  const eyeColor = player.eyeColor || '#4a7fb5';
  const shirtType = player.shirtType || 'short_sleeve';
  const pantsType = player.pantsType || 'shorts';
  const shoeColor = player.shoeColor || '#1a1a2e';
  const shoeType = player.shoeType || 'sneakers';
  const glassesType = player.glassesType || 'none';
  const glassesColor = player.glassesColor || '#2d3748';

  const isFemale = gender === 'female';
  const femaleFace = useTexture('/faces/female.png');
  const maleFace = useTexture('/faces/male.png');
  const faceTexture = isFemale ? femaleFace : maleFace;
  const isDress = isFemale && shirtType === 'dress';
  const isSkirt = isFemale && pantsType === 'skirt';
  const torsoWidth = isFemale ? 0.50 : 0.66;
  const hipWidth = isFemale ? 0.64 : 0.56;
  const sleeveColor = (shirtType === 'long_sleeve' || shirtType === 'suit_jacket') && !isDress ? shirtColor : skinColor;

  const renderMouth = () => {
    switch(expression) {
      case 'sad':
        return <mesh position={[0, -0.15, 0.33]} castShadow><torusGeometry args={[0.068, 0.015, 8, 20, Math.PI]} /><meshStandardMaterial color="#1a1a1a" roughness={0.8} /></mesh>;
      case 'angry':
        return <mesh position={[0, -0.15, 0.33]} castShadow><boxGeometry args={[0.13, 0.015, 0.02]} /><meshStandardMaterial color="#1a1a1a" roughness={0.8} /></mesh>;
      case 'surprised':
        return <mesh position={[0, -0.14, 0.33]} rotation={[Math.PI/2, 0, 0]} castShadow><cylinderGeometry args={[0.048, 0.038, 0.02, 12]} /><meshStandardMaterial color="#1a1a1a" roughness={0.8} /></mesh>;
      default:
        return <mesh position={[0, -0.11, 0.33]} rotation={[0, 0, Math.PI]} castShadow><torusGeometry args={[0.068, 0.015, 8, 20, Math.PI]} /><meshStandardMaterial color="#1a1a1a" roughness={0.8} /></mesh>;
    }
  };

  const renderFacialHair = () => {
    if (isFemale || facialHair === 'none') return null;
    switch(facialHair) {
      case 'mustache':
        return (
          <group position={[0, -0.08, 0]}>
            <mesh position={[-0.068, 0, 0.365]} rotation={[0, 0, 0.22]} castShadow><cylinderGeometry args={[0.02, 0.007, 0.12, 6]} /><meshStandardMaterial color={facialHairColor} roughness={0.9} /></mesh>
            <mesh position={[0.068, 0, 0.365]} rotation={[0, 0, -0.22]} castShadow><cylinderGeometry args={[0.02, 0.007, 0.12, 6]} /><meshStandardMaterial color={facialHairColor} roughness={0.9} /></mesh>
          </group>
        );
      case 'short_beard':
        return (
          <group>
            <mesh position={[0, -0.21, 0.3]} rotation={[0.2, 0, 0]} castShadow><boxGeometry args={[0.28, 0.09, 0.17]} /><meshStandardMaterial color={facialHairColor} roughness={0.9} /></mesh>
            <mesh position={[0, -0.28, 0.26]} castShadow><sphereGeometry args={[0.09, 8, 8, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={facialHairColor} roughness={0.9} /></mesh>
          </group>
        );
      case 'long_beard':
        return (
          <group>
            <mesh position={[0, -0.2, 0.29]} rotation={[0.15, 0, 0]} castShadow><boxGeometry args={[0.26, 0.09, 0.17]} /><meshStandardMaterial color={facialHairColor} roughness={0.9} /></mesh>
            <mesh position={[0, -0.44, 0.21]} rotation={[0.1, 0, 0]} castShadow><cylinderGeometry args={[0.16, 0.06, 0.54, 10]} /><meshStandardMaterial color={facialHairColor} roughness={0.9} /></mesh>
          </group>
        );
      default: return null;
    }
  };

  const renderGlasses = () => {
    if (!glassesType || glassesType === 'none') return null;
    const isSun = glassesType.startsWith('sunglasses');
    const lensOpacity = isSun ? 0.88 : 0.22;
    const lensColor = isSun ? '#060d1a' : glassesColor;
    const fr = 0.38; const fm = 0.75;
    const lensZ = 0.355; // Pushed out further

    if (glassesType === 'round' || glassesType === 'sunglasses_round') {
      return (
        <group position={[0, 0.04, 0]}>
          {([-0.12, 0.12] as number[]).map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 0, lensZ]} castShadow><torusGeometry args={[0.066, 0.011, 8, 22]} /><meshStandardMaterial color={glassesColor} roughness={fr} metalness={fm} /></mesh>
              <mesh position={[0, 0, lensZ - 0.003]} castShadow><circleGeometry args={[0.055, 22]} /><meshStandardMaterial color={lensColor} transparent opacity={lensOpacity} depthWrite={false} /></mesh>
            </group>
          ))}
          <mesh position={[0, 0, lensZ]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.006, 0.006, 0.09, 6]} /><meshStandardMaterial color={glassesColor} roughness={fr} metalness={fm} /></mesh>
          {([-1, 1] as number[]).map((s, i) => <mesh key={i} position={[s*0.19, 0, lensZ-0.065]} rotation={[0, -s*0.44, 0]} castShadow><cylinderGeometry args={[0.005, 0.005, 0.13, 6]} /><meshStandardMaterial color={glassesColor} roughness={fr} metalness={fm} /></mesh>)}
        </group>
      );
    }
    if (glassesType === 'square' || glassesType === 'sunglasses_square') {
      return (
        <group position={[0, 0.04, 0]}>
          {([-0.12, 0.12] as number[]).map((x, i) => (
            <group key={i} position={[x, 0, lensZ]}>
              <mesh castShadow><boxGeometry args={[0.145, 0.092, 0.01]} /><meshStandardMaterial color={glassesColor} roughness={fr} /></mesh>
              <mesh position={[0, 0, 0.004]} castShadow><boxGeometry args={[0.123, 0.072, 0.005]} /><meshStandardMaterial color={lensColor} transparent opacity={lensOpacity} depthWrite={false} /></mesh>
            </group>
          ))}
          <mesh position={[0, 0, lensZ]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.006, 0.006, 0.1, 6]} /><meshStandardMaterial color={glassesColor} roughness={fr} /></mesh>
          {([-1, 1] as number[]).map((s, i) => <mesh key={i} position={[s*0.196, 0, lensZ-0.067]} rotation={[0, -s*0.44, 0]} castShadow><cylinderGeometry args={[0.005, 0.005, 0.14, 6]} /><meshStandardMaterial color={glassesColor} roughness={fr} /></mesh>)}
        </group>
      );
    }
    if (glassesType === 'aviator' || glassesType === 'sunglasses_aviator') {
      return (
        <group position={[0, 0.02, 0]}>
          {([-0.12, 0.12] as number[]).map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 0, lensZ]} castShadow><torusGeometry args={[0.071, 0.011, 8, 22]} /><meshStandardMaterial color={glassesColor} roughness={0.22} metalness={0.9} /></mesh>
              <mesh position={[0, 0, lensZ - 0.003]} castShadow><circleGeometry args={[0.06, 22]} /><meshStandardMaterial color={lensColor} transparent opacity={lensOpacity} depthWrite={false} /></mesh>
            </group>
          ))}
          <mesh position={[0, 0.03, lensZ]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.006, 0.006, 0.09, 6]} /><meshStandardMaterial color={glassesColor} roughness={0.22} metalness={0.9} /></mesh>
          <mesh position={[0, -0.01, lensZ]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.004, 0.004, 0.07, 6]} /><meshStandardMaterial color={glassesColor} roughness={0.22} metalness={0.9} /></mesh>
          {([-1, 1] as number[]).map((s, i) => <mesh key={i} position={[s*0.2, 0, lensZ-0.07]} rotation={[0, -s*0.44, 0]} castShadow><cylinderGeometry args={[0.005, 0.005, 0.14, 6]} /><meshStandardMaterial color={glassesColor} roughness={0.22} metalness={0.9} /></mesh>)}
        </group>
      );
    }
    if (glassesType === 'cat_eye' || glassesType === 'sunglasses_cat_eye') {
      return (
        <group position={[0, 0.04, 0]}>
          {([-1, 1] as number[]).map((s, i) => (
            <group key={i} position={[s*0.12, 0.01, lensZ]} rotation={[0, 0, -s*0.14]}>
              <mesh castShadow><boxGeometry args={[0.148, 0.088, 0.01]} /><meshStandardMaterial color={glassesColor} roughness={fr} /></mesh>
              <mesh position={[0, 0, 0.004]} castShadow><boxGeometry args={[0.126, 0.068, 0.005]} /><meshStandardMaterial color={lensColor} transparent opacity={lensOpacity} depthWrite={false} /></mesh>
            </group>
          ))}
          <mesh position={[0, 0, lensZ]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.006, 0.006, 0.09, 6]} /><meshStandardMaterial color={glassesColor} roughness={fr} /></mesh>
          {([-1, 1] as number[]).map((s, i) => <mesh key={i} position={[s*0.197, 0.01, lensZ-0.067]} rotation={[0, -s*0.44, s*0.09]} castShadow><cylinderGeometry args={[0.005, 0.005, 0.13, 6]} /><meshStandardMaterial color={glassesColor} roughness={fr} /></mesh>)}
        </group>
      );
    }
    if (glassesType === 'wayfarer' || glassesType === 'sunglasses_wayfarer') {
      return (
        <group position={[0, 0.04, 0]}>
          {([-0.12, 0.12] as number[]).map((x, i) => (
            <group key={i} position={[x, 0, lensZ]}>
              <mesh castShadow><boxGeometry args={[0.155, 0.1, 0.012]} /><meshStandardMaterial color={glassesColor} roughness={0.6} /></mesh>
              <mesh position={[0, -0.004, 0.004]} castShadow><boxGeometry args={[0.133, 0.08, 0.006]} /><meshStandardMaterial color={lensColor} transparent opacity={lensOpacity} depthWrite={false} /></mesh>
            </group>
          ))}
          <mesh position={[0, 0, lensZ]} rotation={[0, 0, Math.PI/2]} castShadow><cylinderGeometry args={[0.007, 0.007, 0.09, 6]} /><meshStandardMaterial color={glassesColor} roughness={0.6} /></mesh>
          {([-1, 1] as number[]).map((s, i) => <mesh key={i} position={[s*0.199, 0, lensZ-0.07]} rotation={[0, -s*0.44, 0]} castShadow><cylinderGeometry args={[0.005, 0.005, 0.14, 6]} /><meshStandardMaterial color={glassesColor} roughness={0.6} /></mesh>)}
        </group>
      );
    }
    return null;
  };

  const renderShoe = () => {
    switch(shoeType) {
      case 'boots':
        return (
          <>
            <mesh position={[0, -0.89, 0]} castShadow><cylinderGeometry args={[0.112, 0.105, 0.22, 8]} /><meshStandardMaterial color={shoeColor} roughness={0.7} /></mesh>
            <mesh position={[0, -1.032, 0.05]} castShadow><boxGeometry args={[0.22, 0.15, 0.32]} /><meshStandardMaterial color={shoeColor} roughness={0.75} /></mesh>
            <mesh position={[0, -1.115, 0.05]} castShadow><boxGeometry args={[0.24, 0.06, 0.34]} /><meshStandardMaterial color="#111" roughness={0.95} /></mesh>
          </>
        );
      case 'dress_shoes':
        return (
          <>
            <mesh position={[0, -1.032, 0.06]} castShadow><boxGeometry args={[0.2, 0.14, 0.3]} /><meshStandardMaterial color={shoeColor} roughness={0.22} metalness={0.12} /></mesh>
            <mesh position={[0, -1.032, 0.24]} rotation={[-0.25, 0, 0]} castShadow><coneGeometry args={[0.068, 0.09, 6]} /><meshStandardMaterial color={shoeColor} roughness={0.22} metalness={0.12} /></mesh>
            <mesh position={[0, -1.115, 0.06]} castShadow><boxGeometry args={[0.21, 0.05, 0.32]} /><meshStandardMaterial color="#0a0a0a" roughness={0.95} /></mesh>
          </>
        );
      case 'sandals':
        return (
          <>
            <mesh position={[0, -1.115, 0.04]} castShadow><boxGeometry args={[0.22, 0.04, 0.32]} /><meshStandardMaterial color={shoeColor} roughness={0.8} /></mesh>
            <mesh position={[0, -1.078, 0.0]} castShadow><boxGeometry args={[0.22, 0.04, 0.05]} /><meshStandardMaterial color={shoeColor} roughness={0.7} /></mesh>
            <mesh position={[0, -1.078, 0.13]} castShadow><boxGeometry args={[0.22, 0.04, 0.05]} /><meshStandardMaterial color={shoeColor} roughness={0.7} /></mesh>
          </>
        );
      default: // sneakers
        return (
          <>
            <mesh position={[0, -1.032, 0.05]} castShadow><boxGeometry args={[0.22, 0.14, 0.32]} /><meshStandardMaterial color={shoeColor} roughness={0.7} /></mesh>
            <mesh position={[0, -1.112, 0.05]} castShadow><boxGeometry args={[0.24, 0.055, 0.34]} /><meshStandardMaterial color="#dde6f0" roughness={0.95} /></mesh>
            <mesh position={[0, -1.032, 0.22]} castShadow><boxGeometry args={[0.21, 0.12, 0.08]} /><meshStandardMaterial color="#f0f4f8" roughness={0.85} /></mesh>
          </>
        );
    }
  };

  const renderHair = () => {
    if (!hairType || hairType === 'none') return null;
    switch(hairType) {
      case 'buzz_cut':
        return <mesh position={[0, 0.06, 0]} castShadow><sphereGeometry args={[0.362, 16, 16, 0, Math.PI*2, 0, Math.PI/2.65]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>;
      case 'short':
        return (
          <group>
            <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.366, 16, 16, 0, Math.PI*2, 0, Math.PI/2.2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[-0.32, -0.06, 0.05]} rotation={[0, 0, 0.1]} castShadow scale={[1, 1.8, 1]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.32, -0.06, 0.05]} rotation={[0, 0, -0.1]} castShadow scale={[1, 1.8, 1]}><sphereGeometry args={[0.06, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      case 'fade':
        return <group><mesh position={[0, 0.16, 0.03]} castShadow><sphereGeometry args={[0.32, 16, 16, 0, Math.PI*2, 0, Math.PI/2.45]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh></group>;
      case 'medium':
        return (
          <group>
            <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[-0.32, -0.1, -0.04]} castShadow scale={[0.8, 2.5, 2.2]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.32, -0.1, -0.04]} castShadow scale={[0.8, 2.5, 2.2]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.12, -0.26]} rotation={[0.1, 0, 0]} castShadow scale={[2.8, 1.8, 0.8]}><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      case 'spiky':
        return (
          <group>
            <mesh position={[0, 0.08, 0]} castShadow><sphereGeometry args={[0.366, 16, 16, 0, Math.PI*2, 0, Math.PI/2.4]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            {([[-0.11, 0.38, 0.02],[0.11, 0.38, 0.02],[0, 0.42, 0],[-0.06, 0.40, -0.09],[0.06, 0.40, -0.09],[-0.07, 0.36, 0.12],[0.07, 0.36, 0.12]] as [number,number,number][]).map((pos, i) => (
              <mesh key={i} position={pos} rotation={[pos[2]*1.5, 0, pos[0]*1.4]} castShadow><coneGeometry args={[0.06, 0.22, 6]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            ))}
          </group>
        );
      case 'mohawk':
        return (
          <group>
            {([-0.14, 0, 0.14] as number[]).map((z, i) => (
              <mesh key={i} position={[0, 0.28 + Math.abs(z)*0.4, z]} rotation={[z*0.5, 0, 0]} castShadow scale={[0.5, 1.4, 0.5]}><sphereGeometry args={[0.15, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            ))}
          </group>
        );
      case 'undercut':
        return (
          <group>
            <mesh position={[0, 0.18, 0.02]} castShadow><sphereGeometry args={[0.34, 16, 16, 0, Math.PI*2, 0, Math.PI/2.7]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.07, 0.24, 0.1]} rotation={[0.2, -0.25, 0.2]} castShadow scale={[1.8, 0.6, 0.9]}><sphereGeometry args={[0.16, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      case 'long':
        return (
          <group>
            <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.2, -0.24]} rotation={[0.15, 0, 0]} castShadow scale={[3, 2.5, 0.8]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.45, -0.16]} rotation={[0.2, 0, 0]} castShadow scale={[2.6, 2.2, 0.6]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[-0.32, -0.15, -0.04]} rotation={[0.1, 0.1, 0]} castShadow scale={[0.8, 3.2, 1.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.32, -0.15, -0.04]} rotation={[0.1, -0.1, 0]} castShadow scale={[0.8, 3.2, 1.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      case 'long_middle_part':
        return (
          <group>
            <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, 0.32, 0.22]} castShadow><boxGeometry args={[0.02, 0.1, 0.28]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
            <mesh position={[0, -0.2, -0.24]} rotation={[0.15, 0, 0]} castShadow scale={[3, 2.5, 0.8]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.45, -0.16]} rotation={[0.2, 0, 0]} castShadow scale={[2.6, 2.2, 0.6]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[-0.22, 0.08, 0.25]} rotation={[0, 0, 0.24]} castShadow scale={[1.4, 2.2, 0.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.22, 0.08, 0.25]} rotation={[0, 0, -0.24]} castShadow scale={[1.4, 2.2, 0.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[-0.32, -0.15, -0.04]} castShadow scale={[0.8, 3.2, 1.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.32, -0.15, -0.04]} castShadow scale={[0.8, 3.2, 1.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      case 'long_side_part':
        return (
          <group>
            <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.2, -0.24]} rotation={[0.15, 0, 0]} castShadow scale={[3, 2.5, 0.8]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.45, -0.16]} rotation={[0.2, 0, 0]} castShadow scale={[2.6, 2.2, 0.6]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.09, 0.21, 0.27]} rotation={[0, 0, -0.48]} castShadow scale={[2.2, 1.1, 0.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[-0.3, -0.1, 0.05]} rotation={[0, 0, 0.08]} castShadow scale={[0.9, 3.4, 1.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.32, -0.15, -0.04]} castShadow scale={[0.8, 3.2, 1.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      case 'wavy':
        return (
          <group>
            <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            {([-0.18, 0, 0.18] as number[]).map((xo, i) => (
              <mesh key={i} position={[xo*1.2, -0.2-i*0.08, -0.2+Math.abs(xo)*0.1]} rotation={[0.15, xo*0.3, 0]} castShadow scale={[1.6, 1.8, 0.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            ))}
            <mesh position={[0, -0.45, -0.16]} castShadow scale={[2.8, 1.6, 0.6]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[-0.32, -0.15, -0.04]} castShadow scale={[0.9, 3, 1.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.32, -0.15, -0.04]} castShadow scale={[0.9, 3, 1.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      case 'afro':
        return <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.52, 18, 18]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>;
      case 'curly':
        return (
          <group>
            <mesh position={[0, 0.08, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            {([[-0.2,0.32,0.1],[0,0.38,0.05],[0.2,0.32,0.1],[-0.28,0.2,-0.04],[0.28,0.2,-0.04],[-0.15,0.28,-0.22],[0,0.32,-0.26],[0.15,0.28,-0.22],[-0.32,0.1,0],[0.32,0.1,0],[-0.25,0.05,0.2],[0.25,0.05,0.2]] as [number,number,number][]).map((pos, i) => (
              <mesh key={i} position={pos} castShadow><sphereGeometry args={[0.11, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            ))}
          </group>
        );
      case 'ponytail':
        return (
          <group>
            <mesh position={[0, 0.08, 0]} castShadow><sphereGeometry args={[0.366, 16, 16, 0, Math.PI*2, 0, Math.PI/2.1]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.04, -0.3]} castShadow><sphereGeometry args={[0.2, 16, 16, 0, Math.PI*2, Math.PI/2, Math.PI/2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.1, -0.34]} rotation={[Math.PI/2, 0, 0]} castShadow><torusGeometry args={[0.057, 0.013, 6, 14]} /><meshStandardMaterial color={shirtColor} roughness={0.7} /></mesh>
            <mesh position={[0, -0.3, -0.36]} rotation={[0.28, 0, 0]} castShadow scale={[0.6, 2.6, 0.6]}><sphereGeometry args={[0.1, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      case 'bun':
        return (
          <group>
            <mesh position={[0, 0.08, 0]} castShadow><sphereGeometry args={[0.366, 16, 16, 0, Math.PI*2, 0, Math.PI/2.1]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.02, -0.26]} castShadow scale={[2.6, 1.4, 0.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, 0.34, -0.29]} castShadow><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, 0.34, -0.29]} rotation={[Math.PI/2, 0, 0]} castShadow><torusGeometry args={[0.094, 0.01, 8, 14]} /><meshStandardMaterial color={shirtColor} roughness={0.7} /></mesh>
          </group>
        );
      case 'braids':
        return (
          <group>
            <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            {([-0.18, 0, 0.18] as number[]).map((x, i) => (
              <group key={i}>
                <mesh position={[x, -0.34, -0.22]} rotation={[0.2, 0, 0]} castShadow scale={[0.6, 3, 0.6]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
                {([0, 0.12, 0.24, 0.36] as number[]).map((yo, j) => (
                  <mesh key={j} position={[x, -0.12-yo, -0.22]} rotation={[Math.PI/2, 0, 0]} castShadow><torusGeometry args={[0.035, 0.012, 6, 8]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
                ))}
              </group>
            ))}
          </group>
        );
      case 'dreads':
        return (
          <group>
            <mesh position={[0, 0.08, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2.2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            {([[-0.25,-0.18,-0.14],[0,-0.1,-0.33],[0.25,-0.18,-0.14],[-0.33,-0.1,0.04],[0.33,-0.1,0.04],[-0.18,-0.15,0.26],[0.18,-0.15,0.26],[-0.07,-0.04,0.36],[0.07,-0.04,0.36]] as [number,number,number][]).map((pos, i) => (
              <mesh key={i} position={pos} rotation={[pos[2]*0.4, 0, pos[0]*0.5]} castShadow scale={[0.4, 2+(i%3)*0.5, 0.4]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            ))}
          </group>
        );
      case 'locs':
        return (
          <group>
            <mesh position={[0, 0.08, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2.2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            {([[-0.3,-0.12,-0.1],[0,-0.08,-0.35],[0.3,-0.12,-0.1],[-0.35,-0.08,0.08],[0.35,-0.08,0.08],[-0.22,-0.12,0.28],[0.22,-0.12,0.28],[0,-0.06,0.38],[-0.12,-0.14,0.36],[0.12,-0.14,0.36]] as [number,number,number][]).map((pos, i) => (
              <mesh key={i} position={pos} rotation={[pos[2]*0.35, 0, pos[0]*0.4]} castShadow scale={[0.4, 2.5+(i%4)*0.5, 0.4]}><sphereGeometry args={[0.08, 12, 12]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            ))}
          </group>
        );
      case 'bob':
        return (
          <group>
            <mesh position={[0, 0.08, 0]} castShadow><sphereGeometry args={[0.372, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0, -0.12, -0.24]} castShadow scale={[3, 1.8, 0.8]}><sphereGeometry args={[0.15, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[-0.32, -0.06, 0]} castShadow scale={[0.8, 2.2, 2.4]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[0.32, -0.06, 0]} castShadow scale={[0.8, 2.2, 2.4]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      case 'pixie':
        return (
          <group>
            <mesh position={[0, 0.14, 0.04]} castShadow><sphereGeometry args={[0.348, 16, 16, 0, Math.PI*2, 0, Math.PI/2.2]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
            <mesh position={[-0.08, 0.22, 0.18]} rotation={[0, 0, 0.4]} castShadow scale={[1.8, 0.8, 0.8]}><sphereGeometry args={[0.12, 16, 16]} /><meshStandardMaterial color={hairColor} roughness={1} /></mesh>
          </group>
        );
      default: return null;
    }
  };

  return (
    <group>
      {/* ===== TORSO ===== */}
      {isDress ? (
        <group>
          <mesh position={[0, 1.52, 0]} castShadow>
            <cylinderGeometry args={[torsoWidth*0.72, torsoWidth*0.82, 0.58, 12]} />
            <meshStandardMaterial color={shirtColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.72, 0.4, 1.15, 14, 1, false]} />
            <meshStandardMaterial color={shirtColor} roughness={0.5} />
          </mesh>
        </group>
      ) : (
        <group>
          <mesh position={[0, 1.35, 0]} castShadow>
            <boxGeometry args={[torsoWidth, 0.8, 0.4]} />
            <meshStandardMaterial color={shirtType === 'suit_jacket' ? '#e8edf5' : shirtColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.97, 0]} castShadow>
            <boxGeometry args={[hipWidth, 0.22, 0.42]} />
            <meshStandardMaterial color={isSkirt ? pantsColor : shirtColor} roughness={0.5} />
          </mesh>
          <mesh position={[-(torsoWidth/2+0.05), 1.73, 0]} castShadow>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color={shirtColor} roughness={0.5} />
          </mesh>
          <mesh position={[(torsoWidth/2+0.05), 1.73, 0]} castShadow>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshStandardMaterial color={shirtColor} roughness={0.5} />
          </mesh>
          {shirtType === 'suit_jacket' && (
            <group>
              <mesh position={[-(torsoWidth/4), 1.35, 0.21]} rotation={[0, 0.12, 0]} castShadow><boxGeometry args={[torsoWidth/2+0.02, 0.8, 0.02]} /><meshStandardMaterial color={shirtColor} roughness={0.65} /></mesh>
              <mesh position={[(torsoWidth/4), 1.35, 0.21]} rotation={[0, -0.12, 0]} castShadow><boxGeometry args={[torsoWidth/2+0.02, 0.8, 0.02]} /><meshStandardMaterial color={shirtColor} roughness={0.65} /></mesh>
              <mesh position={[-0.1, 1.58, 0.22]} rotation={[0, 0, 0.28]} castShadow><boxGeometry args={[0.11, 0.2, 0.02]} /><meshStandardMaterial color={shirtColor} roughness={0.65} /></mesh>
              <mesh position={[0.1, 1.58, 0.22]} rotation={[0, 0, -0.28]} castShadow><boxGeometry args={[0.11, 0.2, 0.02]} /><meshStandardMaterial color={shirtColor} roughness={0.65} /></mesh>
              <mesh position={[0, 1.28, 0.22]} castShadow><boxGeometry args={[0.055, 0.42, 0.01]} /><meshStandardMaterial color="#b91c1c" roughness={0.6} /></mesh>
              {([1.52, 1.35, 1.18] as number[]).map((y, i) => (
                <mesh key={i} position={[0, y, 0.22]} castShadow><sphereGeometry args={[0.015, 5, 5]} /><meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.8} /></mesh>
              ))}
            </group>
          )}
          {shirtType === 'womens_blouse' && (
            <mesh position={[0, 1.62, 0.21]} rotation={[Math.PI, 0, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.01, 0.36, 3]} />
              <meshStandardMaterial color={skinColor} roughness={0.5} />
            </mesh>
          )}
          {isSkirt && (
            <mesh position={[0, 0.78, 0]} castShadow>
              <cylinderGeometry args={[0.54, 0.34, 0.72, 14, 1, false]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>
          )}
        </group>
      )}

      {/* ===== NECK ===== */}
      <mesh position={[0, 1.82, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.2, 10]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>

      {/* ===== HEAD ===== */}
      <group position={[0, 2.3, 0]}>
        <mesh castShadow scale={[1, 1.06, 0.96]}>
          <sphereGeometry args={[0.35, 22, 22]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        <mesh position={[-0.35, -0.02, 0.02]} scale={[0.44, 0.66, 0.38]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>
        <mesh position={[0.35, -0.02, 0.02]} scale={[0.44, 0.66, 0.38]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Eyes with sclera, iris, pupil, and shine */}
        {([-0.12, 0.12] as number[]).map((x, i) => (
          <group key={i} position={[x, 0.04, 0.32]}>
            <mesh castShadow><sphereGeometry args={[expression === 'surprised' ? 0.072 : 0.056, 10, 10]} /><meshStandardMaterial color="#ffffff" roughness={0.1} /></mesh>
            <mesh position={[0, 0, expression === 'surprised' ? 0.052 : 0.04]} castShadow><sphereGeometry args={[expression === 'surprised' ? 0.04 : 0.03, 10, 10]} /><meshStandardMaterial color={eyeColor} roughness={0.1} metalness={0.3} /></mesh>
            <mesh position={[0, 0, expression === 'surprised' ? 0.062 : 0.048]} castShadow><sphereGeometry args={[expression === 'surprised' ? 0.02 : 0.015, 8, 8]} /><meshStandardMaterial color="#040404" roughness={0.1} /></mesh>
            <mesh position={[0.008, 0.008, expression === 'surprised' ? 0.068 : 0.052]} castShadow><sphereGeometry args={[0.007, 5, 5]} /><meshStandardMaterial color="#ffffff" roughness={0} /></mesh>
          </group>
        ))}

        {/* Eyebrows — always visible, shape changes per expression */}
        {([-0.12, 0.12] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.145, 0.335]}
            rotation={[0, 0, expression === 'angry' ? (x < 0 ? -0.38 : 0.38) : expression === 'sad' ? (x < 0 ? 0.22 : -0.22) : 0]}
            castShadow>
            <boxGeometry args={[0.095, 0.017, 0.02]} />
            <meshStandardMaterial color={hairColor} roughness={0.85} />
          </mesh>
        ))}

        {/* Nose */}
        <mesh position={[0, -0.04, 0.342]} castShadow>
          <sphereGeometry args={[0.042, 10, 10]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.04, 0.336]} castShadow>
          <boxGeometry args={[0.02, 0.085, 0.02]} />
          <meshStandardMaterial color={skinColor} roughness={0.45} />
        </mesh>

        {renderMouth()}
        {renderFacialHair()}
        {renderGlasses()}
        {renderHair()}

        {/* ===== HATS ===== */}
        {hatType === 'baseball' && (
          <group position={[0, 0.32, 0]}>
            <mesh castShadow><sphereGeometry args={[0.376, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hatColor} roughness={0.75} /></mesh>
            <mesh position={[0, -0.07, 0.27]} rotation={[-0.15, 0, 0]} castShadow><cylinderGeometry args={[0.32, 0.32, 0.05, 16, 1, false, 0, Math.PI]} /><meshStandardMaterial color={hatColor} roughness={0.75} /></mesh>
            <mesh position={[0, 0.36, 0]} castShadow><sphereGeometry args={[0.028, 6, 6]} /><meshStandardMaterial color={hatColor} roughness={0.6} /></mesh>
          </group>
        )}
        {hatType === 'snapback' && (
          <group position={[0, 0.32, 0]}>
            <mesh castShadow><sphereGeometry args={[0.376, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color={hatColor} roughness={0.65} /></mesh>
            <mesh position={[0, -0.07, 0.24]} castShadow><boxGeometry args={[0.68, 0.05, 0.28]} /><meshStandardMaterial color={hatColor} roughness={0.65} /></mesh>
            <mesh position={[0, 0.36, 0]} castShadow><sphereGeometry args={[0.028, 6, 6]} /><meshStandardMaterial color="#ffffff" roughness={0.6} /></mesh>
          </group>
        )}
        {hatType === 'beanie' && (
          <group position={[0, 0.3, 0]}>
            <mesh castShadow><sphereGeometry args={[0.38, 16, 16, 0, Math.PI*2, 0, Math.PI/1.62]} /><meshStandardMaterial color={hatColor} roughness={0.92} /></mesh>
            <mesh position={[0, 0.38, 0]} castShadow><sphereGeometry args={[0.095, 8, 8]} /><meshStandardMaterial color={hatColor} roughness={1} /></mesh>
            <mesh position={[0, -0.07, 0]} castShadow><cylinderGeometry args={[0.384, 0.384, 0.1, 16]} /><meshStandardMaterial color={hatColor} roughness={0.92} /></mesh>
          </group>
        )}
        {hatType === 'cowboy' && (
          <group position={[0, 0.28, 0]}>
            <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.22, 0.3, 0.44, 16]} /><meshStandardMaterial color={hatColor} roughness={0.8} /></mesh>
            <mesh castShadow><cylinderGeometry args={[0.72, 0.68, 0.06, 16]} /><meshStandardMaterial color={hatColor} roughness={0.8} /></mesh>
            <mesh position={[0, 0.04, 0]} castShadow><cylinderGeometry args={[0.307, 0.307, 0.08, 16]} /><meshStandardMaterial color="#0a0a0a" roughness={0.7} /></mesh>
          </group>
        )}
        {hatType === 'top_hat' && (
          <group position={[0, 0.35, 0]}>
            <mesh position={[0, 0.37, 0]} castShadow><cylinderGeometry args={[0.25, 0.27, 0.74, 16]} /><meshStandardMaterial color={hatColor} roughness={0.45} metalness={0.25} /></mesh>
            <mesh castShadow><cylinderGeometry args={[0.5, 0.5, 0.05, 16]} /><meshStandardMaterial color={hatColor} roughness={0.45} metalness={0.25} /></mesh>
            <mesh position={[0, 0.06, 0]} castShadow><cylinderGeometry args={[0.278, 0.278, 0.08, 16]} /><meshStandardMaterial color="#991b1b" roughness={0.6} /></mesh>
          </group>
        )}
        {hatType === 'bucket_hat' && (
          <group position={[0, 0.3, 0]}>
            <mesh position={[0, 0.18, 0]} castShadow><cylinderGeometry args={[0.26, 0.33, 0.38, 14]} /><meshStandardMaterial color={hatColor} roughness={0.9} /></mesh>
            <mesh castShadow><cylinderGeometry args={[0.53, 0.51, 0.06, 14]} /><meshStandardMaterial color={hatColor} roughness={0.9} /></mesh>
          </group>
        )}
      </group>

      {/* ===== LEFT ARM ===== */}
      <group position={[-(torsoWidth/2+0.14), 1.75, 0]} ref={leftArmRef}>
        <mesh position={[0, -0.2, 0]} castShadow><cylinderGeometry args={[0.092, 0.082, 0.4, 8]} /><meshStandardMaterial color={sleeveColor} roughness={0.5} /></mesh>
        {(shirtType === 'short_sleeve' || shirtType === 'womens_blouse') && (
          <mesh position={[0, -0.05, 0]} castShadow><cylinderGeometry args={[0.098, 0.092, 0.18, 8]} /><meshStandardMaterial color={shirtColor} roughness={0.5} /></mesh>
        )}
        <mesh position={[0, -0.42, 0]} castShadow><sphereGeometry args={[0.088, 8, 8]} /><meshStandardMaterial color={sleeveColor} roughness={0.5} /></mesh>
        <mesh position={[0, -0.62, 0]} castShadow><cylinderGeometry args={[0.078, 0.067, 0.38, 8]} /><meshStandardMaterial color={sleeveColor} roughness={0.5} /></mesh>
        <mesh position={[0, -0.835, 0]} castShadow><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
        <mesh position={[0, -0.965, 0]} scale={[1, 0.68, 0.52]} castShadow><sphereGeometry args={[0.088, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
      </group>

      {/* ===== RIGHT ARM ===== */}
      <group position={[(torsoWidth/2+0.14), 1.75, 0]} ref={rightArmRef}>
        <mesh position={[0, -0.2, 0]} castShadow><cylinderGeometry args={[0.092, 0.082, 0.4, 8]} /><meshStandardMaterial color={sleeveColor} roughness={0.5} /></mesh>
        {(shirtType === 'short_sleeve' || shirtType === 'womens_blouse') && (
          <mesh position={[0, -0.05, 0]} castShadow><cylinderGeometry args={[0.098, 0.092, 0.18, 8]} /><meshStandardMaterial color={shirtColor} roughness={0.5} /></mesh>
        )}
        <mesh position={[0, -0.42, 0]} castShadow><sphereGeometry args={[0.088, 8, 8]} /><meshStandardMaterial color={sleeveColor} roughness={0.5} /></mesh>
        <mesh position={[0, -0.62, 0]} castShadow><cylinderGeometry args={[0.078, 0.067, 0.38, 8]} /><meshStandardMaterial color={sleeveColor} roughness={0.5} /></mesh>
        <mesh position={[0, -0.835, 0]} castShadow><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
        <mesh position={[0, -0.965, 0]} scale={[1, 0.68, 0.52]} castShadow><sphereGeometry args={[0.088, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
      </group>

      {/* ===== LEGS ===== */}
      {!isDress && (
        <>
          <group position={[-0.17, 0.95, 0]} ref={leftLegRef}>
            <mesh position={[0, -0.2, 0]} castShadow><cylinderGeometry args={[0.115, 0.102, 0.4, 8]} /><meshStandardMaterial color={isSkirt ? skinColor : pantsType !== 'shorts' ? pantsColor : pantsColor} roughness={0.5} /></mesh>
            {pantsType === 'shorts' && <mesh position={[0, -0.41, 0]} castShadow><cylinderGeometry args={[0.106, 0.103, 0.055, 8]} /><meshStandardMaterial color={pantsColor} roughness={0.5} /></mesh>}
            <mesh position={[0, -0.43, 0]} castShadow><sphereGeometry args={[0.105, 8, 8]} /><meshStandardMaterial color={pantsType === 'pants' && !isSkirt ? pantsColor : skinColor} roughness={0.5} /></mesh>
            <mesh position={[0, -0.63, 0]} castShadow><cylinderGeometry args={[0.093, 0.078, 0.38, 8]} /><meshStandardMaterial color={pantsType === 'pants' && !isSkirt ? pantsColor : skinColor} roughness={0.5} /></mesh>
            <mesh position={[0, -0.84, 0]} castShadow><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
            {renderShoe()}
          </group>
          <group position={[0.17, 0.95, 0]} ref={rightLegRef}>
            <mesh position={[0, -0.2, 0]} castShadow><cylinderGeometry args={[0.115, 0.102, 0.4, 8]} /><meshStandardMaterial color={isSkirt ? skinColor : pantsType !== 'shorts' ? pantsColor : pantsColor} roughness={0.5} /></mesh>
            {pantsType === 'shorts' && <mesh position={[0, -0.41, 0]} castShadow><cylinderGeometry args={[0.106, 0.103, 0.055, 8]} /><meshStandardMaterial color={pantsColor} roughness={0.5} /></mesh>}
            <mesh position={[0, -0.43, 0]} castShadow><sphereGeometry args={[0.105, 8, 8]} /><meshStandardMaterial color={pantsType === 'pants' && !isSkirt ? pantsColor : skinColor} roughness={0.5} /></mesh>
            <mesh position={[0, -0.63, 0]} castShadow><cylinderGeometry args={[0.093, 0.078, 0.38, 8]} /><meshStandardMaterial color={pantsType === 'pants' && !isSkirt ? pantsColor : skinColor} roughness={0.5} /></mesh>
            <mesh position={[0, -0.84, 0]} castShadow><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color={skinColor} roughness={0.5} /></mesh>
            {renderShoe()}
          </group>
        </>
      )}
    </group>
  );
};

const Avatar3D = ({ player, isMe }: { player: PlayerState, isMe?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  
  const lastPos = useRef<THREE.Vector3>(new THREE.Vector3(...player.position));
  const walkTime = useRef(0);

  const shirtColor = player.shirtColor || '#3b82f6';

  useFrame((state, delta) => {
    if (ref.current) {
      const currentPos = new THREE.Vector3(...player.position);
      
      // Smoothly interpolate the avatar's position to smooth out network/React state ticks
      ref.current.position.lerp(currentPos, 0.2);

      // Check distance moved by the visual mesh this frame
      const dist = lastPos.current.distanceTo(ref.current.position);
      
      if (dist > 0.005) {
        walkTime.current += delta * 15;
        
        const direction = currentPos.clone().sub(lastPos.current).normalize();
        if (direction.lengthSq() > 0.1) {
          const targetRotation = Math.atan2(direction.x, direction.z);
          const currentRot = ref.current.rotation.y;
          let diff = targetRotation - currentRot;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          ref.current.rotation.y += diff * 0.2;
        }
      } else {
        // Smoothly return to standing position
        walkTime.current = THREE.MathUtils.lerp(walkTime.current, 0, 0.1);
        // Gentle idle breathing bob
        const t = state.clock.elapsedTime;
        ref.current.position.y = currentPos.y + Math.sin(t * 1.4) * 0.006;
      }
      
      lastPos.current.copy(ref.current.position);

      const swing = Math.sin(walkTime.current) * 1.5;
      
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, swing, 0.2);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -swing, 0.2);
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, -swing, 0.2);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, swing, 0.2);
    }
  });

  return (
    <group ref={ref} position={player.position}>
      <BaseAvatar 
        player={player} 
        leftArmRef={leftArmRef} 
        rightArmRef={rightArmRef} 
        leftLegRef={leftLegRef} 
        rightLegRef={rightLegRef} 
      />

      {/* Name Tag */}
      <Billboard position={[0, 3.8, 0]}>
        <Text fontSize={0.3} color="#ffffff" anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor="#000000">
          {player.name}
        </Text>
      </Billboard>

      {/* Chat Bubble */}
      {player.message && (
        <Billboard position={[0, 4.6, 0]}>
          <Html transform sprite>
            <div style={{
              background: 'rgba(15, 23, 42, 0.9)',
              border: `1px solid ${shirtColor}`,
              padding: '8px 12px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              maxWidth: '200px',
              textAlign: 'center',
              boxShadow: `0 0 10px ${shirtColor}40`,
              pointerEvents: 'none'
            }}>
              {player.message}
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
};

const IsometricCamera = () => {
  const { camera } = useThree();
  useEffect(() => {
    // Set isometric-like perspective
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
};

const GroundGrid = () => {
  return (
    <group>
      {/* Solid dark base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#020617" />
      </mesh>
      {/* Glowing Tron-like Grid */}
      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        sectionColor="#3b82f6" 
        cellColor="#1e293b" 
        sectionThickness={1.5} 
        cellThickness={0.5} 
      />
    </group>
  );
};


const SeatingArea = ({ position, rotation = 0 }: { position: [number, number, number], rotation?: number }) => {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Round Table */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 0.1, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} />
      </mesh>

      {/* Couch 1 */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.4, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.7, -0.4]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.8, 0.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <mesh position={[-0.9, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.6, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <mesh position={[0.9, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.6, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>

      {/* Couch 2 (opposite) */}
      <group position={[0, 0, 2]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.4, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.7, -0.4]} castShadow receiveShadow>
          <boxGeometry args={[2, 0.8, 0.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <mesh position={[-0.9, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.6, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        <mesh position={[0.9, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.2, 0.6, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
};

const ProjectorScreen = ({ mediaData }: { mediaData: MediaData }) => {
  const { url, startedAt } = mediaData;
  const isVideo = url.includes('youtube.com') || url.includes('youtu.be') || url.endsWith('.mp4');

  let embedUrl = url;
  if (isVideo && (url.includes('youtube.com') || url.includes('youtu.be'))) {
    // Parse YouTube URL to get video ID
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
    if (videoIdMatch) {
      // Calculate elapsed seconds since broadcast to sync playback
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      // Construct embed URL with autoplay, unmuted (mute=0), start time, and playsinline
      embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&mute=0&start=${elapsedSeconds}&playsinline=1&enablejsapi=1`;
    }
  }

  return (
    <group position={[-15, 5, -15]} rotation={[0, Math.PI / 4, 0]}>
      {/* Screen Frame */}
      <mesh position={[0, 0, -0.1]}>
        <boxGeometry args={[24.5, 14.5, 0.5]} />
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {isVideo ? (
        <Html transform position={[0, 0, 0.17]} distanceFactor={5}>
          <div style={{
            width: '1920px',
            height: '1080px',
            background: '#000',
            border: '8px solid #3b82f6',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 0 100px rgba(59, 130, 246, 0.5)'
          }}>
            <iframe 
              width="100%" 
              height="100%" 
              src={embedUrl} 
              title="SETX 360 Stadium Live" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </Html>
      ) : (
        <group position={[0, 0, 0.17]}>
          <Image url={url} scale={[24, 14]} transparent />
          {/* Border glow */}
          <mesh position={[0, 0, -0.01]}>
             <planeGeometry args={[24.2, 14.2]} />
             <meshBasicMaterial color="#3b82f6" />
          </mesh>
        </group>
      )}

      {/* Screen glow */}
      <pointLight position={[0, 0, 2]} intensity={2} color="#3b82f6" distance={20} />
      
      {/* Title Text */}
      <Text position={[0, 8.5, 0]} fontSize={1.5} color="#ffffff" outlineWidth={0.05} outlineColor="#3b82f6">
        SETX 360 Stadium
      </Text>
    </group>
  );
};

// Key press manager
const useKeys = () => {
  const keys = useRef<{ [key: string]: boolean }>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = true);
    const up = (e: KeyboardEvent) => (keys.current[e.key.toLowerCase()] = false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  return keys;
};

const MovementManager = ({ onMove }: { onMove: (pos: [number, number, number]) => void }) => {
  const keys = useKeys();
  const position = useRef<[number, number, number]>([(Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10]);
  const lastBroadcast = useRef(Date.now());
  
  useFrame(() => {
    let moved = false;
    const speed = 0.15;
    const k = keys.current;

    // Movement relative to world axes
    if (k['w'] || k['arrowup']) { position.current[2] -= speed; moved = true; }
    if (k['s'] || k['arrowdown']) { position.current[2] += speed; moved = true; }
    if (k['a'] || k['arrowleft']) { position.current[0] -= speed; moved = true; }
    if (k['d'] || k['arrowright']) { position.current[0] += speed; moved = true; }

    if (joystickMovement.x !== 0 || joystickMovement.y !== 0) {
      position.current[0] += joystickMovement.x * speed;
      position.current[2] -= joystickMovement.y * speed; // inverted Y for 3D Z axis
      moved = true;
    }

    // Clamp boundaries
    position.current[0] = Math.max(-45, Math.min(45, position.current[0]));
    position.current[2] = Math.max(-45, Math.min(45, position.current[2]));

    // Broadcast only occasionally to save bandwidth, but immediately on start/stop
    if (moved && Date.now() - lastBroadcast.current > 50) {
      onMove([...position.current]);
      lastBroadcast.current = Date.now();
    }
  });

  return null;
};

export const StadiumView: React.FC<{ onNavigate: (env: string) => void }> = ({ onNavigate }) => {
  const { user } = useApp();
  
  // Lobby State
  const [hasJoined, setHasJoined] = useState(false);
  const [roomName, setRoomName] = useState('Main Stage');
  const [lobbyTab, setLobbyTab] = useState<'join' | 'closet'>('join');
  const [saveText, setSaveText] = useState('Save to Closet');
  
  // Customization State
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [expression, setExpression] = useState<'smile' | 'sad' | 'angry' | 'surprised'>('smile');
  const [facialHair, setFacialHair] = useState<'none' | 'mustache' | 'short_beard' | 'long_beard'>('none');
  const [facialHairColor, setFacialHairColor] = useState('#2d1b0a');
  const [shirtColor, setShirtColor] = useState('#3b82f6');
  const [pantsColor, setPantsColor] = useState('#1e293b');
  const [skinColor, setSkinColor] = useState('#f8c07a');
  const [hairColor, setHairColor] = useState('#2d1b0a');
  const [hairType, setHairType] = useState('short');
  const [hatType, setHatType] = useState('none');
  const [hatColor, setHatColor] = useState('#ef4444');
  const [eyeColor, setEyeColor] = useState('#4a7fb5');
  const [shirtType, setShirtType] = useState('short_sleeve');
  const [pantsType, setPantsType] = useState('shorts');
  const [shoeColor, setShoeColor] = useState('#1a1a2e');
  const [shoeType, setShoeType] = useState('sneakers');
  const [glassesType, setGlassesType] = useState('none');
  const [glassesColor, setGlassesColor] = useState('#2d3748');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('setx_stadium_avatar');
      if (saved) {
        try {
          const p = JSON.parse(saved);
          if (p.gender) setGender(p.gender);
          if (p.expression) setExpression(p.expression);
          if (p.facialHair) setFacialHair(p.facialHair);
          if (p.facialHairColor) setFacialHairColor(p.facialHairColor);
          if (p.shirtColor) setShirtColor(p.shirtColor);
          if (p.pantsColor) setPantsColor(p.pantsColor);
          if (p.color && !p.shirtColor) setShirtColor(p.color); // backwards compatibility
          if (p.skinColor) setSkinColor(p.skinColor);
          if (p.hairColor) setHairColor(p.hairColor);
          if (p.hairType) setHairType(p.hairType);
          if (p.hatType) setHatType(p.hatType);
          if (p.hatColor) setHatColor(p.hatColor);
          if (p.eyeColor) setEyeColor(p.eyeColor);
          if (p.shirtType) setShirtType(p.shirtType);
          if (p.pantsType) setPantsType(p.pantsType);
          if (p.shoeColor) setShoeColor(p.shoeColor);
          if (p.shoeType) setShoeType(p.shoeType);
          if (p.glassesType) setGlassesType(p.glassesType);
          if (p.glassesColor) setGlassesColor(p.glassesColor);
        } catch (e) {}
      }
    }
  }, []);

  const handleSaveCloset = () => {
    const prefs = { gender, expression, facialHair, facialHairColor, shirtColor, pantsColor, skinColor, hairColor, hairType, hatType, hatColor, eyeColor, shirtType, pantsType, shoeColor, shoeType, glassesType, glassesColor };
    localStorage.setItem('setx_stadium_avatar', JSON.stringify(prefs));
    setSaveText('Saved!');
    setTimeout(() => setSaveText('Save to Closet'), 2000);
  };
  
  // Stadium State
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [chatInput, setChatInput] = useState('');
  const [myMessage, setMyMessage] = useState<string | undefined>();
  const [mediaData, setMediaData] = useState<MediaData>({ url: '/stadium-logo.png', startedAt: Date.now() });
  const mediaDataRef = useRef<MediaData>({ url: '/stadium-logo.png', startedAt: Date.now() });
  const [adminMediaInput, setAdminMediaInput] = useState('');
  const channelRef = useRef<any>(null);

  // Sync state
  const myStateRef = useRef<PlayerState>({
    id: user?.id || 'guest-' + Math.random(),
    name: user?.name || 'Guest',
    position: [(Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10],
    rotation: 0,
    gender,
    expression,
    facialHair,
    facialHairColor,
    shirtColor,
    pantsColor,
    skinColor,
    hairColor,
    hairType,
    hatType,
    hatColor,
    eyeColor,
    shirtType,
    pantsType,
    shoeColor,
    shoeType,
    glassesType,
    glassesColor
  });

  useEffect(() => {
    // Only subscribe to channels once the user joins the lobby
    if (!hasJoined) return;

    myStateRef.current.gender = gender;
    myStateRef.current.expression = expression;
    myStateRef.current.facialHair = facialHair;
    myStateRef.current.facialHairColor = facialHairColor;
    myStateRef.current.shirtColor = shirtColor;
    myStateRef.current.pantsColor = pantsColor;
    myStateRef.current.skinColor = skinColor;
    myStateRef.current.hairColor = hairColor;
    myStateRef.current.hairType = hairType;
    myStateRef.current.hatType = hatType;
    myStateRef.current.hatColor = hatColor;
    myStateRef.current.eyeColor = eyeColor;
    myStateRef.current.shirtType = shirtType;
    myStateRef.current.pantsType = pantsType;
    myStateRef.current.shoeColor = shoeColor;
    myStateRef.current.shoeType = shoeType;
    myStateRef.current.glassesType = glassesType;
    myStateRef.current.glassesColor = glassesColor;

    const channelName = `stadium_realm_${roomName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const channel = supabase.channel(channelName, {
      config: { presence: { key: myStateRef.current.id }, broadcast: { self: false } }
    });
    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activePlayers: Record<string, PlayerState> = {};
        for (const id in state) {
          if (id !== myStateRef.current.id) {
            const p = state[id][0] as any;
            if (p && p.position) {
              activePlayers[id] = p as PlayerState;
            }
          }
        }
        setPlayers(prev => ({ ...prev, ...activePlayers }));
        
        // If we are admin, broadcast the current media so new joiners see it
        if (user?.role === 'admin') {
          channel.send({ type: 'broadcast', event: 'media_update', payload: mediaDataRef.current }).catch(() => {});
        }
      })
      .on('broadcast', { event: 'move' }, ({ payload }) => {
        setPlayers(prev => ({
          ...prev,
          [payload.id]: payload
        }));
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        setPlayers(prev => ({
          ...prev,
          [payload.id]: { ...(prev[payload.id] || {}), message: payload.message }
        }));
        
        // Auto-clear message after 5 seconds
        setTimeout(() => {
          setPlayers(curr => {
            const newPlayers = { ...curr };
            if (newPlayers[payload.id]) {
              newPlayers[payload.id] = { ...newPlayers[payload.id], message: undefined };
            }
            return newPlayers;
          });
        }, 5000);
      })
      .on('broadcast', { event: 'media_update' }, ({ payload }) => {
        setMediaData(payload);
        mediaDataRef.current = payload;
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(myStateRef.current);
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [hasJoined, roomName]); // re-run if joined state or room changes

  const broadcastMove = (pos: [number, number, number]) => {
    myStateRef.current.position = pos;
    // Update local state for immediate render
    setPlayers(prev => ({ ...prev, [myStateRef.current.id]: myStateRef.current }));
    
    // Broadcast to others
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'move',
        payload: myStateRef.current
      }).catch(console.error);
    }
  };

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    myStateRef.current.message = chatInput;
    setMyMessage(chatInput);
    setChatInput('');

    // Broadcast chat
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'chat',
        payload: { id: myStateRef.current.id, message: myStateRef.current.message }
      }).catch(console.error);
    }

    // Auto clear local chat
    setTimeout(() => {
      setMyMessage(undefined);
      myStateRef.current.message = undefined;
    }, 5000);
  };

  const handleJoystickMove = (e: any) => {
    joystickMovement.x = (e.x || 0) / 20; 
    joystickMovement.y = (e.y || 0) / 20;
  };
  const handleJoystickStop = () => {
    joystickMovement.x = 0;
    joystickMovement.y = 0;
  };

  const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window;

  // Render Lobby if not joined
  if (!hasJoined) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '40px 0' }}>
        
        {/* Background decorative grid */}
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }} />

        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '500px', margin: 'auto', background: 'rgba(15, 23, 42, 0.8)', padding: '32px', borderRadius: '16px', border: '1px solid #3b82f6', backdropFilter: 'blur(20px)', boxShadow: '0 0 40px rgba(59, 130, 246, 0.2)' }}>
          
          <button onClick={() => onNavigate('home')} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={24} />
          </button>

          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', marginBottom: '16px' }}>
              <Users size={32} color="#3b82f6" />
            </div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.8rem', fontWeight: 700 }}>Stadium Check-in</h1>
            <p style={{ margin: '8px 0 0', color: '#94a3b8' }}>Get your ticket and check your closet</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: '#0f172a', padding: '4px', borderRadius: '12px' }}>
            <button 
              onClick={() => setLobbyTab('join')}
              style={{ flex: 1, padding: '10px', background: lobbyTab === 'join' ? '#3b82f6' : 'transparent', color: lobbyTab === 'join' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
            >
              Event Entry
            </button>
            <button 
              onClick={() => setLobbyTab('closet')}
              style={{ flex: 1, padding: '10px', background: lobbyTab === 'closet' ? '#3b82f6' : 'transparent', color: lobbyTab === 'closet' ? '#fff' : '#94a3b8', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
            >
              My Closet
            </button>
          </div>

          {lobbyTab === 'join' ? (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontWeight: 500 }}>Room Name or Event ID</label>
                <input 
                  type="text" 
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Main Stage"
                  style={{ width: '100%', padding: '12px 16px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <button 
                onClick={() => {
                  if (roomName.trim() !== '') {
                    setHasJoined(true);
                  }
                }}
                disabled={!roomName.trim()}
                style={{ width: '100%', padding: '16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, cursor: roomName.trim() ? 'pointer' : 'not-allowed', opacity: roomName.trim() ? 1 : 0.5, transition: '0.2s' }}
              >
                Enter {roomName}
              </button>
            </div>
          ) : (
            <div>
              <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid #1e293b', marginBottom: '24px', maxHeight: '50vh', overflowY: 'auto' }}>
                
                {/* Avatar Preview */}
                <div style={{ height: '250px', background: '#020617', borderRadius: '12px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
                  <Canvas shadows camera={{ position: [0, 2.5, 5], fov: 45 }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[5, 5, 5]} castShadow intensity={1} />
                    <group position={[0, -1, 0]}>
                      <Suspense fallback={null}>
                        <BaseAvatar player={{ id: 'preview', name: '', position: [0,0,0], rotation: 0, gender, expression, facialHair, facialHairColor, shirtColor, pantsColor, skinColor, hairColor, hairType, hatType, hatColor, eyeColor, shirtType, pantsType, shoeColor, shoeType, glassesType, glassesColor }} />
                      </Suspense>
                    </group>
                    <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/3} maxPolarAngle={Math.PI/2} />
                  </Canvas>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Gender</label>
                    <select value={gender} onChange={e => setGender(e.target.value as any)} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Expression</label>
                    <select value={expression} onChange={e => setExpression(e.target.value as any)} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="smile">Smile</option>
                      <option value="sad">Sad</option>
                      <option value="angry">Angry</option>
                      <option value="surprised">Surprised</option>
                    </select>
                  </div>
                </div>

                {gender === 'male' && (
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 2 }}>
                      <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Facial Hair</label>
                      <select value={facialHair} onChange={e => setFacialHair(e.target.value as any)} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                        <option value="none">None</option>
                        <option value="mustache">Mustache</option>
                        <option value="short_beard">Short Beard</option>
                        <option value="long_beard">Long Beard</option>
                      </select>
                    </div>
                    <div style={{ flex: 1, opacity: facialHair === 'none' ? 0.3 : 1, pointerEvents: facialHair === 'none' ? 'none' : 'auto' }}>
                      <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Facial Hair Color</label>
                      <input type="color" value={facialHairColor} onChange={e => setFacialHairColor(e.target.value)} style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                    </div>
                  </div>
                )}

                {/* Clothing Styles */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Top Style</label>
                    <select value={shirtType} onChange={e => setShirtType(e.target.value)} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="short_sleeve">Short Sleeve</option>
                      <option value="long_sleeve">Long Sleeve</option>
                      <option value="suit_jacket">Suit Jacket</option>
                      {gender === 'female' && <option value="womens_blouse">Blouse</option>}
                      {gender === 'female' && <option value="dress">Dress</option>}
                    </select>
                  </div>
                  <div style={{ flex: 1, opacity: shirtType === 'dress' && gender === 'female' ? 0.3 : 1, pointerEvents: shirtType === 'dress' && gender === 'female' ? 'none' : 'auto' }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Bottom Style</label>
                    <select value={pantsType} onChange={e => setPantsType(e.target.value)} style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}>
                      <option value="shorts">Shorts</option>
                      <option value="pants">Pants</option>
                      {gender === 'female' && <option value="skirt">Skirt</option>}
                    </select>
                  </div>
                </div>

                {/* Color Pickers (Native Color Wheels) */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Top Color</label>
                    <input 
                      type="color" 
                      value={shirtColor} 
                      onChange={e => setShirtColor(e.target.value)} 
                      style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} 
                    />
                  </div>
                  <div style={{ flex: 1, opacity: shirtType === 'dress' && gender === 'female' ? 0.3 : 1, pointerEvents: shirtType === 'dress' && gender === 'female' ? 'none' : 'auto' }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Bottom Color</label>
                    <input 
                      type="color" 
                      value={pantsColor} 
                      onChange={e => setPantsColor(e.target.value)} 
                      style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Skin Tone</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                      {['#fcd34d', '#f8bc7b', '#f2a65a', '#d98b54', '#c67841', '#a55d35', '#8a4b2b', '#6b361a', '#4c2612', '#2f1509'].map(tone => (
                        <div 
                          key={tone}
                          onClick={() => setSkinColor(tone)}
                          style={{ width: '20px', height: '20px', borderRadius: '50%', background: tone, cursor: 'pointer', border: skinColor === tone ? '2px solid #fff' : '2px solid transparent' }}
                        />
                      ))}
                    </div>
                    <input 
                      type="color" 
                      value={skinColor} 
                      onChange={e => setSkinColor(e.target.value)} 
                      style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Eye Color</label>
                    <input 
                      type="color" 
                      value={eyeColor} 
                      onChange={e => setEyeColor(e.target.value)} 
                      style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} 
                    />
                  </div>
                </div>

                {/* Hair Selection */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Hair Style</label>
                    <select 
                      value={hairType} 
                      onChange={e => setHairType(e.target.value)} 
                      style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    >
                      <option value="none">Bald</option>
                      <option value="buzz_cut">Buzz Cut</option>
                      <option value="short">Short</option>
                      <option value="fade">Fade</option>
                      <option value="medium">Medium</option>
                      <option value="spiky">Spiky</option>
                      <option value="mohawk">Mohawk</option>
                      <option value="undercut">Undercut</option>
                      <option value="long">Long</option>
                      <option value="long_middle_part">Long (Middle Part)</option>
                      <option value="long_side_part">Long (Side Part)</option>
                      <option value="wavy">Wavy</option>
                      <option value="afro">Afro</option>
                      <option value="curly">Curly</option>
                      <option value="ponytail">Ponytail</option>
                      <option value="bun">Bun</option>
                      <option value="braids">Braids</option>
                      <option value="dreads">Dreads</option>
                      <option value="locs">Locs</option>
                      <option value="bob">Bob</option>
                      <option value="pixie">Pixie Cut</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, opacity: hairType === 'none' ? 0.3 : 1, pointerEvents: hairType === 'none' ? 'none' : 'auto' }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Hair Color</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                      {['#1a1a1a','#3b1f0a','#6b3a1f','#8b5a2b','#8b3a1f','#c8a052','#f2d28c','#800000','#808080','#e8e8e8'].map(tone => (
                        <div key={tone} onClick={() => setHairColor(tone)} style={{ width: '18px', height: '18px', borderRadius: '50%', background: tone, cursor: 'pointer', border: hairColor === tone ? '2px solid #fff' : '2px solid #475569' }} />
                      ))}
                    </div>
                    <input type="color" value={hairColor} onChange={e => setHairColor(e.target.value)} style={{ width: '100%', height: '36px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                </div>

                {/* Hat Selection */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Hat</label>
                    <select 
                      value={hatType} 
                      onChange={e => setHatType(e.target.value)} 
                      style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    >
                      <option value="none">No Hat</option>
                      <option value="baseball">Baseball Cap</option>
                      <option value="snapback">Snapback</option>
                      <option value="beanie">Beanie</option>
                      <option value="cowboy">Cowboy Hat</option>
                      <option value="top_hat">Top Hat</option>
                      <option value="bucket_hat">Bucket Hat</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, opacity: hatType === 'none' ? 0.3 : 1, pointerEvents: hatType === 'none' ? 'none' : 'auto' }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Hat Color</label>
                    <input type="color" value={hatColor} onChange={e => setHatColor(e.target.value)} style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                </div>

                {/* Glasses */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>👓 Glasses</label>
                    <select 
                      value={glassesType} 
                      onChange={e => setGlassesType(e.target.value)} 
                      style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    >
                      <option value="none">None</option>
                      <option value="round">Round</option>
                      <option value="square">Square</option>
                      <option value="aviator">Aviator</option>
                      <option value="cat_eye">Cat Eye</option>
                      <option value="wayfarer">Wayfarer</option>
                      <option value="sunglasses_round">☀️ Sunglasses (Round)</option>
                      <option value="sunglasses_square">☀️ Sunglasses (Square)</option>
                      <option value="sunglasses_aviator">☀️ Sunglasses (Aviator)</option>
                      <option value="sunglasses_cat_eye">☀️ Sunglasses (Cat Eye)</option>
                      <option value="sunglasses_wayfarer">☀️ Sunglasses (Wayfarer)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, opacity: glassesType === 'none' ? 0.3 : 1, pointerEvents: glassesType === 'none' ? 'none' : 'auto' }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Frame Color</label>
                    <input type="color" value={glassesColor} onChange={e => setGlassesColor(e.target.value)} style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                </div>

                {/* Shoes */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>👟 Shoe Style</label>
                    <select 
                      value={shoeType} 
                      onChange={e => setShoeType(e.target.value)} 
                      style={{ width: '100%', padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff', outline: 'none' }}
                    >
                      <option value="sneakers">Sneakers</option>
                      <option value="boots">Boots</option>
                      <option value="dress_shoes">Dress Shoes</option>
                      <option value="sandals">Sandals</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: '#94a3b8', marginBottom: '6px', fontSize: '0.85rem' }}>Shoe Color</label>
                    <input type="color" value={shoeColor} onChange={e => setShoeColor(e.target.value)} style={{ width: '100%', height: '40px', padding: '0', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveCloset}
                style={{ width: '100%', padding: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
              >
                {saveText}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#000', overflow: 'hidden' }}>
      
      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => {
            // Unsubscribe channel before leaving
            channelRef.current?.unsubscribe();
            onNavigate('home');
          }}
          style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(10px)' }}
        >
          <X size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{roomName}</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>{Object.keys(players).length + 1} citizens connected</p>
        </div>
      </div>

      {/* Admin Panel */}
      {user?.role === 'admin' && (
        <div style={{ position: 'absolute', top: 80, left: 20, zIndex: 10, background: 'rgba(15,23,42,0.9)', padding: '16px', borderRadius: '12px', border: '1px solid #3b82f6', width: '320px', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={18} color="#3b82f6" /> Stadium Media Admin
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Projector URL (Image path or YouTube Link)</label>
            <input 
              type="text" 
              value={adminMediaInput}
              onChange={e => setAdminMediaInput(e.target.value)}
              placeholder="e.g. /stadium-logo.png"
              style={{ background: '#020617', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '0.9rem' }}
            />
            <button 
              onClick={() => {
                if(adminMediaInput) {
                  const newMediaData: MediaData = {
                    url: adminMediaInput,
                    startedAt: Date.now()
                  };
                  setMediaData(newMediaData);
                  mediaDataRef.current = newMediaData;
                  channelRef.current?.send({ type: 'broadcast', event: 'media_update', payload: newMediaData });
                  setAdminMediaInput('');
                }
              }}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, transition: '0.2s', marginTop: '4px' }}
            >
              Update Projector Globally
            </button>
          </div>
        </div>
      )}

      {/* Virtual Joystick for Mobile */}
      {isMobile && (
        <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
          <Joystick 
             size={100} 
             sticky={false} 
             baseColor="rgba(15, 23, 42, 0.6)" 
             stickColor="rgba(59, 130, 246, 0.8)" 
             move={handleJoystickMove} 
             stop={handleJoystickStop} 
          />
        </div>
      )}

      <div style={{ position: 'absolute', bottom: isMobile ? 180 : 40, left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '90%', maxWidth: '500px', pointerEvents: 'auto' }}>
        <form onSubmit={handleChat} style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: '8px', borderRadius: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <input 
            type="text" 
            placeholder={isMobile ? "Say something..." : "Say something to the crowd... (Press W,A,S,D to move)"} 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', padding: '0 16px', fontSize: '0.95rem' }}
          />
          <button type="submit" style={{ background: '#3b82f6', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
            <Send size={18} style={{ marginLeft: '-2px' }} />
          </button>
        </form>
      </div>

      {!isMobile && (
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, background: 'rgba(15,23,42,0.8)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#3b82f6' }}>Controls</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><kbd style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>W A S D</kbd> to move</li>
            <li><kbd style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>Left Click + Drag</kbd> to rotate camera</li>
            <li><kbd style={{ background: '#334155', padding: '2px 6px', borderRadius: '4px' }}>Scroll</kbd> to zoom</li>
          </ul>
        </div>
      )}

      {/* 3D Canvas */}
      <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3b82f6', background: '#000' }}>Loading Realm...</div>}>
        <Canvas shadows dpr={[1, 2]}>
          <IsometricCamera />
          
          <OrbitControls 
            makeDefault 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 2 - 0.05} // Prevent going under the floor
            minDistance={10} 
            maxDistance={100}
            target={[0, 0, 0]}
          />

          <ambientLight intensity={0.4} />
          <directionalLight position={[20, 30, 10]} castShadow intensity={1.5} shadow-mapSize={[2048, 2048]} />
          
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <GroundGrid />
          <ProjectorScreen mediaData={mediaData} />
          
          {/* Seating Areas */}
          <SeatingArea position={[15, 0, -10]} rotation={Math.PI / 4} />
          <SeatingArea position={[-15, 0, 10]} rotation={-Math.PI / 6} />
          <SeatingArea position={[20, 0, 15]} rotation={Math.PI / 3} />
          <SeatingArea position={[-20, 0, -15]} rotation={-Math.PI / 4} />
          <SeatingArea position={[0, 0, 25]} rotation={0} />

          <MovementManager onMove={broadcastMove} />

          {/* Render Me */}
          <Avatar3D player={{ ...myStateRef.current, message: myMessage }} isMe />

          {/* Render Remote Players */}
          {Object.values(players).map(p => (
            p.id !== myStateRef.current.id && <Avatar3D key={p.id} player={p} />
          ))}
        </Canvas>
      </Suspense>
    </div>
  );
};
