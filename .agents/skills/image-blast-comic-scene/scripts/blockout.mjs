// Deterministic perspective composition guide; not image-to-3D reconstruction.
export const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const unit = a => { const n = Math.hypot(...a); if (!n) throw new Error('Degenerate camera basis'); return a.map(v => v/n); };
export const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

export function cameraProjector(camera) {
  const forward = unit(sub(camera.target, camera.position));
  const right = unit(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const focal = camera.width * camera.focal_length_mm / camera.sensor_width_mm;
  return point => {
    const p = sub(point, camera.position);
    const z = dot(p, forward);
    return { x: camera.width/2 + focal*dot(p, right)/z,
      y: camera.height/2 - focal*dot(p, up)/z, z };
  };
}

export function renderBlockout(scene, camera, panel) {
  const project = cameraProjector(camera);
  const faces = [];
  const faceIndices = [[0,1,3,2], [4,6,7,5], [0,4,5,1], [2,3,7,6], [0,2,6,4], [1,5,7,3]];
  for (const box of scene.geometry) {
    const override = panel.continuity.props.find(prop => prop.id === box.id);
    if (override?.visible === false) continue;
    const center = override?.position ?? box.position;
    const vertices = Array.from({length:8}, (_, i) => project(center.map((v, axis) => v + ((i >> axis)&1 ? 1 : -1)*box.size[axis]/2)));
    faceIndices.forEach((indices, i) => {
      const points = indices.map(n => vertices[n]);
      // Faces straddling the near plane are omitted, rather than inventing geometry.
      if (points.some(p => p.z < 0.05)) return;
      faces.push({depth: points.reduce((s,p) => s+p.z, 0)/4, svg:
        `<polygon points="${points.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}" fill="${box.color ?? '#9aaaba'}" fill-opacity="${0.6+i*0.05}" stroke="#263747" stroke-width="1"><title>${escape(box.id)}</title></polygon>`});
    });
  }
  faces.sort((a,b) => b.depth-a.depth);
  const labels = scene.geometry.map(box => {
    const override = panel.continuity.props.find(prop => prop.id === box.id);
    if (override?.visible === false) return '';
    const p = project(override?.position ?? box.position);
    if (p.z < 0.05 || p.x < 0 || p.x > camera.width || p.y < 0 || p.y > camera.height) return '';
    return `<text x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}" fill="#172738" font-size="14" paint-order="stroke" stroke="#fff" stroke-width="3">${escape(box.id)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${camera.width}" height="${camera.height}" viewBox="0 0 ${camera.width} ${camera.height}">
<title>${escape(scene.title)} / ${escape(panel.id)} / ${escape(camera.id)}</title>
<rect width="100%" height="100%" fill="#eef2f5"/>
${faces.map(f=>f.svg).join('\n')}${labels.join('\n')}
<rect width="100%" height="32" fill="#172738"/>
<text x="12" y="22" fill="#fff" font-family="sans-serif" font-size="15">${escape(panel.id)} · ${escape(camera.id)} · ${camera.focal_length_mm}mm · COMPOSITION PROXY</text>
</svg>\n`;
}
