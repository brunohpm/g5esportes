import { expect, test } from '@playwright/test'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

test.describe('site', () => {
  test('a home carrega com o menu novo e o botão da área do aluno', async ({ page }) => {
    await page.goto(BASE)

    await expect(page).toHaveTitle(/G5 Esportes/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const menu = page.getByRole('navigation', { name: 'Menu principal' }).first()
    for (const item of ['Treinos', 'Corridas', 'Blog', 'A G5', 'Contato']) {
      await expect(menu.getByRole('link', { name: item, exact: true })).toBeVisible()
    }

    const areaAluno = page.getByRole('link', { name: /Área do Aluno/i }).first()
    await expect(areaAluno).toHaveAttribute('href', /sistematreinoonline/)
  })

  test('o blog lista posts e o post abre', async ({ page }) => {
    await page.goto(`${BASE}/blog`)

    const primeiro = page.locator('article a').first()
    const titulo = (await primeiro.textContent())?.trim()
    await primeiro.click()

    await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(titulo ?? '')
  })

  test('o calendário filtra as provas por distância', async ({ page }) => {
    await page.goto(`${BASE}/corridas`)

    const contador = page.getByRole('status')
    await expect(contador).toContainText('provas no calendário')

    await page.getByRole('button', { name: '42km', exact: true }).click()

    await expect(contador).toContainText(/de \d+ provas/)
    await expect(page.getByRole('button', { name: 'Limpar' })).toBeVisible()
  })

  test('a busca do calendário encontra uma prova pelo nome', async ({ page }) => {
    await page.goto(`${BASE}/corridas`)

    await page.getByRole('searchbox', { name: /Buscar prova ou cidade/i }).fill('sanepar')
    await expect(page.getByRole('heading', { name: /sanepar/i }).first()).toBeVisible()
  })

  test('URL antiga do WordPress responde 301 para o endereço novo', async ({ request }) => {
    const resposta = await request.get(`${BASE}/2025/11/30/como-funcionam-os-treinos/`, {
      maxRedirects: 0,
    })

    expect(resposta.status()).toBe(301)
    expect(resposta.headers()['location']).toContain('/blog/como-funcionam-os-treinos')
  })

  test('endereço inexistente mostra a página 404 do site', async ({ page }) => {
    const resposta = await page.goto(`${BASE}/isso-nao-existe-mesmo`)

    expect(resposta?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/saiu do percurso/i)
  })
})
