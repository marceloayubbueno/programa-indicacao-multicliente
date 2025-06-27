import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException, Req, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtClientAuthGuard } from '../auth/guards/jwt-client-auth.guard';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createClientDto: CreateClientDto, @Req() req) {
    // Verificar se é superadmin ou admin
    if (!req.user || (req.user.role !== 'superadmin' && req.user.role !== 'admin')) {
      throw new BadRequestException('Apenas administradores podem criar clientes');
    }
    return this.clientsService.create(createClientDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Query('page') page?: string, @Query('search') search?: string, @Req() req?) {
    // Verificar se é superadmin ou admin
    if (!req.user || (req.user.role !== 'superadmin' && req.user.role !== 'admin')) {
      throw new BadRequestException('Apenas administradores podem listar clientes');
    }
    return this.clientsService.findAll();
  }

  @UseGuards(JwtClientAuthGuard)
  @Get('me')
  async getMe(@Req() req) {
    const id = req.user?.userId || req.user?.clientId || req.user?._id || req.user?.sub;
    // Bloqueio: se trial expirou e cadastro incompleto, retorna 403
    if (await this.clientsService.isTrialExpiredAndIncomplete(id)) {
      throw new BadRequestException('Seu período de teste terminou. Complete seu cadastro ou fale com nossa equipe para continuar usando o sistema.');
    }
    const client = await this.clientsService.findOne(id);
    return client;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    // Verificar se é superadmin ou admin
    if (!req.user || (req.user.role !== 'superadmin' && req.user.role !== 'admin')) {
      throw new BadRequestException('Apenas administradores podem visualizar clientes');
    }
    return this.clientsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto, @Req() req) {
    // Verificar se é superadmin ou admin
    if (!req.user || (req.user.role !== 'superadmin' && req.user.role !== 'admin')) {
      throw new BadRequestException('Apenas administradores podem editar clientes');
    }
    return this.clientsService.update(id, updateClientDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    // Verificar se é superadmin ou admin
    if (!req.user || (req.user.role !== 'superadmin' && req.user.role !== 'admin')) {
      throw new BadRequestException('Apenas administradores podem excluir clientes');
    }
    return this.clientsService.remove(id);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('E-mail e senha são obrigatórios');
    }
    return this.clientsService.login(body.email, body.password);
  }

  @Post('trial')
  async createTrial(@Body() body: any) {
    // Campos mínimos: nome, email, whatsapp, empresa, numero de funcionários, senha, plan
    // Preencher campos obrigatórios com placeholders ou deixar vazio
    const {
      nome, email, whatsapp, empresa, funcionarios, senha, plan
    } = body;
    if (!nome || !email || !whatsapp || !empresa || !funcionarios || !senha || !plan) {
      throw new BadRequestException('Todos os campos obrigatórios devem ser preenchidos.');
    }
    // Montar DTO mínimo
    const createClientDto: any = {
      companyName: empresa,
      responsibleName: nome,
      responsiblePosition: '',
      responsibleEmail: email,
      responsiblePhone: whatsapp,
      responsibleCPF: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      accessEmail: email,
      password: senha,
      plan: plan,
      status: 'ativo',
      employeeCount: funcionarios,
      profileComplete: false
    };
    return this.clientsService.create(createClientDto);
  }

  @UseGuards(JwtClientAuthGuard)
  @Patch('me/complete-profile')
  async completeProfile(@Req() req, @Body() body) {
    const id = req.user?._id || req.user?.sub;
    // Permitir atualização apenas dos campos em branco
    const client = await this.clientsService.findOne(id);
    if (!client) throw new BadRequestException('Cliente não encontrado');
    // Validar e-mail corporativo
    if (body.accessEmail && (body.accessEmail.endsWith('@gmail.com') || body.accessEmail.endsWith('@hotmail.com') || body.accessEmail.endsWith('@outlook.com'))) {
      throw new BadRequestException('Use um e-mail corporativo válido');
    }
    // Validar celular (WhatsApp)
    const whatsappRegex = /^\(\d{2}\)\s\d{5}-\d{4}$/;
    if (body.responsiblePhone && !whatsappRegex.test(body.responsiblePhone)) {
      throw new BadRequestException('Digite um número de WhatsApp válido');
    }
    // Atualizar apenas campos em branco
    const update: any = {};
    Object.keys(body).forEach(key => {
      if (!client[key] || client[key] === '') {
        update[key] = body[key];
      }
    });
    // Lista de campos obrigatórios para perfil completo
    const obrigatorios = ['cnpj','responsiblePosition','responsibleCPF','cep','street','number','neighborhood','city','state'];
    // Simula update para validação
    const clientAtualizado = { ...JSON.parse(JSON.stringify(client)), ...update };
    const faltando = obrigatorios.filter(campo => !clientAtualizado[campo] || clientAtualizado[campo] === '');
    if (faltando.length > 0) {
      throw new BadRequestException('Preencha todos os campos obrigatórios: ' + faltando.join(', '));
    }
    update.profileComplete = true;
    const updated = await this.clientsService.update(id, update);
    // Notificar admin (pode ser log, e-mail ou registro em coleção de notificações)
    console.log(`[NOTIFICAÇÃO] Cliente Trial completou cadastro: ${client.companyName} (${client.accessEmail})`);
    return { message: 'Cadastro completado com sucesso', client: updated };
  }
} 