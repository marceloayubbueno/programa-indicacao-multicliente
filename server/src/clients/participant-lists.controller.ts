import { Controller, Post, Body, Patch, Param, Get, Query, Delete, UseGuards } from '@nestjs/common';
import { ParticipantListsService } from './participant-lists.service';
import { CreateParticipantListDto } from './dto/create-participant-list.dto';
import { UpdateParticipantListDto } from './dto/update-participant-list.dto';
import { ParticipantsService } from './participants.service';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

@Controller('participant-lists')
export class ParticipantListsController {
  constructor(
    private readonly participantListsService: ParticipantListsService,
    private readonly participantsService: ParticipantsService
  ) {}

  @UseGuards(JwtClientAuthGuard)
  @Post()
  async create(
    @Body() dto: CreateParticipantListDto,
    @ClientId() clientId: string
  ) {
    // 🔒 SEGURANÇA: Garantir que a lista seja criada para o cliente correto
    const listData = { ...dto, clientId };
    console.log('[CONTROLLER] Criando lista para cliente:', clientId, 'dados:', listData);
    return this.participantListsService.create(listData);
  }

  @UseGuards(JwtClientAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() dto: UpdateParticipantListDto,
    @ClientId() clientId: string
  ) {
    // 🔒 SEGURANÇA: Usar clientId do JWT
    return this.participantListsService.update(id, dto);
  }

  @UseGuards(JwtClientAuthGuard)
  @Get()
  async findAll(@ClientId() clientId: string) {
    // 🔒 SEGURANÇA: Usar clientId do JWT
    return this.participantListsService.findAll(clientId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    console.log('[CONTROLLER] GET /participant-lists/:id chamado com ID:', id);
    const result = await this.participantListsService.findById(id);
    console.log('[CONTROLLER] Resultado do service:', {
      hasParticipants: (result?.participants?.length || 0) > 0,
      participantCount: result?.participants?.length || 0,
      firstParticipantType: result?.participants?.[0] ? typeof result.participants[0] : 'undefined'
    });
    return result;
  }

  @Post(':id/add-participant/:participantId')
  async addParticipant(@Param('id') id: string, @Param('participantId') participantId: string) {
    return this.participantListsService.addParticipant(id, participantId);
  }

  @Post(':id/remove-participant/:participantId')
  async removeParticipant(@Param('id') id: string, @Param('participantId') participantId: string) {
    return this.participantListsService.removeParticipant(id, participantId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.participantListsService.remove(id);
  }

  @Get(':id/participants/count')
  async countParticipants(@Param('id') id: string) {
    return { count: await this.participantsService.countByList(id) };
  }

  @Post(':id/participants')
  async addParticipantToList(@Param('id') listId: string, @Body() body: { participantId: string }) {
    console.log('[CONTROLLER] POST /participant-lists/:id/participants');
    console.log('[CONTROLLER] listId:', listId, 'body:', body);
    return this.participantListsService.addParticipant(listId, body.participantId);
  }
} 