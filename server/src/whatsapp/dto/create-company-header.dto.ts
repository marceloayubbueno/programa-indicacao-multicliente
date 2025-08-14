import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCompanyHeaderDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsNotEmpty()
  companyInfo: {
    name: string;
    description?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
  };

  @IsNotEmpty()
  socialMedia: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    whatsapp?: string;
  };

  @IsNotEmpty()
  headerConfig: {
    enabled: boolean;
    separator: string;
    customText?: string;
  };

  @IsNotEmpty()
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
