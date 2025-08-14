import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CompanyHeaderService } from './company-header.service';
import { CreateCompanyHeaderDto } from '../dto/create-company-header.dto';
import { UpdateCompanyHeaderDto } from '../dto/update-company-header.dto';
import { JwtClientAuthGuard } from '../../auth/guards/jwt-client-auth.guard';
import { ClientId } from '../../auth/decorators/client-id.decorator';

@Controller('whatsapp/company-header')
@UseGuards(JwtClientAuthGuard)
export class CompanyHeaderController {
  constructor(private readonly companyHeaderService: CompanyHeaderService) {}

  @Post()
  async create(
    @Body() createCompanyHeaderDto: CreateCompanyHeaderDto,
    @ClientId() clientId: string,
  ) {
    createCompanyHeaderDto.clientId = clientId;
    return this.companyHeaderService.create(createCompanyHeaderDto);
  }

  @Get()
  async findByClientId(@ClientId() clientId: string) {
    const config = await this.companyHeaderService.findByClientId(clientId);
    if (!config) {
      return { message: 'Configuração não encontrada', data: null };
    }
    return { message: 'Configuração encontrada', data: config };
  }

  @Put()
  async updateByClientId(
    @Body() updateCompanyHeaderDto: UpdateCompanyHeaderDto,
    @ClientId() clientId: string,
  ) {
    const config = await this.companyHeaderService.upsertByClientId(clientId, updateCompanyHeaderDto as CreateCompanyHeaderDto);
    return { message: 'Configuração atualizada com sucesso', data: config };
  }

  @Delete()
  async deleteByClientId(@ClientId() clientId: string) {
    const deleted = await this.companyHeaderService.deleteByClientId(clientId);
    if (deleted) {
      return { message: 'Configuração removida com sucesso' };
    }
    return { message: 'Configuração não encontrada' };
  }

  @Get('active')
  async findActiveByClientId(@ClientId() clientId: string) {
    const config = await this.companyHeaderService.findActiveByClientId(clientId);
    if (!config) {
      return { message: 'Configuração ativa não encontrada', data: null };
    }
    return { message: 'Configuração ativa encontrada', data: config };
  }
}
