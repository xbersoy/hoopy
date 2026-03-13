export interface LocalizationSettings {
  supportedLanguages: string[];
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1;
}

export interface CurrencySettings {
  preferredCurrency: string;
  display: {
    style: 'symbol' | 'code';
    position: 'before' | 'after';
  };
}

export interface UiSettings {
  theme?: 'light' | 'dark';
}

export interface CompanySettings {
  localization: LocalizationSettings;
  currency: CurrencySettings;
  ui?: UiSettings;
  features?: Record<string, boolean>;
}
