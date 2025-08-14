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
    const createdCompanyHeader = new this.companyHeaderModel(createCompanyHeaderDto);
    return createdCompanyHeader.save();
  }

  async findByClientId(clientId: string): Promise<WhatsAppCompanyHeader | null> {
    return this.companyHeaderModel.findOne({ clientId, isActive: true }).exec();
  }

  async updateByClientId(clientId: string, updateCompanyHeaderDto: UpdateCompanyHeaderDto): Promise<WhatsAppCompanyHeader> {
    const existing = await this.companyHeaderModel.findOne({ clientId, isActive: true }).exec();
    
    if (!existing) {
      // Se não existir, criar novo
      const createDto = { ...updateCompanyHeaderDto, clientId };
      return this.create(createDto as CreateCompanyHeaderDto);
    }

    // Se existir, atualizar
    Object.assign(existing, updateCompanyHeaderDto);
    return existing.save();
  }

  async upsertByClientId(clientId: string, companyHeaderData: CreateCompanyHeaderDto): Promise<WhatsAppCompanyHeader> {
    const filter = { clientId, isActive: true };
    const update = { ...companyHeaderData, clientId };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const result = await this.companyHeaderModel.findOneAndUpdate(filter, update, options).exec();
    
    if (!result) {
      // Se por algum motivo não retornou, criar manualmente
      return this.create(companyHeaderData as CreateCompanyHeaderDto);
    }
    
    return result;
  }

  async deleteByClientId(clientId: string): Promise<boolean> {
    const result = await this.companyHeaderModel.updateOne(
      { clientId },
      { isActive: false }
    ).exec();
    
    return result.modifiedCount > 0;
  }

  async findAll(): Promise<WhatsAppCompanyHeader[]> {
    return this.companyHeaderModel.find({ isActive: true }).exec();
  }

  async findActiveByClientId(clientId: string): Promise<WhatsAppCompanyHeader | null> {
    return this.companyHeaderModel.findOne({ 
      clientId, 
      isActive: true,
      'headerConfig.enabled': true 
    }).exec();
  }
}
