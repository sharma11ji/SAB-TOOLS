// Length is in feet. Girth is the circumference in inches, not diameter.
export function roundLogCft(length, girth) {
  const l = Number(length), g = Number(girth);
  if (!Number.isFinite(l) || !Number.isFinite(g) || l <= 0 || g <= 0) return null;
  const volume = l * g * g / 2304;
  return Number.isFinite(volume) && volume > 0 ? volume : null;
}
const nonnegative = value => String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
const paise = value => Math.round((value + Number.EPSILON) * 100) / 100;
export function receiptTotals(rows, rate, advance, labour = '0', transport = '0') {
  const volumes = rows.map(row => roundLogCft(row.length, row.girth));
  const rates = rows.map(row => row.rate ?? rate);
  const amounts = volumes.map((volume, i) => paise((volume ?? 0) * Number(rates[i])));
  const cft = volumes.reduce((sum, volume) => sum + (volume ?? 0), 0);
  const woodValue = paise(amounts.reduce((sum, value) => sum + value, 0));
  const total = paise(woodValue + Number(labour) + Number(transport));
  const paid = paise(Number(advance));
  const valid = rows.length > 0 && volumes.every(volume => volume !== null) &&
    Number.isFinite(cft) && rates.every(nonnegative) && [advance, labour, transport].every(nonnegative) &&
    amounts.every(value => Number.isSafeInteger(Math.round(value * 100))) &&
    Number.isSafeInteger(Math.round(total * 100)) && Number.isSafeInteger(Math.round(paid * 100));
  return { volumes, amounts, cft, woodValue, total, labour: paise(Number(labour)), transport: paise(Number(transport)), advance: paid, balance: paise(total - paid), valid };
}
