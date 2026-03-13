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

class CurrencyDisplayDto {
  @IsEnum(['symbol', 'code'])
  style: 'symbol' | 'code';

  @IsEnum(['before', 'after'])
  position: 'before' | 'after';
}

class CurrencySettingsDto {
  @IsString()
  // Could add a custom decorator for ISO code validation here if strictly needed, keeping it as string for now
  preferredCurrency: string;

  @ValidateNested()
  @Type(() => CurrencyDisplayDto)
  display: CurrencyDisplayDto;
}

class LocalizationSettingsDto {
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

class UiSettingsDto {
  @IsOptional()
  @IsEnum(['light', 'dark'])
  theme?: 'light' | 'dark';
}

export class CompanySettingsDto {
  @ValidateNested()
  @Type(() => LocalizationSettingsDto)
  localization: LocalizationSettingsDto;

  @ValidateNested()
  @Type(() => CurrencySettingsDto)
  currency: CurrencySettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UiSettingsDto)
  ui?: UiSettingsDto;

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;
}
