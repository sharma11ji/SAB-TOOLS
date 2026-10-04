import packageInfo from '../package.json' with {type:'json'};
export const APP_VERSION = packageInfo.version;
export const APP_URL = 'https://sharma11ji.github.io/SAB-TOOLS/';
export const MENU_MAIN = [['Home','Home','home'],['Help','Help','help'],['SaveInvoice','Save invoice','save'],['Profile','Profile','profile'],['Language','Select your language','language'],['Manual','User manual','manual']];
export const MENU_SUPPORT = [['Share','Share App','share'],['Rate','Rate this app','star'],['Privacy','Privacy policy','lock'],['Bug','Bug report','bug']];
export async function shareApp(platform = navigator) {
 if (typeof platform.share === 'function') {
  try {await platform.share({title:'SAB TOOLS',url:APP_URL});return 'Shared.';}
  catch(error) {if(error.name === 'AbortError') return '';}
 }
 if (typeof platform.clipboard?.writeText === 'function') {
  try {await platform.clipboard.writeText(APP_URL);return 'App link copied.';} catch {}
 }
 return `Copy this link: ${APP_URL}`;
}
