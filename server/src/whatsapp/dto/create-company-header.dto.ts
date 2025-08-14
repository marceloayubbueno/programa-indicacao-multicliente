import { IsString, IsBoolean, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class CompanyInfoDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

class SocialMediaDto {
  @IsString()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsOptional()
  linkedin?: string;

  @IsString()
  @IsOptional()
  whatsapp?: string;
}

class HeaderConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  separator: string;

  @IsString()
  @IsOptional()
  customText?: string;
}

class ActiveFieldsDto {
  @IsBoolean()
  description: boolean;

  @IsBoolean()
  website: boolean;

  @IsBoolean()
  phone: boolean;

  @IsBoolean()
  email: boolean;

  @IsBoolean()
  instagram: boolean;

  @IsBoolean()
  facebook: boolean;

  @IsBoolean()
  linkedin: boolean;

  @IsBoolean()
  whatsapp: boolean;
}

export class CreateCompanyHeaderDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => CompanyInfoDto)
  companyInfo: CompanyInfoDto;

  @IsObject()
  @ValidateNested()
  @Type(() => SocialMediaDto)
  socialMedia: SocialMediaDto;

  @IsObject()
  @ValidateNested()
  @Type(() => HeaderConfigDto)
  headerConfig: HeaderConfigDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ActiveFieldsDto)
  activeFields: ActiveFieldsDto;
}
