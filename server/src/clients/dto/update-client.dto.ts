import { IsString, IsOptional, IsEmail, IsIn, IsNotEmpty } from 'class-validator';

export class UpdateClientDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  responsibleName?: string;

  @IsString()
  @IsOptional()
  responsiblePhone?: string;

  @IsString()
  @IsOptional()
  responsiblePosition?: string;

  @IsEmail()
  @IsOptional()
  responsibleEmail?: string;

  @IsString()
  @IsOptional()
  responsibleCPF?: string;

  @IsString()
  @IsOptional()
  cep?: string;

  @IsString()
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsEmail()
  @IsOptional()
  accessEmail?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  webhookMakeUrl?: string;

  @IsString()
  @IsOptional()
  plan?: string;

  @IsString()
  @IsIn(['pendente', 'ativo', 'inativo'])
  @IsOptional()
  status?: string;
} 