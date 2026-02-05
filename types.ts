
import * as THREE from 'three';

export interface CosmicNode {
  question: string;
  answer: string;
  id: number;
}

export interface HoveredData {
  question: string;
  answer: string;
  mesh: THREE.Mesh;
  x: number;
  y: number;
}

export interface TooltipData {
  mesh: THREE.Mesh;
  question: string;
  answer: string;
  isSpecial: boolean;
}

export interface WaveOrigin {
  x: number;
  y: number;
  z: number;
  time: number;
}
