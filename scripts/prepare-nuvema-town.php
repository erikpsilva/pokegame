<?php

$root = dirname(__DIR__);
$folder = $root.'/public/game/maps/nuvema-town';
$size = getimagesize($folder.'/map.png');
if ($size[0] !== 512 || $size[1] !== 576) throw new RuntimeException('Unexpected source map dimensions');
// Manually mapped obstacle regions on the rendered image, not ROM collision data.
$obstacles = [
    [0, 0, 64, 442], [386, 0, 512, 448], // perimeter trees
    [64, 0, 286, 32], [244, 32, 286, 108], // northern trees
    [78, 20, 208, 140], // Juniper laboratory
    [190, 164, 279, 266], // upper house and hedges
    [103, 306, 194, 405], [272, 306, 365, 410], // lower houses
    [108, 160, 131, 191], [268, 300, 296, 325], // signs
    [96, 370, 112, 398], // post by lower house
    [0, 480, 512, 576], [0, 442, 64, 480], [400, 448, 512, 480], // sea and cliff edge
];
$width = 32;
$height = 36;
$blocked = [];
for ($y = 0; $y < $height; $y++) for ($x = 0; $x < $width; $x++) {
    $px = $x * 16 + 8;
    $py = $y * 16 + 8;
    $solid = false;
    foreach ($obstacles as [$left, $top, $right, $bottom]) {
        if ($px >= $left && $px < $right && $py >= $top && $py < $bottom) $solid = true;
    }
    $blocked[] = $solid;
}
$data = ['name' => 'Nuvema Town', 'width' => $width, 'height' => $height, 'tileSize' => 16, 'spawn' => ['x' => 14, 'y' => 18], 'blocked' => $blocked, 'collisionSource' => 'manual demo obstacles on rendered map', 'source' => 'https://bulbapedia.bulbagarden.net/wiki/File:Nuvema_Town_Autumn_BW.png', 'imageSource' => 'https://archives.bulbagarden.net/media/upload/5/5b/Nuvema_Town_Autumn_BW.png', 'imageSha256' => hash_file('sha256', $folder.'/map.png')];
if ($blocked[18 * $width + 14]) throw new RuntimeException('Blocked spawn');
file_put_contents($folder.'/map.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n");
echo 'Nuvema Town: 32x36 cells, '.count(array_filter($blocked))." blocked\n";
