/**
 * Фаза 6 — юзабилити-эмуляция для сценария «Оплата по адресу (неавторизованная зона)».
 * Прогоняет платёжные персоны через их JTBD, считает клики/время, фиксирует friction.
 *
 * Запуск (dev-сервер должен быть поднят):
 *   BASE_URL=http://127.0.0.1:5175 node tests/personas/payment-personas.mjs
 */
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';
const personas = [];

function makeTracker(name, scenario, patienceMs) {
  return { name, scenario, patienceMs, clicks: 0, path: [], friction: [], t0: null, ms: 0 };
}

async function think(page, t) {
  await page.waitForTimeout(t.patienceMs);
}
async function clickRole(page, t, role, name) {
  await page.getByRole(role, { name }).first().click();
  t.clicks++;
  t.path.push(`${role}:${name}`);
}

async function run() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 }, locale: 'ru-RU' });
  const page = await ctx.newPage();

  // ─── Персона 1: Новичок «с улицы», один счёт ──────────────────────────────
  {
    const t = makeTracker('Новичок «с улицы»', 'Оплатить одну квитанцию', 1200);
    await page.goto(BASE_URL + '/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    t.t0 = Date.now();
    await think(page, t);
    await page.getByRole('textbox', { name: /Номер лицевого счёта/ }).fill('101001090');
    await page.getByRole('textbox', { name: 'Адрес квартиры' }).fill('г. Курск, ул. Гайдара, д. 5, кв. 48');
    await clickRole(page, t, 'button', 'Найти');
    await page.waitForURL(/oplata/);
    await think(page, t);
    await clickRole(page, t, 'button', 'Оплатить');
    const stub = await page.getByText('Конец сценария прототипа').isVisible();
    t.ms = Date.now() - t.t0;
    if (!stub) t.friction.push({ step: 'после Оплатить', issue: 'нет финального экрана', sev: '🔴' });
    t.friction.push({ step: 'helper ЛС', issue: 'формат ЕЛС (3-й/4-й — буквы) может быть непонятен новичку', sev: '⚪' });
    personas.push(t);
    await page.getByRole('button', { name: 'На главную', exact: true }).click();
  }

  // ─── Персона 2: Повторный плательщик (кэш) ────────────────────────────────
  {
    const t = makeTracker('Повторный плательщик', 'Повторить прошлую оплату', 800);
    await page.goto(BASE_URL + '/'); // кэш с прошлой оплаты сохранён
    t.t0 = Date.now();
    await think(page, t);
    const hasCache = await page.getByRole('heading', { name: 'Оплатить снова' }).isVisible();
    if (!hasCache) t.friction.push({ step: 'Главная', issue: 'блок кэша не появился', sev: '🔴' });
    await clickRole(page, t, 'button', 'Оплатить'); // на карточке кэша
    await page.waitForURL(/oplata/);
    await clickRole(page, t, 'button', 'Оплатить'); // сайдбар
    const stub = await page.getByText('Конец сценария прототипа').isVisible();
    t.ms = Date.now() - t.t0;
    if (!stub) t.friction.push({ step: 'после Оплатить', issue: 'не дошёл до финала', sev: '🔴' });
    personas.push(t);
    await page.getByRole('button', { name: 'На главную', exact: true }).click();
  }

  // ─── Персона 3: Пожилой собственник, несколько счетов через организацию ────
  {
    const t = makeTracker('Пожилой собственник', 'Оплатить несколько счетов, один — через организацию', 1800);
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL + '/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    t.t0 = Date.now();
    await think(page, t);
    await page.getByRole('textbox', { name: /Номер лицевого счёта/ }).fill('101001090');
    await page.getByRole('textbox', { name: 'Адрес квартиры' }).fill('г. Курск, ул. Гайдара, д. 5, кв. 48');
    await clickRole(page, t, 'button', 'Найти');
    await page.waitForURL(/oplata/);
    await think(page, t);
    await clickRole(page, t, 'button', 'Указать организацию');
    await page.waitForURL(/poisk-organizacii/);
    await think(page, t);
    await clickRole(page, t, 'button', /Кристалл/);
    await page.waitForURL(/organizaciya/);
    await page.getByRole('textbox', { name: /Номер лицевого счёта/ }).fill('1022345701');
    await clickRole(page, t, 'button', 'Продолжить');
    await page.waitForURL(/oplata/);
    await think(page, t);
    await clickRole(page, t, 'button', 'Оплатить');
    const stub = await page.getByText('Конец сценария прототипа').isVisible();
    t.ms = Date.now() - t.t0;
    if (!stub) t.friction.push({ step: 'после Оплатить', issue: 'не дошёл до финала', sev: '🔴' });
    t.friction.push({ step: 'Поиск по организации', issue: 'реквизиты ОГРН/ИНН/КПП — шум для пожилого; ориентируется по названию', sev: '⚪' });
    t.friction.push({ step: 'добавление счёта', issue: 'две кнопки [Найти счёт]/[Указать организацию] — какой путь выбрать, не сразу очевидно', sev: '🟡' });
    personas.push(t);
  }

  await browser.close();

  console.log('\n=== Юзабилити-эмуляция: платёжные персоны ===');
  for (const t of personas) {
    console.log(`\n— ${t.name} · «${t.scenario}»`);
    console.log(`  клики: ${t.clicks} · время эмуляции: ${(t.ms / 1000).toFixed(1)} c`);
    console.log(`  путь: ${t.path.join(' → ')}`);
    for (const f of t.friction) console.log(`  ${f.sev} ${f.step}: ${f.issue}`);
  }
  const blockers = personas.flatMap((t) => t.friction.filter((f) => f.sev === '🔴'));
  console.log(`\nBlockers (🔴): ${blockers.length}`);
  process.exit(blockers.length === 0 ? 0 : 1);
}

run().catch((e) => { console.error(e); process.exit(2); });
