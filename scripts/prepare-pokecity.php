<?php
// Deterministic extraction of supplied game art; original files are preserved.
$root=dirname(__DIR__);
$sourceDir=$root.'/resources/game-source/pokecity';
$out=$root.'/public/game/maps/pokecity';
@mkdir($sourceDir,0777,true);@mkdir($out,0777,true);
$desktop='C:/Users/erikn/OneDrive/Área de Trabalho/';
$inputs=['map.png'=>'Mapa de Vila Pokémon PokeCity.png','movement-reference.png'=>'253b3064-4819-4f3e-ac42-949215135b21.png','red-reference.png'=>'a0624a54-5a63-4181-aad4-7ea7207649c1.png'];
foreach($inputs as $name=>$file)if(!file_exists($sourceDir.'/'.$name)){if(!copy($desktop.$file,$sourceDir.'/'.$name))throw new RuntimeException('Missing input '.$file);}
copy($sourceDir.'/map.png',$out.'/map.png');
$mask=imagecreatetruecolor(1672,941);$white=imagecolorallocate($mask,255,255,255);
// Walkable footprints follow image 2, aligned to the actual roads in image 1.
$paths=[
 [45,365,1264,420],[630,400,681,741],[931,400,977,741],[630,688,1356,746],
 [738,317,853,420],[763,737,849,897],[215,875,1090,914],[226,782,301,895],
 [1348,703,1584,764],[1584,672,1616,802],
 [1171,329,1247,371],[1164,632,1225,694],[171,318,231,370],[423,303,479,371],
 [350,144,376,368],[367,111,564,139],[642,119,669,368],[641,107,738,139],
 [737,90,855,142],[740,0,852,100],[855,107,961,141],[1029,109,1069,371],
 [1063,144,1107,188],[1299,147,1341,451],[1263,349,1323,458],
 [449,681,631,831],[467,647,632,689],
];
foreach($paths as [$x1,$y1,$x2,$y2])imagefilledrectangle($mask,$x1,$y1,$x2,$y2,$white);
// Lamps, bins, hedges and the tree inside the small western lawn remain solid.
foreach([[324,280,355,357],[354,269,387,335],[565,282,599,359],[668,411,696,488],[891,411,919,487],[995,282,1023,361],[684,742,744,826],[875,742,915,827],[451,682,492,732],[447,717,509,802],[544,745,634,832],[512,590,589,642],[590,603,622,675],[1023,599,1068,658],[1338,641,1375,703],[1558,637,1598,704]] as [$x1,$y1,$x2,$y2])imagefilledrectangle($mask,$x1,$y1,$x2,$y2,0);
$tile=16;$width=(int)ceil(1672/$tile);$height=(int)ceil(941/$tile);$blocked=[];
for($y=0;$y<$height;$y++)for($x=0;$x<$width;$x++){
    $walk=true;
    // Test the feet footprint, not just a single point at an obstacle's edge.
    foreach([[-4,-3],[4,-3],[-4,3],[4,3]] as [$dx,$dy]){
        $px=$x*$tile+8+$dx;$py=$y*$tile+10+$dy;
        if($px<0||$py<0||$px>=1672||$py>=941||imagecolorat($mask,$px,$py)===0)$walk=false;
    }
    $blocked[]=!$walk;
}
imagepng($mask,$out.'/walkable-mask.png');
file_put_contents($out.'/map.json',json_encode(['name'=>'PokeCity','width'=>$width,'height'=>$height,'tileSize'=>16,'spawn'=>['x'=>49,'y'=>25],'blocked'=>$blocked],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));

// Extract twenty frames without repainting them. Flood only the connected dark
// backdrop from crop edges, preserving the enclosed dark pixels of the artwork.
$reference=imagecreatefrompng($sourceDir.'/red-reference.png');
$sheet=imagecreatetruecolor(160*5,240*4);imagealphablending($sheet,false);imagesavealpha($sheet,true);
$transparent=imagecolorallocatealpha($sheet,0,0,0,127);imagefill($sheet,0,0,$transparent);
$tops=[22,260,510,752];$bottoms=[229,472,712,958];
foreach($tops as $row=>$top)for($col=0;$col<5;$col++){
    $left=530+$col*180;$w=150;$h=$bottoms[$row]-$top+1;
    $crop=imagecreatetruecolor($w,$h);imagealphablending($crop,false);imagesavealpha($crop,true);imagecopy($crop,$reference,0,0,$left,$top,$w,$h);
    $visited=array_fill(0,$w*$h,false);$queue=new SplQueue();
    for($x=0;$x<$w;$x++){ $queue->enqueue([$x,0]);$queue->enqueue([$x,$h-1]); }
    for($y=0;$y<$h;$y++){ $queue->enqueue([0,$y]);$queue->enqueue([$w-1,$y]); }
    while(!$queue->isEmpty()){
        [$x,$y]=$queue->dequeue();if($x<0||$y<0||$x>=$w||$y>=$h)continue;
        $i=$y*$w+$x;if($visited[$i])continue;$visited[$i]=true;
        $c=imagecolorat($crop,$x,$y);$r=($c>>16)&255;$g=($c>>8)&255;$b=$c&255;
        if(max($r,$g,$b)>26||max($r,$g,$b)-min($r,$g,$b)>12)continue;
        imagesetpixel($crop,$x,$y,0x7f000000);
        foreach([[1,0],[-1,0],[0,1],[0,-1]] as [$dx,$dy])$queue->enqueue([$x+$dx,$y+$dy]);
    }
    // Fixed source anchors preserve the supplied walk cycle rather than stretching poses.
    imagecopy($sheet,$crop,$col*160+5,$row*240+232-$h,0,0,$w,$h);
}
imagepng($sheet,$root.'/public/game/sprites/trainers/red-pokecity.png');
echo "PokeCity prepared: {$width}x{$height} movement grid, 20 Red frames.\n";
