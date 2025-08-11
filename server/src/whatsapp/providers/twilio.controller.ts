import { Controller, Get, Post, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { CreateTwilioConfigDto, UpdateTwilioConfigDto, TestTwilioMessageDto } from './twilio-config.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('admin/whatsapp/twilio')
@UseGuards(JwtAuthGuard)
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post('config')
  async createConfig(@Body() createDto: CreateTwilioConfigDto) {
    const config = await this.twilioService.createConfig(createDto);
    return {
      success: true,
      data: config
    };
  }

  @Get('config')
  async getConfig() {
    const config = await this.twilioService.getConfig();
    return {
      success: true,
      data: config
    };
  }

  @Put('config')
  async updateConfig(@Body() updateDto: UpdateTwilioConfigDto) {
    const config = await this.twilioService.updateConfig(updateDto);
    return {
      success: true,
      data: config
    };
  }

  @Delete('config')
  async deleteConfig() {
    return this.twilioService.deleteConfig();
  }

  @Post('test-connection')
  async testConnection() {
    const result = await this.twilioService.testConnection();
    return {
      success: result.success,
      message: result.message,
      data: result
    };
  }

  @Post('test-message')
  async sendTestMessage(@Body() testDto: TestTwilioMessageDto) {
    const result = await this.twilioService.sendTestMessage(testDto);
    return {
      success: result.success,
      message: result.message,
      data: result
    };
  }

  @Get('status')
  async getStatus() {
    return this.twilioService.getStatus();
  }
}
