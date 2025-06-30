import { Controller, Post, Body, Patch, Param, Get, Query, UseGuards, Request, Delete } from '@nestjs/common';
import { ParticipantsService } from './participants.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { ImportParticipantsDto } from './dto/import-participants.dto';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @UseGuards(JwtClientAuthGuard)
  @Post()
  async create(
    @Body() dto: CreateParticipantDto,
    @ClientId() clientId: string // 🚀 NOVO: ClientId automático do JWT
  ) {
    // 🔒 SEGURANÇA: Garantir que o participante seja criado para o cliente correto
    const participantData = { ...dto, clientId };
    return this.participantsService.create(participantData);
  }

  // Endpoint público para formulário externo
  @Post('external')
  async createExternal(@Body() dto: CreateParticipantDto) {
    // Pode adicionar lógica extra de validação/captcha aqui
    return this.participantsService.create(dto);
  }

  @UseGuards(JwtClientAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateParticipantDto,
    @ClientId() clientId: string // 🔒 SEGURANÇA: Validar ownership
  ) {
    // 🔒 SEGURANÇA: Verificar se o participante pertence ao cliente
    const participant = await this.participantsService.findById(id);
    if (!participant || participant.clientId.toString() !== clientId) {
      return {
        success: false,
        message: 'Participante não encontrado ou não pertence ao cliente'
      };
    }
    return this.participantsService.update(id, dto);
  }

  @UseGuards(JwtClientAuthGuard)
  @Get()
  async findAll(
    @ClientId() clientId: string, // 🚀 NOVO: ClientId automático do JWT
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query() query: any
  ) {
    // 🔍 DEBUG BACKEND - Log da requisição
    console.log('🔍 DEBUG BACKEND CONTROLLER - ClientId:', clientId);
    console.log('🔍 DEBUG BACKEND CONTROLLER - Page:', page, 'Limit:', limit);
    console.log('🔍 DEBUG BACKEND CONTROLLER - Query params:', query);
    
    // 🔍 H2 - DIAGNÓSTICO FILTROS RECEBIDOS BACKEND
    console.log('🔍 H2 - FILTROS RECEBIDOS BACKEND:', {
      allQueryParams: query,
      hasListId: !!query.listId,
      listIdValue: query.listId || 'VAZIO',
      listIdType: typeof query.listId,
      otherFilters: Object.keys(query).filter(key => !['clientId', 'page', 'limit'].includes(key))
    });
    
    // Remove parâmetros de paginação/filtro do filtro real
    const { clientId: cId, page: p, limit: l, ...filter } = query;
    
    console.log('🔍 DEBUG BACKEND CONTROLLER - Filter after cleanup:', filter);
    
    // 🔍 H2 - DIAGNÓSTICO FILTRO LIMPO
    console.log('🔍 H2 - FILTRO APÓS LIMPEZA:', {
      filterAfterCleanup: filter,
      hasListIdAfterCleanup: !!filter.listId,
      listIdAfterCleanup: filter.listId || 'VAZIO'
    });
    
    // 🔒 SEGURANÇA: Usar clientId do JWT, ignorando qualquer tentativa de override via query
    const result = await this.participantsService.findAll(clientId, Number(page), Number(limit), filter);
    
    console.log('🔍 DEBUG BACKEND CONTROLLER - Result summary:', {
      participantsCount: result.participants?.length,
      page: result.page,
      totalPages: result.totalPages,
      hasParticipants: result.participants?.length > 0
    });
    
    return result;
  }

  @UseGuards(JwtClientAuthGuard)
  @Post('import')
  async importMany(
    @Body() dto: ImportParticipantsDto,
    @ClientId() clientId: string // 🚀 NOVO: ClientId automático do JWT
  ) {
    // 🔒 SEGURANÇA: Garantir que a importação seja para o cliente correto
    const importData = { ...dto, clientId };
    return this.participantsService.importMany(importData);
  }

  // @UseGuards(JwtClientAuthGuard)
  @Post(':id/add-to-list/:listId')
  async addToList(@Param('id') id: string, @Param('listId') listId: string) {
    return this.participantsService.addToList(id, listId);
  }

  // @UseGuards(JwtClientAuthGuard)
  @Post(':id/remove-from-list/:listId')
  async removeFromList(@Param('id') id: string, @Param('listId') listId: string) {
    return this.participantsService.removeFromList(id, listId);
  }

  // === ENDPOINTS ESPECÍFICOS (DEVEM VIR ANTES DOS GENÉRICOS) ===

  /**
   * 🚀 ATUALIZADO: Listar indicadores com links (ClientId automático do JWT)
   * GET /participants/indicators-with-links
   */
  @UseGuards(JwtClientAuthGuard)
  @Get('indicators-with-links')
  async getIndicatorsWithLinks(@ClientId() clientId: string) {
    try {
      // 🔒 SEGURANÇA: ClientId vem automaticamente do JWT
      const indicators = await this.participantsService.findIndicatorsWithLinks(clientId);
      return {
        success: true,
        total: indicators.length,
        indicators,
        message: `${indicators.length} indicadores encontrados`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Erro ao listar indicadores'
      };
    }
  }

  /**
   * TESTE: Validar código de referral
   * GET /participants/validate-referral/:code
   */
  @Get('validate-referral/:code')
  async validateReferralCode(@Param('code') code: string) {
    try {
      const validation = await this.participantsService.validateReferralCode(code);
      
      return {
        success: true,
        data: validation
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * TESTE: Buscar indicador por código
   * GET /participants/by-referral-code/:code
   */
  @Get('by-referral-code/:code')
  async findByReferralCode(@Param('code') code: string) {
    try {
      const participant = await this.participantsService.findByReferralCode(code);
      return {
        success: !!participant,
        participant: participant ? {
          id: participant._id,
          name: participant.name,
          email: participant.email,
          phone: participant.phone,
          referralCode: participant.uniqueReferralCode,
          totalIndicacoes: participant.totalIndicacoes || 0,
          indicacoesAprovadas: participant.indicacoesAprovadas || 0,
          campaign: participant.campaignName || 'N/A'
        } : null,
        message: participant ? 'Indicador encontrado' : 'Indicador não encontrado'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Erro ao buscar indicador'
      };
    }
  }

  @Get('/../indicators')
  async findIndicators() {
    return this.participantsService.findIndicators();
  }

  @Get('debug')
  @UseGuards(JwtClientAuthGuard)
  async debugAllParticipants(@ClientId() clientId: string) {
    try {
      console.log('🔍 DEBUG ENDPOINT - ClientId:', clientId);
      
      // Versão simplificada para teste
      const allParticipants = await this.participantsService.findAll(clientId, 1, 100);
      
      console.log('🔍 DEBUG ENDPOINT - Participantes encontrados:', allParticipants.participants.length);
      
      return {
        success: true,
        data: {
          message: 'Debug endpoint funcionando',
          clientId: clientId,
          participantsCount: allParticipants.participants.length,
          totalPages: allParticipants.totalPages,
          sampleParticipants: allParticipants.participants.slice(0, 3).map(p => ({
            id: p._id,
            name: p.name,
            email: p.email,
            originSource: p.originSource || 'undefined',
            tipo: p.tipo || 'undefined'
          }))
        }
      };
    } catch (error) {
      console.error('❌ ERRO no debug endpoint:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  // === ENDPOINTS GENÉRICOS (DEVEM VIR DEPOIS DOS ESPECÍFICOS) ===

  /**
   * Gera ou regenera código único de referência para um indicador
   */
  @Post(':id/generate-referral-code')
  async generateReferralCode(@Param('id') id: string) {
    try {
      const referralCode = await this.participantsService.generateReferralCode(id);
      
      if (!referralCode) {
        return {
          success: false,
          error: 'Não foi possível gerar código de referência'
        };
      }

      // Construir URL completa do link
      const baseUrl = process.env.BACKEND_URL || 'https://programa-indicacao-multicliente-production.up.railway.app';
      const referralLink = `${baseUrl}/indicacao/${referralCode}`;

      return {
        success: true,
        referralCode,
        referralLink,
        message: 'Código de referência gerado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro interno ao gerar código'
      };
    }
  }

  // @UseGuards(JwtClientAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.participantsService.findById(id);
  }

  // @UseGuards(JwtClientAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.participantsService.remove(id);
  }
} 