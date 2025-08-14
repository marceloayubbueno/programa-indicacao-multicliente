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
    console.log('🔍 [CONTROLLER] POST /whatsapp/company-header - Iniciando...');
    console.log('🔍 [CONTROLLER] clientId recebido:', clientId);
    console.log('🔍 [CONTROLLER] dados recebidos:', JSON.stringify(createCompanyHeaderDto, null, 2));
    
    try {
      const dtoWithClientId = { ...createCompanyHeaderDto, clientId };
      const result = await this.companyHeaderService.create(dtoWithClientId);
      console.log('✅ [CONTROLLER] Configuração criada com sucesso:', result);
      return result;
    } catch (error) {
      console.error('❌ [CONTROLLER] Erro ao criar:', error);
      throw error;
    }
  }

  @Get()
  async findByClientId(@ClientId() clientId: string) {
    console.log('🔍 [CONTROLLER] GET /whatsapp/company-header - Iniciando...');
    console.log('🔍 [CONTROLLER] clientId recebido:', clientId);
    
    try {
      const config = await this.companyHeaderService.findByClientId(clientId);
      console.log('🔍 [CONTROLLER] Resultado da busca:', config ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      if (config) {
        console.log('🔍 [CONTROLLER] Dados encontrados:', JSON.stringify(config, null, 2));
      }
      
      if (!config) {
        return { message: 'Configuração não encontrada', data: null };
      }
      return { message: 'Configuração encontrada', data: config };
    } catch (error) {
      console.error('❌ [CONTROLLER] Erro ao buscar:', error);
      throw error;
    }
  }

  @Put()
  async updateByClientId(
    @Body() updateCompanyHeaderDto: UpdateCompanyHeaderDto,
    @ClientId() clientId: string,
  ) {
    console.log('🔍 [CONTROLLER] PUT /whatsapp/company-header - Iniciando...');
    console.log('🔍 [CONTROLLER] clientId recebido:', clientId);
    console.log('🔍 [CONTROLLER] dados recebidos (RAW):', JSON.stringify(updateCompanyHeaderDto, null, 2));
    
    // Validar se todos os campos obrigatórios estão presentes
    const requiredFields = ['companyInfo', 'socialMedia', 'headerConfig', 'activeFields'];
    const missingFields = requiredFields.filter(field => !updateCompanyHeaderDto[field]);
    
    if (missingFields.length > 0) {
      console.error('❌ [CONTROLLER] Campos obrigatórios ausentes:', missingFields);
      throw new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`);
    }
    
    // Validar estrutura dos dados
    console.log('🔍 [CONTROLLER] Validando estrutura dos dados...');
    console.log('🔍 [CONTROLLER] companyInfo:', updateCompanyHeaderDto.companyInfo);
    console.log('🔍 [CONTROLLER] socialMedia:', updateCompanyHeaderDto.socialMedia);
    console.log('🔍 [CONTROLLER] headerConfig:', updateCompanyHeaderDto.headerConfig);
    console.log('🔍 [CONTROLLER] activeFields:', updateCompanyHeaderDto.activeFields);
    
    try {
      const config = await this.companyHeaderService.upsertByClientId(clientId, updateCompanyHeaderDto as CreateCompanyHeaderDto);
      console.log('✅ [CONTROLLER] Configuração salva com sucesso:', config);
      return { message: 'Configuração atualizada com sucesso', data: config };
    } catch (error) {
      console.error('❌ [CONTROLLER] Erro ao salvar:', error);
      throw error;
    }
  }

  @Delete()
  async deleteByClientId(@ClientId() clientId: string) {
    console.log('🔍 [CONTROLLER] DELETE /whatsapp/company-header - Iniciando...');
    console.log('🔍 [CONTROLLER] clientId recebido:', clientId);
    
    try {
      const deleted = await this.companyHeaderService.deleteByClientId(clientId);
      console.log('🔍 [CONTROLLER] Resultado da exclusão:', deleted ? 'EXCLUÍDO' : 'NÃO ENCONTRADO');
      
      if (deleted) {
        return { message: 'Configuração removida com sucesso' };
      }
      return { message: 'Configuração não encontrada' };
    } catch (error) {
      console.error('❌ [CONTROLLER] Erro ao excluir:', error);
      throw error;
    }
  }

  @Get('active')
  async findActiveByClientId(@ClientId() clientId: string) {
    console.log('🔍 [CONTROLLER] GET /whatsapp/company-header/active - Iniciando...');
    console.log('🔍 [CONTROLLER] clientId recebido:', clientId);
    
    try {
      const config = await this.companyHeaderService.findActiveByClientId(clientId);
      console.log('🔍 [CONTROLLER] Resultado da busca ativa:', config ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      
      if (!config) {
        return { message: 'Configuração ativa não encontrada', data: null };
      }
      return { message: 'Configuração ativa encontrada', data: config };
    } catch (error) {
      console.error('❌ [CONTROLLER] Erro ao buscar ativo:', error);
      throw error;
    }
  }
}
