import * as THREE from 'three';

/** Everything a player can pick in the wardrobe. Colours are stored as indices so saved/sent data stays tiny and safe. */
export const LOOK_OPTIONS = {
  skin: [0xf1c9a5, 0xe0b48a, 0xc68a5c, 0x8d5a3b, 0x5a3a26],
  hoodie: [0x1b1b22, 0xb03a3a, 0x2f6fd0, 0x3a8a4a, 0x8a4ad0, 0xe0a020, 0xe8e8ee],
  pants: [0x1d2230, 0x3a3f4a, 0x5a4a32, 0x2a4a3a, 0x7a2a2a],
  hairColor: [0x1a1a1a, 0x5a3a1a, 0xc8a050, 0xcc2222, 0x2a7ad0, 0xeeeeee],
  hair: ['mohawk', 'short', 'beanie', 'none'],
  mask: ['none', 'clown', 'skull', 'visor'],
};
export const DEFAULT_LOOK = { skin: 1, hoodie: 0, pants: 0, hairColor: 3, hair: 'mohawk', mask: 'clown' };

const idx = (v, list, d) => (Number.isInteger(v) && v >= 0 && v < list.length ? v : d);
const pick = (v, list, d) => (list.includes(v) ? v : d);

/** Never trust a look: it comes from localStorage or from another player over the network. */
export function sanitizeLook(l) {
  const o = LOOK_OPTIONS, d = DEFAULT_LOOK, s = l && typeof l === 'object' ? l : {};
  return {
    skin: idx(s.skin, o.skin, d.skin), hoodie: idx(s.hoodie, o.hoodie, d.hoodie), pants: idx(s.pants, o.pants, d.pants),
    hairColor: idx(s.hairColor, o.hairColor, d.hairColor), hair: pick(s.hair, o.hair, d.hair), mask: pick(s.mask, o.mask, d.mask),
  };
}

/** Look for a bot / villager that only has a shirt colour. */
export function lookFromColor(color, variant = 0) {
  return { ...DEFAULT_LOOK, skin: variant % 5, hairColor: (variant + 1) % 6, hair: ['short', 'beanie', 'short', 'none'][variant % 4], mask: 'none', hoodieRGB: color };
}

const G = {};
function geo() {
  if (G.ready) return G;
  Object.assign(G, {
    ready: true,
    head: new THREE.SphereGeometry(0.19, 16, 12),
    neck: new THREE.CylinderGeometry(0.07, 0.08, 0.1, 8),
    torso: new THREE.CylinderGeometry(0.26, 0.21, 0.6, 12),
    belt: new THREE.CylinderGeometry(0.215, 0.215, 0.06, 12),
    arm: new THREE.CapsuleGeometry(0.075, 0.46, 3, 8),
    leg: new THREE.CapsuleGeometry(0.1, 0.56, 3, 8),
    hand: new THREE.SphereGeometry(0.085, 8, 6),
    shoe: new THREE.BoxGeometry(0.2, 0.1, 0.33),
    hood: new THREE.SphereGeometry(0.2, 10, 8),
    cap: new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    blade: new THREE.BoxGeometry(0.05, 0.17, 0.085),
    pom: new THREE.SphereGeometry(0.045, 8, 6),
    ring: new THREE.RingGeometry(0.045, 0.07, 18),
    visor: new THREE.BoxGeometry(0.4, 0.075, 0.1),
    pack: new THREE.BoxGeometry(0.34, 0.4, 0.15),
    gun: new THREE.BoxGeometry(0.08, 0.1, 0.62),
    stock: new THREE.BoxGeometry(0.07, 0.14, 0.2),
  });
  return G;
}

