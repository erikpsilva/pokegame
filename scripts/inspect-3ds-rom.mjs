import fs from 'node:fs';
import path from 'node:path';

const romPath = process.argv[2];
if (!romPath) throw new Error('Usage: node scripts/inspect-3ds-rom.mjs <ROM> [RomFS paths to extract]');
const fd = fs.openSync(romPath, 'r');
const read = (offset, length) => { const buffer = Buffer.alloc(length); if (fs.readSync(fd, buffer, 0, length, offset) !== length) throw new Error('Short ROM read'); return buffer; };
try {
    const header = read(0, 512);
    if (header.toString('ascii', 256, 260) !== 'NCSD') throw new Error('Not NCSD');
    const partition = header.readUInt32LE(0x120) * 512;
    const ncch = read(partition, 512);
    if (ncch.toString('ascii',256,260) !== 'NCCH') throw new Error('Not NCCH');
    const romfs = partition + ncch.readUInt32LE(0x1b0) * 512;
    const ivfc = read(romfs, 0x60);
    if (ivfc.toString('ascii',0,4) !== 'IVFC') throw new Error('RomFS is not readable (possibly encrypted)');
    const blockSize = 2 ** ivfc.readUInt32LE(0x4c);
    const level3 = romfs + Math.ceil((0x60 + ivfc.readUInt32LE(8)) / blockSize) * blockSize;
    const h = read(level3, 40);
    if (h.readUInt32LE(0) !== 40) throw new Error('Invalid RomFS level 3');
    const dirs = read(level3 + h.readUInt32LE(12), h.readUInt32LE(16));
    const files = read(level3 + h.readUInt32LE(28), h.readUInt32LE(32));
    const dataOffset = level3 + h.readUInt32LE(36);
    const entries = [];
    function walk(directory, prefix) {
        let file = dirs.readUInt32LE(directory + 12);
        while (file !== 0xffffffff) {
            const name = files.toString('utf16le', file + 32, file + 32 + files.readUInt32LE(file + 28));
            entries.push({ path: prefix + name, offset: dataOffset + Number(files.readBigUInt64LE(file + 8)), size: Number(files.readBigUInt64LE(file + 16)) });
            file = files.readUInt32LE(file + 4);
        }
        let child = dirs.readUInt32LE(directory + 8);
        while (child !== 0xffffffff) {
            const name = dirs.toString('utf16le', child + 24, child + 24 + dirs.readUInt32LE(child + 20));
            walk(child, prefix + name + '/');
            child = dirs.readUInt32LE(child + 4);
        }
    }
    walk(0, '');
    const output = path.resolve('storage/app/pokemon-x-tools');
    fs.mkdirSync(output, {recursive:true});
    fs.writeFileSync(path.join(output,'romfs-index.json'), JSON.stringify({product:ncch.toString('ascii',0x150,0x160).replaceAll('\0',''),readable:true,entries},null,2));
    console.log(`Readable RomFS: ${entries.length} files`);
    const requested = process.argv.slice(3);
    for (const entry of entries) {
        if (!requested.includes(entry.path)) continue;
        const target = path.join(output,'romfs',...entry.path.split('/'));
        if (!path.resolve(target).startsWith(output + path.sep)) throw new Error('Unsafe output path');
        fs.mkdirSync(path.dirname(target),{recursive:true});
        fs.writeFileSync(target, read(entry.offset,entry.size));
        console.log(`Extracted ${entry.path}: ${entry.size} bytes`);
    }
} finally { fs.closeSync(fd); }
