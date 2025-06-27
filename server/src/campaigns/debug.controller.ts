import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign } from './entities/campaign.schema';
import { LPIndicadores } from '../lp-indicadores/entities/lp-indicadores.schema';
import { ParticipantList } from '../clients/entities/participant-list.schema';
import { Participant } from '../clients/entities/participant.schema';

// Interfaces para o diagnóstico
interface LPIndicadoresInfo {
  id: any;
  name: any;
  status: any;
  isLinkedToCampaign: boolean;
  campaignName: any;
}

interface ParticipantListInfo {
  id: any;
  name: any;
  tipo: any;
  participantCount: any;
}

interface CampaignDiagnostic {
  campaign: {
    id: any;
    name: string;
    type: string;
    status: string | undefined;
  };
  lpIndicadores: LPIndicadoresInfo | null;
  participantList: ParticipantListInfo | null;
  issues: string[];
  participantCount: number;
  recentSubmissions: number;
}

@Controller('campaigns/debug')
export class DebugController {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<Campaign>,
    @InjectModel(LPIndicadores.name) private lpIndicadoresModel: Model<LPIndicadores>,
    @InjectModel(ParticipantList.name) private participantListModel: Model<ParticipantList>,
    @InjectModel(Participant.name) private participantModel: Model<Participant>,
  ) {}

  @Get('overview')
  async getCampaignsOverview() {
    try {
      const campaigns = await this.campaignModel.find()
        .populate('lpIndicadoresId', 'name status campaignId campaignName')
        .populate('participantListId', 'name tipo participants')
        .exec();

      const diagnostics: CampaignDiagnostic[] = [];

      for (const campaign of campaigns) {
        const diagnostic: CampaignDiagnostic = {
          campaign: {
            id: campaign._id,
            name: campaign.name,
            type: campaign.type,
            status: campaign.status
          },
          lpIndicadores: null,
          participantList: null,
          issues: [],
          participantCount: 0,
          recentSubmissions: 0
        };

        // Verificar LP de Indicadores
        if (campaign.lpIndicadoresId) {
          const lp = campaign.lpIndicadoresId as any;
          diagnostic.lpIndicadores = {
            id: lp._id,
            name: lp.name,
            status: lp.status,
            isLinkedToCampaign: lp.campaignId?.toString() === campaign._id.toString(),
            campaignName: lp.campaignName
          };

          if (!diagnostic.lpIndicadores.isLinkedToCampaign) {
            diagnostic.issues.push('LP não está vinculada à campanha (campaignId faltando)');
          }
        } else {
          diagnostic.issues.push('Campanha sem LP de Indicadores vinculada');
        }

        // Verificar Lista de Participantes
        if (campaign.participantListId) {
          const list = campaign.participantListId as any;
          diagnostic.participantList = {
            id: list._id,
            name: list.name,
            tipo: list.tipo,
            participantCount: list.participants?.length || 0
          };

          diagnostic.participantCount = diagnostic.participantList.participantCount;

          if (list.tipo !== 'indicador') {
            diagnostic.issues.push(`Lista não é do tipo indicador (tipo: ${list.tipo})`);
          }
        } else {
          diagnostic.issues.push('Campanha sem lista de participantes vinculada');
        }

        // Verificar submissões recentes (últimos 7 dias)
        if (campaign.lpIndicadoresId) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          const recentSubmissions = await this.participantModel.countDocuments({
            originLandingPageId: campaign.lpIndicadoresId,
            createdAt: { $gte: oneWeekAgo }
          });

          diagnostic.recentSubmissions = recentSubmissions;
        }

        diagnostics.push(diagnostic);
      }

      return {
        success: true,
        data: {
          totalCampaigns: campaigns.length,
          campaignsWithIssues: diagnostics.filter(d => d.issues.length > 0).length,
          diagnostics
        },
        message: 'Diagnóstico de campanhas realizado com sucesso'
      };
    } catch (error) {
      console.error('[DEBUG] Erro no diagnóstico:', error);
      return {
        success: false,
        message: 'Erro ao realizar diagnóstico',
        error: error.message
      };
    }
  }

  @Get('campaign/:id/detailed')
  async getCampaignDetailed(@Param('id') campaignId: string) {
    try {
      const campaign = await this.campaignModel.findById(campaignId)
        .populate('lpIndicadoresId')
        .populate('participantListId')
        .exec();

      if (!campaign) {
        return {
          success: false,
          message: 'Campanha não encontrada'
        };
      }

      const result: any = {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          description: campaign.description,
          type: campaign.type,
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          clientId: campaign.clientId
        },
        lpIndicadores: null,
        participantList: null,
        participants: [],
        recentSubmissions: [],
        connectionStatus: {
          lpLinked: false,
          listLinked: false,
          lpPointsToList: false,
          allCorrect: false
        }
      };

      // Análise da LP de Indicadores
      if (campaign.lpIndicadoresId) {
        const lp = campaign.lpIndicadoresId as any;
        result.lpIndicadores = {
          id: lp._id,
          name: lp.name,
          status: lp.status,
          campaignId: lp.campaignId,
          campaignName: lp.campaignName,
          isLinkedToCampaign: lp.campaignId?.toString() === campaign._id.toString()
        };

        result.connectionStatus.lpLinked = result.lpIndicadores.isLinkedToCampaign;

        // Buscar submissões recentes desta LP
        const recentSubmissions = await this.participantModel.find({
          originLandingPageId: lp._id
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email createdAt lists campaignId campaignName')
        .exec();

        result.recentSubmissions = recentSubmissions.map(sub => ({
          id: sub._id,
          name: sub.name,
          email: sub.email,
          createdAt: sub.createdAt,
          isInCampaignList: sub.lists?.some(listId => listId.toString() === campaign.participantListId?.toString()),
          campaignId: sub.campaignId,
          campaignName: sub.campaignName
        }));
      }

      // Análise da Lista de Participantes
      if (campaign.participantListId) {
        const list = await this.participantListModel.findById(campaign.participantListId)
          .populate('participants', 'name email tipo createdAt originLandingPageId')
          .exec();

        if (list) {
          result.participantList = {
            id: list._id,
            name: list.name,
            tipo: list.tipo,
            participantCount: list.participants?.length || 0,
            campaignId: list.campaignId,
            campaignName: list.campaignName
          };

          result.connectionStatus.listLinked = true;

          // Listar participantes
          result.participants = (list.participants as any[])?.map(p => ({
            id: p._id,
            name: p.name,
            email: p.email,
            tipo: p.tipo,
            createdAt: p.createdAt,
            cameFromCampaignLP: p.originLandingPageId?.toString() === campaign.lpIndicadoresId?.toString()
          })) || [];
        }
      }

      // Status final da conexão
      result.connectionStatus.allCorrect = 
        result.connectionStatus.lpLinked && 
        result.connectionStatus.listLinked;

      return {
        success: true,
        data: result,
        message: 'Diagnóstico detalhado realizado com sucesso'
      };
    } catch (error) {
      console.error('[DEBUG] Erro no diagnóstico detalhado:', error);
      return {
        success: false,
        message: 'Erro ao realizar diagnóstico detalhado',
        error: error.message
      };
    }
  }

  @Post('campaign/:id/repair')
  async repairCampaignConnections(@Param('id') campaignId: string) {
    try {
      const campaign = await this.campaignModel.findById(campaignId).exec();
      if (!campaign) {
        return {
          success: false,
          message: 'Campanha não encontrada'
        };
      }

      const repairs: string[] = [];

      // Reparar vinculação da LP com a campanha
      if (campaign.lpIndicadoresId) {
        const lpUpdate = await this.lpIndicadoresModel.findByIdAndUpdate(
          campaign.lpIndicadoresId,
          {
            campaignId: campaign._id,
            campaignName: campaign.name
          },
          { new: true }
        ).exec();

        if (lpUpdate) {
          repairs.push('LP vinculada à campanha');
        }
      }

      // Reparar vinculação da lista com a campanha
      if (campaign.participantListId) {
        const listUpdate = await this.participantListModel.findByIdAndUpdate(
          campaign.participantListId,
          {
            campaignId: campaign._id,
            campaignName: campaign.name
          },
          { new: true }
        ).exec();

        if (listUpdate) {
          repairs.push('Lista vinculada à campanha');
        }

        // Reparar participantes órfãos (que vieram da LP mas não estão na lista)
        if (campaign.lpIndicadoresId) {
          const orphanParticipants = await this.participantModel.find({
            originLandingPageId: campaign.lpIndicadoresId,
            lists: { $ne: campaign.participantListId }
          }).exec();

          if (orphanParticipants.length > 0) {
            // Adicionar participantes órfãos à lista
            const participantIds = orphanParticipants.map(p => p._id);
            
            await this.participantListModel.findByIdAndUpdate(
              campaign.participantListId,
              { $addToSet: { participants: { $each: participantIds } } }
            ).exec();

            // Atualizar os participantes para incluir a lista
            await this.participantModel.updateMany(
              { _id: { $in: participantIds } },
              { 
                $addToSet: { lists: campaign.participantListId },
                $set: { 
                  campaignId: campaign._id,
                  campaignName: campaign.name 
                }
              }
            ).exec();

            repairs.push(`${orphanParticipants.length} participantes órfãos adicionados à lista`);
          }
        }
      }

      return {
        success: true,
        data: { repairs },
        message: `Reparação concluída. ${repairs.length} correções aplicadas.`
      };
    } catch (error) {
      console.error('[DEBUG] Erro na reparação:', error);
      return {
        success: false,
        message: 'Erro ao reparar conexões',
        error: error.message
      };
    }
  }

  @Get('test')
  async test() {
    return {
      success: true,
      message: 'Debug controller funcionando'
    };
  }

  @Get('list/:listId/participants')
  async debugParticipantList(@Param('listId') listId: string) {
    console.log('[DEBUG] Analisando lista de participantes:', listId);
    
    try {
      // Buscar a lista
      const ParticipantList = this.campaignModel.db.model('ParticipantList');
      const list = await ParticipantList.findById(listId)
        .populate('participants')
        .populate('clientId', 'name')
        .exec();
      
      if (!list) {
        return {
          success: false,
          message: 'Lista não encontrada',
          listId
        };
      }

      // Buscar participantes que deveriam estar na lista
      const Participant = this.campaignModel.db.model('Participant');
      const allParticipantsWithThisList = await Participant.find({
        lists: listId
      }).exec();

      // Buscar participantes por origem (LP de indicadores)
      const participantsByOrigin = await Participant.find({
        originSource: 'landing-page',
        tipo: 'indicador'
      }).sort({ createdAt: -1 }).limit(10).exec();

      return {
        success: true,
        data: {
          list: {
            id: list._id,
            name: list.name,
            tipo: list.tipo,
            clientId: list.clientId,
            participantsInArray: list.participants?.length || 0,
            participantsData: list.participants || []
          },
          participantsWithThisListInField: {
            count: allParticipantsWithThisList.length,
            participants: allParticipantsWithThisList.map(p => ({
              id: p._id,
              name: p.name,
              email: p.email,
              lists: p.lists,
              campaignId: p.campaignId,
              createdAt: p.createdAt
            }))
          },
          recentIndicatorsByLP: {
            count: participantsByOrigin.length,
            participants: participantsByOrigin.map(p => ({
              id: p._id,
              name: p.name,
              email: p.email,
              lists: p.lists,
              campaignId: p.campaignId,
              originLandingPageId: p.originLandingPageId,
              createdAt: p.createdAt
            }))
          }
        }
      };

    } catch (error) {
      console.error('[DEBUG] Erro ao analisar lista:', error);
      return {
        success: false,
        message: 'Erro ao analisar lista',
        error: error.message
      };
    }
  }

  @Post('test-list-population')
  async testListPopulation(@Body() body: { lpId: string; campaignId: string }) {
    console.log('[DEBUG] Testando população de lista:', body);
    
    try {
      const { lpId, campaignId } = body;
      
      // Dados de teste
      const testData = {
        lpId,
        name: 'TESTE DEBUG LISTA',
        email: `debug-lista-${Date.now()}@teste.com`,
        phone: '11999888777',
        company: 'Empresa Debug'
      };

      console.log('[DEBUG] Submetendo formulário de teste...');
      
      // Chamar o serviço de LP de indicadores
      const LPService = this.campaignModel.db.model('LPIndicadores');
      
      // Como não posso injetar diretamente o service aqui, vou fazer uma requisição HTTP interna
      const axios = require('axios');
      
      try {
        const submitResponse = await axios.post(
          'http://localhost:3000/api/lp-indicadores/submit-form',
          testData
        );
        
        console.log('[DEBUG] Formulário submetido com sucesso');
        
        // Aguardar 2 segundos para processamento
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Buscar a campanha para pegar o listId
        const campaign = await this.campaignModel.findById(campaignId).exec();
        if (!campaign) {
          return {
            success: false,
            message: 'Campanha não encontrada',
            campaignId
          };
        }

        // Verificar se o participante foi adicionado à lista
        const ParticipantList = this.campaignModel.db.model('ParticipantList');
        const list = await ParticipantList.findById(campaign.participantListId)
          .populate('participants')
          .exec();

        const testParticipant = list.participants?.find(p => p.email === testData.email);

        return {
          success: true,
          data: {
            testSubmission: {
              email: testData.email,
              participantCreated: !!submitResponse.data,
              participantId: submitResponse.data?.data?._id || submitResponse.data?._id
            },
            listStatus: {
              listId: campaign.participantListId,
              listName: list.name,
              totalParticipants: list.participants?.length || 0,
              testParticipantFound: !!testParticipant,
              testParticipantData: testParticipant || null
            }
          }
        };

      } catch (submitError) {
        console.error('[DEBUG] Erro ao submeter formulário:', submitError.message);
        return {
          success: false,
          message: 'Erro ao submeter formulário de teste',
          error: submitError.message
        };
      }

    } catch (error) {
      console.error('[DEBUG] Erro no teste de população:', error);
      return {
        success: false,
        message: 'Erro no teste de população',
        error: error.message
      };
    }
  }

  @Post('auto-repair-after-submission')
  async autoRepairAfterSubmission(@Body() body: { lpId: string; participantEmail: string }) {
    console.log('[DEBUG] Auto-reparação após submissão:', body);
    
    try {
      const { lpId, participantEmail } = body;
      
      // Buscar a LP
      const LPIndicadores = this.campaignModel.db.model('LPIndicadores');
      const lp = await LPIndicadores.findById(lpId).exec();
      
      if (!lp || !lp.campaignId) {
        return {
          success: false,
          message: 'LP não encontrada ou não vinculada a campanha'
        };
      }

      // Buscar o participante recém-criado
      const Participant = this.campaignModel.db.model('Participant');
      const participant = await Participant.findOne({
        email: participantEmail,
        originLandingPageId: lpId
      }).sort({ createdAt: -1 }).exec();

      if (!participant) {
        return {
          success: false,
          message: 'Participante não encontrado'
        };
      }

      // Buscar a campanha
      const campaign = await this.campaignModel.findById(lp.campaignId).exec();
      if (!campaign || !campaign.participantListId) {
        return {
          success: false,
          message: 'Campanha ou lista não encontrada'
        };
      }

      // Verificar se o participante já está na lista
      const ParticipantList = this.campaignModel.db.model('ParticipantList');
      const list = await ParticipantList.findById(campaign.participantListId).exec();
      
      const isAlreadyInList = list.participants?.some(p => p.toString() === participant._id.toString());
      
      if (isAlreadyInList) {
        return {
          success: true,
          message: 'Participante já está na lista',
          data: { alreadyInList: true }
        };
      }

      // Adicionar à lista
      await ParticipantList.findByIdAndUpdate(
        campaign.participantListId,
        { $addToSet: { participants: participant._id } }
      );

      // Atualizar participante
      await Participant.findByIdAndUpdate(
        participant._id,
        { 
          $addToSet: { lists: campaign.participantListId },
          $set: { 
            campaignId: campaign._id,
            campaignName: campaign.name 
          }
        }
      );

      return {
        success: true,
        message: 'Participante adicionado à lista com sucesso',
        data: {
          participantId: participant._id,
          participantName: participant.name,
          listId: campaign.participantListId,
          listName: list.name
        }
      };

    } catch (error) {
      console.error('[DEBUG] Erro na auto-reparação:', error);
      return {
        success: false,
        message: 'Erro na auto-reparação',
        error: error.message
      };
    }
  }
} 