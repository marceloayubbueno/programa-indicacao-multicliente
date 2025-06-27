import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from './entities/client.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../common/mail.service';
import * as path from 'path';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    // Validação de unicidade
    let exists = null;
    if (createClientDto.cnpj && createClientDto.cnpj.trim() !== '') {
      exists = await this.clientModel.findOne({
        $or: [
          { cnpj: createClientDto.cnpj },
          { accessEmail: createClientDto.accessEmail },
        ],
      });
    } else {
      exists = await this.clientModel.findOne({ accessEmail: createClientDto.accessEmail });
    }
    if (exists) {
      throw new BadRequestException('CNPJ ou e-mail já cadastrado');
    }
    // Senha obrigatória
    if (!createClientDto.password) {
      throw new BadRequestException('A senha é obrigatória para criar um cliente.');
    }
    const hash = await bcrypt.hash(createClientDto.password, 10);
    // Validação de obrigatoriedade do CNPJ
    let dtoToSave: any = { ...createClientDto };
    if (createClientDto.plan !== 'trial') {
      if (!createClientDto.cnpj || createClientDto.cnpj.trim() === '') {
        throw new BadRequestException('CNPJ é obrigatório para este plano.');
      }
    } else {
      // Remover cnpj se for undefined, null ou string vazia
      if (
        typeof dtoToSave.cnpj === 'undefined' ||
        dtoToSave.cnpj === null ||
        dtoToSave.cnpj === ''
      ) {
        delete dtoToSave.cnpj;
      }
    }
    const created = new this.clientModel({
      ...dtoToSave,
      password: hash,
    });
    const saved = await created.save();
    return saved;
  }

  async findAll(): Promise<{ clients: Client[]; page: number; totalPages: number }> {
    const clients = await this.clientModel.find().exec();
    return {
      clients,
      page: 1,
      totalPages: 1,
    };
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientModel.findById(id).populate('plan').exec();
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    if (updateClientDto.password) {
      updateClientDto.password = await bcrypt.hash(updateClientDto.password, 10);
    }
    const updated = await this.clientModel.findByIdAndUpdate(id, updateClientDto, { new: true });
    if (!updated) throw new NotFoundException('Cliente não encontrado');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.clientModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Cliente não encontrado');
  }

  generateTempPassword(length = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = '';
    for (let i = 0; i < length; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  }

  async login(email: string, password: string) {
    // Busca por accessEmail ou responsibleEmail (case insensitive)
    const client = await this.clientModel.findOne({
      $or: [
        { accessEmail: email.toLowerCase() },
        { responsibleEmail: email.toLowerCase() },
      ],
    });
    if (!client) {
      throw new NotFoundException('E-mail ou senha inválidos');
    }
    if (client.status !== 'ativo') {
      throw new BadRequestException('Seu acesso está bloqueado. Entre em contato com o suporte.');
    }
    const isMatch = await bcrypt.compare(password, client.password);
    if (!isMatch) {
      throw new NotFoundException('E-mail ou senha inválidos');
    }
    // 🚀 NOVO: Gera token JWT com clientId incluído no payload
    const payload = { 
      sub: client._id, 
      clientId: client._id.toString(),
      role: 'client',
      email: client.accessEmail 
    };
    const token = this.jwtService.sign(payload);
    return {
      token,
      client: {
        id: client._id,
        companyName: client.companyName,
        accessEmail: client.accessEmail,
        status: client.status,
      },
    };
  }

  async isTrialExpiredAndIncomplete(id: string): Promise<boolean> {
    const client = await this.clientModel.findById(id).populate('plan').exec() as ClientDocument;
    if (!client) return false;
    if (client.profileComplete) return false;
    if (!client.createdAt) {
      throw new BadRequestException('Data de criação do cliente não encontrada.');
    }
    // Garante que createdAt é do tipo Date
    const created = (client.createdAt instanceof Date)
      ? client.createdAt
      : new Date(client.createdAt);
    const periodoTrial = client.plan && client.plan.periodoTrial ? client.plan.periodoTrial : 14;
    const trialEnd = new Date(created.getTime() + periodoTrial * 24 * 60 * 60 * 1000);
    return new Date() > trialEnd;
  }
} 