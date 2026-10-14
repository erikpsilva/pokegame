# Protagonista e Pikachu seguidor

As demos FireRed e Black/White compartilham o protagonista Red. Fonte da sprite: `graphics/object_events/pics/people/red_normal.png` do projeto https://github.com/pret/pokefirered, commit `037335f4c725d7c9aecdac87066f2002b4bd7e14`. Créditos: gráficos originais Pokémon / Nintendo / Game Freak / Creatures e documentação pret.

O original está preservado em `resources/game-source/trainer/red-normal.png`. `scripts/prepare-trainer.php` organiza as sequências documentadas em `src/data/object_events/object_event_anims.h` em uma grade 4x4, com a direção direita espelhada conforme o jogo. Saída: `public/game/sprites/trainers/red-walk.png`.

A altura visível de referência é de 19 pixels no protagonista e 18 no Pikachu. A escala do protagonista é `0.4225 * 18 / 19 * 1.3`, resultando em altura visual 30% maior. A escala do Pikachu continua em 0.4225. O zoom dos mapas passou de 0.88 para 0.704, uma redução de 20%.

WASD, setas e botões controlam somente Red. Em cada passo válido, Pikachu se desloca para a célula anterior de Red. Os dois interpolam o movimento juntos; bloqueios não avançam nenhum dos dois. A direção do seguidor é calculada pelo seu próprio deslocamento, incluindo curvas. O render ordena os personagens pela posição vertical. Recomeçar restaura ambos em células caminháveis.
