// One durable lock spans every network write. It has no expiry or force-unlock.
// A missing response can mean Google accepted a write: retain the lock then.
export const DELIVERY_PAUSED = 'Sheet sync is paused because another device is sending or a previous send needs recovery. Cloud receipts stay safe. Reconnecting cannot unlock it.';
export async function deliverSerially({acquire, next, write, acknowledge, release, check}) {
  const lock = await acquire();
  if (!lock) return;
  let ambiguous = false;
  try {
    for (;;) {
      await check(lock);
      const row = await next(lock);
      if (!row) return;
      try {
        await write(lock, row);
      } catch (error) {
        // Only explicit authorization rejections prove no write happened.
        ambiguous = error.definiteNoWrite !== true;
        throw error;
      }
      await acknowledge(lock, row);
    }
  } finally {
    // No write is still in flight after a confirmed response. Failure to
    // release is safe: durable state stops the next sender instead of overlap.
    if (!ambiguous) await release(lock);
  }
}
