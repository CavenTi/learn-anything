import { zhCN } from './locales/zh-CN.js';
import { en } from './locales/en.js';
const messages = {
    'zh-CN': zhCN,
    en,
};
export function getMessages(locale) {
    return messages[locale];
}
export function detectSystemLocale() {
    const langEnv = process.env.LANG ||
        process.env.LC_ALL ||
        process.env.LANGUAGE ||
        '';
    if (/^zh[_-]/i.test(langEnv)) {
        return 'zh-CN';
    }
    return 'en';
}
export function resolveLocale(cliFlag) {
    if (cliFlag === 'zh-CN' || cliFlag === 'en') {
        return cliFlag;
    }
    if (cliFlag) {
        // Unknown locale flag — warn and fall back
        console.warn(`Unknown locale "${cliFlag}", falling back to system default.`);
    }
    return detectSystemLocale();
}
//# sourceMappingURL=index.js.map