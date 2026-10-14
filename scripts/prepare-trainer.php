<?php

$root = dirname(__DIR__);
$source = imagecreatefrompng($root.'/resources/game-source/trainer/red-normal.png');
$sheet = imagecreatetruecolor(128, 128);
imagealphablending($sheet, false);
imagesavealpha($sheet, true);
imagefill($sheet, 0, 0, imagecolorallocatealpha($sheet, 0, 0, 0, 127));
// FireRed animation sequences; right uses the horizontally flipped left frames.
$rows = [[3, 0, 4, 0], [7, 2, 8, 2], [7, 2, 8, 2], [5, 1, 6, 1]];
foreach ($rows as $row => $frames) foreach ($frames as $column => $frame) {
    for ($y = 3; $y < 32; $y++) for ($x = 0; $x < 16; $x++) {
        $color = imagecolorsforindex($source, imagecolorat($source, $frame * 16 + ($row === 2 ? 15 - $x : $x), $y));
        imagesetpixel($sheet, $column * 32 + 8 + $x, $row * 32 + $y - 3, imagecolorallocatealpha($sheet, $color['red'], $color['green'], $color['blue'], $color['alpha']));
    }
}
imagepng($sheet, $root.'/public/game/sprites/trainers/red-walk.png');
echo "Red walking sheet prepared: four directions, four frames\n";
