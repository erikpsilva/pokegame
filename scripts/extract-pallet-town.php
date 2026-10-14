<?php

// Reads the preserved FireRed decompilation data; does not alter any ROM.
$root = dirname(__DIR__);
$source = isset($argv[1]) ? $root.'/'.$argv[1] : $root.'/resources/game-source/firered';
$output = $root.'/public/game/maps/'.($argv[2] ?? 'pallet-town');
if (!is_dir($output)) mkdir($output, 0777, true);
$layout = json_decode(file_get_contents($source.'/layout.json'), true, flags: JSON_THROW_ON_ERROR);
$map = imagecreatetruecolor($layout['width'] * 16, $layout['height'] * 16);
imagefill($map, 0, 0, imagecolorallocate($map, 0, 0, 0));
$primary = imagecreatefrompng($source.'/general/tiles.png');
$secondary = imagecreatefrompng($source.'/pallet_town/tiles.png');
$palettes = [];
for ($p = 0; $p < 16; $p++) {
    $set = $p < 7 ? 'general' : 'pallet_town';
    $path = $source.'/'.$set.'/palettes/'.sprintf('%02d.pal', $p);
    $lines = file_exists($path) ? file($path, FILE_IGNORE_NEW_LINES) : [];
    for ($c = 0; $c < 16; $c++) {
        $rgb = isset($lines[$c + 3]) ? array_map('intval', preg_split('/\s+/', trim($lines[$c + 3]))) : [0, 0, 0];
        $palettes[$p][$c] = imagecolorallocate($map, ...$rgb);
    }
}
$metatiles = [unpack('v*', file_get_contents($source.'/general/metatiles.bin')), unpack('v*', file_get_contents($source.'/pallet_town/metatiles.bin'))];
$blocks = array_values(unpack('v*', file_get_contents($source.'/map.bin')));
if (count($blocks) !== $layout['width'] * $layout['height']) throw new RuntimeException('Unexpected map size');
$collision = [];
$tiles = [];
foreach ($blocks as $index => $block) {
    $x = $index % $layout['width'];
    $y = intdiv($index, $layout['width']);
    $id = $block & 1023;
    $set = $id < 640 ? 0 : 1;
    $localId = $set ? $id - 640 : $id;
    for ($part = 0; $part < 8; $part++) {
        $reference = $metatiles[$set][$localId * 8 + $part + 1];
        $tile = $reference & 1023;
        $image = $tile < 640 ? $primary : $secondary;
        $tile = $tile < 640 ? $tile : $tile - 640;
        $columns = intdiv(imagesx($image), 8);
        $palette = ($reference >> 12) & 15;
        $flipX = ($reference & 1024) !== 0;
        $flipY = ($reference & 2048) !== 0;
        for ($py = 0; $py < 8; $py++) for ($px = 0; $px < 8; $px++) {
            $sourceX = ($tile % $columns) * 8 + ($flipX ? 7 - $px : $px);
            $sourceY = intdiv($tile, $columns) * 8 + ($flipY ? 7 - $py : $py);
            $color = imagecolorat($image, $sourceX, $sourceY) & 15;
            if ($color !== 0) imagesetpixel($map, $x * 16 + ($part % 2) * 8 + $px, $y * 16 + (intdiv($part % 4, 2)) * 8 + $py, $palettes[$palette][$color]);
        }
    }
    $collisionBits = ($block >> 10) & 3;
    $elevation = ($block >> 12) & 15;
    // This demo walks on land only. Doors have no interior destination yet.
    $collision[] = $collisionBits !== 0 || $elevation === 1;
    $tiles[] = ['id' => $id, 'collision' => $collisionBits, 'elevation' => $elevation];
}
$events = json_decode(file_get_contents($source.'/map-events.json'), true, flags: JSON_THROW_ON_ERROR);
foreach ($events['warp_events'] as $warp) $collision[$warp['y'] * $layout['width'] + $warp['x']] = true;
imagepng($map, $output.'/map.png');
$data = ['name' => $argv[3] ?? 'Pallet Town', 'width' => $layout['width'], 'height' => $layout['height'], 'tileSize' => 16, 'spawn' => isset($argv[2]) ? ['x' => 6, 'y' => 6] : ['x' => 8, 'y' => 9], 'blocked' => $collision, 'tiles' => $tiles, 'source' => 'pret/pokefirered', 'sourceCommit' => '037335f4c725d7c9aecdac87066f2002b4bd7e14'];
if ($collision[$data['spawn']['y'] * $layout['width'] + $data['spawn']['x']]) throw new RuntimeException('Spawn blocked');
file_put_contents($output.'/map.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");
echo 'Pallet Town: '.$layout['width'].'x'.$layout['height'].' tiles; '.count(array_filter($collision))." blocked tiles\n";
