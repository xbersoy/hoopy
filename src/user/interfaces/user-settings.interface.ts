export interface UserLocalizationSettings {
  supportedLanguages: string[];
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1;
}

export interface UserCurrencySettings {
  preferredCurrency: string;
  display: {
    style: 'symbol' | 'code';
    position: 'before' | 'after';
  };
}

export interface UserUiSettings {
  theme?: 'light' | 'dark';
}

export interface UserSettings {
  localization: UserLocalizationSettings;
  currency: UserCurrencySettings;
  ui?: UserUiSettings;
  features?: Record<string, boolean>;
}
