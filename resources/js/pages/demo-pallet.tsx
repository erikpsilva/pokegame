import {
    destination,
    directionBetween,
    directionRows,
    followerSpawn,
    keyDirections,
    warpAt,
    type Direction,
    type Position,
    type TownMap,
} from '@/game/pallet-movement';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

type DemoProps = { mapFolder?: string; mapName?: string; customArt?: boolean };

export default function DemoPallet({ mapFolder = 'pallet-town', mapName = 'Pallet Town', customArt = false }: DemoProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const held = useRef(new Map<string, Direction>());
    const reset = useRef<(() => void) | null>(null);
    const [status, setStatus] = useState(`Carregando ${mapName}…`);
    const [position, setPosition] = useState<Position>({ x: 8, y: 9 });
    const [ready, setReady] = useState(false);
    const [retry, setRetry] = useState(0);
    const [scene, setScene] = useState<{ folder: string; arrival: Position; facing: Direction } | null>(null);
    const [roomName, setRoomName] = useState(mapName);
    const [adapted, setAdapted] = useState(false);
    const activeFolder = scene?.folder ?? mapFolder;

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;
        const abort = new AbortController();
        let disposed = false;
        let animation = 0;
        let inputReady = false;
        held.current.clear();
        setReady(false);
        setStatus('Carregando ambiente…');
        const base = route('home').replace(/\/?$/, '/');
        const loadImage = (url: string) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error('Não foi possível carregar as imagens.'));
                image.src = url;
            });
        const down = (event: KeyboardEvent) => {
            if (!inputReady) return;
            const direction = keyDirections[event.key.length === 1 ? event.key.toLowerCase() : event.key];
            if (!direction || event.ctrlKey || event.metaKey || event.altKey) return;
            event.preventDefault();
            held.current.delete(event.code);
            held.current.set(event.code, direction);
        };
        const up = (event: KeyboardEvent) => {
            held.current.delete(event.code);
        };
        const clear = () => {
            held.current.clear();
        };
        const visibility = () => {
            if (document.hidden) clear();
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        window.addEventListener('blur', clear);
        document.addEventListener('visibilitychange', visibility);

        Promise.all([
            fetch(base + `game/maps/${activeFolder}/map.json`, { signal: abort.signal }).then((response) => {
                if (!response.ok) throw new Error('Não foi possível carregar o mapa.');
                return response.json() as Promise<TownMap>;
            }),
            loadImage(base + `game/maps/${activeFolder}/map.png`),
            loadImage(base + 'game/sprites/pokemon/overworld/0025.png'),
            loadImage(base + `game/sprites/trainers/${customArt ? 'red-pokecity.png' : 'red-walk.png'}`),
        ])
            .then(([map, background, pikachu, trainer]) => {
                if (disposed) return;
                map.spawn = scene?.arrival ?? map.spawn;
                const initialFacing = scene?.facing ?? 'down';
                setRoomName(map.name);
                setAdapted(Boolean(map.adaptedInterior));
                held.current.clear();
                canvas.width = map.width * map.tileSize;
                canvas.height = map.height * map.tileSize;
                context.imageSmoothingEnabled = false;
                const frameWidth = pikachu.width / 4;
                const frameHeight = pikachu.height / 4;
                const spriteScale = customArt ? 2.3 : 0.714025;
                const trainerWidth = trainer.width / (customArt ? 5 : 4);
                const trainerHeight = trainer.height / 4;
                const trainerRows = customArt ? { down: 0, up: 1, left: 2, right: 3 } : directionRows;
                let current = { ...map.spawn };
                let target: Position | null = null;
                let follower = followerSpawn(map, initialFacing);
                const makeTrail = () => {
                    const positions = [{ ...map.spawn }];
                    const behind: Record<Direction, Direction> = { down: 'up', up: 'down', left: 'right', right: 'left' };
                    for (let i = 0; i < 3; i++) positions.push(destination(map, positions.at(-1)!, behind[initialFacing]) ?? positions.at(-1)!);
                    return positions;
                };
                let trail = makeTrail();
                if (customArt) follower = { ...trail[3] };
                let followerTarget: Position | null = null;
                let followerFacing: Direction = initialFacing;
                let facing: Direction = initialFacing;
                let progress = 0;
                let lastTime = 0;
                let walkTime = 0;
                let steps = 0;
                reset.current = () => {
                    if (scene) {
                        setScene(null);
                        return;
                    }
                    held.current.clear();
                    current = { ...map.spawn };
                    target = null;
                    follower = followerSpawn(map, initialFacing);
                    trail = makeTrail();
                    if (customArt) follower = { ...trail[3] };
                    followerTarget = null;
                    followerFacing = 'down';
                    progress = 0;
                    walkTime = 0;
                    facing = 'down';
                    steps = 0;
                    setPosition(current);
                    setStatus('Explore com W, A, S e D.');
                };
                inputReady = true;
                setReady(true);
                setPosition(current);
                setStatus('Explore com W, A, S e D.');
                canvas.focus({ preventScroll: true });
                const draw = (time: number) => {
                    const dt = lastTime ? Math.min(time - lastTime, 50) : 0;
                    lastTime = time;
                    const pressed = Array.from(held.current.values()).at(-1);
                    if (!target && pressed) {
                        facing = pressed;
                        target = destination(map, current, facing);
                        if (target) {
                            followerTarget = { ...(customArt ? trail[2] : current) };
                            followerFacing = directionBetween(follower, followerTarget, followerFacing);
                            setStatus(`Explorando ${map.name}`);
                        } else setStatus('Caminho bloqueado');
                    }
                    if (target) {
                        progress = Math.min(1, progress + dt / 160);
                        walkTime += dt;
                        if (progress >= 1) {
                            follower = followerTarget ?? follower;
                            followerTarget = null;
                            current = target;
                            trail = [{ ...current }, ...trail].slice(0, 4);
                            target = null;
                            progress = 0;
                            steps++;
                            setPosition({ ...current });
                            const warp = warpAt(map, current, facing);
                            if (warp) {
                                inputReady = false;
                                held.current.clear();
                                setReady(false);
                                setScene({ folder: warp.to, arrival: warp.arrival, facing: warp.facing });
                                return;
                            }
                        }
                    } else {
                        walkTime = 0;
                    }
                    const x = current.x + (target ? (target.x - current.x) * progress : 0);
                    const y = current.y + (target ? (target.y - current.y) * progress : 0);
                    const frame = target ? Math.floor(walkTime / 85) % 4 : 0;
                    const viewport = canvas.getBoundingClientRect();
                    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
                    const width = Math.round(viewport.width * pixelRatio);
                    const height = Math.round(viewport.height * pixelRatio);
                    if (canvas.width !== width || canvas.height !== height) {
                        canvas.width = width;
                        canvas.height = height;
                    }
                    const zoom = customArt
                        ? Math.max(viewport.width / background.width, viewport.height / background.height) * 1.1
                        : Math.max(viewport.width / 384, viewport.height / 320) * 0.704;
                    const cameraX =
                        background.width < viewport.width / zoom
                            ? (background.width - viewport.width / zoom) / 2
                            : Math.max(0, Math.min(background.width - viewport.width / zoom, x * 16 + 8 - viewport.width / zoom / 2));
                    const cameraY =
                        background.height < viewport.height / zoom
                            ? (background.height - viewport.height / zoom) / 2
                            : Math.max(0, Math.min(background.height - viewport.height / zoom, y * 16 + 8 - viewport.height / zoom / 2));
                    context.setTransform(1, 0, 0, 1, 0, 0);
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.imageSmoothingEnabled = false;
                    context.setTransform(pixelRatio * zoom, 0, 0, pixelRatio * zoom, -cameraX * pixelRatio * zoom, -cameraY * pixelRatio * zoom);
                    context.drawImage(background, 0, 0);
                    const followerX = follower.x + (followerTarget ? (followerTarget.x - follower.x) * progress : 0);
                    const followerY = follower.y + (followerTarget ? (followerTarget.y - follower.y) * progress : 0);
                    // Visible trainer height is exactly 1.3 times Pikachu's reference height (18px vs 19px).
                    const trainerScale = customArt ? 0.28 : spriteScale * (18 / 19) * 1.3;
                    const actors = [
                        {
                            image: trainer,
                            x,
                            y,
                            facing,
                            frame: target ? (customArt ? Math.floor(walkTime / 85) % 5 : frame) : 1,
                            scale: trainerScale,
                            shadow: customArt ? 12 : 3,
                            width: trainerWidth,
                            height: trainerHeight,
                            row: trainerRows[facing],
                            padding: customArt ? 8 : 6,
                        },
                        {
                            image: pikachu,
                            x: followerX,
                            y: followerY,
                            facing: followerFacing,
                            frame: followerTarget ? frame : 0,
                            scale: spriteScale,
                            shadow: 2,
                            width: frameWidth,
                            height: frameHeight,
                            row: directionRows[followerFacing],
                            padding: 6,
                        },
                    ].sort((a, b) => a.y - b.y);
                    for (const actor of actors) {
                        context.fillStyle = 'rgba(24, 50, 36, 0.22)';
                        context.beginPath();
                        context.ellipse(actor.x * 16 + 8, actor.y * 16 + 10, actor.shadow, 1, 0, 0, Math.PI * 2);
                        context.fill();
                        context.drawImage(
                            actor.image,
                            actor.frame * actor.width,
                            actor.row * actor.height,
                            actor.width,
                            actor.height,
                            actor.x * 16 + 8 - (actor.width * actor.scale) / 2,
                            actor.y * 16 + 10 - (actor.height - actor.padding) * actor.scale,
                            actor.width * actor.scale,
                            actor.height * actor.scale,
                        );
                    }
                    canvas.dataset.map = activeFolder;
                    canvas.dataset.followerX = String(follower.x);
                    canvas.dataset.followerY = String(follower.y);
                    canvas.dataset.followerDirection = followerFacing;
                    canvas.dataset.x = String(current.x);
                    canvas.dataset.y = String(current.y);
                    canvas.dataset.direction = facing;
                    canvas.dataset.frame = String(frame);
                    canvas.dataset.steps = String(steps);
                    canvas.dataset.moving = String(Boolean(target));
                    animation = requestAnimationFrame(draw);
                };
                animation = requestAnimationFrame(draw);
            })
            .catch((error) => {
                if (!disposed) setStatus(error instanceof Error ? error.message : 'Falha ao carregar a demo.');
            });
        return () => {
            disposed = true;
            abort.abort();
            cancelAnimationFrame(animation);
            held.current.clear();
            reset.current = null;
            window.removeEventListener('keydown', down);
            window.removeEventListener('keyup', up);
            window.removeEventListener('blur', clear);
            document.removeEventListener('visibilitychange', visibility);
        };
    }, [retry, mapFolder, activeFolder, scene, customArt]);

    const touch = (direction: Direction, active: boolean) => {
        if (active) held.current.set('touch', direction);
        else held.current.delete('touch');
    };

    return (
        <>
            <Head title={`${roomName} — demo`} />
            <main className="fixed inset-0 overflow-hidden bg-[#203c32] text-white">
                <canvas
                    ref={canvasRef}
                    tabIndex={0}
                    aria-label={`Mapa de ${roomName}. Controle o personagem com W, A, S e D; Pikachu segue atrás.`}
                    className="absolute inset-0 block h-full w-full outline-none"
                    style={{ imageRendering: 'pixelated' }}
                />
                <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-5">
                    <div className="rounded-xl bg-slate-950/75 px-4 py-3 backdrop-blur-sm">
                        <h1 className="text-lg font-semibold">{roomName}</h1>
                        <p className="mt-1 text-sm text-yellow-300">Personagem + Pikachu · W A S D</p>
                        {adapted && <p className="mt-1 text-sm text-white/70">Interior adaptado para a demo</p>}
                    </div>
                    <div className="pointer-events-auto flex gap-2">
                        <button
                            onClick={() => (ready ? reset.current?.() : setRetry((value) => value + 1))}
                            className="rounded-xl bg-slate-950/75 px-3 py-3 text-sm hover:bg-slate-900"
                        >
                            {ready ? 'Recomeçar' : 'Tentar novamente'}
                        </button>
                        <Link href={route('home')} className="rounded-xl bg-slate-950/75 px-3 py-3 text-sm hover:bg-slate-900">
                            Sair
                        </Link>
                    </div>
                </header>
                <div className="pointer-events-none absolute bottom-4 left-4 max-w-[calc(100%-190px)] rounded-xl bg-slate-950/75 px-4 py-3 text-sm backdrop-blur-sm">
                    <p role="status">{status}</p>
                    <p className="mt-1 text-white/70">
                        Personagem: {position.x}, {position.y}
                    </p>
                </div>
                <div className="absolute right-4 bottom-4 grid w-36 grid-cols-3 gap-1.5">
                    {(
                        [
                            ['up', '↑', 'col-start-2'],
                            ['left', '←', 'col-start-1'],
                            ['down', '↓', ''],
                            ['right', '→', ''],
                        ] as const
                    ).map(([direction, label, placement]) => (
                        <button
                            key={direction}
                            disabled={!ready}
                            aria-label={`Andar para ${direction === 'up' ? 'cima' : direction === 'down' ? 'baixo' : direction === 'left' ? 'esquerda' : 'direita'}`}
                            onPointerDown={(event) => {
                                event.preventDefault();
                                event.currentTarget.setPointerCapture(event.pointerId);
                                touch(direction, true);
                            }}
                            onPointerUp={() => touch(direction, false)}
                            onPointerCancel={() => touch(direction, false)}
                            onLostPointerCapture={() => touch(direction, false)}
                            className={`${placement} touch-none rounded-xl bg-slate-950/75 py-3 text-lg font-semibold select-none active:bg-yellow-600 disabled:opacity-40`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </main>
        </>
    );
}
