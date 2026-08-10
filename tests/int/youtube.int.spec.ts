import { describe, expect, it } from 'vitest'
import { idDoYoutube } from '@/lib/youtube'

const ID = 'ZBEHcsjgBNg'

describe('idDoYoutube', () => {
  it('aceita o formato que o YouTube gera com parâmetros antes do v', () => {
    // Foi este que quebrou em produção: o `v` não é o primeiro parâmetro.
    expect(idDoYoutube(`https://www.youtube.com/watch?reload=9&v=${ID}`)).toBe(ID)
    expect(idDoYoutube(`https://www.youtube.com/watch?app=desktop&v=${ID}`)).toBe(ID)
  })

  it('aceita os formatos usuais', () => {
    expect(idDoYoutube(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID)
    expect(idDoYoutube(`https://youtube.com/watch?v=${ID}&t=42s`)).toBe(ID)
    expect(idDoYoutube(`https://youtu.be/${ID}`)).toBe(ID)
    expect(idDoYoutube(`https://youtu.be/${ID}?si=abc`)).toBe(ID)
    expect(idDoYoutube(`https://www.youtube.com/embed/${ID}`)).toBe(ID)
    expect(idDoYoutube(`https://www.youtube-nocookie.com/embed/${ID}`)).toBe(ID)
    expect(idDoYoutube(`https://www.youtube.com/shorts/${ID}`)).toBe(ID)
    expect(idDoYoutube(`https://www.youtube.com/live/${ID}`)).toBe(ID)
  })

  it('aceita o ID colado sozinho', () => {
    expect(idDoYoutube(ID)).toBe(ID)
  })

  it('devolve null para o que não é vídeo', () => {
    expect(idDoYoutube('')).toBeNull()
    expect(idDoYoutube(null)).toBeNull()
    expect(idDoYoutube('   ')).toBeNull()
    expect(idDoYoutube('https://vimeo.com/123456')).toBeNull()
    expect(idDoYoutube('https://www.youtube.com/')).toBeNull()
    expect(idDoYoutube('https://www.youtube.com/@G5esportes')).toBeNull()
  })
})
