import { Botao, Container } from '@/components/ui'

export default function NaoEncontrado() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="font-display text-[10rem] font-extrabold leading-none tabular-nums text-g5-200 sm:text-[14rem]">
        404
      </span>
      <h1 className="-mt-4 font-display text-4xl font-extrabold uppercase leading-tight text-g5-950 sm:text-5xl">
        Essa página saiu do percurso
      </h1>
      <p className="mt-4 max-w-md text-lg text-ink-muted">
        O endereço não existe mais ou foi digitado errado. Volte para o início ou dê uma olhada no
        calendário de provas.
      </p>
      <div className="mt-9 flex flex-wrap justify-center gap-4">
        <Botao href="/">Página inicial</Botao>
        <Botao href="/corridas" estilo="secundario">
          Calendário de provas
        </Botao>
      </div>
    </Container>
  )
}
