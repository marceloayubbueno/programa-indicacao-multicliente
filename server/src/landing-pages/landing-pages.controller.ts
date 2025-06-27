import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { LandingPagesService } from './landing-pages.service';
import { LandingPage } from './entities/landing-page.schema';

@Controller('api/landing-pages')
export class LandingPagesController {
  constructor(private readonly service: LandingPagesService) {}

  @Post()
  async create(@Body() data: Partial<LandingPage>) {
    return this.service.create(data);
  }

  @Get()
  async findAll(@Query('clientId') clientId?: string) {
    return this.service.findAll(clientId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<LandingPage>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// Endpoint público para buscar por slug
import { Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('lp')
export class PublicLandingPageController {
  constructor(private readonly service: LandingPagesService) {}

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string, @Res() res: Response) {
    const lp = await this.service.findBySlug(slug);
    if (!lp) return res.status(404).send('Landing page não encontrada');
    // Aqui pode-se renderizar um template ou retornar o JSON para o frontend montar a página
    return res.json(lp);
  }
} 