import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateCompanyHeaderDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  companyInfo: {
    name: string;
    description?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
  };

  socialMedia: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    whatsapp?: string;
  };

  headerConfig: {
    enabled: boolean;
    separator: string;
    customText?: string;
  };

  activeFields: {
    description: boolean;
    website: boolean;
    phone: boolean;
    email: boolean;
    instagram: boolean;
    facebook: boolean;
    linkedin: boolean;
    whatsapp: boolean;
  };
}
