# G5 Esportes — site

Site institucional e blog da G5 Esportes (assessoria de corrida, Curitiba/PR),
substituindo o WordPress.com. Next.js 16 + Payload CMS 3 na mesma aplicação:
o site em `/`, o painel de administração em `/admin`.

## Como rodar na sua máquina

Requisitos: Node 20.9+ (22 LTS é o ideal) e Docker.

```bash
cp .env.example .env      # os valores padrão já servem para desenvolvimento
npm install
npm run db:up             # sobe o Postgres em Docker, na porta 5433
npm run dev               # http://localhost:3000
```

Na primeira vez, popule o conteúdo:

```bash
npm run migrate:wp        # traz tudo do WordPress (demora ~20 min na 1ª vez)
npm run seed              # menu, configurações, professores e calendário
```

> A ordem importa: `seed` depois de `migrate:wp`. A migração reescreve as
> páginas, e o seed é quem coloca o bloco de equipe na página de professores.

O primeiro `migrate:wp` cria o usuário administrador e imprime a senha no
terminal. Anote — ela não é mostrada de novo.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Site e painel em desenvolvimento |
| `npm run build` / `npm start` | Build e execução de produção |
| `npm run db:up` / `db:down` | Postgres local em Docker |
| `npm run migrate:wp` | Importa o WordPress. Idempotente — pode repetir |
| `npm run seed` | Configurações, menu, professores e provas |
| `npm run check:redirects` | Confere se as URLs antigas respondem 301 e chegam a uma página real |
| `npm run generate:types` | Regenera `src/payload-types.ts` após mexer em coleções |
| `npm run generate:importmap` | Regenera o mapa de componentes do painel |
| `node scripts/check-html.mjs` | Abre páginas no navegador e acusa erro de console/hidratação |
| `node scripts/screenshots.mjs` | Prints das páginas principais para conferência visual |

Variáveis de ambiente aceitas pelos scripts: `DRY_RUN=1` e `SEM_IMAGENS=1`
(migração), `TODOS=1` e `ALVO=<url>` (verificação de redirects).

## Estrutura

```text
src/
├── app/(frontend)/     site público
├── app/(payload)/      painel — gerado pelo Payload, não editar à mão
├── collections/        posts, páginas, provas, professores, álbuns, mídia…
├── globals/            configurações do site e menu
├── blocks/             blocos de layout das páginas
├── components/         componentes do site
├── lib/payload.ts      consultas ao CMS (com cache do React)
├── middleware.ts       os ~1.600 redirects 301 do WordPress
└── payload.config.ts   configuração central do CMS
scripts/                migração, seed e ferramentas de verificação
deploy/                 backup e restauração no servidor
```

## O conteúdo que veio do WordPress

| Item | Origem | Resultado |
|---|---|---|
| Posts | 322 | 322, com URL antiga redirecionada |
| Páginas | 20 | 14 migradas; 6 viraram redirect para a estrutura nova |
| Imagens | 2.842 referenciadas | 2.817 baixadas (as 25 restantes já estavam quebradas no site antigo) |
| Categorias | 16 | 6, consolidadas |
| Tags | 1.224 | 285 (só as com 3+ posts) |
| Calendário de provas | 14 páginas de texto | 171 provas estruturadas e filtráveis |

Detalhes e falhas em `migration-report.md` (gerado pela migração).

As imagens são baixadas redimensionadas para 1600px — o maior tamanho que o
site exibe. Isso reduz o acervo de ~2,4 GB para ~700 MB sem perda visível.

## Deploy no VPS

O alvo é o VPS **2.25.182.14** ("Shadowfax"), que **já hospeda formiz,
metodoaxion e casadoauau**. Isso condiciona todo o desenho do deploy:

| Restrição do servidor | Consequência aqui |
|---|---|
| nginx do host é dono das portas 80/443 | Sem Caddy. A app escuta em `127.0.0.1:3001` e o nginx faz o proxy (`deploy/nginx-g5esportes.conf`) |
| 7,8 GB de RAM **sem swap**, 2 vCPU | A imagem é construída na máquina de desenvolvimento e transferida pronta — um build lá poderia acionar o OOM killer contra o container de outro cliente |
| Disco compartilhado com 3 clientes | Limites de memória e rotação de log por container; backup da mídia semanal, não diário |
| certbot já instalado e renovando | O TLS segue o mesmo padrão dos outros sites |

**Nunca** rode `docker system prune -a` nessa máquina: apagaria as imagens dos
outros clientes e esta, que veio por `docker load` e não pode ser baixada de
volta. Para liberar espaço: `docker builder prune -f`.

### Primeira subida

