import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateCompanyHeaderDto {
  @IsString()
  @IsOptional()
  clientId?: string;

  companyInfo: {
    @IsString()
    @IsNotEmpty()
    name: string;
    
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
  };

  socialMedia: {
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
  };

  headerConfig: {
    @IsBoolean()
    enabled: boolean;
    
    @IsString()
    @IsNotEmpty()
    separator: string;
    
    @IsString()
    @IsOptional()
    customText?: string;
  };

  activeFields: {
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
  };
}
