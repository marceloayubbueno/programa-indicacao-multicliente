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
    const dtoWithClientId = { ...createCompanyHeaderDto, clientId };
    return this.companyHeaderService.create(dtoWithClientId);
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
    console.log('🔍 [DEBUG] PUT /whatsapp/company-header - Iniciando...');
    console.log('🔍 [DEBUG] clientId recebido:', clientId);
    console.log('🔍 [DEBUG] dados recebidos:', JSON.stringify(updateCompanyHeaderDto, null, 2));
    
    try {
      const config = await this.companyHeaderService.upsertByClientId(clientId, updateCompanyHeaderDto as CreateCompanyHeaderDto);
      console.log('✅ [DEBUG] Configuração salva com sucesso:', config);
      return { message: 'Configuração atualizada com sucesso', data: config };
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao salvar:', error);
      throw error;
    }
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
