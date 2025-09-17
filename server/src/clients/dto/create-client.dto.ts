import { IsString, IsNotEmpty, IsEmail, IsOptional, IsIn, ValidateIf } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ValidateIf(o => o.plan !== 'trial' && o.plan !== 'Trial' && !o.plan?.toString().includes('trial'))
  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsNotEmpty()
  responsibleName: string;

  @IsString()
  @IsNotEmpty()
  responsiblePhone: string;

  @IsString()
  @IsNotEmpty()
  responsiblePosition: string;

  @IsEmail()
  @IsNotEmpty()
  responsibleEmail: string;

  @IsString()
  @IsNotEmpty()
  responsibleCPF: string;

  @IsString()
  @IsNotEmpty()
  cep: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsOptional()
  complement?: string;

  @IsString()
  @IsNotEmpty()
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsEmail()
  @IsNotEmpty()
  accessEmail: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  plan: string;

  @IsString()
  @IsIn(['pendente', 'ativo', 'inativo'])
  status: string;

  @IsString()
  @IsOptional()
  employeeCount?: string;

  @IsOptional()
  profileComplete?: boolean;
} 