import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LPIndicadoresDocument = LPIndicadores & Document;

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

// Interface para configuração do formulário
interface FormConfig {
  fields: string[];         // ['name', 'email', 'phone', 'custom1']
  submitEndpoint?: string;  // Endpoint customizado para submissão
  successMessage?: string;  // Mensagem de sucesso
  redirectUrl?: string;     // URL de redirecionamento após sucesso
  requiredFields?: string[]; // Campos obrigatórios
  customFields?: {          // Campos personalizados
    name: string;
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
  }[];
}

// Interface para estatísticas
interface LPStatistics {
  totalViews: number;                    // Total de visualizações
  totalSubmissions: number;              // Total de submissões do formulário
  totalIndicadoresCadastrados: number;   // Total de indicadores efetivamente cadastrados
  conversionRate: number;                // Taxa de conversão (submissions/views)
  lastViewAt?: Date;                     // Última visualização
  lastSubmissionAt?: Date;               // Última submissão
}

@Schema({ timestamps: true })
export class LPIndicadores {
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
  campaignId?: Types.ObjectId;

  @Prop({ required: false })
  campaignName?: string;

  // === CONTEÚDO GRAPESJS ===
  @Prop({ type: Object, required: true })
  grapesData: GrapesJSData;

  @Prop({ type: Object, required: true })
  compiledOutput: CompiledOutput;

  @Prop({ type: Object, required: true })
  metadata: LPMetadata;

  // === CONFIGURAÇÃO DO FORMULÁRIO ===
  @Prop({ type: Object, required: false })
  formConfig?: FormConfig;

  // === ESTATÍSTICAS ===
  @Prop({ type: Object, default: () => ({
    totalViews: 0,
    totalSubmissions: 0,
    totalIndicadoresCadastrados: 0,
    conversionRate: 0
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

  // === CONFIGURAÇÕES AVANÇADAS ===
  @Prop({ required: false })
  customCSS?: string; // CSS adicional personalizado

  @Prop({ required: false })
  customJS?: string; // JavaScript adicional personalizado

  @Prop({ type: Object, required: false })
  trackingCodes?: {
    googleAnalytics?: string;
    facebookPixel?: string;
    customScripts?: string[];
  };

  // === TEMPLATES E VERSIONAMENTO ===
  @Prop({ required: false })
  templateId?: string; // ID do template usado como base

  @Prop({ required: false })
  parentLPId?: Types.ObjectId; // LP pai (para duplicação)

  @Prop({ default: false })
  isTemplate: boolean; // Se esta LP pode ser usada como template

  // === AUDITORIA ===
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  lastModifiedBy?: Types.ObjectId;
}

export const LPIndicadoresSchema = SchemaFactory.createForClass(LPIndicadores);

// Índices para performance
LPIndicadoresSchema.index({ clientId: 1, status: 1 });
LPIndicadoresSchema.index({ slug: 1 }, { unique: true });
LPIndicadoresSchema.index({ campaignId: 1 });
LPIndicadoresSchema.index({ status: 1, publishedAt: -1 });
LPIndicadoresSchema.index({ 'statistics.totalViews': -1 });
LPIndicadoresSchema.index({ createdAt: -1 });

// Middleware para atualizar campos automáticos
LPIndicadoresSchema.pre('save', function(next) {
  if (this.isModified('grapesData') || this.isModified('compiledOutput')) {
    this.metadata.lastModified = new Date();
    
    // Atualizar taxa de conversão
    if (this.statistics.totalViews > 0) {
      this.statistics.conversionRate = (this.statistics.totalSubmissions / this.statistics.totalViews) * 100;
    }
  }
  
  // Gerar slug automaticamente se não fornecido
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  next();
});

// Método virtual para URL completa
LPIndicadoresSchema.virtual('fullUrl').get(function() {
  if (this.status === 'published' && this.publishedUrl) {
    return this.publishedUrl;
  }
  return this.previewUrl || `/lp/indicadores/${this.slug}`;
});

// Método virtual para taxa de conversão formatada
LPIndicadoresSchema.virtual('formattedConversionRate').get(function() {
  return `${this.statistics.conversionRate.toFixed(2)}%`;
}); 