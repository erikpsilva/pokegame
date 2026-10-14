<?php

$routeRoot = dirname(__DIR__);
$routeMaps = $routeRoot.'/public/game/maps';
function routeRead(string $id): array { global $routeMaps; return json_decode(file_get_contents($routeMaps.'/'.$id.'/map.json'), true, flags: JSON_THROW_ON_ERROR); }
function routeSave(string $id, array $map): void { global $routeMaps; file_put_contents($routeMaps.'/'.$id.'/map.json', json_encode($map, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n"); }
function routeLink(array &$map, int $x, int $y, string $to, int $ax, int $ay, string $direction): void {
    $map['blocked'][$y * $map['width'] + $x] = false;
    $map['warps'][] = ['x'=>$x, 'y'=>$y, 'to'=>$to, 'arrival'=>['x'=>$ax, 'y'=>$ay], 'direction'=>$direction, 'facing'=>$direction];
}

// The eastern walking section of the complete rendered Unova Route 1.
// Preserve native pixels and the same 16-pixel world cell scale as Nuvema Town.
$original = $routeRoot.'/resources/game-source/unova-route1/original-map.png';
$source = imagecreatefrompng($original);
if (imagesx($source) !== 1024 || imagesy($source) !== 1544) throw new RuntimeException('Unexpected Unova image size');
$crop = imagecrop($source, ['x'=>736, 'y'=>0, 'width'=>288, 'height'=>1008]);
imagepng($crop, $routeMaps.'/unova-route1/map.png');
$width = 18; $height = 63;
$blocked = array_fill(0,$width*$height,true);
// Coordinates refer to the full source image. Conservative manual demo collisions.
$ground = [
    [848,0,912,160], [768,160,960,240], [848,240,912,272],
    [852,272,916,352], [800,352,912,400],
    [800,400,864,704], [864,400,960,544],
    [768,704,896,816], [816,816,864,1008],
];
for ($y=0;$y<$height;$y++) for ($x=0;$x<$width;$x++) {
    $px=736+$x*16+8; $py=$y*16+8;
    foreach ($ground as [$left,$top,$right,$bottom]) if ($px >= $left && $px < $right && $py >= $top && $py < $bottom) $blocked[$y*$width+$x]=false;
}
// Tree at the bend, signs, and outer edges never become traversable.
foreach ([[800,272,848,352],[808,224,840,256],[872,592,904,624],[872,832,904,864]] as [$left,$top,$right,$bottom]) {
    for ($y=0;$y<$height;$y++) for ($x=0;$x<$width;$x++) {
        $px=736+$x*16+8;$py=$y*16+8;
        if ($px >= $left && $px < $right && $py >= $top && $py < $bottom) $blocked[$y*$width+$x]=true;
    }
}
$unova = ['name'=>'Rota 1 · Unova','width'=>$width,'height'=>$height,'tileSize'=>16,'spawn'=>['x'=>6,'y'=>61], 'blocked'=>$blocked, 'warps'=>[], 'collisionSource'=>'manual demo ground rectangles on rendered map', 'source'=>'https://bulbapedia.bulbagarden.net/wiki/File:Unova_Route_1_Autumn_BW.png', 'imageSource'=>'https://archives.bulbagarden.net/media/upload/e/e7/Unova_Route_1_Autumn_BW.png', 'originalSha256'=>hash_file('sha256',$original), 'crop'=>['x'=>736,'y'=>0,'width'=>288,'height'=>1008]];
$kanto = routeRead('firered-route1');
$kanto['name']='Rota 1 · Kanto';$kanto['spawn']=['x'=>12,'y'=>38];$kanto['warps']=[];
$pallet = routeRead('pallet-town');$nuvema=routeRead('nuvema-town');
// Keep every existing house connection; only replace the route links on reruns.
foreach (['pallet','nuvema'] as $key) {
    $$key['warps']=array_values(array_filter($$key['warps'] ?? [], fn($warp)=>!in_array($warp['to'],['firered-route1','unova-route1'])));
}
foreach ([12,13] as $x) {
    routeLink($pallet,$x,0,'firered-route1',$x,38,'up');
    routeLink($kanto,$x,39,'pallet-town',$x,1,'down');
}
foreach ([19=>6,20=>7] as $townX=>$routeX) {
    routeLink($nuvema,$townX,0,'unova-route1',$routeX,61,'up');
    routeLink($unova,$routeX,62,'nuvema-town',$townX,1,'down');
}
routeSave('pallet-town',$pallet);routeSave('firered-route1',$kanto);
routeSave('nuvema-town',$nuvema);routeSave('unova-route1',$unova);
echo "Route 1 connected in both demos, with return links and existing house doors preserved\n";
