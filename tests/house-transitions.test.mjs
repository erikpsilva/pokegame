import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { destination, followerSpawn, warpAt } from '../resources/js/game/pallet-movement.ts';

const ids = ['pallet-town','pallet-home','pallet-bedroom','pallet-rival','pallet-lab','nuvema-town','nuvema-home','nuvema-bianca','nuvema-cheren','nuvema-bedroom','nuvema-lab','firered-route1','unova-route1'];
const maps = Object.fromEntries(ids.map(id => [id, JSON.parse(readFileSync(new URL(`../public/game/maps/${id}/map.json`, import.meta.url)))]));
function reachable(map, start) {
    const seen = new Set(); const queue = [start];
    while (queue.length) {
        const cell = queue.shift(); const key = `${cell.x},${cell.y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        for (const direction of ['up','down','left','right']) {
            const next = destination(map,cell,direction);
            if (next) queue.push(next);
        }
    }
    return seen;
}
test('Every doorway has a walkable destination and separate follower arrival', () => {
    for (const [id,map] of Object.entries(maps)) for (const warp of map.warps) {
        const next = maps[warp.to]; assert.ok(next, `${id} destination ${warp.to}`);
        assert.equal(map.blocked[warp.y * map.width + warp.x],false);
        assert.equal(next.blocked[warp.arrival.y * next.width + warp.arrival.x],false, `${id} -> ${warp.to}`);
        const follower = followerSpawn({...next,spawn:warp.arrival},warp.facing);
        assert.equal(Math.abs(follower.x-warp.arrival.x)+Math.abs(follower.y-warp.arrival.y),1, `${id} follower arrival`);
        assert.equal(warpAt(map,warp,warp.direction),warp);
        assert.equal(warpAt(map,warp,warp.direction === 'up' ? 'down':'up'),undefined);
    }
});
test('Every interior arrival can reach an exit without crossing furniture', () => {
    for (const [id,map] of Object.entries(maps)) for (const warp of map.warps) {
        const next = maps[warp.to];
        const seen = reachable(next,warp.arrival);
        assert.ok(next.warps.some(exit => seen.has(`${exit.x},${exit.y}`)), `No exit from ${id} -> ${warp.to}`);
        const back = next.warps.filter(exit => exit.to === id);
        assert.ok(back.some(exit => seen.has(`${exit.x},${exit.y}`)), `No return from ${warp.to} to ${id}`);
    }
});
test('All outdoor house doors are reachable from the demo spawn', () => {
    for (const id of ['pallet-town','nuvema-town']) {
        const map = maps[id]; const seen = reachable(map,map.spawn);
        for (const warp of map.warps) assert.ok(seen.has(`${warp.x},${warp.y}`), `${id} door ${warp.x},${warp.y}`);
    }
});

test('Both city exits reach Route 1 and can return with the follower behind', () => {
    for (const [city,route] of [['pallet-town','firered-route1'],['nuvema-town','unova-route1']]) {
        const exits=maps[city].warps.filter(warp=>warp.to===route);
        assert.equal(exits.length,2);
        for (const exit of exits) {
            assert.equal(exit.y,0);
            assert.equal(exit.direction,'up');
            const townSeen=reachable(maps[city],maps[city].spawn);
            assert.ok(townSeen.has(`${exit.x},${exit.y}`));
            const routeSeen=reachable(maps[route],exit.arrival);
            assert.ok([...routeSeen].some(cell=>Number(cell.split(',')[1])<5), `${route} cannot be explored northwards`);
            const back=maps[route].warps.find(warp=>warp.to===city&&warp.x===exit.arrival.x);
            assert.ok(back);
            assert.equal(back.direction,'down');
            assert.equal(back.arrival.x,exit.x);
            assert.equal(back.arrival.y,1);
            assert.ok(routeSeen.has(`${back.x},${back.y}`));
            assert.equal(followerSpawn({...maps[route],spawn:exit.arrival},'up').y,exit.arrival.y+1);
            assert.equal(followerSpawn({...maps[city],spawn:back.arrival},'down').y,0);
        }
        const png=readFileSync(new URL(`../public/game/maps/${route}/map.png`,import.meta.url));
        assert.equal(png.readUInt32BE(16), maps[route].width*16);
        assert.equal(png.readUInt32BE(20), maps[route].height*16);
    }
});
