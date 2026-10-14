import fs from 'node:fs';

// GF1 format based on gdkchan/SPICA Formats/GFL/Motion (Unlicense).
// XY uses GF1; the later GF2 animation reader cannot decode these archives.
export function readMotionPack(buffer) {
    let p = 0;
    const u8 = () => buffer.readUInt8(p++);
    const u16 = () => { const n = buffer.readUInt16LE(p); p += 2; return n; };
    const u32 = () => { const n = buffer.readUInt32LE(p); p += 4; return n; };
    const f32 = () => { const n = buffer.readFloatLE(p); p += 4; if (!Number.isFinite(n)) throw Error('Invalid motion float'); return n; };
    const align = (n) => { p = Math.ceil(p / n) * n; };
    const count = u32();
    if (count > 2048) throw Error('Invalid motion count');
    const offsets = Array.from({length: count}, u32);
    p = offsets[0];
    const boneCount = u8(); u8();
    const bones = [{name:'Origin',parent:-1,flags:0}];
    for (let i=1;i<boneCount;i++) bones.push({parent:u8(),flags:u8(),children:u8()});
    for (let i=1;i<boneCount;i++) { const start=p; while(u8()!==0) {} bones[i].name=buffer.toString('utf8',start,p-1); }
    align(4);
    for (const b of bones) { b.position=Array.from({length:3},f32); b.quaternion=Array.from({length:4},f32); }
    const animations=[];
    for(let index=1;index<count;index++) {
        if(!offsets[index])continue;
        p=offsets[index]; const octalCount=u16(),frames=u16();
        const octals=[];let packed=0;
        for(let i=0;i<octalCount;i++){if(i%8===0)packed=u8()|(u8()<<8)|(u8()<<16);octals.push(packed&7);packed>>>=3;}
        const wide=frames>255;if(wide)align(2);
        const keyLists=[];
        for(const code of octals)if(code>5){const n=wide?u16():u8();keyLists.push([0,...Array.from({length:n},wide?u16:u8),frames]);}
        align(4);let elem=0,key=0;const channels=[];
        for(let i=2;i<octals.length;i++){
            const code=octals[i];if(code===1){elem+=3;continue;}
            const bone=Math.floor(elem/9),axis=elem%9;elem++;
            if(bone>=bones.length)throw Error('Motion bone outside skeleton');
            let keys=[];
            if(code<=5){const value=code===0?0:code===2?Math.PI/2:code===3?Math.PI:code===4?-Math.PI/2:f32();keys=[[0,value,0]];}
            else keys=keyLists[key++].map(frame=>[frame,f32(),code===7?f32():0]);
            channels.push({bone:bones[bone].name,world:!!(bones[bone].flags&8),axis,hermite:code===7,keys});
        }
        animations.push({index:index-1,frames,channels});
    }
    return {bones,animations};
}
if(process.argv[1]?.endsWith('pokemon-x-motion.mjs') && process.argv[2]) {
    const mm=fs.readFileSync(process.argv[2]);
    const pack=readMotionPack(mm.subarray(mm.readUInt32LE(8),mm.readUInt32LE(12)));
    fs.writeFileSync(process.argv[3],JSON.stringify(pack));
    console.log('Skeleton:',pack.bones.length,'Animations:',pack.animations.map(a=>`${a.index}:${a.frames}`).join(', '));
}
