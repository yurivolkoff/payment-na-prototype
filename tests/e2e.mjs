/**
 * End-to-end smoke for «Оплата по адресу» (неавторизованная зона).
 * Covers the phase-3 gate checklist from logs/01-design-plan.md.
 *
 * Usage:
 *   node tests/e2e.mjs                        (dev server :5173)
 *   BASE_URL=http://127.0.0.1:5174 node tests/e2e.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = resolve('test-output');
mkdirSync(OUT, { recursive: true });

const results = [];
let failures = 0;

function record(name, ok, note = '') {
  results.push({ name, ok, note });
  if (!ok) failures++;
  console.log(`${ok ? '✓' : '✗'} ${name}${note ? ` — ${note}` : ''}`);
}
async function expect(cond, name, note = '') {
  record(name, !!cond, note);
}
async function shot(page, name) {
  await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: true });
}

/** Извлечь рубли из строки вида «14 587,06 ₽» → 14587.06 */
function parseRub(text) {
  const m = text.match(/([\d\s ]+),(\d{2})\s*₽/);
  if (!m) return NaN;
  return parseFloat(m[1].replace(/[\s ]/g, '') + '.' + m[2]);
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1024 },
    locale: 'ru-RU',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  // ─── 0. Чистый старт (без кэша) ─────────────────────────────────────────
  await page.goto(BASE_URL + '/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await shot(page, '01-home');

  // ─── 1. Главная рендерится ──────────────────────────────────────────────
  await expect(
    await page.getByRole('heading', { name: 'Узнайте всё о любом доме в России' }).isVisible(),
    '1.1 — Hero виден'
  );
  await expect(
    await page.getByRole('heading', { name: 'Найти и оплатить коммунальные услуги' }).isVisible(),
    '1.2 — Блок поиска виден'
  );
  await expect(
    !(await page.getByRole('heading', { name: 'Оплатить снова' }).isVisible().catch(() => false)),
    '1.3 — Блок «Оплатить снова» скрыт без кэша'
  );

  // ─── 2. Валидации ───────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.waitForTimeout(150);
  await expect(
    await page.getByText('Укажите адрес квартиры', { exact: true }).isVisible(),
    '2.1 — Ошибка пустого адреса'
  );
  await expect(
    await page.getByText('Укажите номер лицевого счёта', { exact: true }).isVisible(),
    '2.2 — Ошибка пустого ЛС'
  );

  await page.getByLabel('Адрес квартиры').fill('г. Курск, ул. Гайдара, д. 5');
  await page.getByLabel('Номер лицевого счёта').fill('101001090');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.waitForTimeout(150);
  await expect(
    await page.getByText('Добавьте номер квартиры в адрес').isVisible(),
    '2.3 — Ошибка адреса без квартиры'
  );

  await page.getByLabel('Адрес квартиры').fill('Квартира 48, обл. Курская, г. Курск, ул. Гайдара, д. 5');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.waitForURL(/\/oplata/);
  await page.waitForTimeout(200);
  await shot(page, '02-oplata-found');
  await expect(page.url().includes('/oplata'), '2.4 — Переход на Оплату');

  // ─── 3. Оплата: найдена квитанция + сумма ───────────────────────────────
  await expect(
    await page.getByRole('heading', { name: 'Оплата', exact: true }).isVisible(),
    '3.1 — Заголовок «Оплата»'
  );
  await expect(
    await page.getByText('АО «Газпром газораспределение Курск»').first().isVisible(),
    '3.2 — Найден счёт Газпром'
  );
  await expect(
    await page.getByText('лицевой счёт 101001090; Газоснабжение').isVisible(),
    '3.3 — Строка лицевого счёта'
  );
  const summary = page.locator('.pay-summary');
  let sumText = await summary.innerText();
  await expect(
    Math.abs(parseRub(sumText) - 7293.53) < 0.01,
    '3.4 — Итог = 7 293,53 ₽',
    `summary=«${sumText.replace(/\n/g, ' ')}»`
  );

  // ─── 4. Добавить счёт по номеру (найден) ────────────────────────────────
  await page.getByLabel('Номер лицевого счёта').fill('770050010101');
  await page.getByRole('button', { name: 'Найти счёт' }).click();
  await page.waitForTimeout(200);
  await expect(
    await page.getByText('ПАО «Курскэнергосбыт»').isVisible(),
    '4.1 — Добавлена карточка по номеру'
  );
  sumText = await summary.innerText();
  await expect(
    Math.abs(parseRub(sumText) - (7293.53 + 2143.7)) < 0.01,
    '4.2 — Итог пересчитан (+2 143,70 ₽)',
    `summary=«${sumText.replace(/\n/g, ' ')}»`
  );

  await page.getByLabel('Номер лицевого счёта').fill('000000');
  await page.getByRole('button', { name: 'Найти счёт' }).click();
  await page.waitForTimeout(150);
  await expect(
    await page.getByText('Счёт не найден. Проверьте номер или укажите организацию').isVisible(),
    '4.3 — Ошибка «Счёт не найден»'
  );

  // ─── 5. Path B: Указать организацию → поиск → карточка → продолжить ──────
  await page.getByRole('button', { name: 'Указать организацию' }).click();
  await page.waitForURL(/\/poisk-organizacii/);
  await page.waitForTimeout(150);
  await shot(page, '03-org-search');
  await expect(
    await page.getByRole('heading', { name: 'Поиск счетов по организации' }).isVisible(),
    '5.1 — Экран поиска по организации'
  );

  await page.getByLabel('Организация').fill('нет такой организации zzz');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.waitForTimeout(150);
  await expect(
    await page.getByText('Ничего не нашли. Проверьте название или реквизиты организации').isVisible(),
    '5.2 — Пустой результат поиска'
  );

  await page.getByLabel('Организация').fill('Квадра');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.waitForTimeout(150);
  await page.getByText('ПАО «Квадра — Курская генерация»').click();
  await page.waitForURL(/\/organizaciya\//);
  await page.waitForTimeout(150);
  await shot(page, '04-org-card');
  await expect(
    await page.getByRole('heading', { name: 'ПАО «Квадра — Курская генерация»' }).isVisible(),
    '5.3 — Карточка организации'
  );
  await expect(
    await page.getByText('Квартира 48, обл. Курская, г. Курск, ул. Гайдара, д. 5').isVisible(),
    '5.4 — Адрес подставлен с Главной'
  );
  await page.getByLabel('Номер лицевого счёта').fill('440120030');
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await page.waitForURL(/\/oplata/);
  await page.waitForTimeout(200);
  await expect(
    await page.getByText('ПАО «Квадра — Курская генерация»').first().isVisible(),
    '5.5 — Карточка Квадра добавлена на Оплате'
  );

  // ─── 6. Чекбоксы + сумма + disabled [Оплатить] ──────────────────────────
  sumText = await summary.innerText();
  const totalNow = parseRub(sumText);
  await expect(
    Math.abs(totalNow - (7293.53 + 2143.7 + 3842.19)) < 0.01,
    '6.1 — Итог трёх счетов = 13 279,42 ₽',
    `summary=«${sumText.replace(/\n/g, ' ')}»`
  );

  const checks = page.locator('.cb-input:not(:disabled)');
  const n = await checks.count();
  for (let i = 0; i < n; i++) {
    const cb = checks.nth(i);
    if (await cb.isChecked()) await cb.click({ force: true });
  }
  await page.waitForTimeout(200);
  const payBtn = page.locator('.pay-summary').getByRole('button', { name: 'Оплатить' });
  await expect(await payBtn.isDisabled(), '6.2 — [Оплатить] disabled при 0 выбранных');
  await expect(
    await page.getByText('Выберите хотя бы один счёт для оплаты').isVisible(),
    '6.3 — Helper «Выберите хотя бы один счёт»'
  );

  await checks.nth(0).click({ force: true });
  await page.waitForTimeout(150);
  await expect(!(await payBtn.isDisabled()), '6.4 — [Оплатить] активна при 1 выбранном');

  // ─── 7. «не выставил счёт» ───────────────────────────────────────────────
  await page.getByLabel('Номер лицевого счёта').fill('001234567890');
  await page.getByRole('button', { name: 'Найти счёт' }).click();
  await page.waitForTimeout(200);
  await expect(
    await page.getByText('поставщик ещё не выставил счёт').isVisible(),
    '7.1 — Карточка «не выставил счёт»'
  );
  const disabledCb = page.locator('.cb-input:disabled');
  await expect((await disabledCb.count()) >= 1, '7.2 — Чекбокс «не выставил счёт» задизейблен');
  await page.getByRole('button', { name: 'Почему счёт не выставлен' }).click();
  await page.waitForTimeout(150);
  await expect(
    await page.getByText('Поставщик ещё не выставил квитанцию за этот период').isVisible(),
    '7.3 — ⓘ-popover открывается'
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);

  // ─── 8. [Оплатить] → «Конец сценария» ───────────────────────────────────
  await payBtn.click();
  await page.waitForTimeout(300);
  await shot(page, '05-paid-modal');
  await expect(
    await page.getByRole('heading', { name: 'Конец сценария прототипа' }).isVisible(),
    '8.1 — Заглушка «Конец сценария»'
  );
  await page.getByRole('button', { name: 'На главную', exact: true }).click();
  await page.waitForTimeout(300);

  // ─── 9. Кэш «Оплатить снова» ────────────────────────────────────────────
  await page.waitForTimeout(200);
  await shot(page, '06-home-cached');
  await expect(
    await page.getByRole('heading', { name: 'Оплатить снова' }).isVisible(),
    '9.1 — Блок «Оплатить снова» появился'
  );
  await expect(
    await page.getByText('Квартира 48').first().isVisible(),
    '9.2 — Карточка профиля с адресом'
  );
  const cacheCard = page.getByRole('heading', { name: 'Оплатить снова' }).locator('xpath=ancestor::*[1]');
  await cacheCard.getByRole('button', { name: 'Оплатить' }).first().click();
  await page.waitForURL(/\/oplata/);
  await page.waitForTimeout(200);
  await expect(
    (await page.getByText('АО «Газпром газораспределение Курск»').first().isVisible()) &&
      (await page.getByText('ПАО «Квадра — Курская генерация»').first().isVisible()) &&
      (await page.getByText('поставщик ещё не выставил счёт').isVisible()),
    '9.3 — Полный набор счетов восстановлен из кэша'
  );

  await page.goto(BASE_URL + '/');
  await page.waitForTimeout(200);
  const cacheCard2 = page.getByRole('heading', { name: 'Оплатить снова' }).locator('xpath=ancestor::*[1]');
  await cacheCard2.getByRole('button', { name: 'Удалить' }).first().click();
  await page.waitForTimeout(200);
  await expect(
    !(await page.getByRole('heading', { name: 'Оплатить снова' }).isVisible().catch(() => false)),
    '9.4 — [Удалить] убирает профиль'
  );

  // ─── FINAL ───────────────────────────────────────────────────────────────
  console.log('\n──────────────────────────');
  console.log(`Passed: ${results.filter((r) => r.ok).length}/${results.length}`);
  if (failures > 0) console.log(`FAILED: ${failures}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) console.log(consoleErrors.slice(0, 10).join('\n'));

  writeFileSync(
    resolve(OUT, 'e2e-results.json'),
    JSON.stringify({ results, consoleErrors }, null, 2),
    'utf-8'
  );

  await browser.close();
  process.exit(failures === 0 && consoleErrors.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
