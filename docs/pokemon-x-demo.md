# Pokémon X: teste local de extração

Rota: `/demo/pokemon-x`, acessível pelo cartão **Exemplo Pokémon X** da home.
A demo usa atualmente Red e Pikachu em sprites sobre o mapa 3D de Vaniville Town. WASD/setas e botões direcionais movem Red; Pikachu segue o histórico do caminho com distância aproximada de 54 unidades. Red usa a folha preparada para PokeCity e Pikachu usa a folha HGSS existente. Os recursos extraídos de Calem continuam preservados para testes futuros, mas não são exibidos. A câmera acompanha Red.

## Origem verificada

ROM fornecida pelo usuário: Pokémon X Europe, produto `CTR-P-EKJA`.
O RomFS está legível (assinatura IVFC), apesar da flag de criptografia do NCCH.
Não é necessário carregar a ROM no navegador. ROM, arquivos GARC, ferramentas e extrações intermediárias ficam fora do Git, em `storage/app/pokemon-x-tools`.

- `a/0/1/2`, zona 0: Vaniville, área 2, matriz 0. Nome confirmado no arquivo de textos 72 de `a/0/7/4`, linha 6.
- `a/0/4/1`, regiões 12–15: geometria, posicionamento dos objetos e tiles originais de movimento. Origem local: X=7920, Z=10080.
- `a/0/1/3`, área 2, seções 1 e 11: texturas dos objetos e cenário.
- `a/0/2/4`, modelos 1, 2, 5 e 10: luminárias, portas e placa.
- `a/0/8/8`, base 398 e peças 397, 400, 404, 409, 411, 419, 424, 430: Calem e roupas.
- `a/0/2/1`, entrada 2, seção 1: pacote de movimentos GF1; clips 0 (repouso) e 2 (locomoção de 14 frames) utilizados na demo.

## Conversão

`scripts/inspect-3ds-rom.mjs` lê o RomFS sem alterar a ROM. `InspectPokemonX.java` extrai e descomprime entradas com a biblioteca GARC do CTRMap-F5. `ExportPokemonX.cs` converte BCH em geometria JSON e texturas PNG usando o leitor Ohana3DS. `pokemon-x-motion.mjs` decodifica GF1 conforme o leitor SPICA. `prepare-pokemon-x.mjs` monta o esqueleto, remapeia juntas por nome e copia somente os recursos usados para `public/game/pokemon-x`.

Fontes das ferramentas: [CTRMap-F5](https://github.com/hdent1232/CTRMap-F5), [Ohana3DS-Transfigured](https://github.com/Taicanium/Ohana3DS-Transfigured) e [SPICA](https://github.com/gdkchan/SPICA). Crédito dos leitores BCH e GF1: gdkchan e colaboradores. O leitor GF1 foi adaptado da implementação Unlicense do SPICA. Os recursos de Pokémon pertencem aos respectivos titulares; a licença das ferramentas não licencia esses recursos.

## Limites deste teste

Renderização com Three.js e materiais básicos, sem reproduzir todos os combinadores, iluminação, animações de materiais e efeitos do Nintendo 3DS. Máscaras de sombras projetadas são omitidas para evitar exibir suas cores de controle. Colisão usa os tiles de movimento originais e altura da geometria, sem executar scripts da ROM. Não há interiores, transições para outras cidades, NPCs, eventos ou batalhas neste exemplo. As demos 2D existentes continuam separadas.

Validação: `node --test tests/pokemon-x-assets.test.mjs`, `npm run typecheck`, `npm run build` e teste visual no navegador.

