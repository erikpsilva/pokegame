# Pokémon andando no mapa — gerações 1 a 8

## Arquivos

Spritesheets PNG originais, sem redimensionamento, em `public/game/sprites/pokemon/overworld/`. A pasta inclui espécies base, shiny, diferenças de sexo e formas alternativas disponíveis na fonte. Não se presume que todas as formas alternativas estejam cobertas.

Fonte: https://github.com/PokemonWorkshop/GameDataPacks

Commit fixado: `d430fb553df98ccde5f9f90ece78e36b07d8083c`.

- IDs 0001–0898: `Gen 8/sword-shield/graphics/characters`.
- IDs 0899–0905: complemento de Hisui em `Gen 9/scarlet-violet/graphics/characters`. Apesar de estarem no pacote cumulativo Gen 9, essas espécies pertencem à geração 8.
- Nomes e gerações: CSV do PokeAPI, https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_species.csv, baixado em 2026-10-14.

## Como ler

Cada PNG é uma grade de 4 colunas por 4 linhas:

| Linha, começando em zero | Direção |
| --- | --- |
| 0 | Baixo |
| 1 | Esquerda |
| 2 | Direita |
| 3 | Cima |

As colunas são os quatro quadros do ciclo. As dimensões variam entre arquivos; use `frameWidth` e `frameHeight` do `public/game/sprites/pokemon/manifest.json`. Exemplo: `0001.png` identifica Bulbasaur normal; `0001s.png` é shiny. Preserve os sufixos originais; o manifesto registra variantes e caminhos de origem.

## Auditoria

Execute `C:\xampp\php\php.exe scripts/audit-pokemon-sprites.php` na raiz. O script verifica:

- Integridade de cada download comparando o hash de objeto Git com a origem.
- Decodificação PNG, grade 4x4 e presença de pixels em cada quadro.
- Presença da versão base de cada espécie dos IDs 1–905.
- Linhas sem mudança de pixels entre os quadros, registradas como `unchangingAnimationRows`; uma animação sutil ou estática não é inventada nem corrigida automaticamente.

O manifesto lista arquivos, espécies, gerações, dimensões, hashes SHA-256 e resultados. Essa verificação estrutural não equivale a uma revisão artística individual de todas as animações.

## Créditos e condições da fonte

O README original está preservado em `pokemon-overworld-source-readme.md`, com a lista completa de colaboradores. A licença apontada pelo repositório está em `pokemon-studio-license.md`. Não se atribui a propriedade dos personagens Pokémon ao projeto Pokegame.

Créditos dos overworlds conforme o README da fonte:

- Gerações 1–5: MissingLukey, help-14, Kymoyonian, cSc-A7X, 2and2makes5, Pokegirl4ever, Fernandojl, Silver-Skies, TyranitarDark, Getsuei-H, Kid1513, Milomilotic11, Kyt666, kdiamo11, Chocosrawlooid, Syledude, Gallanty, Gizamimi-Pichu, Zyon17, LarryTurbo, spritesstealer.
- Geração 6: princess-pheonix, LunarDusk, Wolfang62, TintjeMadelintje101, piphybuilder88.
- Geração 7: Larry Turbo, princess-pheonix.
- Geração 8: SageDeoxys, Wolfang62, LarryTurbo, tammyclaydon.
- Hisui: Boonzeet, DarkusShadow, princess-phoenix, Ezeart, WolfPP.
- Compilação Gen 8: Golisopod User, UberDunsparce.
- Adaptação dos recursos para Pokémon Studio: Aelysya.

Somente os assets e a documentação foram adicionados; nenhum plugin Ruby, sistema de movimento ou mapa foi instalado.
