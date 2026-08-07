import Link from 'next/link'
import { Mail, MapPin, Phone } from 'lucide-react'
import { getConfiguracoes, getMenu } from '@/lib/payload'
import { RedesSociais } from './RedesSociais'

const ANO = new Date().getFullYear()

export async function Rodape() {
  const [menu, cfg] = await Promise.all([getMenu(), getConfiguracoes()])

  return (
    <footer className="mt-24 bg-g5-950 text-white">
      <div
        aria-hidden
        className="h-1 w-full"
        style={{
          backgroundImage:
            'repeating-linear-gradient(115deg, var(--color-g5-200) 0 14px, var(--color-g5-600) 14px 28px)',
        }}
      />

      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <div className="flex items-baseline gap-2 font-display leading-none">
              <span className="text-5xl font-extrabold text-g5-200">G5</span>
              <span className="text-2xl font-semibold uppercase tracking-[0.18em] text-white/70">
                Esportes
              </span>
            </div>

            {cfg.slogan && (
              <p className="mt-4 max-w-sm text-lg leading-snug text-white/70">{cfg.slogan}</p>
            )}

            <ul className="mt-8 space-y-3 text-white/80">
              {cfg.localTreino && (
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-g5-300" aria-hidden />
                  {cfg.mapaUrl ? (
                    <a href={cfg.mapaUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                      {cfg.localTreino}
                    </a>
                  ) : (
                    <span>{cfg.localTreino}</span>
                  )}
                </li>
              )}
              {cfg.telefone && (
                <li className="flex items-center gap-3">
                  <Phone className="size-5 shrink-0 text-g5-300" aria-hidden />
                  <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    {cfg.telefone}
                  </a>
                </li>
              )}
              {cfg.email && (
                <li className="flex items-center gap-3">
                  <Mail className="size-5 shrink-0 text-g5-300" aria-hidden />
                  <a href={`mailto:${cfg.email}`} className="break-all hover:text-white">
                    {cfg.email}
                  </a>
                </li>
              )}
            </ul>

            <RedesSociais cfg={cfg} className="mt-8" />
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {(menu.rodape ?? []).map((coluna) => (
              <div key={coluna.id ?? coluna.titulo}>
                <h2 className="font-display text-xl font-bold uppercase tracking-wide text-g5-200">
                  {coluna.titulo}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {(coluna.links ?? []).map((link) => (
                    <li key={link.id ?? link.url}>
                      <Link href={link.url} className="text-white/70 transition-colors hover:text-white">
                        {link.rotulo}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {ANO} {cfg.nomeSite ?? 'G5 Esportes'}. Todos os direitos reservados.
          </p>
          <p>
            Treinos conduzidos por profissionais registrados no CREF —{' '}
            <Link href="/professores" className="underline underline-offset-4 hover:text-white">
              conheça a equipe
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
