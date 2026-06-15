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
    !(await page.getByText('Ваши квартиры', { exact: true }).isVisible().catch(() => false)),
    '1.3 — Список «Ваши квартиры» скрыт без кэша'
  );
  await expect(
    await page.getByLabel('Адрес квартиры').isVisible(),
    '1.4 — Форма поиска показана сразу (нет профилей)'
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

  // ─── 4. Inline-добавление счёта по номеру (любой номер принимается) ─────
  // Раскрываем компактную строку добавления.
  await expect(
    !(await page.getByLabel('Номер лицевого счёта').isVisible().catch(() => false)),
    '4.0 — Строка добавления свёрнута по умолчанию'
  );
  await page.getByRole('button', { name: '+ Добавить ещё счёт' }).click();
  await page.waitForTimeout(150);
  await expect(
    await page.getByLabel('Номер лицевого счёта').isVisible(),
    '4.0b — «+ Добавить ещё счёт» раскрывает inline-строку'
  );

  await page.getByLabel('Номер лицевого счёта').fill('770050010101');
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
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

  // 4.3 — Строка остаётся открытой после добавления (можно добавить ещё).
  await expect(
    await page.getByLabel('Номер лицевого счёта').isVisible(),
    '4.3 — Inline-строка остаётся открытой после добавления'
  );
  // 4.4 — Нет ошибки «Счёт не найден» на Оплате.
  await expect(
    !(await page.getByText('Счёт не найден', { exact: false }).isVisible().catch(() => false)),
    '4.4 — Нет ошибки «Счёт не найден» на Оплате'
  );

  // ─── 4b. Изолированно: произвольный ЛС принимается + fallback-ссылка ─────
  await page.goto(BASE_URL + '/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Адрес квартиры').fill('Квартира 48, г. Курск, ул. Гайдара, д. 5');
  await page.getByLabel('Номер лицевого счёта').fill('101001090');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.waitForURL(/\/oplata/);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '+ Добавить ещё счёт' }).click();
  await page.waitForTimeout(150);
  const arbTotalBefore = parseRub(await summary.innerText());
  await page.getByLabel('Номер лицевого счёта').fill('555000111');
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
  await page.waitForTimeout(200);
  const arbTotalAfter = parseRub(await summary.innerText());
  await expect(
    arbTotalAfter > arbTotalBefore,
    '4b.1 — Произвольный ЛС принимается и увеличивает итог',
    `before=${arbTotalBefore} after=${arbTotalAfter}`
  );
  await expect(
    !(await page.getByText('Счёт не найден', { exact: false }).isVisible().catch(() => false)),
    '4b.2 — Нет ошибки на произвольном ЛС'
  );
  await page.getByText('Не знаю номер — найти по организации').click();
  await page.waitForURL(/\/poisk-organizacii/);
  await page.waitForTimeout(150);
  await expect(
    await page.getByRole('heading', { name: 'Поиск счетов по организации' }).isVisible(),
    '4b.3 — Fallback-ссылка ведёт на поиск по организации'
  );

  // ─── 5. Path B: поиск организации → карточка → продолжить ───────────────
  // Возвращаемся к основному сценарию (Газпром + Курскэнерго).
  await page.goto(BASE_URL + '/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Адрес квартиры').fill('Квартира 48, обл. Курская, г. Курск, ул. Гайдара, д. 5');
  await page.getByLabel('Номер лицевого счёта').fill('101001090');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.waitForURL(/\/oplata/);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '+ Добавить ещё счёт' }).click();
  await page.waitForTimeout(150);
  await page.getByLabel('Номер лицевого счёта').fill('770050010101');
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
  await page.waitForTimeout(200);
  await page.getByText('Не знаю номер — найти по организации').click();
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
  await page.getByRole('button', { name: '+ Добавить ещё счёт' }).click();
  await page.waitForTimeout(150);
  await page.getByLabel('Номер лицевого счёта').fill('001234567890');
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
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

  // ─── 9. Сохранённая квартира первой на Главной («Ваши квартиры») ─────────
  await page.waitForTimeout(200);
  await shot(page, '06-home-cached');
  await expect(
    await page.getByText('Ваши квартиры', { exact: true }).isVisible(),
    '9.1 — Метка «Ваши квартиры» появилась'
  );
  await expect(
    await page.getByText('Квартира 48').first().isVisible(),
    '9.2 — Карточка профиля с адресом'
  );
  // 9.2b — Форма поиска свёрнута по умолчанию (поле адреса не видно).
  await expect(
    !(await page.getByLabel('Адрес квартиры').isVisible().catch(() => false)),
    '9.2b — Форма поиска свёрнута, пока есть профиль'
  );
  // 9.2c — Триггер «Оплатить другой счёт» раскрывает форму.
  await page.getByRole('button', { name: 'Оплатить другой счёт' }).click();
  await page.waitForTimeout(150);
  await expect(
    await page.getByLabel('Адрес квартиры').isVisible(),
    '9.2c — «Оплатить другой счёт» раскрывает форму поиска'
  );

  // 9.3 — Карточка ведёт на /oplata с полным набором счетов.
  await page.getByRole('button', { name: 'Оплатить', exact: true }).first().click();
  await page.waitForURL(/\/oplata/);
  await page.waitForTimeout(200);
  await expect(
    (await page.getByText('АО «Газпром газораспределение Курск»').first().isVisible()) &&
      (await page.getByText('ПАО «Квадра — Курская генерация»').first().isVisible()) &&
      (await page.getByText('поставщик ещё не выставил счёт').isVisible()),
    '9.3 — Полный набор счетов восстановлен из кэша'
  );

  // 9.5 — Карточка честно подписывает прошлую сумму («В прошлый раз»).
  await page.goto(BASE_URL + '/');
  await page.waitForTimeout(200);
  await expect(
    await page.getByText('В прошлый раз:', { exact: false }).first().isVisible(),
    '9.5 — Подпись «В прошлый раз» в карточке'
  );

  // 9.4 — [Удалить] просит подтверждение через модалку, затем убирает профиль.
  await page.getByRole('button', { name: 'Удалить сохранённые счета' }).first().click();
  await page.waitForTimeout(200);
  await expect(
    await page.getByRole('heading', { name: 'Удалить сохранённые счета?' }).isVisible(),
    '9.4a — Модалка подтверждения удаления'
  );
  // Профиль ещё на месте, пока не подтвердили.
  await expect(
    await page.getByText('Ваши квартиры', { exact: true }).isVisible(),
    '9.4b — Профиль сохраняется до подтверждения'
  );
  await page.getByRole('button', { name: 'Удалить', exact: true }).click();
  await page.waitForTimeout(200);
  await expect(
    !(await page.getByText('Ваши квартиры', { exact: true }).isVisible().catch(() => false)),
    '9.4c — Подтверждение удаления убирает профиль'
  );

  // ─── 10. Главная: принимается ЛЮБОЙ ЛС без проверки ─────────────────────
  await page.goto(BASE_URL + '/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Адрес квартиры').fill('Квартира 48, г. Курск, ул. Гайдара, д. 5');
  await page.getByLabel('Номер лицевого счёта').fill('999999999');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.waitForURL(/\/oplata/);
  await expect(
    page.url().includes('/oplata'),
    '10.1 — Любой ЛС принимается → переход на Оплату',
    `url=${page.url()}`
  );

  // ─── 11. Дедуп: повторное добавление того же ЛС не дублирует ─────────────
  await page.goto(BASE_URL + '/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Адрес квартиры').fill('Квартира 48, г. Курск, ул. Гайдара, д. 5');
  await page.getByLabel('Номер лицевого счёта').fill('101001090');
  await page.getByRole('button', { name: 'Найти' }).click();
  await page.waitForURL(/\/oplata/);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '+ Добавить ещё счёт' }).click();
  await page.waitForTimeout(150);
  await page.getByLabel('Номер лицевого счёта').fill('770050010101');
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
  await page.waitForTimeout(200);
  const energoCount1 = await page.getByText('ПАО «Курскэнергосбыт»').count();
  await page.getByLabel('Номер лицевого счёта').fill('770050010101');
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
  await page.waitForTimeout(200);
  const energoCount2 = await page.getByText('ПАО «Курскэнергосбыт»').count();
  await expect(
    energoCount1 === energoCount2 && energoCount1 >= 1,
    '11.1 — Повторный тот же ЛС не дублирует счёт',
    `before=${energoCount1} after=${energoCount2}`
  );
  await expect(
    await page.getByText('Этот счёт уже добавлен').isVisible(),
    '11.2 — Инлайн-сообщение «Этот счёт уже добавлен»'
  );

  // ─── 12. Trust-сигнал у оплаты ───────────────────────────────────────────
  await expect(
    await page
      .locator('.pay-summary')
      .getByText('Оплата через банк-эквайер ВБРР', { exact: false })
      .isVisible(),
    '12.1 — Trust-строка под [Оплатить]'
  );
  await expect(
    await page.locator('.pay-summary').getByText('К оплате', { exact: true }).isVisible(),
    '12.2 — Честная подпись суммы «К оплате»'
  );

  // ─── 13. Под-начисления — расшифровка, не платёжная строка ───────────────
  // Inline-строка добавления осталась открытой после секции 11.
  await page.getByLabel('Номер лицевого счёта').fill('1022345701 23');
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
  await page.waitForTimeout(200);
  await expect(
    await page.getByText('В том числе', { exact: true }).first().isVisible(),
    '13.1 — Подпись «В том числе» у под-начислений'
  );
  // Контейнер расшифровки «В том числе» (ближайший .doc-row).
  const breakdown = page
    .getByText('В том числе', { exact: true })
    .first()
    .locator('xpath=ancestor::div[contains(@class,"doc-row")][1]');
  await expect(
    await breakdown.getByText('ООО «ЕИРКЦ»', { exact: true }).isVisible(),
    '13.2 — ЕИРКЦ показан как расшифровка внутри «В том числе»'
  );
  // Под-начисление не имеет собственного чекбокса (не отдельный платёж).
  await expect(
    (await breakdown.locator('.cb-input').count()) === 0,
    '13.3 — У под-начислений нет чекбоксов (не платёжные строки)'
  );
  // Суммы под-начислений — не .amount-pill (обычный текст).
  await expect(
    (await breakdown.locator('.amount-pill').count()) === 0,
    '13.4 — Суммы под-начислений — не amount-pill'
  );

  // ─── 14. Подсказки адреса на Главной ────────────────────────────────────
  await page.goto(BASE_URL + '/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByLabel('Адрес квартиры').fill('Гайдара');
  await page.waitForTimeout(150);
  const suggestion = page.locator('.suggest-item', { hasText: 'Гайдара' }).first();
  await expect(await suggestion.isVisible(), '14.1 — Подсказка адреса появляется при вводе');
  await suggestion.dispatchEvent('mousedown');
  await page.waitForTimeout(100);
  const addrVal = await page.getByLabel('Адрес квартиры').inputValue();
  await expect(
    addrVal.includes('кв.') && addrVal.toLowerCase().includes('гайдара'),
    '14.2 — Клик по подсказке подставляет адрес до квартиры',
    `value=${addrVal}`
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
