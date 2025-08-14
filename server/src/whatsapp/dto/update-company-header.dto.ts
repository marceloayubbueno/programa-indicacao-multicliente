import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyHeaderDto } from './create-company-header.dto';

export class UpdateCompanyHeaderDto extends PartialType(CreateCompanyHeaderDto) {}
