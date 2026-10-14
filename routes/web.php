<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/demo/pallet-town', fn () => Inertia::render('demo-pallet'))->name('demo.pallet');
Route::get('/demo/pokemon-x', fn () => Inertia::render('demo-pokemon-x'))->name('demo.pokemonx');
Route::get('/demo/pokecity', fn () => Inertia::render('demo-pallet', [
    'mapFolder' => 'pokecity',
    'mapName' => 'PokeCity',
    'customArt' => true,
]))->name('demo.pokecity');

Route::get('/demo/black-white', fn () => Inertia::render('demo-pallet', [
    'mapFolder' => 'nuvema-town',
    'mapName' => 'Nuvema Town',
]))->name('demo.blackwhite');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
