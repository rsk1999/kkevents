import * as THREE from 'three';
import type { Project } from '../types';

/**
 * Procedural Texture Generator for High-End Architectural Gallery
 */

// Generate realistic microcement / gallery stone floor texture
export function createFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base stone tone: light warm ivory gray
  ctx.fillStyle = '#EBE7DE';
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle noise and stone grain
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Architectural stone slab tile joints (large 256x256 slabs)
  ctx.strokeStyle = 'rgba(180, 175, 165, 0.45)';
  ctx.lineWidth = 2;
  const tileSize = 256;
  for (let x = 0; x <= 1024; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 28);
  return texture;
}

// Generate museum wall texture with subtle plaster texture
export function createWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#F3F0E9';
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 5;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 20);
  return texture;
}

// Generate luxury museum placard / title label underneath artwork
export function createPlacardTexture(project: Project): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;

  // Transparent / very subtle off-white background
  ctx.fillStyle = 'rgba(243, 240, 233, 0.95)';
  ctx.fillRect(0, 0, 800, 240);

  // Border & divider
  ctx.strokeStyle = '#B89A6A';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 780, 220);

  // Project Number
  ctx.fillStyle = '#B89A6A';
  ctx.font = 'bold 24px "Cinzel", Georgia, serif';
  ctx.fillText(`${project.number}  /  08  ·  ${project.category.toUpperCase()}`, 36, 54);

  // Gold accent line
  ctx.fillStyle = '#B89A6A';
  ctx.fillRect(36, 68, 80, 2);

  // Project Title
  ctx.fillStyle = '#222222';
  ctx.font = '600 34px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(project.title, 36, 118);

  // Tagline & Location
  ctx.fillStyle = '#555555';
  ctx.font = '400 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${project.tagline}  ·  ${project.location}`, 36, 160);

  // Hover instruction
  ctx.fillStyle = '#8C6D3F';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CLICK TO EXPLORE CASE STUDY →', 36, 200);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

// Generate fallback artwork texture while live image loads
export function createFallbackArtworkTexture(project: Project): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d')!;

  // Luxury gradient
  const grad = ctx.createLinearGradient(0, 0, 1200, 800);
  grad.addColorStop(0, '#2A241C');
  grad.addColorStop(0.5, '#1E1B18');
  grad.addColorStop(1, '#110F0D');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 800);

  // Subtle luxury geometric pattern
  ctx.strokeStyle = 'rgba(184, 154, 106, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 1200; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 400, 800);
    ctx.stroke();
  }

  // Gold ornamental border
  ctx.strokeStyle = '#B89A6A';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 1140, 740);

  // Emblem
  ctx.fillStyle = '#B89A6A';
  ctx.font = 'bold 36px "Cinzel", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦  KK EVENTS EXHIBITION  ✦', 600, 240);

  // Number
  ctx.font = 'italic 48px "Cormorant Garamond", serif';
  ctx.fillStyle = '#E8D6B6';
  ctx.fillText(`Project ${project.number} — ${project.category}`, 600, 320);

  // Title
  ctx.font = 'bold 64px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(project.title, 600, 420);

  // Tagline
  ctx.font = '400 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#CFC8BA';
  ctx.fillText(project.tagline, 600, 480);

  // Location & Year
  ctx.font = '300 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#B89A6A';
  ctx.fillText(`${project.location}  ·  ${project.year}`, 600, 540);

  // Interactive hint
  ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Click anywhere on frame to inspect details', 600, 640);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
}
