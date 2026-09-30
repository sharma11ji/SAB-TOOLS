// Length is in feet. Girth is the circumference in inches, not diameter.
export function roundLogCft(length, girth) {
  const l = Number(length), g = Number(girth);
  if (!Number.isFinite(l) || !Number.isFinite(g) || l <= 0 || g <= 0) return null;
  const volume = l * g * g / 2304;
  return Number.isFinite(volume) && volume > 0 ? volume : null;
}
export function receiptTotals(rows, rate, advance) {
  const volumes = rows.map(row => roundLogCft(row.length, row.girth));
  const cft = volumes.reduce((sum, volume) => sum + (volume ?? 0), 0);
  const price = Number(rate), paid = Number(advance);
  const valid = rows.length > 0 && volumes.every(volume => volume !== null) &&
    Number.isFinite(cft) && Number.isFinite(price) && price >= 0 &&
    String(rate).trim() !== '' && Number.isFinite(paid) && paid >= 0 &&
    String(advance).trim() !== '';
  const total = Math.round(cft * price * 100) / 100;
  const deposit = Math.round(paid * 100) / 100;
  return { volumes, cft, total, advance: deposit, balance: Math.round((total - deposit) * 100) / 100,
    valid: valid && Number.isFinite(total) && Number.isSafeInteger(Math.round(total * 100)) && Number.isSafeInteger(Math.round(deposit * 100)) };
}
