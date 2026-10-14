# Exemplo Black White — Nuvema Town

URL local: http://localhost/pokegame/public/demo/black-white

Mapa de Nuvema Town no outono, conforme Pokémon Black/White. Nesta demo, o cenário é uma imagem já renderizada, não uma extração do modelo 3D da ROM.

- Página de origem: https://bulbapedia.bulbagarden.net/wiki/File:Nuvema_Town_Autumn_BW.png
- Arquivo original: https://archives.bulbagarden.net/media/upload/5/5b/Nuvema_Town_Autumn_BW.png
- Resolução: 512x576; autor da contribuição atual listado na página: Minibug, 2026-08-10.
- Créditos dos gráficos originais: Pokémon / Nintendo / Game Freak / Creatures; compilação disponível no Bulbagarden Archives. A fonte identifica a imagem como captura ou derivação de um jogo Pokémon.
- Download local: 2026-10-14. SHA-256 registrado no JSON do mapa.

`scripts/prepare-nuvema-town.php` cria uma grade 32x36 com obstáculos definidos manualmente para esta demo. Não se afirma que as colisões foram extraídas da ROM: árvores, edifícios, placas, mar e bordas foram delimitados sobre a imagem, e podem ser refinados em uma etapa futura.

O mesmo componente React e motor de movimento atendem às duas demos. A escala visual é baseada na referência de FireRed (384x320), com zoom 0.88 e spriteScale 0.4225. Assim cada célula de 16 pixels e o Pikachu têm a mesma escala para uma mesma tela, independentemente das dimensões totais do mapa. Este tamanho de sprite é 30% maior que o valor anterior 0.325.

W/A/S/D e setas movimentam o Pikachu em quatro direções; controles de toque, câmera, reinício e tratamento de perda de foco são compartilhados. Há interiores adaptados conectados às casas, conforme house-interiors.md. Não há outras rotas ou eventos de história.
