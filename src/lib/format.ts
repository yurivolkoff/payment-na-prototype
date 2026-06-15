/** Форматирование денег: «14 587,06 ₽» — пробел в разрядах, запятая в дробной части, ₽ через пробел. */
export function formatMoney(amount: number): string {
  const fixed = amount.toFixed(2); // «14587.06»
  const [intPart, decPart] = fixed.split('.');
  // Пробел-разделитель разрядов (неразрывный пробел U+00A0 для устойчивой вёрстки).
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped},${decPart} ₽`;
}
