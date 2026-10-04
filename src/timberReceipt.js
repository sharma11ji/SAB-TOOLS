// Length is in feet. Girth is the circumference in inches, not diameter.
export function roundLogCft(length, girth) {
  const l = Number(length), g = Number(girth);
  if (!Number.isFinite(l) || !Number.isFinite(g) || l <= 0 || g <= 0) return null;
  const volume = l * g * g / 2304;
  return Number.isFinite(volume) && volume > 0 ? volume : null;
}
export const CBM_TO_CFT = 35.3147;
export const receiptUnit = value => value === 'CBM' ? 'CBM' : 'CFT';
export const cftToUnit = (cft, unit) => receiptUnit(unit) === 'CBM' ? cft / CBM_TO_CFT : cft;
const nonnegative = value => String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
const paise = value => Math.round((value + Number.EPSILON) * 100) / 100;
export function receiptTotals(rows, rate, advance, labour = '0', transport = '0', unit = 'CFT') {
  const u = receiptUnit(unit);
  const cfts = rows.map(row => roundLogCft(row.length, row.girth));
  const volumes = cfts.map(v => v === null ? null : cftToUnit(v, u));
  const rates = rows.map(row => row.rate ?? rate);
  const amounts = volumes.map((volume, i) => paise((volume ?? 0) * Number(rates[i])));
  const cft = cfts.reduce((sum, volume) => sum + (volume ?? 0), 0);
  const volume = volumes.reduce((sum, v) => sum + (v ?? 0), 0);
  const woodValue = paise(amounts.reduce((sum, value) => sum + value, 0));
  const total = paise(woodValue + Number(labour) + Number(transport));
  const paid = paise(Number(advance));
  const valid = rows.length > 0 && cfts.every(volume => volume !== null) &&
    Number.isFinite(cft) && Number.isFinite(volume) && rates.every(nonnegative) && [advance, labour, transport].every(nonnegative) &&
    amounts.every(value => Number.isSafeInteger(Math.round(value * 100))) &&
    Number.isSafeInteger(Math.round(total * 100)) && Number.isSafeInteger(Math.round(paid * 100));
  return { unit: u, volumes, volume, amounts, cft, woodValue, total, labour: paise(Number(labour)), transport: paise(Number(transport)), advance: paid, balance: paise(total - paid), valid };
}
