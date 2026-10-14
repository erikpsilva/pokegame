import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {destination,followerSpawn} from '../resources/js/game/pallet-movement.ts';
const map=JSON.parse(fs.readFileSync(new URL('../public/game/maps/pokecity/map.json',import.meta.url)));
const directions=['up','down','left','right'];
test('PokeCity streets, bridge and building approaches are connected',()=>{
    const seen=new Set([`${map.spawn.x},${map.spawn.y}`]),queue=[map.spawn];
    for(let i=0;i<queue.length;i++)for(const direction of directions){const p=destination(map,queue[i],direction);if(p&&!seen.has(`${p.x},${p.y}`)){seen.add(`${p.x},${p.y}`);queue.push(p);}}
    for(const [name,x,y] of [['bridge',90,45],['gym',16,50],['mart',75,21],['house',74,41],['stairs',49,5],['west street',15,24]])assert.ok(seen.has(`${x},${y}`),name);
    assert.notDeepEqual(followerSpawn(map),map.spawn);
});
test('PokeCity blocks water, buildings, central garden and limits',()=>{
    for(const [name,x,y] of [['water',89,35],['pond',15,34],['center roof',49,13],['tree garden',49,35],['gym roof',15,42]])assert.equal(map.blocked[y*map.width+x],true,name);
    assert.equal(destination(map,{x:0,y:0},'left'),null);
});
