<?php

// Run from any directory: C:\xampp\php\php.exe scripts/audit-pokemon-sprites.php
$root = dirname(__DIR__);
$folder = $root.'/public/game/sprites/pokemon/overworld';
$sourceCommit = 'd430fb553df98ccde5f9f90ece78e36b07d8083c';
$sources = [];
foreach (['gen8', 'hisui'] as $pack) {
    $entries = json_decode(file_get_contents($root.'/docs/assets/pokemon-overworld-'.$pack.'-tree.json'), true, flags: JSON_THROW_ON_ERROR);
    foreach ($entries as $entry) {
        $sources[basename($entry['path'])] = ['sha' => $entry['sha'], 'path' => ($pack === 'gen8' ? 'Gen 8/' : 'Gen 9/').$entry['path']];
    }
}
$species = [];
$csv = fopen($root.'/docs/assets/pokemon-species.csv', 'r');
$header = fgetcsv($csv, escape: '');
while (($row = fgetcsv($csv, escape: '')) !== false) {
    $record = array_combine($header, $row);
    if ((int) $record['id'] <= 905) {
        $species[(int) $record['id']] = ['name' => $record['identifier'], 'generation' => (int) $record['generation_id']];
    }
}
fclose($csv);
$errors = [];
$items = [];
$unchangingRows = [];
foreach (glob($folder.'/*.png') as $file) {
    $name = basename($file);
    $bytes = file_get_contents($file);
    $source = $sources[$name] ?? null;
    if (!$source || sha1('blob '.strlen($bytes)."\0".$bytes) !== $source['sha']) {
        $errors[] = 'Source hash mismatch: '.$name;
        continue;
    }
    $image = @imagecreatefrompng($file);
    if (!$image) {
        $errors[] = 'Invalid PNG: '.$name;
        continue;
    }
    $width = imagesx($image);
    $height = imagesy($image);
    if ($width % 4 || $height % 4) {
        $errors[] = 'Invalid 4x4 sheet: '.$name;
        continue;
    }
    $cellWidth = intdiv($width, 4);
    $cellHeight = intdiv($height, 4);
    foreach (['down', 'left', 'right', 'up'] as $row => $direction) {
        $hashes = [];
        for ($column = 0; $column < 4; $column++) {
            $pixels = '';
            $visible = 0;
            for ($y = 0; $y < $cellHeight; $y++) {
                for ($x = 0; $x < $cellWidth; $x++) {
                    $color = imagecolorsforindex($image, imagecolorat($image, $column * $cellWidth + $x, $row * $cellHeight + $y));
                    $pixels .= pack('C4', $color['red'], $color['green'], $color['blue'], $color['alpha']);
                    if ($color['alpha'] < 127) {
                        $visible++;
                    }
                }
            }
            if (!$visible) {
                $errors[] = 'Empty frame: '.$name.' '.$direction.' '.$column;
            }
            $hashes[] = sha1($pixels);
        }
        if (count(array_unique($hashes)) === 1) {
            $unchangingRows[] = $name.' '.$direction;
        }
    }
    imagedestroy($image);
    $id = (int) substr($name, 0, 4);
    $items[] = ['file' => 'overworld/'.$name, 'id' => $id, ...$species[$id], 'variant' => substr(pathinfo($name, PATHINFO_FILENAME), 4) ?: 'regular', 'width' => $width, 'height' => $height, 'frameWidth' => $cellWidth, 'frameHeight' => $cellHeight, 'sha256' => hash('sha256', $bytes), 'sourcePath' => $source['path']];
}
$generations = [];
foreach ($species as $id => $record) {
    if (!is_file($folder.'/'.sprintf('%04d.png', $id))) {
        $errors[] = 'Missing base species: '.$id;
    }
    $gen = $record['generation'];
    $generations[$gen] = ($generations[$gen] ?? 0) + 1;
}
$manifest = ['source' => 'https://github.com/PokemonWorkshop/GameDataPacks', 'sourceCommit' => $sourceCommit, 'layout' => ['columns' => 4, 'rows' => 4, 'directionsByRow' => ['down', 'left', 'right', 'up']], 'speciesCount' => count($species), 'filesCount' => count($items), 'speciesByGeneration' => $generations, 'errors' => $errors, 'unchangingAnimationRows' => $unchangingRows, 'sprites' => $items];
file_put_contents($root.'/public/game/sprites/pokemon/manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n");
echo json_encode(['species' => count($species), 'files' => count($items), 'generations' => $generations, 'errors' => $errors, 'unchangingRows' => $unchangingRows], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)."\n";
exit($errors ? 1 : 0);
