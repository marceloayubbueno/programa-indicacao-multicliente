import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admins')
@UseGuards(JwtAuthGuard)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  async findAll() {
    return this.adminsService.findAll();
  }

  @Post()
  async create(@Body() body, @Req() req) {
    return this.adminsService.create(body, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body, @Req() req) {
    return this.adminsService.update(id, body, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.adminsService.remove(id, req.user);
  }
} 