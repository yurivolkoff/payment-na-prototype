import type { AddressInfo, OrgResult, PaymentDoc } from './types';

/** Текущий период начислений (мок). */
export const PERIOD = 'Июль 2025';

/** Основной адрес из макета. */
export const seedAddress: AddressInfo = {
  full: 'Квартира 48, обл. Курская, г. Курск, ул. Гайдара, д. 5',
  apartmentTitle: 'Квартира 48',
  street: 'обл. Курская, г. Курск, ул. Гайдара, д. 5',
};

/** Дополнительный адрес — для проверки нескольких профилей в кэше. */
export const seedAddressAlt: AddressInfo = {
  full: 'Квартира 12, г. Курск, ул. Ленина, д. 14',
  apartmentTitle: 'Квартира 12',
  street: 'г. Курск, ул. Ленина, д. 14',
};

let docSeq = 0;
/** Уникальный id для платёжного документа. */
export function nextDocId(): string {
  docSeq += 1;
  return `doc-${docSeq}-${Date.now()}`;
}

// ─── Платёжные документы основной квартиры ──────────────────────────────────

/** Газпром — находится по номеру с Главной (первый найденный счёт). */
export function buildGazpromDoc(account = '101001090'): PaymentDoc {
  return {
    id: nextDocId(),
    org: 'АО «Газпром газораспределение Курск»',
    account,
    service: 'Газоснабжение',
    amount: 7293.53,
  };
}

/** Кристалл — с вложенными под-начислениями (ЕИРКЦ + капремонт). */
export function buildKristallDoc(): PaymentDoc {
  return {
    id: nextDocId(),
    org: 'ООО «Кристалл»',
    account: '1022345701 23',
    service: '',
    amount: 6566.33,
    subCharges: [
      {
        id: 'sub-eirkc',
        org: 'ООО «ЕИРКЦ»',
        service: 'Содержание помещения, лифта; Уборка придомовой территории',
        amount: 4977.52,
      },
      {
        id: 'sub-kapremont',
        org: 'ООО «Кристалл»',
        service: 'Взнос на капитальный ремонт',
        amount: 1588.81,
      },
    ],
  };
}

/** Экопол — поставщик ещё не выставил счёт (0,00 ₽, чекбокс задизейблен). */
export function buildEkopolDoc(): PaymentDoc {
  return {
    id: nextDocId(),
    org: 'ООО «Экопол»',
    account: '001234567890',
    service: 'ТКО',
    amount: 0,
    notIssued: true,
  };
}

/** Полный набор документов квартиры (для восстановления из кэша «Оплатить снова»). */
export function buildFullDocSet(): PaymentDoc[] {
  return [buildGazpromDoc(), buildKristallDoc(), buildEkopolDoc()];
}

/** Итог полной корзины: 14 587,06 ₽. */
export const FULL_BASKET_TOTAL = 14587.06;

/** Курскэнергосбыт — демонстрационный «находимый» счёт по электроснабжению. */
export function buildKurskenergoDoc(account = '770050010101'): PaymentDoc {
  return {
    id: nextDocId(),
    org: 'ПАО «Курскэнергосбыт»',
    account,
    service: 'Электроснабжение',
    amount: 2143.7,
  };
}

// ─── Поиск счёта по номеру (блок «Оплатить несколько счетов» на Экране 2) ────

/**
 * Мок поиска счёта по номеру лицевого счёта.
 * Возвращает документ, если номер «найден», иначе null.
 */
export function findDocByAccount(account: string): PaymentDoc | null {
  const a = account.trim();
  // Кристалл — находится по своему номеру.
  if (a === '1022345701' || a === '102234570123' || a === '1022345701 23') {
    return buildKristallDoc();
  }
  // Экопол — находится по своему номеру (но счёт ещё не выставлен).
  if (a === '001234567890') {
    return buildEkopolDoc();
  }
  // Демонстрационный «находимый» счёт — Курскэнергосбыт.
  if (a === '770050010101' || a === '7700500101') {
    return buildKurskenergoDoc(a);
  }
  return null;
}

