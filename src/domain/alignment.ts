import type { ControlPair, GeoPoint } from '../types/domain';

export interface AffineTransform { a: number; b: number; c: number; d: number; e: number; f: number }

function determinant3(m: number[][]): number {
  return m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!)
    - m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!)
    + m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);
}

function solve3(matrix: number[][], y: number[]): [number, number, number] {
  const det = determinant3(matrix);
  if (Math.abs(det) < 1e-12) throw new Error('control_points_collinear');
  const replace = (col: number) => matrix.map((row, r) => row.map((v, c) => c === col ? y[r]! : v));
  return [determinant3(replace(0)) / det, determinant3(replace(1)) / det, determinant3(replace(2)) / det];
}

export function solveAffine(pairs: [ControlPair, ControlPair, ControlPair]): AffineTransform {
  const m = pairs.map((p) => [p.source.lng, p.source.lat, 1]);
  const tx = pairs.map((p) => p.target.lng);
  const ty = pairs.map((p) => p.target.lat);
  const [a, b, c] = solve3(m, tx);
  const [d, e, f] = solve3(m, ty);
  return { a, b, c, d, e, f };
}

export function applyAffine(t: AffineTransform, p: GeoPoint): GeoPoint {
  return { lng: t.a * p.lng + t.b * p.lat + t.c, lat: t.d * p.lng + t.e * p.lat + t.f };
}

export function rmsError(t: AffineTransform, pairs: ControlPair[]): number {
  if (!pairs.length) return 0;
  const squared = pairs.map((pair) => {
    const p = applyAffine(t, pair.source);
    const dx = p.lng - pair.target.lng;
    const dy = p.lat - pair.target.lat;
    return dx * dx + dy * dy;
  });
  return Math.sqrt(squared.reduce((a, b) => a + b, 0) / squared.length);
}

export function confidenceFromRms(rmsDegrees: number): number {
  const meters = rmsDegrees * 111_320;
  if (meters <= 0.5) return 100;
  if (meters >= 50) return 0;
  return Math.max(0, Math.round(100 - (meters - 0.5) * (100 / 49.5)));
}
