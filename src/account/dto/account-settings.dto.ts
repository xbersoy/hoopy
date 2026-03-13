import {
  IsString,
  IsArray,
  IsIn,
  IsTimeZone,
  ValidateNested,
  IsOptional,
  IsObject,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

class AccountCurrencyDisplayDto {
  @IsEnum(['symbol', 'code'])
  style: 'symbol' | 'code';

  @IsEnum(['before', 'after'])
  position: 'before' | 'after';
}

class AccountCurrencySettingsDto {
  @IsString()
  preferredCurrency: string;

  @ValidateNested()
  @Type(() => AccountCurrencyDisplayDto)
  display: AccountCurrencyDisplayDto;
}

class AccountLocalizationSettingsDto {
  @IsArray()
  @IsString({ each: true })
  supportedLanguages: string[];

  @IsString()
  defaultLanguage: string;

  @IsTimeZone()
  timezone: string;

  @IsEnum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'])
  dateFormat: string;

  @IsEnum(['12h', '24h'])
  timeFormat: '12h' | '24h';

  @IsIn([0, 1])
  weekStartsOn: 0 | 1;
}

class AccountUiSettingsDto {
  @IsOptional()
  @IsEnum(['light', 'dark'])
  theme?: 'light' | 'dark';
}

export class AccountSettingsDto {
  @ValidateNested()
  @Type(() => AccountLocalizationSettingsDto)
  localization: AccountLocalizationSettingsDto;

  @ValidateNested()
  @Type(() => AccountCurrencySettingsDto)
  currency: AccountCurrencySettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AccountUiSettingsDto)
  ui?: AccountUiSettingsDto;

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;
}
