import { create } from 'zustand';
import type { AddressInfo, PaymentDoc, SavedProfile } from './types';
import { PERIOD, buildFullDocSet, seedAddress } from './seed';

const LS_KEY = 'payment-na-prototype-profiles';

// ─── localStorage helpers для кэша «Оплатить снова» ──────────────────────────

function loadProfiles(): SavedProfile[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedProfile[]) : [];
  } catch {
    return [];
  }
}

function persistProfiles(profiles: SavedProfile[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(profiles));
  } catch {
    // ignore
  }
}

/** Ключ дедупликации счёта: нормализованный ЛС (без пробелов) + организация. */
function normalizeDocKey(org: string, account: string): string {
  const normAccount = account.replace(/\s+/g, '');
  const normOrg = org.trim().toLowerCase();
  return `${normOrg}::${normAccount}`;
}

// ─── Состояние текущей платёжной сессии (Экран 2) ────────────────────────────

interface PaymentSession {
  address: AddressInfo | null;
  period: string;
  docs: PaymentDoc[];
  /** id выбранных к оплате документов. */
  selected: Record<string, boolean>;
}

function emptySession(): PaymentSession {
  return { address: null, period: PERIOD, docs: [], selected: {} };
}

interface StoreState {
  session: PaymentSession;
  profiles: SavedProfile[];

  /** Старт сессии с Главной: найден один счёт по ЛС. */
  startSession: (address: AddressInfo, docs: PaymentDoc[]) => void;
  /** Восстановить сессию из сохранённого профиля (кэш). */
  restoreFromProfile: (profileId: string) => void;
  /**
   * Добавить документ в текущую сессию (по номеру или из карточки организации).
   * Дедуп: если счёт с тем же нормализованным ЛС и той же организацией уже есть —
   * не добавляет и возвращает false. Иначе добавляет и возвращает true.
   */
  addDoc: (doc: PaymentDoc) => boolean;
  /** Переключить выбор документа. */
  toggleSelected: (docId: string) => void;
  /** Итоговая сумма выбранных документов. */
  selectedTotal: () => number;
  /** Кол-во выбранных документов. */
  selectedCount: () => number;

  /** Сохранить текущую сессию как профиль (вызывается из [Оплатить]). */
  savePaidProfile: () => void;
  /** Удалить сохранённый профиль. */
  deleteProfile: (profileId: string) => void;

  // ── Демо-переключатель состояний Главной (презентационный, не продуктовый) ──
  /** Демо: очистить все профили — «пустое состояние» Главной. */
  clearProfiles: () => void;
  /** Демо: засеять профиль квартиры — «состояние с заполненной квартирой». */
  seedDemoProfile: () => void;

  // ── Хэндофф для пути B (Указать организацию → карточка → возврат) ──
  /** Сохранённый адрес для подстановки в карточку организации. */
  pendingOrgId: string | null;
  setPendingOrg: (orgId: string | null) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  session: emptySession(),
  profiles: loadProfiles(),
  pendingOrgId: null,

  startSession: (address, docs) => {
    const selected: Record<string, boolean> = {};
    for (const d of docs) {
      // По умолчанию выбраны все, кроме «счёт не выставлен».
      selected[d.id] = !d.notIssued;
    }
    set({ session: { address, period: PERIOD, docs, selected } });
  },

  restoreFromProfile: (profileId) => {
    const profile = get().profiles.find((p) => p.id === profileId);
    if (!profile) return;
    // Восстанавливаем набор счетов; начисления — актуальные (мок за текущий период).
    const docs = profile.docs.map((d) => ({ ...d }));
    const selected: Record<string, boolean> = {};
    for (const d of docs) selected[d.id] = !d.notIssued;
    set({ session: { address: profile.address, period: PERIOD, docs, selected } });
  },

  addDoc: (doc) => {
    const { session } = get();
    const key = normalizeDocKey(doc.org, doc.account);
    const exists = session.docs.some(
      (d) => normalizeDocKey(d.org, d.account) === key
    );
    if (exists) return false;
    set((s) => ({
      session: {
        ...s.session,
        docs: [...s.session.docs, doc],
        selected: { ...s.session.selected, [doc.id]: !doc.notIssued },
      },
    }));
    return true;
  },

  toggleSelected: (docId) =>
    set((s) => {
      const doc = s.session.docs.find((d) => d.id === docId);
      if (!doc || doc.notIssued) return s; // «не выставлен счёт» — нельзя выбрать.
      return {
        session: {
          ...s.session,
          selected: { ...s.session.selected, [docId]: !s.session.selected[docId] },
        },
      };
    }),

  selectedTotal: () => {
    const { docs, selected } = get().session;
    return docs.reduce((sum, d) => (selected[d.id] ? sum + d.amount : sum), 0);
  },

  selectedCount: () => {
    const { docs, selected } = get().session;
    return docs.reduce((n, d) => (selected[d.id] ? n + 1 : n), 0);
  },

  savePaidProfile: () => {
    const { session, profiles } = get();
    if (!session.address) return;
    const total = get().selectedTotal();
    const newProfile: SavedProfile = {
      id: `profile-${Date.now()}`,
      address: session.address,
      docs: session.docs.map((d) => ({ ...d })),
      lastPaidTotal: total,
      lastPaidPeriod: session.period,
    };
    // Один профиль на адрес: заменяем существующий по той же квартире.
    const rest = profiles.filter((p) => p.address.full !== session.address!.full);
    const next = [newProfile, ...rest];
    persistProfiles(next);
    set({ profiles: next });
  },

  deleteProfile: (profileId) =>
    set((s) => {
      const next = s.profiles.filter((p) => p.id !== profileId);
      persistProfiles(next);
      return { profiles: next };
    }),

  setPendingOrg: (orgId) => set({ pendingOrgId: orgId }),

  clearProfiles: () =>
    set(() => {
      persistProfiles([]);
      return { profiles: [] };
    }),

  seedDemoProfile: () =>
    set(() => {
      const docs = buildFullDocSet();
      const total = docs.reduce((s, d) => (d.notIssued ? s : s + d.amount), 0);
      const profile: SavedProfile = {
        id: 'profile-demo',
        address: seedAddress,
        docs,
        lastPaidTotal: total,
        lastPaidPeriod: PERIOD,
      };
      persistProfiles([profile]);
      return { profiles: [profile] };
    }),
}));
