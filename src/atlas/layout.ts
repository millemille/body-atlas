/** Shared landmarks for the stylized mannequin (meters, Y-up, facing +Z). */
export const L = {
  head: [0, 1.6, 0.02] as [number, number, number],
  jaw: [0, 1.5, 0.03] as [number, number, number],
  neck: [0, 1.47, 0.01] as [number, number, number],
  c7: [0, 1.42, -0.02] as [number, number, number],
  chest: [0, 1.24, 0.02] as [number, number, number],
  sternum: [0, 1.22, 0.08] as [number, number, number],
  abdomen: [0, 1.04, 0.02] as [number, number, number],
  waist: [0, 0.98, 0] as [number, number, number],
  pelvis: [0, 0.88, 0] as [number, number, number],
  sacrum: [0, 0.9, -0.04] as [number, number, number],
  shoulderL: [-0.22, 1.38, 0] as [number, number, number],
  shoulderR: [0.22, 1.38, 0] as [number, number, number],
  scapulaL: [-0.16, 1.32, -0.08] as [number, number, number],
  clavicleL: [-0.12, 1.4, 0.06] as [number, number, number],
  elbowL: [-0.27, 1.08, 0.03] as [number, number, number],
  elbowR: [0.27, 1.08, 0.03] as [number, number, number],
  wristL: [-0.3, 0.8, 0.05] as [number, number, number],
  wristR: [0.3, 0.8, 0.05] as [number, number, number],
  hipL: [-0.1, 0.84, 0.01] as [number, number, number],
  hipR: [0.1, 0.84, 0.01] as [number, number, number],
  kneeL: [-0.11, 0.48, 0.03] as [number, number, number],
  kneeR: [0.11, 0.48, 0.03] as [number, number, number],
  ankleL: [-0.1, 0.1, 0] as [number, number, number],
  ankleR: [0.1, 0.1, 0] as [number, number, number],
  heart: [-0.04, 1.22, 0.06] as [number, number, number],
  lungL: [-0.1, 1.26, 0.02] as [number, number, number],
  lungR: [0.1, 1.26, 0.02] as [number, number, number],
  liver: [0.08, 1.06, 0.05] as [number, number, number],
  stomach: [-0.05, 1.05, 0.07] as [number, number, number],
  kidneyL: [-0.08, 1.02, -0.04] as [number, number, number],
  kidneyR: [0.08, 1.02, -0.04] as [number, number, number],
  brain: [0, 1.62, 0.02] as [number, number, number],
}

export function mid(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
}