/**
 * Поиск счёта по номеру ЛС на Главной.
 * Известные номера дают конкретный счёт; неизвестный → null (инлайн-ошибка).
 * Не подставляет Газпром на любой ввод.
 */
export function findHomeDocByAccount(account: string): PaymentDoc | null {
  const a = account.trim();
  // Газпром — основной находимый счёт макета.
  if (a === '101001090') {
    return buildGazpromDoc(a);
  }
  // Остальные находимые номера — общий мок поиска по номеру.
  return findDocByAccount(a);
}

// ─── Поиск по организации (Экран 3) ─────────────────────────────────────────

export const seedOrgs: OrgResult[] = [
  {
    id: 'org-gazprom',
    name: 'АО «Газпром газораспределение Курск»',
    ogrn: '1024600945556',
    inn: '4629044317',
    kpp: '463201001',
    address: 'обл. Курская, г. Курск, ул. Ленина, д. 12',
    doc: {
      org: 'АО «Газпром газораспределение Курск»',
      account: '101001090',
      service: 'Газоснабжение',
      amount: 7293.53,
    },
  },
  {
    id: 'org-kvadra',
    name: 'ПАО «Квадра — Курская генерация»',
    ogrn: '1056882304489',
    inn: '6829012680',
    kpp: '463245001',
    address: 'обл. Курская, г. Курск, ул. Дзержинского, д. 28',
    doc: {
      org: 'ПАО «Квадра — Курская генерация»',
      account: '440120030',
      service: 'Отопление, горячее водоснабжение',
      amount: 3842.19,
    },
  },
  {
    id: 'org-vodokanal',
    name: 'МУП «Курскводоканал»',
    ogrn: '1024600964483',
    inn: '4629001503',
    kpp: '463201001',
    address: 'обл. Курская, г. Курск, ул. Карла Маркса, д. 70б',
    doc: {
      org: 'МУП «Курскводоканал»',
      account: '550030022',
      service: 'Холодное водоснабжение, водоотведение',
      amount: 1276.44,
    },
  },
  {
    id: 'org-ekopol',
    name: 'ООО «Экопол»',
    ogrn: '1144632012345',
    inn: '4632201234',
    kpp: '463201001',
    address: 'обл. Курская, г. Курск, пр-т Победы, д. 50',
    doc: {
      org: 'ООО «Экопол»',
      account: '001234567890',
      service: 'Обращение с ТКО',
      amount: 0,
      notIssued: true,
    },
  },
  {
    id: 'org-kristall',
    name: 'ООО «Кристалл»',
    ogrn: '1104632009876',
    inn: '4632109876',
    kpp: '463201001',
    address: 'обл. Курская, г. Курск, ул. Гайдара, д. 5',
    doc: {
      org: 'ООО «Кристалл»',
      account: '1022345701 23',
      service: 'Содержание и ремонт',
      amount: 6566.33,
      subCharges: [
        {
          id: 'sub-eirkc',
          org: 'ООО «ЕИРКЦ»',
          service: 'Содержание помещения, лифта; Уборка придомовой территории',
          amount: 4977.52,
        },
        {
          id: 'sub-kapremont',
          org: 'ООО «Кристалл»',
          service: 'Взнос на капитальный ремонт',
          amount: 1588.81,
        },
      ],
    },
  },
];

/**
 * Фильтрация организаций по запросу (название / ОГРН / ИНН / КПП).
 * Запрос «нет» / «xxx» и т.п. даёт пустой результат (empty state).
 */
export function searchOrgs(query: string): OrgResult[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return seedOrgs;
  return seedOrgs.filter(
    (o) =>
      o.name.toLowerCase().includes(q) ||
      o.ogrn.includes(q) ||
      o.inn.includes(q) ||
      o.kpp.includes(q)
  );
}
