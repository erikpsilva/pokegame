<?php

$root = dirname(__DIR__);
$maps = $root.'/public/game/maps';
function readMap(string $id): array { global $maps; return json_decode(file_get_contents($maps.'/'.$id.'/map.json'), true, flags: JSON_THROW_ON_ERROR); }
function saveMap(string $id, array $data): void { global $maps; file_put_contents($maps.'/'.$id.'/map.json', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n"); }
function warp(array &$map, int $x, int $y, string $to, int $arrivalX, int $arrivalY, string $direction, string $facing): void {
    $map['blocked'][$y * $map['width'] + $x] = false;
    $map['warps'][] = ['x' => $x, 'y' => $y, 'to' => $to, 'arrival' => ['x' => $arrivalX, 'y' => $arrivalY], 'direction' => $direction, 'facing' => $facing];
}
// Interior room images and solid furniture for the Black/White demo, adapted from local FireRed assets.
$names = ['nuvema-home' => 'Casa do protagonista · térreo', 'nuvema-bianca' => 'Casa de Bianca', 'nuvema-cheren' => 'Casa de Cheren', 'nuvema-bedroom' => 'Quarto do protagonista'];
foreach ($names as $id => $name) {
    $width = 16; $height = 12;
    $image = imagecreatetruecolor($width * 16, $height * 16);
    $floor = imagecolorallocate($image, 190, 155, 111); $seam = imagecolorallocate($image, 159, 128, 91);
    $wall = imagecolorallocate($image, 229, 232, 221); $border = imagecolorallocate($image, 92, 106, 119);
    imagefill($image, 0, 0, $floor);
    $blocked = array_fill(0, $width * $height, false);
    for ($y = 0; $y < $height; $y++) for ($x = 0; $x < $width; $x++) {
        imageline($image, $x * 16, $y * 16, $x * 16 + 15, $y * 16, $seam);
        imageline($image, $x * 16 + ($y % 2 ? 8 : 0), $y * 16, $x * 16 + ($y % 2 ? 8 : 0), $y * 16 + 15, $seam);
        if ($x === 0 || $x === 15 || $y < 3 || $y === 11) {
            $blocked[$y * $width + $x] = true;
            imagefilledrectangle($image, $x * 16, $y * 16, $x * 16 + 15, $y * 16 + 15, $y < 3 ? $wall : $border);
        }
    }
    $house = imagecreatefrompng($maps.'/pallet-home/map.png');
    $bedroom = imagecreatefrompng($maps.'/pallet-bedroom/map.png');
    $place = function($source, $sx, $sy, $w, $h, $tx, $ty) use ($image, &$blocked, $width) {
        imagecopy($image, $source, $tx * 16, $ty * 16, $sx, $sy, $w, $h);
        for ($y = $ty; $y < $ty + (int) ceil($h / 16); $y++) for ($x = $tx; $x < $tx + (int) ceil($w / 16); $x++) $blocked[$y * $width + $x] = true;
    };
    // Kitchen, window and bookshelf, with clear circulation around the central furniture.
    $place($house, 16, 8, 48, 32, 1, 1);
    $place($house, 112, 8, 32, 16, 7, 1);
    $place($bedroom, 64, 8, 32, 32, 12, 1);
    if ($id === 'nuvema-bedroom') {
        $place($bedroom, 24, 80, 32, 48, 2, 5);
        $place($bedroom, 64, 64, 64, 48, 7, 5);
    } else {
        $place($house, 64, 48, 96, 64, 5, 4);
        if ($id === 'nuvema-bianca') $place($bedroom, 24, 80, 32, 48, 2, 6);
        if ($id === 'nuvema-cheren') $place($bedroom, 64, 8, 32, 32, 12, 5);
    }
    // Entrance mat and stairs are interactive walkable cells.
    imagefilledrectangle($image, 112, 160, 127, 175, imagecolorallocate($image, 165, 58, 62));
    imagerectangle($image, 113, 161, 126, 174, imagecolorallocate($image, 245, 229, 193));
    if (in_array($id, ['nuvema-home', 'nuvema-bedroom'])) {
        imagefilledrectangle($image, 208, 48, 223, 63, $border);
        for ($s = 0; $s < 4; $s++) imageline($image, 209, 50 + $s * 3, 222, 50 + $s * 3, $wall);
    }
    if (!is_dir($maps.'/'.$id)) mkdir($maps.'/'.$id, 0777, true);
    imagepng($image, $maps.'/'.$id.'/map.png');
    saveMap($id, ['name' => $name, 'width' => $width, 'height' => $height, 'tileSize' => 16, 'spawn' => ['x' => 7, 'y' => 9], 'blocked' => $blocked, 'interior' => true, 'adaptedInterior' => true, 'source' => 'Demo recreation using local FireRed furniture; not original DS interiors']);
}
// Lab uses the original Oak room as an explicitly adapted lab scene.
if (!is_dir($maps.'/nuvema-lab')) mkdir($maps.'/nuvema-lab', 0777, true);
copy($maps.'/pallet-lab/map.png', $maps.'/nuvema-lab/map.png');
$lab = readMap('pallet-lab'); $lab['name'] = 'Laboratório de Juniper · adaptação'; $lab['adaptedInterior'] = true; $lab['interior'] = true; $lab['warps'] = [];
saveMap('nuvema-lab', $lab);

$ids = ['pallet-town', 'pallet-home', 'pallet-bedroom', 'pallet-rival', 'pallet-lab', 'nuvema-town', 'nuvema-home', 'nuvema-bianca', 'nuvema-cheren', 'nuvema-bedroom', 'nuvema-lab'];
$data = [];
foreach ($ids as $id) { $data[$id] = readMap($id); $data[$id]['warps'] = []; }
$labels = ['pallet-home' => 'Casa do protagonista · térreo', 'pallet-bedroom' => 'Quarto do protagonista', 'pallet-rival' => 'Casa do rival', 'pallet-lab' => 'Laboratório do Professor Oak'];
foreach ($labels as $id => $name) { $data[$id]['name'] = $name; $data[$id]['interior'] = true; }
$links = [
    ['pallet-town',6,7,'pallet-home',4,7,6,8,4,8],
    ['pallet-town',15,7,'pallet-rival',4,7,15,8,4,8],
    ['pallet-town',16,13,'pallet-lab',6,11,16,14,6,12],
    ['nuvema-town',14,15,'nuvema-home',7,9,14,17,7,10],
    ['nuvema-town',9,24,'nuvema-bianca',7,9,9,26,7,10],
    ['nuvema-town',20,24,'nuvema-cheren',7,9,20,26,7,10],
    ['nuvema-town',9,7,'nuvema-lab',6,11,9,9,6,12],
];
foreach ($links as [$outside,$doorX,$doorY,$inside,$insideX,$insideY,$returnX,$returnY,$exitX,$exitY]) {
    warp($data[$outside], $doorX,$doorY,$inside,$insideX,$insideY,'up','up');
    // Open the full approach from the street, including Nuvema's perspective offsets.
    for ($y = $doorY; $y <= $returnY; $y++) $data[$outside]['blocked'][$y * $data[$outside]['width'] + $doorX] = false;
    warp($data[$inside],$exitX,$exitY,$outside,$returnX,$returnY,'down','down');
    $data[$inside]['spawn'] = ['x' => $insideX, 'y' => $insideY];
    $data[$inside]['blocked'][$insideY * $data[$inside]['width'] + $insideX] = false;
}
warp($data['pallet-home'],10,2,'pallet-bedroom',10,3,'right','down');
warp($data['pallet-bedroom'],10,2,'pallet-home',9,2,'up','left');
warp($data['nuvema-home'],13,3,'nuvema-bedroom',12,3,'right','left');
warp($data['nuvema-bedroom'],13,3,'nuvema-home',12,3,'right','left');
// All original exit mats lead out, not only the center cell.
foreach ([['pallet-home',5,8,'pallet-town',6,8],['pallet-rival',5,8,'pallet-town',15,8],['pallet-rival',3,8,'pallet-town',15,8],['pallet-lab',5,12,'pallet-town',16,14],['pallet-lab',7,12,'pallet-town',16,14],['nuvema-lab',5,12,'nuvema-town',9,9],['nuvema-lab',7,12,'nuvema-town',9,9]] as [$id,$x,$y,$to,$ax,$ay]) warp($data[$id],$x,$y,$to,$ax,$ay,'down','down');
foreach ($data as $id => $map) saveMap($id, $map);
echo count($data)." scenes with connected entrances, exits and stairs\n";

// Reconnect Route 1 after rebuilding the house graph, when its assets are present.
if (is_file($maps.'/firered-route1/map.json') && is_file($root.'/resources/game-source/unova-route1/original-map.png')) {
    require __DIR__.'/prepare-route1.php';
}
