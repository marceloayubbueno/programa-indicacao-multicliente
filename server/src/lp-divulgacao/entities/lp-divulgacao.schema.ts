import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LPDivulgacaoDocument = LPDivulgacao & Document;

// Interface para dados estruturados do GrapesJS
interface GrapesJSData {
  components: any[];  // Estrutura de componentes do GrapesJS
  styles: any[];      // Regras CSS estruturadas
  assets: any[];      // Imagens e recursos
}

// Interface para saída compilada
interface CompiledOutput {
  html: string;       // HTML final compilado
  css: string;        // CSS final compilado
}

// Interface para metadados
interface LPMetadata {
  blocksUsed: string[];     // Quais blocos foram utilizados
  lastModified: Date;       // Última modificação
  version: string;          // Versão da LP
  editorVersion?: string;   // Versão do editor GrapesJS usado
}

// Interface para estatísticas
interface LPStatistics {
  totalViews: number;                    // Total de visualizações
  totalSubmissions: number;              // Total de submissões do formulário
  totalTrialsStarted: number;            // Total de testes grátis iniciados
  totalConversions: number;              // Total de conversões (trial → cliente)
  conversionRate: number;                // Taxa de conversão (submissions/views)
  trialConversionRate: number;           // Taxa de conversão trial → cliente
  lastViewAt?: Date;                     // Última visualização
  lastSubmissionAt?: Date;               // Última submissão
}

// Interface para configuração de integração
interface IntegrationConfig {
  crmWebhook?: string;                   // Webhook para CRM
  emailProvider?: {                      // Configuração de email
    provider: 'mailchimp' | 'sendgrid' | 'custom';
    apiKey?: string;
    listId?: string;
  };
  analyticsConfig?: {                    // Configuração de analytics
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    customEvents?: string[];
  };
}

@Schema({ timestamps: true })
export class LPDivulgacao {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string; // URL amigável

  @Prop({ required: false, trim: true })
  description?: string;

  @Prop({ required: true, enum: ['draft', 'published', 'inactive'], default: 'draft' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign', required: false })
  campaignId?: Types.ObjectId; // Pode ser vinculada a uma campanha

  @Prop({ required: false, trim: true })
  campaignName?: string; // Nome da campanha vinculada

  // === CONTEÚDO GRAPESJS ===
  @Prop({ type: Object, required: true })
  grapesData: GrapesJSData;

  @Prop({ type: Object, required: true })
  compiledOutput: CompiledOutput;

  @Prop({ type: Object, required: true })
  metadata: LPMetadata;

  // === ESTATÍSTICAS ===
  @Prop({ type: Object, default: () => ({
    totalViews: 0,
    totalSubmissions: 0,
    totalTrialsStarted: 0,
    totalConversions: 0,
    conversionRate: 0,
    trialConversionRate: 0
  }) })
  statistics: LPStatistics;

  // === CONFIGURAÇÕES DE PUBLICAÇÃO ===
  @Prop({ required: false })
  publishedAt?: Date;

  @Prop({ required: false })
  publishedUrl?: string; // URL pública da LP

  @Prop({ required: false })
  previewUrl?: string; // URL de preview

  // === SEO E METADADOS ===
  @Prop({ required: false, trim: true })
  metaTitle?: string;

  @Prop({ required: false, trim: true })
  metaDescription?: string;

  @Prop({ required: false })
  metaKeywords?: string[];

  @Prop({ required: false })
  ogImage?: string; // Imagem para compartilhamento social

  // === CONFIGURAÇÃO DE PRODUTO/SERVIÇO ===
  @Prop({ required: false, trim: true })
  productName?: string; // Nome do produto/serviço oferecido

  @Prop({ required: false })
  productPrice?: number; // Preço do produto/serviço

  @Prop({ required: false, trim: true })
  productDescription?: string; // Descrição do produto/serviço

  // === TEMPLATES E VERSIONAMENTO ===
  @Prop({ required: false })
  templateId?: string; // ID do template usado como base

  @Prop({ required: false })
  parentLPId?: Types.ObjectId; // LP pai (para duplicação)

  @Prop({ default: false })
  isTemplate: boolean; // Se esta LP pode ser usada como template

  // === CONFIGURAÇÃO DE FUNIL ===
  @Prop({ required: false })
  funnelStage?: string; // Estágio do funil: 'awareness', 'consideration', 'decision'

  @Prop({
    type: {
      demographics: [{ type: String }],
      interests: [{ type: String }],
      painPoints: [{ type: String }]
    },
    required: false
  })
  targetAudience?: {
    demographics?: string[];
    interests?: string[];
    painPoints?: string[];
  };

  // === AUDITORIA ===
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  lastModifiedBy?: Types.ObjectId;

  @Prop({ unique: true, trim: true })
  lpdedivulgacaoId: string;

  // === REDIRECIONAMENTO E UTM ===
  @Prop({ required: false, trim: true })
  redirectUrl?: string;

  @Prop({ type: Object, required: false })
  utmParams?: Record<string, string>;
}

export const LPDivulgacaoSchema = SchemaFactory.createForClass(LPDivulgacao);

// Índices para performance
LPDivulgacaoSchema.index({ clientId: 1, status: 1 });
LPDivulgacaoSchema.index({ slug: 1 }, { unique: true });
LPDivulgacaoSchema.index({ campaignId: 1 });
LPDivulgacaoSchema.index({ status: 1, publishedAt: -1 });
LPDivulgacaoSchema.index({ 'statistics.totalViews': -1 });
LPDivulgacaoSchema.index({ funnelStage: 1 });
LPDivulgacaoSchema.index({ createdAt: -1 });
LPDivulgacaoSchema.index({ lpdedivulgacaoId: 1 }, { unique: true });

// Middleware para atualizar campos automáticos
LPDivulgacaoSchema.pre('save', function(next) {
  if (this.isModified('grapesData') || this.isModified('compiledOutput')) {
    this.metadata.lastModified = new Date();
    
    // Atualizar taxas de conversão
    if (this.statistics.totalViews > 0) {
      this.statistics.conversionRate = (this.statistics.totalSubmissions / this.statistics.totalViews) * 100;
    }
    
    if (this.statistics.totalTrialsStarted > 0) {
      this.statistics.trialConversionRate = (this.statistics.totalConversions / this.statistics.totalTrialsStarted) * 100;
    }
  }
  
  // Gerar slug automaticamente se não fornecido
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  if (!this.lpdedivulgacaoId && this._id) {
    this.lpdedivulgacaoId = this._id.toString();
  }
  
  next();
});

// Método virtual para URL completa
LPDivulgacaoSchema.virtual('fullUrl').get(function() {
  if (this.status === 'published' && this.publishedUrl) {
    return this.publishedUrl;
  }
  return this.previewUrl || `/lp/divulgacao/${this.slug}`;
});

// Método virtual para taxa de conversão formatada
LPDivulgacaoSchema.virtual('formattedConversionRate').get(function() {
  return `${this.statistics.conversionRate.toFixed(2)}%`;
});

// Método virtual para taxa de conversão de trial formatada
LPDivulgacaoSchema.virtual('formattedTrialConversionRate').get(function() {
  return `${this.statistics.trialConversionRate.toFixed(2)}%`;
}); 