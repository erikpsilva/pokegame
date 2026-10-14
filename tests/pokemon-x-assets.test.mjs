import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const scene=JSON.parse(fs.readFileSync(new URL('../public/game/pokemon-x/scene.json',import.meta.url)));
test('Pokémon X has complete, finite geometry and every referenced texture',()=>{
    for(const model of [scene.avatar,...scene.maps.map(m=>m.model),...Object.values(scene.props)]){
        for(const m of model.materials)assert.ok(fs.existsSync(new URL(`../public/game/pokemon-x/textures/${m.texture1||m.texture}.png`,import.meta.url)));
        for(const mesh of model.meshes){
            assert.equal(mesh.positions.length%9,0,'triangle list');
            assert.equal(mesh.uv.length,mesh.positions.length/3*2);
            assert.ok(mesh.positions.every(Number.isFinite));
            assert.ok(mesh.material<model.materials.length);
        }
    }
});
test('Calem has a complete mapped skin and a changing original walk animation',()=>{
    assert.equal(scene.avatar.bones.length,43);
    for(const mesh of scene.avatar.meshes){
        assert.equal(mesh.joints.length,mesh.positions.length/3*4);
        assert.equal(mesh.weights.length,mesh.joints.length);
        assert.ok(mesh.joints.every(j=>Number.isInteger(j)&&j>=0&&j<43));
        for(let i=0;i<mesh.weights.length;i+=4)assert.ok(Math.abs(mesh.weights.slice(i,i+4).reduce((a,b)=>a+b,0)-1)<0.02);
    }
    const walk=scene.motion.animations.find(a=>a.index===2);
    assert.equal(walk.frames,14);
    assert.ok(walk.channels.some(c=>c.keys.length>2&&new Set(c.keys.map(k=>k[1])).size>2));
    for(const channel of walk.channels){
        assert.ok(scene.avatar.bones.some(b=>b.name===channel.bone));
        assert.ok(channel.keys.flat().every(Number.isFinite));
    }
});
test('original movement tiles admit the spawn and block surrounding scenery',()=>{
    const [x,,z]=scene.spawn;
    const grid=scene.movement.find(g=>x>=g.x&&z>=g.z&&x<g.x+g.width*18&&z<g.z+g.height*18);
    assert.ok(grid);
    assert.equal(grid.walkable[Math.floor((z-grid.z)/18)*grid.width+Math.floor((x-grid.x)/18)],1);
    for(const g of scene.movement){assert.equal(g.walkable.length,g.width*g.height);assert.ok(g.walkable.includes(0));assert.ok(g.walkable.every(v=>v===0||v===1));}
    assert.ok(scene.movement.some(g=>g.walkable.includes(1)));
});
