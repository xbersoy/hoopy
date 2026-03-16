import { CompanySettings } from '../interfaces/company-settings.interface';

export const createDefaultCompanySettings = (): CompanySettings => ({
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
