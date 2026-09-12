import { DataTexture, RepeatWrapping, RGBAFormat, UnsignedByteType } from 'three'

let fiber: DataTexture | null = null

/** Longitudinal grain for rose-gel muscle — matte, not wet. */
export function getFiberTexture() {
  if (fiber) return fiber
  const w = 128
  const h = 256
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const stripe = Math.sin(x * 0.55 + Math.sin(y * 0.08) * 1.4)
      const n = 0.82 + stripe * 0.1 + ((x * 17 + y * 31) % 7) * 0.008
      const v = Math.max(150, Math.min(245, n * 255))
      data[i] = v
      data[i + 1] = v
      data[i + 2] = v
      data[i + 3] = 255
    }
  }
  const tex = new DataTexture(data, w, h, RGBAFormat, UnsignedByteType)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(2.4, 5.2)
  tex.needsUpdate = true
  fiber = tex
  return tex
}
