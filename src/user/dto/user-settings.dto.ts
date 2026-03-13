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

class UserCurrencyDisplayDto {
  @IsEnum(['symbol', 'code'])
  style: 'symbol' | 'code';

  @IsEnum(['before', 'after'])
  position: 'before' | 'after';
}

class UserCurrencySettingsDto {
  @IsString()
  preferredCurrency: string;

  @ValidateNested()
  @Type(() => UserCurrencyDisplayDto)
  display: UserCurrencyDisplayDto;
}

class UserLocalizationSettingsDto {
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

class UserUiSettingsDto {
  @IsOptional()
  @IsEnum(['light', 'dark'])
  theme?: 'light' | 'dark';
}

export class UserSettingsDto {
  @ValidateNested()
  @Type(() => UserLocalizationSettingsDto)
  localization: UserLocalizationSettingsDto;

  @ValidateNested()
  @Type(() => UserCurrencySettingsDto)
  currency: UserCurrencySettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserUiSettingsDto)
  ui?: UserUiSettingsDto;

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;
}
