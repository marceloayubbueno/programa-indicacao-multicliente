import { Controller, Get, Post, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { EvolutionService } from './evolution.service';
import { CreateEvolutionConfigDto, UpdateEvolutionConfigDto, TestEvolutionMessageDto } from './evolution-config.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('admin/whatsapp/evolution')
@UseGuards(JwtAuthGuard)
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}

  @Post('config')
  async createConfig(@Body() createDto: CreateEvolutionConfigDto) {
    const config = await this.evolutionService.createConfig(createDto);
    return {
      success: true,
      data: config
    };
  }

  @Get('config')
  async getConfig() {
    const config = await this.evolutionService.getConfig();
    return {
      success: true,
      data: config
    };
  }

  @Put('config')
  async updateConfig(@Body() updateDto: UpdateEvolutionConfigDto) {
    const config = await this.evolutionService.updateConfig(updateDto);
    return {
      success: true,
      data: config
    };
  }

  @Delete('config')
  async deleteConfig() {
    await this.evolutionService.deleteConfig();
    return {
      success: true,
      message: 'Configuração Evolution API removida com sucesso'
    };
  }

  @Post('test-connection')
  async testConnection() {
    const result = await this.evolutionService.testConnection();
    return {
      success: result.success,
      message: result.message,
      data: result
    };
  }

  @Post('test-message')
  async sendTestMessage(@Body() testDto: TestEvolutionMessageDto) {
    const result = await this.evolutionService.sendTestMessage(testDto);
    return {
      success: result.success,
      message: result.message,
      data: result
    };
  }

  @Get('status')
  async getStatus() {
    const status = await this.evolutionService.getStatus();
    return {
      success: true,
      data: status
    };
  }
}
