export function notificationOffer({ configured, owner, permission, used, dismissed }) {
  return configured && owner && used && !dismissed && permission === 'default';
}
export function updateNotification(data, scope) {
  if (data?.type !== 'APP_UPDATE' || !/^[a-f0-9]{16}$/.test(data.release || '')) return null;
  return { title: 'New update available', options: {
    body: 'Tap to open SAB TOOLS and update.', icon: new URL('icons/icon-192.png', scope).href,
    tag: 'sab-tools-update', data: { sabUpdate: true, release: data.release },
  }};
}
