-- Migração 002 — coleção de vídeos hospedados no servidor
--
-- Acrescenta a coleção `videos` (alternativa ao YouTube para a palavra dos
-- treinadores) e o campo que a liga em Configurações do site.
--
-- Idempotente: pode rodar de novo sem quebrar.

BEGIN;

-- ── Coleção de vídeos ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.videos (
  id              serial PRIMARY KEY,
  titulo          character varying NOT NULL,
  legenda         character varying,
  capa_id         integer,
  updated_at      timestamp(3) with time zone DEFAULT now() NOT NULL,
  created_at      timestamp(3) with time zone DEFAULT now() NOT NULL,
  url             character varying,
  thumbnail_u_r_l character varying,
  filename        character varying,
  mime_type       character varying,
  filesize        numeric,
  width           numeric,
  height          numeric,
  focal_x         numeric,
  focal_y         numeric
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'videos_capa_id_midia_id_fk') THEN
    ALTER TABLE public.videos
      ADD CONSTRAINT videos_capa_id_midia_id_fk
      FOREIGN KEY (capa_id) REFERENCES public.midia(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX        IF NOT EXISTS videos_capa_idx       ON public.videos USING btree (capa_id);
CREATE INDEX        IF NOT EXISTS videos_created_at_idx ON public.videos USING btree (created_at);
CREATE INDEX        IF NOT EXISTS videos_updated_at_idx ON public.videos USING btree (updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS videos_filename_idx   ON public.videos USING btree (filename);

-- ── Campo em Configurações do site ─────────────────────────────────────────
ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS palavra_treinadores_video_arquivo_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'configuracoes_palavra_treinadores_video_arquivo_id_videos_id_fk'
  ) THEN
    ALTER TABLE public.configuracoes
      ADD CONSTRAINT configuracoes_palavra_treinadores_video_arquivo_id_videos_id_fk
      FOREIGN KEY (palavra_treinadores_video_arquivo_id) REFERENCES public.videos(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS configuracoes_palavra_treinadores_palavra_treinadores_vi_idx
  ON public.configuracoes USING btree (palavra_treinadores_video_arquivo_id);

-- ── Registro de bloqueio de edição do painel ───────────────────────────────
ALTER TABLE public.payload_locked_documents_rels
  ADD COLUMN IF NOT EXISTS videos_id integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_videos_fk') THEN
    ALTER TABLE public.payload_locked_documents_rels
      ADD CONSTRAINT payload_locked_documents_rels_videos_fk
      FOREIGN KEY (videos_id) REFERENCES public.videos(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_videos_id_idx
  ON public.payload_locked_documents_rels USING btree (videos_id);

COMMIT;
