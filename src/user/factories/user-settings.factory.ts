import { UserSettings } from '../interfaces/user-settings.interface';

export const createDefaultUserSettings = (): UserSettings => ({
  localization: {
    supportedLanguages: ['en'],
    defaultLanguage: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    weekStartsOn: 1,
  },
  currency: {
    preferredCurrency: 'USD',
    display: {
      style: 'symbol',
      position: 'before',
    },
  },
});
