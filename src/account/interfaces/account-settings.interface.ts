export interface AccountLocalizationSettings {
  supportedLanguages: string[];
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1;
}

export interface AccountCurrencySettings {
  preferredCurrency: string;
  display: {
    style: 'symbol' | 'code';
    position: 'before' | 'after';
  };
}

export interface AccountUiSettings {
  theme?: 'light' | 'dark';
}

export interface AccountSettings {
  localization: AccountLocalizationSettings;
  currency: AccountCurrencySettings;
  ui?: AccountUiSettings;
  features?: Record<string, boolean>;
}
