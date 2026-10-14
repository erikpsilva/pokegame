export type Direction = 'up' | 'down' | 'left' | 'right';
export type Position = { x: number; y: number };
export type MapWarp = Position & { to: string; arrival: Position; direction: Direction; facing: Direction };
export type TownMap = {
    name: string;
    width: number;
    height: number;
    tileSize: number;
    spawn: Position;
    blocked: boolean[];
    warps?: MapWarp[];
    interior?: boolean;
    adaptedInterior?: boolean;
};
export const directionRows: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 };

export function followerSpawn(map: TownMap, facing: Direction = 'down'): Position {
    const behind: Record<Direction, Direction> = { down: 'up', up: 'down', left: 'right', right: 'left' };
    for (const direction of [behind[facing], 'up', 'left', 'right', 'down'] as Direction[]) {
        const position = destination(map, map.spawn, direction);
        if (position) return position;
    }
    return { ...map.spawn };
}

export function warpAt(map: TownMap, position: Position, facing: Direction): MapWarp | undefined {
    return map.warps?.find((warp) => warp.x === position.x && warp.y === position.y && warp.direction === facing);
}

export function directionBetween(from: Position, to: Position, fallback: Direction): Direction {
    if (to.x > from.x) return 'right';
    if (to.x < from.x) return 'left';
    if (to.y > from.y) return 'down';
    if (to.y < from.y) return 'up';
    return fallback;
}
export const keyDirections: Record<string, Direction> = {
    w: 'up',
    a: 'left',
    s: 'down',
    d: 'right',
    ArrowUp: 'up',
    ArrowLeft: 'left',
    ArrowDown: 'down',
    ArrowRight: 'right',
};
export function destination(map: TownMap, position: Position, direction: Direction): Position | null {
    const offsets = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = offsets[direction];
    const x = position.x + dx;
    const y = position.y + dy;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height || map.blocked[y * map.width + x]) return null;
    return { x, y };
}
