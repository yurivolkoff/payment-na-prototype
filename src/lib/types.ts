// Domain types for «Оплата по адресу» (неавторизованная зона).

/** Вложенное под-начисление внутри платёжного документа (как у «Кристалл»). */
export interface SubCharge {
  id: string;
  /** Организация-получатель под-начисления, напр. «ООО „ЕИРКЦ"». */
  org: string;
  /** Услуга / назначение, напр. «Содержание помещения, лифта; Уборка придомовой территории». */
  service: string;
  /** Сумма в рублях (число). */
  amount: number;
}

/** Платёжный документ (квитанция) — строка `PaymentDocCard`. */
export interface PaymentDoc {
  id: string;
  /** Наименование организации, выставившей счёт. */
  org: string;
  /** Номер лицевого счёта. */
  account: string;
  /** Услуга, напр. «Газоснабжение». */
  service: string;
  /** Сумма к оплате (рубли). */
  amount: number;
  /** Под-начисления (опционально). */
  subCharges?: SubCharge[];
  /** Поставщик ещё не выставил счёт → 0,00 ₽, чекбокс задизейблен, ⓘ-popover. */
  notIssued?: boolean;
}

/** Адрес квартиры. */
export interface AddressInfo {
  /** Полная строка адреса с квартирой, как ввёл пользователь / из мока. */
  full: string;
  /** Короткая подпись квартиры для карточки, напр. «Квартира 48». */
  apartmentTitle: string;
  /** Адрес без квартиры (улица/дом), напр. «обл. Курская, г. Курск, ул. Гайдара, д. 5». */
  street: string;
}

/** Строка результата поиска по организации. */
export interface OrgResult {
  id: string;
  name: string;
  ogrn: string;
  inn: string;
  kpp: string;
  address: string;
  /** Шаблон платёжного документа, который добавится после выбора этой организации. */
  doc: Omit<PaymentDoc, 'id'>;
}

/** Сохранённый платёжный профиль (кэш «Оплатить снова», localStorage). */
export interface SavedProfile {
  id: string;
  address: AddressInfo;
  /** Набор лицевых счетов/документов, собранных пользователем. */
  docs: PaymentDoc[];
  /** Сумма последней оплаты (число, рубли). */
  lastPaidTotal: number;
  /** Период последней оплаты, напр. «Июль 2025». */
  lastPaidPeriod: string;
}
