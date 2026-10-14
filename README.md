# Pokegame

Base local de um jogo de navegador: Laravel 12, PHP 8.4, React 19, TypeScript, Inertia 2, Tailwind CSS e Vite. Starter oficial Laravel React, com cadastro, login e configurações de conta. Sprites, mapas e mecânicas serão definidos nas próximas etapas.

## Abrir no XAMPP

Inicie Apache e MySQL no painel do XAMPP e abra http://localhost/pokegame/public/ (http://localhost/pokegame/ também redireciona). Os assets estão compilados. O XAMPP usa MariaDB, compatível com a conexão `mysql` do Laravel.

Banco exclusivo: `pokegame_db`. Credenciais locais estão no `.env`, ignorado pelo Git. Nenhuma conta foi pré-criada. Emails de desenvolvimento são gravados em `storage/logs/laravel.log`.

## Instalar

Requisitos: PHP 8.3 ou 8.4, Composer, Node.js 22.12+ ou 24 e MySQL/MariaDB. No PowerShell, dentro do projeto:

```powershell
composer install
Copy-Item .env.example .env
```

Crie o banco `pokegame_db` com charset `utf8mb4` no phpMyAdmin. Ajuste as variáveis `DB_*` e `APP_URL` no `.env` conforme sua máquina. Depois:

```powershell
php artisan key:generate
php artisan migrate
npm.cmd ci
npm.cmd run build
```

Neste host, o PHP está em `C:\xampp\php\php.exe`. No Apache, use `public` como raiz pública; o `.htaccess` da raiz protege os demais arquivos no acesso por subpasta. Se renomear a pasta local, ajuste também `RewriteBase` no `.htaccess`.

## Desenvolver

Com Apache/MySQL ligados, execute `npm.cmd run dev` e abra o endereço do XAMPP. O Vite atualiza React/CSS ao salvar. Ao encerrar o Vite, execute `npm.cmd run build` para atualizar os assets compilados.

Alternativamente, `composer run dev` inicia Laravel em http://127.0.0.1:8000, Vite e o worker de filas. Configure `APP_URL=http://127.0.0.1:8000` nesse modo. O script foi ajustado para Windows, sem o Pail que exige PCNTL.

## Organização

- `resources/js/pages`: telas React.
- `resources/js/components`: componentes compartilhados.
- `resources/js/game`: futura lógica visual.
- `public/game/sprites` e `public/game/maps`: futuros assets.
- `routes/web.php`: rotas e páginas Inertia.
- `app`: regras e serviços no servidor.
- `database/migrations`: evolução do banco.

As sprites de Pokémon andando das gerações 1–8 estão em `public/game/sprites/pokemon/overworld/`. Consulte [origem, créditos e formato](docs/assets/pokemon-overworld.md). Nenhuma mecânica de jogo foi implementada.

## Verificar

```powershell
php artisan test --compact
composer check-platform-reqs
npm.cmd run typecheck
npm.cmd run build
```

Os testes do starter usam SQLite em memória, separado do banco local. As migrations e o acesso HTTP local também são verificados com MariaDB.
