import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Plan, PlanDocument } from './entities/plan.schema';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class PlanosService implements OnModuleInit {
  constructor(
    @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
  ) {}

  async onModuleInit() {
    // Seed automático dos planos padrão se a coleção estiver vazia
    const count = await this.planModel.countDocuments();
    if (count === 0) {
      await this.planModel.insertMany([
        {
          nome: 'Trial',
          descricao: 'Plano de avaliação gratuito',
          preco: 0,
          periodoTrial: 14,
          limiteIndicadores: 3,
          limiteIndicacoes: 10,
          funcionalidades: { exportacao: false, relatorios: false, campanhasExtras: false }
        },
        {
          nome: 'Start',
          descricao: 'Plano inicial para pequenas empresas',
          preco: 49.90,
          periodoTrial: 7,
          limiteIndicadores: 10,
          limiteIndicacoes: 50,
          funcionalidades: { exportacao: true, relatorios: false, campanhasExtras: false }
        },
        {
          nome: 'Premium',
          descricao: 'Plano completo para empresas que querem crescer',
          preco: 199.90,
          periodoTrial: 14,
          limiteIndicadores: 100,
          limiteIndicacoes: 1000,
          funcionalidades: { exportacao: true, relatorios: true, campanhasExtras: true }
        }
      ]);
    }
  }

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const created = new this.planModel(createPlanDto);
    return created.save();
  }

  async findAll(): Promise<Plan[]> {
    return this.planModel.find().exec();
  }

  async findOne(id: string): Promise<Plan | null> {
    return this.planModel.findById(id).exec();
  }

  async update(id: string, updatePlanDto: UpdatePlanDto): Promise<Plan | null> {
    return this.planModel.findByIdAndUpdate(id, updatePlanDto, { new: true }).exec();
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.planModel.findByIdAndDelete(id).exec();
    return { message: 'Plano excluído com sucesso' };
  }
} 