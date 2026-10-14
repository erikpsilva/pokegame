# Rota 1 nas duas demos

Saia pelo caminho norte da cidade usando WASD ou setas. A passagem para a Rota 1 é automática; volte pela passagem sul da rota para retornar à cidade. Pikachu acompanha a mudança de mapa, chegando em uma célula caminhável atrás do protagonista. As conexões das casas e escadas continuam ativas.

## FireRed

Mapa original `Route1`, grade 24x40, renderizado com o mesmo pipeline de Pallet Town. Fonte: https://github.com/pret/pokefirered, commit `037335f4c725d7c9aecdac87066f2002b4bd7e14`.

Dados preservados em `resources/game-source/firered-route1/`: `data/layouts/Route1/map.bin`, entrada Route1 de `layouts.json`, eventos e tilesets General/PalletTown. A conexão original tem deslocamento horizontal zero: colunas 12 e 13 ligam as cidades e a rota. Não foi alterada a ROM local.

## Black/White

Trecho terrestre leste da Rota 1 de Unova, ligado a Nuvema Town. O mapa é uma renderização da Rota 1 no outono, preservada em `resources/game-source/unova-route1/original-map.png`.

- Origem: https://bulbapedia.bulbagarden.net/wiki/File:Unova_Route_1_Autumn_BW.png
- Imagem: https://archives.bulbagarden.net/media/upload/e/e7/Unova_Route_1_Autumn_BW.png
- Contribuição da imagem: Gabo 2oo, com transparência creditada a Adil na página de origem.
- Gráficos originais: Pokémon / Nintendo / Game Freak / Creatures.
- Download: 2026-10-14. SHA-256 original registrado no JSON.

O recorte em resolução nativa é x=736, y=0, largura=288, altura=1008. Esta demo usa grade de 18x63 e colisões configuradas manualmente sobre os caminhos e a grama. Não se afirma que as colisões foram extraídas da ROM. Áreas marítimas e o trecho oeste dependente de Surf não foram incluídos. A rota mantém a escala de 16 pixels por célula, igual a Nuvema Town.

## Reproduzir

```powershell
C:\xampp\php\php.exe scripts/extract-pallet-town.php resources/game-source/firered-route1 firered-route1 "Rota 1 - Kanto"
C:\xampp\php\php.exe scripts/prepare-route1.php
node --experimental-strip-types --test tests/pallet-movement.test.mjs tests/house-transitions.test.mjs
```

O preparador é idempotente: substitui somente conexões da rota, preservando as casas. `prepare-house-transitions.php` também o chama após reconstruir os interiores, se os assets da rota estiverem presentes.

Dez testes aprovados: destinos válidos, chegadas distintas para os personagens, portas e saídas acessíveis, exploração de sul a norte das duas rotas e retorno à cidade. Ida, caminhada e volta foram validadas no navegador nos dois exemplos. Capturas em `storage/app/route1-firered-preview.png` e `storage/app/route1-black-white-preview.png`.

O norte das rotas ainda não conecta à próxima cidade; esta etapa conecta apenas a cidade inicial e a Rota 1.