/** Face texture painted on a canvas (eyes, mouth, clown / skull paint). Front of the head faces +z, which is u = 0.25 on a three.js sphere. */
function faceTexture(look) {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  if (!x) return null;
  x.fillStyle = '#' + LOOK_OPTIONS.skin[look.skin].toString(16).padStart(6, '0'); x.fillRect(0, 0, 512, 256);
  const cx = 128, cy = 132;
  const eye = (dx, col, w = 11, h = 7) => { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(cx + dx, cy - 6, w, h, 0, 0, 7); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(cx + dx, cy - 6, h - 1.5, 0, 7); x.fill(); };
  if (look.mask === 'clown') {
    x.fillStyle = '#f4f4f4'; x.beginPath(); x.ellipse(cx, cy + 6, 62, 78, 0, 0, 7); x.fill();
    x.fillStyle = '#c8222a'; x.beginPath(); x.moveTo(cx - 40, cy + 36); x.quadraticCurveTo(cx, cy + 82, cx + 40, cy + 36); x.quadraticCurveTo(cx, cy + 58, cx - 40, cy + 36); x.fill(); // wide smile
    x.beginPath(); x.arc(cx, cy + 14, 9, 0, 7); x.fill();                                                                                            // red nose
    for (const s of [-1, 1]) { x.fillStyle = '#8a3ad8'; x.beginPath(); x.ellipse(cx + s * 24, cy - 8, 15, 11, 0, 0, 7); x.fill(); x.fillStyle = '#e9b8ff'; x.beginPath(); x.arc(cx + s * 24, cy - 8, 5, 0, 7); x.fill(); }
  } else if (look.mask === 'skull') {
    x.fillStyle = '#e8e8e0'; x.beginPath(); x.ellipse(cx, cy + 6, 62, 78, 0, 0, 7); x.fill();
    x.fillStyle = '#111'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(cx + s * 24, cy - 6, 16, 19, 0, 0, 7); x.fill(); }
    x.beginPath(); x.moveTo(cx, cy + 8); x.lineTo(cx - 8, cy + 30); x.lineTo(cx + 8, cy + 30); x.fill();
    for (let i = -3; i <= 3; i++) x.fillRect(cx + i * 9 - 3, cy + 44, 6, 22);
  } else if (look.mask === 'visor') {
    eye(-24, '#222'); eye(24, '#222');
    x.fillStyle = '#b86a50'; x.fillRect(cx - 18, cy + 40, 36, 5);
  } else {
    eye(-24, '#222'); eye(24, '#222');
    x.strokeStyle = '#6a3a2a'; x.lineWidth = 5; x.beginPath(); x.arc(cx, cy + 36, 20, 0.25, Math.PI - 0.25); x.stroke();
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(cx - 40, cy - 28, 26, 4); x.fillRect(cx + 14, cy - 28, 26, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * A properly proportioned player (rounded limbs, hoodie, belt, gloves, shoes, hair, face paint). Origin at the feet, faces +z.
 * Keeps the rig contract used everywhere (userData.head / armL / armR / legL / legR / phase / armed) so animateHumanoid still works.
 */
export function makeCharacter(rawLook = DEFAULT_LOOK, armed = true) {
  const look = sanitizeLook(rawLook), g3 = geo(), O = LOOK_OPTIONS;
  const hoodieCol = rawLook && rawLook.hoodieRGB != null ? rawLook.hoodieRGB : O.hoodie[look.hoodie];
  const lam = (c, extra) => new THREE.MeshLambertMaterial({ color: c, ...extra });
  const skin = lam(O.skin[look.skin]), hoodie = lam(hoodieCol), pants = lam(O.pants[look.pants]);
  const dark = lam(0x15151a), hair = lam(O.hairColor[look.hairColor]);
  const g = new THREE.Group();
  const add = (parent, geom, mat, x, y, z) => { const m = new THREE.Mesh(geom, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };

  // legs + shoes (pivot at the hip)
  const mkLeg = (x) => {
    const p = new THREE.Group(); p.position.set(x, 0.88, 0); g.add(p);
    add(p, g3.leg, pants, 0, -0.44, 0);
    add(p, g3.shoe, dark, 0, -0.83, 0.05);
    return p;
  };
  const legL = mkLeg(-0.115), legR = mkLeg(0.115);

  // torso: hoodie, belt, chest ring, pocket stripe; flattened front-to-back
  const torso = add(g, g3.torso, hoodie, 0, 1.18, 0); torso.scale.z = 0.62;
  const belt = add(g, g3.belt, dark, 0, 0.9, 0); belt.scale.z = 0.62;
  const ring = new THREE.Mesh(g3.ring, new THREE.MeshBasicMaterial({ color: 0xdfe6ee, side: THREE.DoubleSide }));
  ring.position.set(0, 1.28, 0.163); g.add(ring);
  const hoodBack = add(g, g3.hood, hoodie, 0, 1.46, -0.1); hoodBack.scale.set(1.1, 0.7, 0.6);

  // arms (pivot at the shoulder) + gloves
  const mkArm = (x) => {
    const p = new THREE.Group(); p.position.set(x, 1.4, 0); g.add(p);
    add(p, g3.arm, hoodie, 0, -0.3, 0);
    add(p, g3.hand, dark, 0, -0.62, 0);
    return p;
  };
  const armL = mkArm(-0.34), armR = mkArm(0.34);

  // neck + head with painted face
  add(g, g3.neck, skin, 0, 1.52, 0);
  const tex = faceTexture(look);
  const faceMat = lam(tex ? 0xffffff : O.skin[look.skin]);
  if (tex) faceMat.map = tex;
  const head = add(g, g3.head, faceMat, 0, 1.64, 0); head.scale.set(0.95, 1.1, 1.0);

  // hair / headwear
  const cy = 1.64;
  if (look.hair === 'mohawk') {
    for (let i = 0; i < 7; i++) {
      const z = 0.15 - i * 0.05, y = cy + 0.21 * Math.sqrt(Math.max(0, 1 - (z / 0.21) ** 2)) + 0.02 - Math.abs(i - 2) * 0.004;
      const b = add(g, g3.blade, hair, 0, y + 0.05, z); b.rotation.x = Math.atan2(z, y - cy) * 0.6;
    }
  } else if (look.hair === 'short') {
    const c = add(g, g3.cap, hair, 0, cy + 0.015, -0.005); c.scale.set(1.0, 1.0, 1.02); c.rotation.x = -0.32;
  } else if (look.hair === 'beanie') {
    const bm = lam(0x8a2a2a);
    const c = add(g, g3.cap, bm, 0, cy + 0.03, 0); c.scale.set(1.08, 1.12, 1.1); c.rotation.x = 0.12;
    add(g, g3.pom, bm, 0, cy + 0.26, 0);
  }
  if (look.mask === 'visor') {
    const v = new THREE.Mesh(g3.visor, new THREE.MeshBasicMaterial({ color: 0x35e0ff }));
    v.position.set(0, cy + 0.0, 0.14); g.add(v);
  }

  if (armed) {
    add(g, g3.pack, dark, 0, 1.2, -0.2);
    const gun = new THREE.Mesh(g3.gun, lam(0x222222)); gun.position.set(0.3, 1.0, 0.35); g.add(gun);
    add(g, g3.stock, lam(0x2a2a2a), 0.3, 0.97, 0.02);
  }

  g.userData = { head, armL, armR, legL, legR, phase: 0, armed, look, hoodieColor: hoodieCol };
  return g;
}
