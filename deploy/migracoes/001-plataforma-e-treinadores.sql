-- Migração 001 — campos novos de Configurações do site
--
-- CONTEXTO: o Payload sincroniza o schema sozinho só em DESENVOLVIMENTO
-- (`push`). Em produção ele espera que o schema já exista. Ao publicar a
-- imagem 2026-08-07-2125, que adiciona "Palavra dos treinadores",
-- "Plataforma" e "Faixa de fotos", o código passou a consultar tabelas que o
-- banco de produção não tinha e o site devolveu 500 em todas as páginas
-- públicas. Esta migração cria o que faltava.
--
-- É idempotente: pode rodar de novo sem quebrar.
--
--   docker exec -i g5-postgres psql -U g5 -d g5esportes < 001-....sql

BEGIN;

-- ── Tipo do seletor de ícone dos recursos ──────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_configuracoes_plataforma_recursos_icone') THEN
    CREATE TYPE public.enum_configuracoes_plataforma_recursos_icone
      AS ENUM ('planilha', 'relogio', 'celular', 'evolucao', 'conversa', 'calendario');
  END IF;
END $$;

-- ── Campos simples, direto na tabela do global ─────────────────────────────
ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS palavra_treinadores_titulo    character varying,
  ADD COLUMN IF NOT EXISTS palavra_treinadores_texto     character varying,
  ADD COLUMN IF NOT EXISTS palavra_treinadores_video_url character varying,
  ADD COLUMN IF NOT EXISTS plataforma_titulo             character varying,
  ADD COLUMN IF NOT EXISTS plataforma_texto              character varying,
  ADD COLUMN IF NOT EXISTS plataforma_imagem_id          integer,
  ADD COLUMN IF NOT EXISTS fotos_titulo                  character varying;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'configuracoes_plataforma_imagem_id_midia_id_fk'
  ) THEN
    ALTER TABLE public.configuracoes
      ADD CONSTRAINT configuracoes_plataforma_imagem_id_midia_id_fk
      FOREIGN KEY (plataforma_imagem_id) REFERENCES public.midia(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS configuracoes_plataforma_plataforma_imagem_idx
  ON public.configuracoes USING btree (plataforma_imagem_id);

-- ── Array de recursos da plataforma ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.configuracoes_plataforma_recursos (
  _order     integer NOT NULL,
  _parent_id integer NOT NULL,
  id         character varying NOT NULL,
  icone      public.enum_configuracoes_plataforma_recursos_icone DEFAULT 'planilha',
  titulo     character varying NOT NULL,
  texto      character varying,
  CONSTRAINT configuracoes_plataforma_recursos_pkey PRIMARY KEY (id),
  CONSTRAINT configuracoes_plataforma_recursos_parent_id_fk
    FOREIGN KEY (_parent_id) REFERENCES public.configuracoes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS configuracoes_plataforma_recursos_order_idx
  ON public.configuracoes_plataforma_recursos USING btree (_order);
CREATE INDEX IF NOT EXISTS configuracoes_plataforma_recursos_parent_id_idx
  ON public.configuracoes_plataforma_recursos USING btree (_parent_id);

-- ── Relacionamentos do global (a faixa de fotos usa upload hasMany) ────────
CREATE TABLE IF NOT EXISTS public.configuracoes_rels (
  id        serial PRIMARY KEY,
  "order"   integer,
  parent_id integer NOT NULL,
  path      character varying NOT NULL,
  midia_id  integer,
  CONSTRAINT configuracoes_rels_parent_fk
    FOREIGN KEY (parent_id) REFERENCES public.configuracoes(id) ON DELETE CASCADE,
  CONSTRAINT configuracoes_rels_midia_fk
    FOREIGN KEY (midia_id) REFERENCES public.midia(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS configuracoes_rels_order_idx  ON public.configuracoes_rels USING btree ("order");
CREATE INDEX IF NOT EXISTS configuracoes_rels_parent_idx ON public.configuracoes_rels USING btree (parent_id);
CREATE INDEX IF NOT EXISTS configuracoes_rels_path_idx   ON public.configuracoes_rels USING btree (path);
CREATE INDEX IF NOT EXISTS configuracoes_rels_midia_id_idx ON public.configuracoes_rels USING btree (midia_id);

COMMIT;
