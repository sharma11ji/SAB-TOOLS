const positive = value => String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0;
const price = value => String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0;
export function woodCalculation(kind, system, fields) {
  if (!['size','door','round'].includes(kind) || !['imperial','metric'].includes(system)) return null;
  const keys = kind === 'size' ? ['length','width','thickness'] : kind === 'door' ? ['length','width'] : ['length','girth'];
  if (!keys.every(key => positive(fields[key])) || !positive(fields.pieces) || !Number.isSafeInteger(Number(fields.pieces)) || !price(fields.rate)) return null;
  const f = Object.fromEntries(Object.entries(fields).map(([key,value]) => [key, Number(value)]));
  const metric = system === 'metric';
  let perPiece;
  if (kind === 'size') perPiece = metric ? f.length * (f.width / 100) * (f.thickness / 100) : f.length * f.width * f.thickness / 144;
  // Door dimensions both use feet or metres. Logs retain the receipt's quarter-girth method.
  else if (kind === 'door') perPiece = f.length * f.width;
  else perPiece = metric ? f.length * (f.girth / 400) ** 2 : f.length * f.girth ** 2 / 2304;
  const quantity = perPiece * f.pieces;
  const amount = Math.round((quantity * f.rate + Number.EPSILON) * 100) / 100;
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isSafeInteger(Math.round(amount * 100))) return null;
  return {perPiece, quantity, amount, unit: kind === 'door' ? (metric ? 'sq m' : 'sq ft') : (metric ? 'CBM' : 'CFT')};
}
