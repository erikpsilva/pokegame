import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type BoneData = { name: string; parent: number; position: number[]; rotation: number[]; scale: number[] };
type ModelData = {
    name: string;
    bones: BoneData[];
    materials: { name: string; texture: string; texture1: string }[];
    meshes: { name: string; material: number; positions: number[]; uv: number[]; joints: number[]; weights: number[] }[];
};
type SceneData = {
    avatar: ModelData;
    maps: { model: ModelData; position: number[] }[];
    props: Record<string, ModelData>;
    instances: { id: number; position: number[]; rotation: number[]; scale: number[] }[];
    spawn: number[];
    movement: { x: number; z: number; width: number; height: number; walkable: number[] }[];
};

export default function PokemonXDemo() {
    const host = useRef<HTMLDivElement>(null);
    const heldKeys = useRef(new Set<string>());
    const [status, setStatus] = useState('Carregando cenário e personagem…');
    const [error, setError] = useState(false);
    useEffect(() => {
        const container = host.current!;
        const controller = new AbortController();
        let stopped = false,
            frameId = 0;
        const keys = heldKeys.current;
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
        renderer.setClearColor(0xb4d7e8);
        container.appendChild(renderer.domElement);
        renderer.domElement.tabIndex = 0;
        renderer.domElement.setAttribute('aria-label', 'Vaniville Town, Pokémon X. Use WASD ou setas para andar.');
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 1, 5000);
        const textures = new Map<string, THREE.Texture>();
        const loader = new THREE.TextureLoader();
        const base = `${window.location.pathname.split('/demo/')[0]}/game/pokemon-x`;
        const resize = () => {
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(container);
        resize();
        const down = (e: KeyboardEvent) => {
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                keys.add(e.key.toLowerCase());
            }
        };
        const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
        const blur = () => keys.clear();
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        window.addEventListener('blur', blur);
        const model = (data: ModelData, skinned = false) => {
            const group = new THREE.Group();
            group.name = data.name;
            const bones = data.bones.map((b) => {
                const bone = new THREE.Bone();
                bone.name = b.name;
                bone.position.fromArray(b.position);
                bone.rotation.set(b.rotation[0], b.rotation[1], b.rotation[2], 'ZYX');
                bone.scale.fromArray(b.scale);
                return bone;
            });
            bones.forEach((b, i) => {
                const parent = data.bones[i].parent;
                if (parent >= 0) bones[parent].add(b);
                else group.add(b);
            });
            group.updateMatrixWorld(true);
            const skeleton = new THREE.Skeleton(bones);
            const materials = data.materials.map((m) => {
                const name = m.texture1 || m.texture;
                return new THREE.MeshBasicMaterial({ map: textures.get(name), color: 0xffffff, side: THREE.DoubleSide, alphaTest: 0.4 });
            });
            data.meshes.forEach((m) => {
                // These meshes are projected shadow masks. The 3DS combines their
                // channels with the ground; displaying the raw mask creates white/red planes.
                if (!skinned && /kokage|fencekg|com_kaze/.test(data.materials[m.material].name)) return;
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(m.positions, 3));
                geometry.setAttribute('uv', new THREE.Float32BufferAttribute(m.uv, 2));
                let mesh: THREE.Mesh;
                if (skinned) {
                    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(m.joints, 4));
                    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(m.weights, 4));
                    const skin = new THREE.SkinnedMesh(geometry, materials[m.material]);
                    group.add(skin);
                    skin.bind(skeleton);
                    skin.normalizeSkinWeights();
                    mesh = skin;
                } else {
                    mesh = new THREE.Mesh(geometry, materials[m.material]);
                    group.add(mesh);
                }
                mesh.name = data.materials[m.material].name;
                mesh.frustumCulled = false;
            });
            return { group, bones };
        };
        async function start() {
            const response = await fetch(`${base}/scene.json`, { signal: controller.signal });
            if (!response.ok) throw Error('Não foi possível carregar o cenário');
            const data: SceneData = await response.json();
            const names = new Set(
                [...data.maps.map((m) => m.model), ...Object.values(data.props)]
                    .flatMap((m) => m.materials.map((t) => t.texture1 || t.texture))
                    .filter(Boolean),
            );
            await Promise.all(
                [...names].map(async (name) => {
                    const t = await loader.loadAsync(`${base}/textures/${encodeURIComponent(name)}.png`);
                    t.colorSpace = THREE.SRGBColorSpace;
                    t.wrapS = t.wrapT = THREE.RepeatWrapping;
                    t.magFilter = THREE.NearestFilter;
                    textures.set(name, t);
                }),
            );
            if (stopped) return;
            const terrain = new THREE.Group();
            scene.add(terrain);
            data.maps.forEach((m) => {
                const result = model(m.model);
                result.group.position.fromArray(m.position);
                terrain.add(result.group);
            });
            data.instances.forEach((p) => {
                const result = model(data.props[String(p.id)]);
                result.group.position.fromArray(p.position);
                result.group.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2], 'ZYX');
                result.group.scale.fromArray(p.scale);
                terrain.add(result.group);
            });
            const spriteRoot = base.replace(/pokemon-x$/, 'sprites');
            const makeActor = async (url: string, columns: number, width: number, height: number) => {
                const texture = await loader.loadAsync(url);
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.magFilter = texture.minFilter = THREE.NearestFilter;
                texture.repeat.set(1 / columns, 1 / 4);
                textures.set(url, texture);
                const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, alphaTest: 0.25, transparent: true }));
                sprite.center.set(0.5, 8 / 240);
                sprite.scale.set(width, height, 1);
                scene.add(sprite);
                return sprite;
            };
            const red = await makeActor(spriteRoot + '/trainers/red-pokecity.png', 5, 25.33, 38);
            const pikachu = await makeActor(spriteRoot + '/pokemon/overworld/0025.png', 4, 36, 36);
            pikachu.center.set(0.5, 6 / 32);
            if (stopped) return;
            const avatar = { group: new THREE.Group() };
            avatar.group.position.fromArray(data.spawn);
            avatar.group.position.z += 54;
            let facing = 0,
                followFacing = 0;
            const trail = Array.from({ length: 55 }, (_, i) => avatar.group.position.clone().add(new THREE.Vector3(0, 0, i - 54)));
            pikachu.position.copy(trail[0]);
            const animate = (sprite: THREE.Sprite, frame: number, row: number, columns: number) => {
                const texture = sprite.material.map!;
                texture.offset.set(frame / columns, 1 - (row + 1) / 4);
            };
            const ray = new THREE.Raycaster(),
                direction = new THREE.Vector3(0, -1, 0);
            const clock = new THREE.Clock();
            let elapsed = 0;
            scene.updateMatrixWorld(true);
            const surface = (x: number, z: number) => {
                ray.set(new THREE.Vector3(x, 220, z), direction);
                return ray.intersectObject(terrain, true).find((h) => h.face && Math.abs(h.face.normal.y) > 0.65);
            };
            const initial = surface(avatar.group.position.x, avatar.group.position.z);
            if (initial) avatar.group.position.y = initial.point.y;
            setStatus('Red + Pikachu · Vaniville Town · WASD ou setas');
            const tick = () => {
                if (stopped) return;
                const dt = Math.min(clock.getDelta(), 0.05);
                elapsed += dt;
                let x = Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft'));
                let z = Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup'));
                const moving = x !== 0 || z !== 0;
                let walked = false;
                if (moving) {
                    const length = Math.hypot(x, z);
                    x /= length;
                    z /= length;
                    const next = avatar.group.position.clone().add(new THREE.Vector3(x * 65 * dt, 0, z * 65 * dt));
                    const ground = surface(next.x, next.z);
                    const grid = data.movement.find(
                        (g) => next.x >= g.x && next.z >= g.z && next.x < g.x + g.width * 18 && next.z < g.z + g.height * 18,
                    );
                    const allowed = grid && grid.walkable[Math.floor((next.z - grid.z) / 18) * grid.width + Math.floor((next.x - grid.x) / 18)] === 1;
                    if (allowed && ground && Math.abs(ground.point.y - avatar.group.position.y) < 10) {
                        avatar.group.position.set(next.x, ground.point.y, next.z);
                        walked = true;
                    }
                    facing = Math.abs(x) > Math.abs(z) ? (x < 0 ? 2 : 3) : z < 0 ? 1 : 0;
                }
                if (walked) {
                    trail.push(avatar.group.position.clone());
                    let distance = 0,
                        index = trail.length - 1;
                    while (index > 0 && distance < 54) {
                        distance += trail[index].distanceTo(trail[index - 1]);
                        index--;
                    }
                    const next = trail[index];
                    const delta = next.clone().sub(pikachu.position);
                    if (delta.lengthSq() > 0.001) followFacing = Math.abs(delta.x) > Math.abs(delta.z) ? (delta.x < 0 ? 1 : 2) : delta.z < 0 ? 3 : 0;
                    pikachu.position.copy(next);
                    const floor = surface(next.x, next.z);
                    if (floor) pikachu.position.y = floor.point.y;
                    if (index > 0) trail.splice(0, index);
                }
                red.position.copy(avatar.group.position);
                animate(red, walked ? Math.floor(elapsed * 10) % 5 : 1, facing, 5);
                animate(pikachu, walked ? Math.floor(elapsed * 10) % 4 : 0, followFacing, 4);
                const position = avatar.group.position;
                renderer.domElement.dataset.position = `${position.x.toFixed(2)},${position.y.toFixed(2)},${position.z.toFixed(2)}`;
                renderer.domElement.dataset.motion = walked ? 'walk' : 'idle';
                renderer.domElement.dataset.followerPosition = pikachu.position
                    .toArray()
                    .map((n) => n.toFixed(2))
                    .join(',');
                camera.position.set(position.x, position.y + 230, position.z + 300);
                camera.lookAt(position.x, position.y + 12, position.z);
                renderer.render(scene, camera);
                frameId = requestAnimationFrame(tick);
            };
            tick();
            renderer.domElement.focus();
        }
        start().catch((e) => {
            if (!stopped) {
                console.error(e);
                setError(true);
                setStatus('Falha ao carregar a demo. Atualize a página para tentar novamente.');
            }
        });
        return () => {
            stopped = true;
            controller.abort();
            cancelAnimationFrame(frameId);
            observer.disconnect();
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
            window.removeEventListener('blur', blur);
            scene.traverse((o) => {
                if (o instanceof THREE.Mesh || o instanceof THREE.Sprite) {
                    if (o instanceof THREE.Mesh) o.geometry.dispose();
                    const mats = Array.isArray(o.material) ? o.material : [o.material];
                    mats.forEach((m) => m.dispose());
                }
            });
            textures.forEach((t) => t.dispose());
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, []);
    return (
        <>
            <Head title="Exemplo Pokémon X" />
            <div ref={host} className="fixed inset-0 bg-sky-200" />
            <div className="pointer-events-none fixed top-4 left-4 max-w-[calc(100%-2rem)] rounded-xl bg-slate-950/85 px-4 py-3 text-white">
                <h1 className="text-lg font-semibold">Exemplo Pokémon X</h1>
                <p className={`mt-1 text-sm ${error ? 'text-red-300' : 'text-slate-200'}`} role="status">
                    {status}
                </p>
                <p className="mt-1 text-xs text-slate-300">Mapa 3D de Kalos · Red e Pikachu em sprites</p>
                <a href={route('home')} className="pointer-events-auto mt-2 inline-block text-sm text-amber-300">
                    ← Projeto Jogo
                </a>
            </div>
            <div className="fixed right-4 bottom-4 grid touch-none grid-cols-3 gap-2 select-none" aria-label="Direcionais">
                {['', 'w', '', 'a', 's', 'd'].map((key, i) =>
                    key ? (
                        <button
                            key={key}
                            aria-label={{ w: 'Andar para cima', a: 'Andar para esquerda', s: 'Andar para baixo', d: 'Andar para direita' }[key]}
                            className="h-12 w-12 rounded-xl border border-white/40 bg-slate-950/80 text-xl text-white active:bg-blue-700"
                            onPointerDown={(e) => {
                                e.currentTarget.setPointerCapture(e.pointerId);
                                heldKeys.current.add(key);
                            }}
                            onPointerUp={() => heldKeys.current.delete(key)}
                            onPointerCancel={() => heldKeys.current.delete(key)}
                            onLostPointerCapture={() => heldKeys.current.delete(key)}
                        >
                            {{ w: '↑', a: '←', s: '↓', d: '→' }[key]}
                        </button>
                    ) : (
                        <span key={i} />
                    ),
                )}
            </div>
        </>
    );
}
