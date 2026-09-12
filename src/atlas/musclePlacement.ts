import { L, mid } from './layout'
import { bonePosition } from './structures'

export type Vec3 = [number, number, number]

export function mix(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

export function offset(p: Vec3, dx: number, dy: number, dz: number): Vec3 {
  return [p[0] + dx, p[1] + dy, p[2] + dz]
}

export function dist(a: Vec3, b: Vec3) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

function bone(id: string, fallback: Vec3): Vec3 {
  return bonePosition(id, fallback)
}

/**
 * Refined densify v2 landmarks. Origins/inserts sit on BodyParts3D centroids
 * instead of the stylized mannequin wrists and a calcaneus stand-in for TA.
 */
export function m1Placement() {
  const humL = bone('humerus-left', mid(L.shoulderL, L.elbowL))
  const humR = bone('humerus-right', mid(L.shoulderR, L.elbowR))
  const scapL = bone('scapula-left', L.scapulaL)
  const scapR = bone('scapula-right', [0.108, 1.367, 0.033])
  const clavL = bone('clavicle-left', L.clavicleL)
  const clavR = bone('clavicle-right', [0.079, 1.417, 0.103])
  const femL = bone('femur-left', mid(L.hipL, L.kneeL))
  const femR = bone('femur-right', mid(L.hipR, L.kneeR))
  const tibL = bone('tibia-left', mid(L.kneeL, L.ankleL))
  const tibR = bone('tibia-right', mid(L.kneeR, L.ankleR))
  const patL = bone('patella-left', [-0.081, 0.462, 0.113])
  const patR = bone('patella-right', [0.081, 0.462, 0.113])
  const calcL = bone('calcaneus-left', [-0.071, 0.038, 0.059])
  const calcR = bone('calcaneus-right', [0.071, 0.038, 0.059])
  const radL = bone('radius-left', [-0.248, 0.997, 0.092])
  const radR = bone('radius-right', [0.248, 0.996, 0.093])
  const ulnL = bone('ulna-left', [-0.222, 1.027, 0.08])
  const ulnR = bone('ulna-right', [0.222, 1.027, 0.08])
  const sternum = bone('body-of-sternum', L.sternum)
  const manubrium = bone('manubrium', [0, 1.382, 0.152])
  const xiphoid = bone('xiphoid-process', [0, 1.257, 0.206])
  const c7 = bone('seventh-cervical-vertebra', L.c7)
  const t12 = bone('twelfth-thoracic-vertebra', [0, 1.16, 0.065])
  const hipL = bone('hip-left', L.hipL)
  const hipR = bone('hip-right', L.hipR)
  const sacrum = bone('sacrum', L.sacrum)
  const occ = bone('occipital', [0, 1.593, 0.023])
  const scaphL = bone('scaphoid-left', [-0.262, 0.885, 0.119])
  const scaphR = bone('scaphoid-right', [0.262, 0.885, 0.119])
  const pisL = bone('pisiform-left', [-0.236, 0.876, 0.132])
  const pisR = bone('pisiform-right', [0.236, 0.876, 0.132])

  const grooveL = offset(mix(humL, clavL, 0.18), 0.022, 0.012, 0.028)
  const grooveR = offset(mix(humR, clavR, 0.18), -0.022, 0.012, 0.028)
  const coracoidL = offset(mix(scapL, clavL, 0.38), -0.006, -0.006, 0.036)
  const coracoidR = offset(mix(scapR, clavR, 0.38), 0.006, -0.006, 0.036)
  const olecL = offset(mix(ulnL, humL, 0.28), 0, -0.012, -0.028)
  const olecR = offset(mix(ulnR, humR, 0.28), 0, -0.012, -0.028)
  const radTubL = offset(mix(radL, humL, 0.22), 0.004, 0.01, 0.016)
  const radTubR = offset(mix(radR, humR, 0.22), -0.004, 0.01, 0.016)
  const deltoidTubL = offset(mix(humL, radL, 0.18), -0.028, 0, 0.008)
  const deltoidTubR = offset(mix(humR, radR, 0.18), 0.028, 0, 0.008)
  const acromionL = offset(mix(clavL, scapL, 0.35), -0.036, 0.018, 0.006)
  const acromionR = offset(mix(clavR, scapR, 0.35), 0.036, 0.018, 0.006)
  const medialEpiL = offset(mix(humL, ulnL, 0.86), 0.012, -0.004, 0.01)
  const medialEpiR = offset(mix(humR, ulnR, 0.86), -0.012, -0.004, 0.01)

  return {
    pecOriginUpperL: offset(mix(manubrium, sternum, 0.32), -0.016, 0.004, 0.016),
    pecOriginLowerL: offset(mix(sternum, xiphoid, 0.48), -0.028, 0, 0.016),
    pecOriginUpperR: offset(mix(manubrium, sternum, 0.32), 0.016, 0.004, 0.016),
    pecOriginLowerR: offset(mix(sternum, xiphoid, 0.48), 0.028, 0, 0.016),
    grooveL,
    grooveR,
    coracoidL,
    coracoidR,
    radTubL,
    radTubR,
    infraglenoidL: offset(scapL, -0.016, -0.028, -0.016),
    infraglenoidR: offset(scapR, 0.016, -0.028, -0.016),
    olecL,
    olecR,
    acromionL,
    acromionR,
    deltoidTubL,
    deltoidTubR,
    xiphoid: offset(xiphoid, 0, 0, 0.008),
    pubis: offset(mix(hipL, hipR, 0.5), 0, -0.036, 0.042),
    aiisL: offset(hipL, -0.008, 0.018, 0.036),
    aiisR: offset(hipR, 0.008, 0.018, 0.036),
    patL: offset(patL, 0, 0, 0.01),
    patR: offset(patR, 0, 0, 0.01),
    vastusL: offset(femL, -0.022, 0.016, 0.026),
    vastusR: offset(femR, 0.022, 0.016, 0.026),
    occ,
    c7,
    t12,
    clavL,
    clavR,
    scapL,
    scapR,
    latOriginL: offset(mix(sacrum, hipL, 0.48), -0.028, 0.016, -0.038),
    latOriginR: offset(mix(sacrum, hipR, 0.48), 0.028, 0.016, -0.038),
    iliumPostL: offset(mix(hipL, sacrum, 0.32), -0.018, 0.016, -0.048),
    iliumPostR: offset(mix(hipR, sacrum, 0.32), 0.018, 0.016, -0.048),
    gluteTubL: offset(mix(hipL, femL, 0.38), -0.018, 0, -0.028),
    gluteTubR: offset(mix(hipR, femR, 0.38), 0.018, 0, -0.028),
    ischiumL: offset(hipL, -0.008, -0.058, -0.038),
    ischiumR: offset(hipR, 0.008, -0.058, -0.038),
    tibPostL: offset(mix(tibL, patL, 0.22), 0.004, 0, -0.018),
    tibPostR: offset(mix(tibR, patR, 0.22), -0.004, 0, -0.018),
    condyleMedL: offset(mix(femL, patL, 0.7), 0.014, 0, -0.016),
    condyleLatL: offset(mix(femL, patL, 0.7), -0.016, 0, -0.016),
    condyleMedR: offset(mix(femR, patR, 0.7), -0.014, 0, -0.016),
    condyleLatR: offset(mix(femR, patR, 0.7), 0.016, 0, -0.016),
    achillesL: offset(calcL, 0, 0.016, -0.018),
    achillesR: offset(calcR, 0, 0.016, -0.018),
    soleusFromL: offset(mix(tibL, patL, 0.16), 0, -0.016, -0.012),
    soleusFromR: offset(mix(tibR, patR, 0.16), 0, -0.016, -0.012),
    psoasFromL: offset(t12, -0.026, -0.016, 0.016),
    psoasFromR: offset(t12, 0.026, -0.016, 0.016),
    lesserTrL: offset(mix(hipL, femL, 0.24), 0.016, 0.016, 0.016),
    lesserTrR: offset(mix(hipR, femR, 0.24), -0.016, 0.016, 0.016),
    medialEpiL,
    medialEpiR,
    flexorScaphL: offset(scaphL, 0, -0.004, 0.008),
    flexorScaphR: offset(scaphR, 0, -0.004, 0.008),
    flexorPisL: offset(pisL, 0, -0.002, 0.006),
    flexorPisR: offset(pisR, 0, -0.002, 0.006),
  }
}

export function m2Placement() {
  const humL = bone('humerus-left', mid(L.shoulderL, L.elbowL))
  const humR = bone('humerus-right', mid(L.shoulderR, L.elbowR))
  const scapL = bone('scapula-left', L.scapulaL)
  const scapR = bone('scapula-right', [0.108, 1.367, 0.033])
  const clavL = bone('clavicle-left', L.clavicleL)
  const clavR = bone('clavicle-right', [0.079, 1.417, 0.103])
  const femL = bone('femur-left', mid(L.hipL, L.kneeL))
  const femR = bone('femur-right', mid(L.hipR, L.kneeR))
  const tibL = bone('tibia-left', mid(L.kneeL, L.ankleL))
  const tibR = bone('tibia-right', mid(L.kneeR, L.ankleR))
  const patL = bone('patella-left', [-0.081, 0.462, 0.113])
  const patR = bone('patella-right', [0.081, 0.462, 0.113])
  const ulnL = bone('ulna-left', [-0.222, 1.027, 0.08])
  const ulnR = bone('ulna-right', [0.222, 1.027, 0.08])
  const hipL = bone('hip-left', L.hipL)
  const hipR = bone('hip-right', L.hipR)
  const sacrum = bone('sacrum', L.sacrum)
  const c7 = bone('seventh-cervical-vertebra', L.c7)
  const l5 = bone('fifth-lumbar-vertebra', [0, 1.02, 0.04])
  const t4 = bone('fourth-thoracic-vertebra', [0, 1.28, 0.05])
  const capL = bone('capitate-left', [-0.257, 0.873, 0.119])
  const capR = bone('capitate-right', [0.257, 0.873, 0.119])
  const mc3L = bone('third-metacarpal-left', [-0.263, 0.833, 0.127])
  const mc3R = bone('third-metacarpal-right', [0.263, 0.833, 0.127])
  const cunL = bone('medial-cuneiform-left', [-0.08, 0.051, 0.127])
  const cunR = bone('medial-cuneiform-right', [0.08, 0.051, 0.127])
  const mt1L = bone('first-metatarsal-left', [-0.09, 0.036, 0.161])
  const mt1R = bone('first-metatarsal-right', [0.09, 0.036, 0.161])

  const acromionL = offset(mix(clavL, scapL, 0.35), -0.036, 0.018, 0.006)
  const acromionR = offset(mix(clavR, scapR, 0.35), 0.036, 0.018, 0.006)
  const coracoidL = offset(mix(scapL, clavL, 0.38), -0.006, -0.006, 0.036)
  const coracoidR = offset(mix(scapR, clavR, 0.38), 0.006, -0.006, 0.036)
  const pubis = offset(mix(hipL, hipR, 0.5), 0, -0.036, 0.042)

  return {
    gtL: offset(mix(humL, acromionL, 0.16), -0.02, 0.02, 0.014),
    gtR: offset(mix(humR, acromionR, 0.16), 0.02, 0.02, 0.014),
    ltL: offset(mix(humL, coracoidL, 0.22), 0.01, 0.006, 0.024),
    ltR: offset(mix(humR, coracoidR, 0.22), -0.01, 0.006, 0.024),
    supraL: offset(scapL, -0.01, 0.044, -0.028),
    supraR: offset(scapR, 0.01, 0.044, -0.028),
    infraL: offset(scapL, -0.026, -0.024, -0.046),
    infraR: offset(scapR, 0.026, -0.024, -0.046),
    subscapL: offset(scapL, 0.018, -0.004, 0.04),
    subscapR: offset(scapR, -0.018, -0.004, 0.04),
    teresL: offset(scapL, -0.034, -0.038, -0.03),
    teresR: offset(scapR, 0.034, -0.038, -0.03),
    erectFromL: offset(mix(sacrum, l5, 0.45), -0.012, 0.008, -0.052),
    erectFromR: offset(mix(sacrum, l5, 0.45), 0.012, 0.008, -0.052),
    erectMidL: offset(t4, -0.014, 0, -0.048),
    erectMidR: offset(t4, 0.014, 0, -0.048),
    erectToL: offset(c7, -0.012, -0.008, -0.046),
    erectToR: offset(c7, 0.012, -0.008, -0.046),
    adductorFromL: offset(pubis, -0.022, 0.002, 0.008),
    adductorFromR: offset(pubis, 0.022, 0.002, 0.008),
    adductorToL: offset(femL, 0.03, 0.004, 0.008),
    adductorToR: offset(femR, -0.03, 0.004, 0.008),
    adductorLongFromL: offset(pubis, -0.016, -0.006, 0.018),
    adductorLongFromR: offset(pubis, 0.016, -0.006, 0.018),
    adductorLongToL: offset(mix(femL, patL, 0.2), 0.028, 0, 0.014),
    adductorLongToR: offset(mix(femR, patR, 0.2), -0.028, 0, 0.014),
    adductorMagFromL: offset(pubis, -0.02, -0.014, -0.008),
    adductorMagFromR: offset(pubis, 0.02, -0.014, -0.008),
    adductorMagToL: offset(mix(femL, patL, 0.28), 0.026, 0, -0.002),
    adductorMagToR: offset(mix(femR, patR, 0.28), -0.026, 0, -0.002),
    taFromL: offset(mix(tibL, patL, 0.12), -0.014, 0.004, 0.028),
    taFromR: offset(mix(tibR, patR, 0.12), 0.014, 0.004, 0.028),
    taToL: offset(mix(cunL, mt1L, 0.4), 0.004, 0.006, 0.006),
    taToR: offset(mix(cunR, mt1R, 0.4), -0.004, 0.006, 0.006),
    latEpiL: offset(mix(humL, ulnL, 0.86), -0.014, -0.004, 0.006),
    latEpiR: offset(mix(humR, ulnR, 0.86), 0.014, -0.004, 0.006),
    dorsalWristL: offset(capL, 0, 0, -0.012),
    dorsalWristR: offset(capR, 0, 0, -0.012),
    dorsalMcL: offset(mc3L, 0, 0.004, -0.01),
    dorsalMcR: offset(mc3R, 0, 0.004, -0.01),
  }
}

/** Used by tests so refine v2 cannot silently drift back to mannequin wrists. */
export function refineChecks() {
  const a = m1Placement()
  const b = m2Placement()
  const scaphL = bone('scaphoid-left', [-0.262, 0.885, 0.119])
  const pisL = bone('pisiform-left', [-0.236, 0.876, 0.132])
  const cunL = bone('medial-cuneiform-left', [-0.08, 0.051, 0.127])
  const calcL = bone('calcaneus-left', [-0.071, 0.038, 0.059])
  const femL = bone('femur-left', mid(L.hipL, L.kneeL))
  const patL = bone('patella-left', [-0.081, 0.462, 0.113])
  const scapL = bone('scapula-left', L.scapulaL)
  const humL = bone('humerus-left', mid(L.shoulderL, L.elbowL))
  return {
    flexorToScaphoid: dist(a.flexorScaphL, scaphL),
    flexorToPisiform: dist(a.flexorPisL, pisL),
    flexorToMannequinWrist: dist(a.flexorScaphL, L.wristL),
    taToCuneiform: dist(b.taToL, cunL),
    taToCalcaneus: dist(b.taToL, calcL),
    adductorToFemur: dist(b.adductorToL, femL),
    adductorToPatella: dist(b.adductorToL, patL),
    adductorMedialOfFemur: b.adductorToL[0] - femL[0],
    erectAbsX: Math.abs(b.erectFromL[0]),
    cuffOriginToScap: dist(b.supraL, scapL),
    cuffInsertToHum: dist(b.gtL, humL),
    cuffInfraBehindScap: scapL[2] - b.infraL[2],
  }
}
