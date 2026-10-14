import fs from 'node:fs';
import path from 'node:path';
import {readMotionPack} from './pokemon-x-motion.mjs';

const source='storage/app/pokemon-x-tools';
const output='public/game/pokemon-x';
fs.mkdirSync(output,{recursive:true});
const load=(name)=>JSON.parse(fs.readFileSync(`${source}/export/${name}/model.json`))[0];
const part=(b,i)=>b.subarray(b.readUInt32LE(4+i*4),b.readUInt32LE(8+i*4));
const avatar=load('calem-base'); avatar.meshes=[];avatar.materials=[];
for(const id of [397,400,404,409,411,419,424,430]){
    const piece=load(`part${id}`),base=avatar.materials.length;
    avatar.materials.push(...piece.materials);
    for(const mesh of piece.meshes){
        mesh.material+=base;
        mesh.joints=mesh.joints.map(j=>{
            if(piece.bones[j].parent<0)return 0;
            const name=piece.bones[j].name;
            const index=avatar.bones.findIndex(b=>b.name===name);
            if(index<0)throw Error(`Missing bone ${name}`);
            return index;
        });
        avatar.meshes.push(mesh);
    }
}
const origin=[7920,10080];
const regions=[{id:12,x:11,z:14},{id:13,x:12,z:14},{id:14,x:11,z:15},{id:15,x:12,z:15}];
const instances=[];
for(const r of regions){
    const b=part(fs.readFileSync(`${source}/unpacked/a/0/4/1/${r.id}.bin`),3);
    for(let n=0;n<b.readUInt32LE(0);n++){
        const p=4+n*44,id=b.readUInt32LE(p);
        instances.push({id,scale:[4,8,12].map(o=>b.readFloatLE(p+o)),rotation:[16,20,24].map(o=>b.readFloatLE(p+o)),position:[b.readFloatLE(p+28)-origin[0],b.readFloatLE(p+32),b.readFloatLE(p+36)-origin[1]]});
    }
}
const maps=regions.map(r=>({model:load(`map${r.id}`),position:[r.x*720+360-origin[0],0,r.z*720+360-origin[1]]}));
const movement=regions.map(r=>{
    const b=part(fs.readFileSync(`${source}/unpacked/a/0/4/1/${r.id}.bin`),0);
    const width=b.readUInt16LE(0),height=b.readUInt16LE(2);
    return {x:r.x*720-origin[0],z:r.z*720-origin[1],width,height,walkable:Array.from({length:width*height},(_,i)=>b[7+i*4]===0?1:0)};
});
const props=Object.fromEntries([...new Set(instances.map(p=>p.id))].map(id=>[id,load(`prop${id}`)]));
const mm=fs.readFileSync(`${source}/unpacked/a/0/2/1/2.bin`);
const motion=readMotionPack(part(mm,1));
// Keep the test's locomotion clips only; the archive contains many unrelated actions.
motion.animations=motion.animations.filter(a=>[0,2,3,4,7,8,9,10,11,12].includes(a.index));
// loc_acchat is an optional accessory locator absent from this base skeleton.
for(const clip of motion.animations)clip.channels=clip.channels.filter(c=>avatar.bones.some(b=>b.name===c.bone));
const scene={name:'Vaniville Town',avatar,motion,maps,props,instances,movement,spawn:[495,144,675]};
fs.writeFileSync(`${output}/scene.json`,JSON.stringify(scene));
const textureNames=new Set([avatar,...maps.map(m=>m.model),...Object.values(props)].flatMap(m=>m.materials.map(t=>t.texture1||t.texture)).filter(Boolean));
const textureOut=`${output}/textures`;fs.mkdirSync(textureOut,{recursive:true});
for(const name of textureNames){
    const candidates=[`${source}/export/wardrobe/${name}.png`,`${source}/export/textures/${name}.png`];
    const file=candidates.find(f=>fs.existsSync(f));
    if(!file)throw Error(`Missing texture ${name}`);
    fs.copyFileSync(file,path.join(textureOut,`${name}.png`));
}
console.log(`Prepared Calem (${avatar.bones.length} bones), ${maps.length} map regions, ${instances.length} props, ${textureNames.size} textures.`);
