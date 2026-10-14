# Casas, laboratórios e escadas nas demos

- FireRed: casa do protagonista (térreo e quarto), casa do rival e laboratório do Professor Oak. Interiores renderizados dos layouts originais de `pret/pokefirered`, commit `037335f4c725d7c9aecdac87066f2002b4bd7e14`.
- Black/White: casa do protagonista (térreo e quarto), casas de Bianca e Cheren e laboratório de Juniper. **Recriações adaptadas para a demo, não os interiores originais extraídos de Black/White.** Usam mobiliário local de FireRed e pisos/paredes preparados pelo script; o laboratório usa a planta de Oak como adaptação. A tela identifica estes ambientes como adaptados.

Não foram alteradas as ROMs. Os originais FireRed estão em `resources/game-source/firered-interiors/`. Para cada sala, `general` é o tileset primário Building; `pallet_town` é o secundário GenericBuilding1, GenericBuilding2 ou Lab, nos nomes locais esperados pelo renderizador.

## Uso

Ande em direção à porta com WASD ou setas para entrar. Dentro, caminhe para baixo sobre o tapete da entrada para sair. Atravesse as escadas da casa do protagonista para trocar de andar. Pikachu acompanha as transições e chega em uma célula caminhável atrás do personagem. Recomeçar retorna ao ponto inicial da cidade.

Cada mapa registra `warps`: posição, direção de entrada, destino, chegada e orientação. Apenas um passo concluído pelo protagonista ativa a troca; o seguidor não ativa outra transição. Teclas mantidas são limpas ao trocar de ambiente. Comandos só são aceitos depois de carregar o mapa.

## Reproduzir

```powershell
C:\xampp\php\php.exe scripts/extract-pallet-town.php
C:\xampp\php\php.exe scripts/prepare-nuvema-town.php
C:\xampp\php\php.exe scripts/extract-pallet-town.php resources/game-source/firered-interiors/pallet-home pallet-home "Casa do protagonista"
C:\xampp\php\php.exe scripts/extract-pallet-town.php resources/game-source/firered-interiors/pallet-bedroom pallet-bedroom "Quarto do protagonista"
C:\xampp\php\php.exe scripts/extract-pallet-town.php resources/game-source/firered-interiors/pallet-rival pallet-rival "Casa do rival"
C:\xampp\php\php.exe scripts/extract-pallet-town.php resources/game-source/firered-interiors/pallet-lab pallet-lab "Laboratorio do Professor Oak"
C:\xampp\php\php.exe scripts/prepare-house-transitions.php
node --experimental-strip-types --test tests/pallet-movement.test.mjs tests/house-transitions.test.mjs
```

O preparador de transições deve ser executado por último: abre as portas e conecta os mapas. Os testes verificam portas acessíveis a partir das cidades, chegadas caminháveis, espaço para o seguidor e caminhos de volta de todos os interiores e andares.

Validado no navegador: entrada e saída da casa do protagonista nas duas demos, subida e descida das escadas em FireRed. TypeScript, build e nove testes de movimento/transições aprovados. Capturas: `storage/app/fire-red-interior-preview.png` e `storage/app/black-white-interior-preview.png`.

Créditos gráficos: Pokémon / Nintendo / Game Freak / Creatures; dados e documentação FireRed: https://github.com/pret/pokefirered. As recriações Black/White não representam os layouts exatos da ROM do DS.