```bash
# 1. no servidor: estrutura e configuração
ssh root@2.25.182.14 'mkdir -p /opt/g5esportes'
scp -r docker-compose.yml deploy .env.producao.example root@2.25.182.14:/opt/g5esportes/
ssh root@2.25.182.14 'cd /opt/g5esportes && cp .env.producao.example .env && nano .env'

# 2. na sua máquina: constrói, confere a arquitetura e envia a imagem
npm run deploy:imagem

# 3. conteúdo: dump do banco + mídia
docker exec g5-postgres-dev pg_dump -U g5 -d g5esportes -Fc > g5.dump
scp g5.dump root@2.25.182.14:/opt/g5esportes/
tar -cf - media | ssh root@2.25.182.14 'tar -xf - -C /opt/g5esportes'
ssh root@2.25.182.14 'chown -R 1000:1000 /opt/g5esportes/media'   # o container roda como UID 1000
ssh root@2.25.182.14 'cd /opt/g5esportes && docker compose exec -T postgres pg_restore -U g5 -d g5esportes --clean --if-exists --no-owner < g5.dump'

# 4. nginx: vhost novo (não encosta nos existentes)
scp deploy/nginx-g5esportes.conf root@2.25.182.14:/etc/nginx/sites-available/g5esportes
ssh root@2.25.182.14 'ln -sf /etc/nginx/sites-available/g5esportes /etc/nginx/sites-enabled/g5esportes \
                      && nginx -t && systemctl reload nginx'

# 5. TLS
ssh root@2.25.182.14 'certbot --nginx -d g5.prattsolutions.com.br --non-interactive --agree-tos -m SEU@EMAIL'

# 6. backup no cron (ver cabeçalho de deploy/backup.sh)
```

Depois de **cada** passo que mexe no nginx, confira que os vizinhos seguem de
pé antes de continuar:

```bash
for d in formiz.com.br metodoaxion.com.br api.casadoauau.com.br; do
  curl -s -o /dev/null -w "$d -> %{http_code}\n" "https://$d"
done
```

### Deploys seguintes

```bash
npm run deploy:imagem     # constrói, envia e sobe, com verificação de saúde
```

Cada envio deixa a versão anterior taggeada por data no servidor, então o
rollback é `docker tag g5esportes:<data> g5esportes:latest && docker compose up -d`.

### Renderização

As páginas são renderizadas sob demanda (`dynamic = 'force-dynamic'`). Isso faz
o build não precisar de banco e o conteúdo publicado aparecer na hora, sem
espera de revalidação. Com o Postgres no mesmo host, o tempo de resposta fica
entre 60 e 130 ms.

### Backups

Dump do banco todo dia, mídia aos domingos (700 MB comprimem pouco e o disco é
dos quatro clientes):

```bash
ssh root@2.25.182.14 'chmod +x /opt/g5esportes/deploy/*.sh && crontab -e'
# 10 3 * * *  /opt/g5esportes/deploy/backup.sh       >> /opt/g5esportes/backups/backup.log 2>&1
# 40 3 * * 0  /opt/g5esportes/deploy/backup.sh midia >> /opt/g5esportes/backups/backup.log 2>&1
```

Backup que fica no mesmo servidor não protege de perda do servidor — vale
configurar uma cópia externa (rclone) apontando para `/opt/g5esportes/backups`.

### Estratégia de corte para g5esportes.com

Hoje o site novo roda em `g5.prattsolutions.com.br`, que serve de homologação:
o `robots.ts` bloqueia a indexação em qualquer endereço que não seja
exatamente `https://g5esportes.com`, então o Google não vê conteúdo duplicado.

Quando o cliente aprovar:

1. `DOMINIO=https://g5esportes.com npm run deploy:imagem` — o endereço público
   é embutido na imagem no build, então **precisa** reconstruir; trocar só o
   `.env` não corrige canonical, sitemap nem og:image.
2. No servidor, acrescentar `g5esportes.com www.g5esportes.com` ao `server_name`
   do vhost, `nginx -t && systemctl reload nginx`, e emitir o certificado:
   `certbot --nginx -d g5esportes.com -d www.g5esportes.com`.
3. O DNS de `g5esportes.com` está nos nameservers do WordPress.com
   (`ns1/ns2/ns3.wordpress.com`) — é lá que o registro A precisa apontar para
   `2.25.182.14`. Considere migrar o domínio para a Cloudflare antes, junto com
   `prattsolutions.com.br`, para ter controle do DNS num lugar só.
4. `ALVO=https://g5esportes.com TODOS=1 npm run check:redirects`
5. Enviar o sitemap (`/sitemap.xml`) no Search Console.

O WordPress.com continua intacto até o passo 3 — voltar atrás é reverter o DNS.

## Para quem vai publicar conteúdo

O painel fica em `/admin`, todo em português.

- **Posts** — o blog. Salve como rascunho, use *Visualizar* para ver como fica
  no site e publique quando estiver pronto. Dá para agendar a publicação.
- **Calendário de provas** — cadastre a prova uma vez; ela aparece na página
  `/corridas`, na home e nos blocos de página.
- **Páginas** — montadas por blocos (destaque, texto, cards, planos, chamada,
  perguntas frequentes…). Arraste para reordenar.
- **Configurações do site** — contato, WhatsApp, horários, redes sociais e o
  destaque da página inicial.
- **Menu de navegação** — o menu do topo e as colunas do rodapé.

Cuidado com o campo **Endereço (slug)**: mudá-lo depois de publicado quebra o
link antigo.
