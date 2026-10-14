# Pallet Town — demo 01

Abra http://localhost/pokegame/public/demo/pallet-town ou use o botão da página inicial. Controle Pikachu com W/A/S/D ou setas; no celular, mantenha os botões direcionais pressionados. Recomeçar restaura a posição inicial.

## Origem do mapa

Dados originais de FireRed preservados de https://github.com/pret/pokefirered, commit `037335f4c725d7c9aecdac87066f2002b4bd7e14`:

- `data/layouts/PalletTown/map.bin` e entrada PalletTown de `data/layouts/layouts.json`.
- `data/maps/PalletTown/map.json`.
- `data/tilesets/primary/general` e `data/tilesets/secondary/pallet_town`.

Somente os dados necessários estão em `resources/game-source/firered/`. Não foi copiada nem alterada a ROM local. O script próprio `scripts/extract-pallet-town.php` compõe os tiles 8x8 em metatiles 16x16 com paletas, espelhamento e duas camadas. A referência técnica consultada foi https://github.com/blixxurd/kanto/blob/main/scripts/01_render_metatile_atlases.py.

Saída: `public/game/maps/pallet-town/map.png` (384x320) e `map.json` (24x20 células). Pokémon e os gráficos originais pertencem aos respectivos titulares; pret fornece o trabalho de documentação e engenharia reversa. Créditos das sprites em `pokemon-overworld.md`.

## Comportamento da demo

- Pikachu usa `public/game/sprites/pokemon/overworld/0025.png`, quatro linhas direcionais e quatro quadros.
- Movimento em grade, com interpolação de 160 ms por célula e animação enquanto anda.
- Colisões leem os bits do mapa original; água de elevação 1 é bloqueada; portas conectadas são abertas pelo preparador de transições.
- Bordas não transferem para outras rotas. Casas, laboratório e quarto estão disponíveis; veja house-interiors.md. Não há NPCs, surfe, batalhas ou persistência.
- Perda de foco limpa teclas pressionadas; desmontagem da tela encerra o loop e listeners.

## Reproduzir e testar

```powershell
C:\xampp\php\php.exe scripts/extract-pallet-town.php
node --experimental-strip-types --test tests/pallet-movement.test.mjs
C:\xampp\php\php.exe artisan test --compact
npm.cmd run typecheck
npm.cmd run build
```

As colisões são para uma demo local: a posição ainda não é validada pelo servidor para um jogo multiplayer.

Validação local em 2026-10-14: 4 testes de movimento aprovados, 27 testes Laravel aprovados, TypeScript e build aprovados. No navegador, W/A/S/D alteraram a posição corretamente, uma casa bloqueou o movimento e Recomeçar restaurou (8,9). Layout conferido em 1366x900, 768x1024, 390x844 e 844x390, sem conteúdo excedendo a largura. Imagem de QA em `storage/app/pallet-demo-preview.png`.
