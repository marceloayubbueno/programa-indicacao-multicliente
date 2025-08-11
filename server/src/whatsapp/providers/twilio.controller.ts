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
    return this.twilioService.createConfig(createDto);
  }

  @Get('config')
  async getConfig() {
    return this.twilioService.getConfig();
  }

  @Put('config')
  async updateConfig(@Body() updateDto: UpdateTwilioConfigDto) {
    return this.twilioService.updateConfig(updateDto);
  }

  @Delete('config')
  async deleteConfig() {
    return this.twilioService.deleteConfig();
  }

  @Post('test-connection')
  async testConnection() {
    return this.twilioService.testConnection();
  }

  @Post('test-message')
  async sendTestMessage(@Body() testDto: TestTwilioMessageDto) {
    return this.twilioService.sendTestMessage(testDto);
  }

  @Get('status')
  async getStatus() {
    return this.twilioService.getStatus();
  }
}
