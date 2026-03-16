import { AccountSettings } from '../interfaces/account-settings.interface';

export const createDefaultAccountSettings = (): AccountSettings => ({
  branding: {
    companyName: '',
  },
  localization: {
    supportedLanguages: ['en'],
    defaultLanguage: 'en',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    weekStartsOn: 1,
  },
  currency: {
    supportedCurrencies: ['USD'],
    preferredCurrency: 'USD',
    display: {
      style: 'symbol',
      position: 'before',
    },
  },
});
