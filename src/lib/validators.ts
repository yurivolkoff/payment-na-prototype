export const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRe = /^\+?[0-9\s\-()]{7,}$/;
export const shareRe = /^(\d{1,4}\/\d{1,4}|\d{1,4})$/;

export function validateRequired(v: string): string | null {
  return v.trim().length === 0 ? 'Поле обязательно для заполнения' : null;
}
export function validateEmail(v: string): string | null {
  return emailRe.test(v.trim()) ? null : 'Укажите email в формате name@example.com';
}
export function validatePhone(v: string): string | null {
  return phoneRe.test(v.trim()) ? null : 'Укажите телефон в формате +7 XXX XXX-XX-XX';
}
export function validateShare(v: string): string | null {
  return shareRe.test(v.trim()) ? null : 'Укажите долю в формате 1/2 или 1';
}
