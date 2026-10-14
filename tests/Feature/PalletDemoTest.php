<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PalletDemoTest extends TestCase
{
    public function test_home_is_available_without_login(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->component('welcome'));
    }

    public function test_black_white_demo_selects_the_nuvema_map(): void
    {
        $this->get('/demo/black-white')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('demo-pallet')
            ->where('mapFolder', 'nuvema-town')
            ->where('mapName', 'Nuvema Town'));
    }

    public function test_pallet_demo_is_available_without_login(): void
    {
        $this->get('/demo/pallet-town')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('demo-pallet'));
    }
}
