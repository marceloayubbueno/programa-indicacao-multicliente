import { Controller, Post, Body, Get, UseGuards, Request, Logger } from '@nestjs/common';
import { IndicatorAuthService } from './indicator-auth.service';
import { JwtIndicatorAuthGuard } from './guards/jwt-indicator-auth.guard';

@Controller('indicator-auth')
export class IndicatorAuthController {
  private readonly logger = new Logger(IndicatorAuthController.name);

  constructor(private readonly indicatorAuthService: IndicatorAuthService) {}

  /**
   * Login de indicador
   * POST /indicator-auth/login
   */
  @Post('login')
  async login(@Body() body: { email: string; referralCode?: string }) {
    this.logger.log(`Tentativa de login do indicador: ${body.email}`);
    
    try {
      const result = await this.indicatorAuthService.login(body.email, body.referralCode);
      
      if (result.success) {
        this.logger.log(`✅ Login bem-sucedido: ${body.email}`);
      } else {
        this.logger.warn(`❌ Falha no login: ${body.email} - ${result.message}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`💥 Erro no login: ${error.message}`);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Verificar token do indicador
   * GET /indicator-auth/me
   */
  @UseGuards(JwtIndicatorAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    this.logger.log(`Verificando perfil do indicador: ${req.user.id}`);
    
    try {
      const profile = await this.indicatorAuthService.getProfile(req.user.id);
      return {
        success: true,
        data: profile
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar perfil: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao buscar perfil'
      };
    }
  }

  /**
   * Dashboard do indicador
   * GET /indicator-auth/dashboard
   */
  @UseGuards(JwtIndicatorAuthGuard)
  @Get('dashboard')
  async getDashboard(@Request() req) {
    this.logger.log(`Carregando dashboard do indicador: ${req.user.id}`);
    
    try {
      const dashboard = await this.indicatorAuthService.getDashboard(req.user.id);
      return {
        success: true,
        data: dashboard
      };
    } catch (error) {
      this.logger.error(`Erro ao carregar dashboard: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao carregar dashboard'
      };
    }
  }

  /**
   * Listar indicações do indicador
   * GET /indicator-auth/referrals
   */
  @UseGuards(JwtIndicatorAuthGuard)
  @Get('referrals')
  async getReferrals(@Request() req) {
    this.logger.log(`Listando indicações do indicador: ${req.user.id}`);
    
    try {
      const referrals = await this.indicatorAuthService.getReferrals(req.user.id);
      return {
        success: true,
        data: referrals
      };
    } catch (error) {
      this.logger.error(`Erro ao listar indicações: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao listar indicações'
      };
    }
  }

  /**
   * Buscar recompensas do indicador
   * GET /indicator-auth/rewards
   */
  @UseGuards(JwtIndicatorAuthGuard)
  @Get('rewards')
  async getRewards(@Request() req) {
    this.logger.log(`Buscando recompensas do indicador: ${req.user.id}`);
    
    try {
      const rewards = await this.indicatorAuthService.getRewards(req.user.id);
      return {
        success: true,
        data: rewards
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar recompensas: ${error.message}`);
      return {
        success: false,
        message: 'Erro ao buscar recompensas'
      };
    }
  }
} 