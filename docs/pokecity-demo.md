# PokeCity — teste com imagens fornecidas

Demo local: `/demo/pokecity`. O cartão **Exemplo PokeCity** na home abre em outra aba.

- Imagem 1: fundo original, preservado sem redimensionamento (1672 × 941).
- Imagem 2: referência para ruas, entradas, ponte, água e obstáculos. Como os desenhos têm pequenos deslocamentos entre si, as áreas foram alinhadas manualmente ao mapa limpo. A grade usa tiles de 16 pixels e uma pequena margem para os pés nas bordas.
- Imagem 3: vinte quadros extraídos do Red, cinco por direção. O fundo escuro conectado às bordas de cada recorte foi removido, preservando os pixels internos. A folha resultante tem células de 160 × 240, nas linhas baixo, cima, esquerda e direita.
- Pikachu: recurso HGSS já existente em `public/game/sprites/pokemon/overworld/0025.png`. Segue o histórico de passos do Red com distância de três tiles, inclusive nas curvas.

WASD, setas e botões direcionais controlam Red. Árvores, prédios, canteiros e água ficam bloqueados; a ponte pode ser atravessada. Entradas permitem aproximação, mas esta demo não cria interiores nem uma área além da escada.

Fontes preservadas em `resources/game-source/pokecity`. Regeração: `C:\xampp\php\php.exe scripts/prepare-pokecity.php`. O motor das demos anteriores é reutilizado; escala, folha de sprites e distância do seguidor são específicas deste exemplo.
