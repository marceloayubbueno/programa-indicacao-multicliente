import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WhatsAppCompanyHeader, WhatsAppCompanyHeaderDocument } from '../entities/whatsapp-company-header.schema';
import { CreateCompanyHeaderDto } from '../dto/create-company-header.dto';
import { UpdateCompanyHeaderDto } from '../dto/update-company-header.dto';

@Injectable()
export class CompanyHeaderService {
  constructor(
    @InjectModel(WhatsAppCompanyHeader.name)
    private companyHeaderModel: Model<WhatsAppCompanyHeaderDocument>,
  ) {}

  async create(createCompanyHeaderDto: CreateCompanyHeaderDto): Promise<WhatsAppCompanyHeader> {
    console.log('🔍 [SERVICE] create() - Iniciando...');
    console.log('🔍 [SERVICE] Dados recebidos:', JSON.stringify(createCompanyHeaderDto, null, 2));
    
    try {
      const createdCompanyHeader = new this.companyHeaderModel(createCompanyHeaderDto);
      const result = await createdCompanyHeader.save();
      console.log('✅ [SERVICE] Configuração criada com sucesso no MongoDB:', result._id);
      return result;
    } catch (error) {
      console.error('❌ [SERVICE] Erro ao criar no MongoDB:', error);
      throw error;
    }
  }

  async findByClientId(clientId: string): Promise<WhatsAppCompanyHeader | null> {
    console.log('🔍 [SERVICE] findByClientId() - Iniciando...');
    console.log('🔍 [SERVICE] clientId:', clientId);
    
    try {
      const result = await this.companyHeaderModel.findOne({ clientId, isActive: true }).exec();
      console.log('🔍 [SERVICE] Resultado da busca:', result ? `ENCONTRADO (ID: ${result._id})` : 'NÃO ENCONTRADO');
      return result;
    } catch (error) {
      console.error('❌ [SERVICE] Erro ao buscar no MongoDB:', error);
      throw error;
    }
  }

  async updateByClientId(clientId: string, updateCompanyHeaderDto: UpdateCompanyHeaderDto): Promise<WhatsAppCompanyHeader> {
    console.log('🔍 [SERVICE] updateByClientId() - Iniciando...');
    console.log('🔍 [SERVICE] clientId:', clientId);
    console.log('🔍 [SERVICE] dados de atualização:', JSON.stringify(updateCompanyHeaderDto, null, 2));
    
    try {
      const existing = await this.companyHeaderModel.findOne({ clientId, isActive: true }).exec();
      console.log('🔍 [SERVICE] Configuração existente:', existing ? `ENCONTRADA (ID: ${existing._id})` : 'NÃO ENCONTRADA');
      
      if (!existing) {
        console.log('🔍 [SERVICE] Criando nova configuração...');
        const createDto = { ...updateCompanyHeaderDto, clientId };
        return this.create(createDto as CreateCompanyHeaderDto);
      }

      console.log('🔍 [SERVICE] Atualizando configuração existente...');
      Object.assign(existing, updateCompanyHeaderDto);
      const result = await existing.save();
      console.log('✅ [SERVICE] Configuração atualizada com sucesso:', result._id);
      return result;
    } catch (error) {
      console.error('❌ [SERVICE] Erro ao atualizar:', error);
      throw error;
    }
  }

  async upsertByClientId(clientId: string, companyHeaderData: CreateCompanyHeaderDto): Promise<WhatsAppCompanyHeader> {
    console.log('🔍 [SERVICE] upsertByClientId() - Iniciando...');
    console.log('🔍 [SERVICE] clientId:', clientId);
    console.log('🔍 [SERVICE] dados:', JSON.stringify(companyHeaderData, null, 2));
    
    try {
      const filter = { clientId, isActive: true };
      const update = { ...companyHeaderData, clientId };
      const options = { upsert: true, new: true, setDefaultsOnInsert: true };

      console.log('🔍 [SERVICE] Filter MongoDB:', JSON.stringify(filter, null, 2));
      console.log('🔍 [SERVICE] Update MongoDB:', JSON.stringify(update, null, 2));
      console.log('🔍 [SERVICE] Options MongoDB:', JSON.stringify(options, null, 2));

      const result = await this.companyHeaderModel.findOneAndUpdate(filter, update, options).exec();
      console.log('✅ [SERVICE] Resultado do MongoDB upsert:', result ? `SUCESSO (ID: ${result._id})` : 'FALHOU');
      
      if (!result) {
        console.log('⚠️ [SERVICE] Upsert falhou, criando manualmente...');
        return this.create(companyHeaderData as CreateCompanyHeaderDto);
      }
      
      return result;
    } catch (error) {
      console.error('❌ [SERVICE] Erro no MongoDB upsert:', error);
      throw error;
    }
  }

  async deleteByClientId(clientId: string): Promise<boolean> {
    console.log('🔍 [SERVICE] deleteByClientId() - Iniciando...');
    console.log('🔍 [SERVICE] clientId:', clientId);
    
    try {
      const result = await this.companyHeaderModel.updateOne(
        { clientId },
        { isActive: false }
      ).exec();
      
      const success = result.modifiedCount > 0;
      console.log('🔍 [SERVICE] Resultado da exclusão:', success ? 'SUCESSO' : 'NÃO ENCONTRADO');
      console.log('🔍 [SERVICE] Documentos modificados:', result.modifiedCount);
      
      return success;
    } catch (error) {
      console.error('❌ [SERVICE] Erro ao excluir:', error);
      throw error;
    }
  }

  async findAll(): Promise<WhatsAppCompanyHeader[]> {
    console.log('🔍 [SERVICE] findAll() - Iniciando...');
    
    try {
      const result = await this.companyHeaderModel.find({ isActive: true }).exec();
      console.log('🔍 [SERVICE] Total de configurações encontradas:', result.length);
      return result;
    } catch (error) {
      console.error('❌ [SERVICE] Erro ao buscar todas:', error);
      throw error;
    }
  }

  async findActiveByClientId(clientId: string): Promise<WhatsAppCompanyHeader | null> {
    console.log('🔍 [SERVICE] findActiveByClientId() - Iniciando...');
    console.log('🔍 [SERVICE] clientId:', clientId);
    
    try {
      const result = await this.companyHeaderModel.findOne({ 
        clientId, 
        isActive: true,
        'headerConfig.enabled': true 
      }).exec();
      
      console.log('🔍 [SERVICE] Resultado da busca ativa:', result ? `ENCONTRADO (ID: ${result._id})` : 'NÃO ENCONTRADO');
      return result;
    } catch (error) {
      console.error('❌ [SERVICE] Erro ao buscar ativo:', error);
      throw error;
    }
  }
}
