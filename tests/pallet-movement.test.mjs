import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { destination, keyDirections, directionRows, followerSpawn, directionBetween, warpAt } from '../resources/js/game/pallet-movement.ts';

const map = JSON.parse(readFileSync(new URL('../public/game/maps/pallet-town/map.json', import.meta.url)));

test('Follower starts on walkable ground and turns toward the previous leader cell', () => {
    for (const filename of ['pallet-town', 'nuvema-town']) {
        const town = JSON.parse(readFileSync(new URL(`../public/game/maps/${filename}/map.json`, import.meta.url)));
        const follower = followerSpawn(town);
        assert.equal(town.blocked[follower.y * town.width + follower.x], false);
        assert.equal(Math.abs(follower.x - town.spawn.x) + Math.abs(follower.y - town.spawn.y), 1);
        assert.equal(directionBetween(follower, town.spawn, 'left'), 'down');
    }
    assert.equal(directionBetween({x:8,y:9},{x:9,y:9},'down'), 'right');
    assert.equal(directionBetween({x:9,y:9},{x:9,y:10},'right'), 'down');
    assert.equal(directionBetween({x:9,y:10},{x:8,y:10},'down'), 'left');
});

test('Nuvema Town has a walkable spawn and blocks houses, trees and sea', () => {
    const town = JSON.parse(readFileSync(new URL('../public/game/maps/nuvema-town/map.json', import.meta.url)));
    assert.equal(town.blocked.length, town.width * town.height);
    assert.equal(town.blocked[town.spawn.y * town.width + town.spawn.x], false);
    assert.deepEqual(destination(town, town.spawn, 'right'), { x: 15, y: 18 });
    assert.deepEqual(destination(town, town.spawn, 'down'), { x: 14, y: 19 });
    assert.equal(destination(town, { x: 13, y: 17 }, 'up'), null);
    assert.equal(destination(town, { x: 4, y: 18 }, 'left'), null);
    assert.equal(destination(town, { x: 14, y: 29 }, 'down'), null);
});

test('WASD and sprite rows correspond to the four directions', () => {
    assert.deepEqual(['w', 'a', 's', 'd'].map(key => keyDirections[key]), ['up', 'left', 'down', 'right']);
    assert.deepEqual(directionRows, { down: 0, left: 1, right: 2, up: 3 });
});
test('Spawn is walkable and can reach the streets on all sides of town', () => {
    const visited = new Set();
    const queue = [map.spawn];
    while (queue.length) {
        const position = queue.shift();
        const key = `${position.x},${position.y}`;
        if (visited.has(key)) continue;
        visited.add(key);
        for (const direction of Object.keys(directionRows)) {
            const next = destination(map, position, direction);
            if (next) queue.push(next);
        }
    }
    assert.ok(visited.size > 200, `Only ${visited.size} reachable tiles`);
    for (const location of ['2,10', '21,10', '12,1', '12,17']) assert.ok(visited.has(location), location);
});
test('House, water and map boundaries cannot be crossed', () => {
    assert.equal(destination(map, { x: 8, y: 8 }, 'up'), null);
    assert.equal(destination(map, { x: 8, y: 16 }, 'down'), null);
    assert.equal(destination(map, { x: 12, y: 0 }, 'up'), null);
    assert.equal(destination(map, { x: 23, y: 9 }, 'right'), null);
});
test('Every allowed transition stays inside a walkable map cell', () => {
    assert.equal(map.blocked.length, 480);
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
        for (const direction of Object.keys(directionRows)) {
            const next = destination(map, { x, y }, direction);
            if (next) {
                assert.ok(next.x >= 0 && next.x < map.width && next.y >= 0 && next.y < map.height);
                assert.equal(map.blocked[next.y * map.width + next.x], false);
            }
        }
    }
});
