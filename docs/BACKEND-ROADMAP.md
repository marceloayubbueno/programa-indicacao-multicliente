# 🛠️ Roadmap Backend - Landing Pages System

## 📋 Overview
Desenvolvimento completo do backend para suportar o editor GrapesJS e páginas públicas de indicação.

---

## 🎯 Objetivos Principais

### ✅ **O que temos atualmente**
- Editor GrapesJS funcional (frontend)
- Schema MongoDB básico
- Controller e Service estruturados
- Sistema de campanhas funcionando

### 🔄 **O que precisamos implementar**
- CRUD completo para Landing Pages
- Sistema de publicação de páginas
- URLs públicas amigáveis
- Integração com sistema de campanhas
- Processamento de formulários de indicação

---

## 📊 Estrutura de Dados Detalhada

### **Schema Atualizado - Landing Page**

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LandingPageDocument = LandingPage & Document;

@Schema({ timestamps: true })
export class LandingPage {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: /^[a-z0-9-]+$/
  })
  slug: string;

  @Prop({ 
    required: true, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campaign' })
  campaignId?: Types.ObjectId;

  // Conteúdo do GrapesJS
  @Prop({ type: Object, required: true })
  content: {
    html: string;           // HTML gerado pelo GrapesJS
    css: string;            // CSS gerado pelo GrapesJS
    components: any[];      // Estrutura de componentes do GrapesJS
    assets: string[];       // URLs de imagens/assets utilizados
  };

  // SEO e metadados
  @Prop({ type: Object })
  seoSettings: {
    title: string;
    description: string;
    keywords: string[];
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };

  // Analytics simples
  @Prop({ type: Object, default: () => ({
    views: 0,
    submissions: 0,
    conversionRate: 0,
    lastViewed: null
  })})
  analytics: {
    views: number;
    submissions: number;
    conversionRate: number;
    lastViewed?: Date;
  };

  // Configurações avançadas (futuro)
  @Prop({ type: Object })
  settings?: {
    customDomain?: string;
    passwordProtected?: boolean;
    password?: string;
    expiresAt?: Date;
    trackingCode?: string;
  };

  // Histórico de publicações
  @Prop({ type: Date })
  publishedAt?: Date;

  @Prop({ type: Date })
  lastEditedAt?: Date;
}

export const LandingPageSchema = SchemaFactory.createForClass(LandingPage);

// Indexes para performance
LandingPageSchema.index({ slug: 1 });
LandingPageSchema.index({ clientId: 1, status: 1 });
LandingPageSchema.index({ campaignId: 1 });
```

### **DTOs Completos**

```typescript
// create-landing-page.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsObject, IsArray, ValidateNested, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

class ContentDto {
  @IsString()
  @IsNotEmpty()
  html: string;

  @IsString()
  @IsNotEmpty()
  css: string;

  @IsArray()
  components: any[];

  @IsArray()
  @IsOptional()
  @IsUrl({}, { each: true })
  assets?: string[];
}

class SeoSettingsDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  keywords?: string[];

  @IsUrl()
  @IsOptional()
  ogImage?: string;
}

export class CreateLandingPageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsMongoId()
  clientId: string;

  @IsMongoId()
  @IsOptional()
  campaignId?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ContentDto)
  content: ContentDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoSettingsDto)
  seoSettings?: SeoSettingsDto;
}

// update-landing-page.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateLandingPageDto extends PartialType(CreateLandingPageDto) {
  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: string;
}

// publish-landing-page.dto.ts
export class PublishLandingPageDto {
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoSettingsDto)
  seoSettings?: SeoSettingsDto;

  @IsString()
  @IsOptional()
  customSlug?: string;
}
```

---

## 🛠️ Controller Expandido

```typescript
// landing-pages.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LandingPagesService } from './landing-pages.service';
import { CreateLandingPageDto, UpdateLandingPageDto, PublishLandingPageDto } from './dto';

@Controller('api/landing-pages')
@UseGuards(JwtAuthGuard)
export class LandingPagesController {
  constructor(private readonly landingPagesService: LandingPagesService) {}

  // Listar LPs do cliente logado
  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('campaignId') campaignId?: string
  ) {
    const clientId = req.user.clientId;
    return this.landingPagesService.findAll(clientId, { status, campaignId });
  }

  // Obter LP específica
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const clientId = req.user.clientId;
    const landingPage = await this.landingPagesService.findOne(id);
    
    if (!landingPage || landingPage.clientId.toString() !== clientId) {
      throw new NotFoundException('Landing Page não encontrada');
    }
    
    return landingPage;
  }

  // Criar nova LP
  @Post()
  async create(@Body() createDto: CreateLandingPageDto, @Request() req) {
    createDto.clientId = req.user.clientId;
    return this.landingPagesService.create(createDto);
  }

  // Atualizar LP
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLandingPageDto,
    @Request() req
  ) {
    const clientId = req.user.clientId;
    return this.landingPagesService.update(id, updateDto, clientId);
  }

  // Deletar LP
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const clientId = req.user.clientId;
    return this.landingPagesService.remove(id, clientId);
  }

  // Publicar LP
  @Post(':id/publish')
  async publish(
    @Param('id') id: string,
    @Body() publishDto: PublishLandingPageDto,
    @Request() req
  ) {
    const clientId = req.user.clientId;
    return this.landingPagesService.publish(id, publishDto, clientId);
  }

  // Despublicar LP
  @Post(':id/unpublish')
  async unpublish(@Param('id') id: string, @Request() req) {
    const clientId = req.user.clientId;
    return this.landingPagesService.unpublish(id, clientId);
  }

  // Duplicar LP
  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @Request() req) {
    const clientId = req.user.clientId;
    return this.landingPagesService.duplicate(id, clientId);
  }

  // Preview da LP (sem autenticação para facilitar)
  @Get(':id/preview')
  async preview(@Param('id') id: string) {
    return this.landingPagesService.generatePreview(id);
  }

  // Obter analytics da LP
  @Get(':id/analytics')
  async getAnalytics(@Param('id') id: string, @Request() req) {
    const clientId = req.user.clientId;
    return this.landingPagesService.getAnalytics(id, clientId);
  }
}

// Controller público para servir as LPs
@Controller('lp')
export class PublicLandingPageController {
  constructor(private readonly landingPagesService: LandingPagesService) {}

  // Servir LP pública
  @Get(':slug')
  async serveLandingPage(@Param('slug') slug: string) {
    const landingPage = await this.landingPagesService.findBySlug(slug);
    
    if (!landingPage || landingPage.status !== 'published') {
      throw new NotFoundException('Página não encontrada');
    }

    // Incrementar visualizações
    await this.landingPagesService.incrementViews(landingPage._id);

    // Retornar HTML renderizado
    return this.landingPagesService.renderPublicPage(landingPage);
  }

  // Processar submissão de formulário
  @Post(':slug/submit')
  async submitForm(@Param('slug') slug: string, @Body() formData: any) {
    return this.landingPagesService.processFormSubmission(slug, formData);
  }

  // Tracking de eventos
  @Post(':slug/track')
  async trackEvent(@Param('slug') slug: string, @Body() event: any) {
    return this.landingPagesService.trackEvent(slug, event);
  }
}
```

---

## 🔧 Service Implementação

```typescript
// landing-pages.service.ts
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LandingPage, LandingPageDocument } from './entities/landing-page.schema';
import { CreateLandingPageDto, UpdateLandingPageDto, PublishLandingPageDto } from './dto';
import { CampaignsService } from '../campaigns/campaigns.service';
import { ReferralsService } from '../referrals/referrals.service';

@Injectable()
export class LandingPagesService {
  constructor(
    @InjectModel(LandingPage.name)
    private landingPageModel: Model<LandingPageDocument>,
    private campaignsService: CampaignsService,
    private referralsService: ReferralsService,
  ) {}

  // Gerar slug único
  private async generateUniqueSlug(name: string, existingSlug?: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (existingSlug && existingSlug !== baseSlug) {
      const existing = await this.landingPageModel.findOne({ slug: existingSlug });
      if (!existing) return existingSlug;
    }

    let slug = baseSlug;
    let counter = 1;

    while (await this.landingPageModel.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Listar LPs
  async findAll(clientId: string, filters: any = {}): Promise<LandingPage[]> {
    const query: any = { clientId };
    
    if (filters.status) query.status = filters.status;
    if (filters.campaignId) query.campaignId = filters.campaignId;

    return this.landingPageModel
      .find(query)
      .populate('campaignId', 'name description')
      .sort({ updatedAt: -1 })
      .exec();
  }

  // Obter LP por ID
  async findOne(id: string): Promise<LandingPage | null> {
    return this.landingPageModel
      .findById(id)
      .populate('campaignId', 'name description')
      .exec();
  }

  // Obter LP por slug (público)
  async findBySlug(slug: string): Promise<LandingPage | null> {
    return this.landingPageModel
      .findOne({ slug, status: 'published' })
      .populate('campaignId')
      .exec();
  }

  // Criar LP
  async create(createDto: CreateLandingPageDto): Promise<LandingPage> {
    // Gerar slug único
    const slug = await this.generateUniqueSlug(createDto.name, createDto.slug);

    // Validar campanha se fornecida
    if (createDto.campaignId) {
      const campaign = await this.campaignsService.findOne(createDto.campaignId);
      if (!campaign || campaign.clientId.toString() !== createDto.clientId) {
        throw new BadRequestException('Campanha inválida');
      }
    }

    const landingPage = new this.landingPageModel({
      ...createDto,
      slug,
      lastEditedAt: new Date(),
    });

    return landingPage.save();
  }

  // Atualizar LP
  async update(id: string, updateDto: UpdateLandingPageDto, clientId: string): Promise<LandingPage> {
    const landingPage = await this.findOne(id);
    
    if (!landingPage || landingPage.clientId.toString() !== clientId) {
      throw new NotFoundException('Landing Page não encontrada');
    }

    // Se mudou o nome, gerar novo slug
    if (updateDto.name && updateDto.name !== landingPage.name) {
      updateDto.slug = await this.generateUniqueSlug(updateDto.name, updateDto.slug);
    }

    Object.assign(landingPage, updateDto, { lastEditedAt: new Date() });
    return landingPage.save();
  }

  // Publicar LP
  async publish(id: string, publishDto: PublishLandingPageDto, clientId: string): Promise<LandingPage> {
    const landingPage = await this.findOne(id);
    
    if (!landingPage || landingPage.clientId.toString() !== clientId) {
      throw new NotFoundException('Landing Page não encontrada');
    }

    // Validar se tem conteúdo mínimo
    if (!landingPage.content.html || !landingPage.content.css) {
      throw new BadRequestException('Landing Page precisa ter conteúdo para ser publicada');
    }

    // Atualizar SEO se fornecido
    if (publishDto.seoSettings) {
      landingPage.seoSettings = { ...landingPage.seoSettings, ...publishDto.seoSettings };
    }

    // Atualizar slug se fornecido
    if (publishDto.customSlug) {
      landingPage.slug = await this.generateUniqueSlug(landingPage.name, publishDto.customSlug);
    }

    landingPage.status = 'published';
    landingPage.publishedAt = new Date();

    return landingPage.save();
  }

  // Despublicar LP
  async unpublish(id: string, clientId: string): Promise<LandingPage> {
    const landingPage = await this.findOne(id);
    
    if (!landingPage || landingPage.clientId.toString() !== clientId) {
      throw new NotFoundException('Landing Page não encontrada');
    }

    landingPage.status = 'draft';
    return landingPage.save();
  }

  // Duplicar LP
  async duplicate(id: string, clientId: string): Promise<LandingPage> {
    const original = await this.findOne(id);
    
    if (!original || original.clientId.toString() !== clientId) {
      throw new NotFoundException('Landing Page não encontrada');
    }

    const duplicateData = {
      name: `${original.name} (Cópia)`,
      clientId: original.clientId,
      campaignId: original.campaignId,
      content: { ...original.content },
      seoSettings: { ...original.seoSettings },
    };

    return this.create(duplicateData as CreateLandingPageDto);
  }

  // Deletar LP
  async remove(id: string, clientId: string): Promise<any> {
    const landingPage = await this.findOne(id);
    
    if (!landingPage || landingPage.clientId.toString() !== clientId) {
      throw new NotFoundException('Landing Page não encontrada');
    }

    return this.landingPageModel.findByIdAndDelete(id);
  }

  // Renderizar página pública
  async renderPublicPage(landingPage: LandingPage): Promise<string> {
    const seo = landingPage.seoSettings || {};
    
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${seo.title || landingPage.name}</title>
        <meta name="description" content="${seo.description || ''}">
        <meta name="keywords" content="${seo.keywords?.join(', ') || ''}">
        
        <!-- Open Graph -->
        <meta property="og:title" content="${seo.ogTitle || seo.title || landingPage.name}">
        <meta property="og:description" content="${seo.ogDescription || seo.description || ''}">
        <meta property="og:image" content="${seo.ogImage || ''}">
        <meta property="og:type" content="website">
        
        <!-- FontAwesome -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
        
        <!-- Estilos da LP -->
        <style>
          ${landingPage.content.css}
          
          /* Estilos base para formulários */
          .lp-form {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
          }
          .lp-form input,
          .lp-form button {
            width: 100%;
            margin-bottom: 15px;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .lp-form button {
            background: #007bff;
            color: white;
            cursor: pointer;
            border: none;
          }
          .lp-form button:hover {
            background: #0056b3;
          }
          .lp-success,
          .lp-error {
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
            text-align: center;
          }
          .lp-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .lp-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
        </style>
      </head>
      <body>
        ${landingPage.content.html}
        
        <script>
          // Configuração global
          window.LP_CONFIG = {
            slug: '${landingPage.slug}',
            campaignId: '${landingPage.campaignId || ''}',
            apiUrl: '/lp/${landingPage.slug}'
          };
          
          // Processar formulários
          document.addEventListener('DOMContentLoaded', function() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
              form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(form);
                const data = Object.fromEntries(formData.entries());
                
                try {
                  const response = await fetch(window.LP_CONFIG.apiUrl + '/submit', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                  });
                  
                  const result = await response.json();
                  
                  if (response.ok) {
                    form.innerHTML = '<div class="lp-success">Obrigado! Sua indicação foi enviada com sucesso.</div>';
                  } else {
                    throw new Error(result.message || 'Erro ao enviar indicação');
                  }
                } catch (error) {
                  const errorDiv = document.createElement('div');
                  errorDiv.className = 'lp-error';
                  errorDiv.textContent = error.message || 'Erro ao enviar indicação. Tente novamente.';
                  form.insertBefore(errorDiv, form.firstChild);
                }
              });
            });
            
            // Tracking básico
            fetch(window.LP_CONFIG.apiUrl + '/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'page_view',
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
              })
            }).catch(() => {}); // Ignorar erros de tracking
          });
        </script>
      </body>
      </html>
    `;
  }

  // Processar submissão de formulário
  async processFormSubmission(slug: string, formData: any): Promise<any> {
    const landingPage = await this.findBySlug(slug);
    
    if (!landingPage) {
      throw new NotFoundException('Página não encontrada');
    }

    // Validar dados mínimos
    if (!formData.name || !formData.email) {
      throw new BadRequestException('Nome e email são obrigatórios');
    }

    // Processar indicação se vinculada a campanha
    if (landingPage.campaignId) {
      const referralData = {
        campaignId: landingPage.campaignId.toString(),
        landingPageId: landingPage._id.toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        source: 'landing-page',
        metadata: {
          userAgent: formData.userAgent,
          ip: formData.ip,
          timestamp: new Date(),
        }
      };

      await this.referralsService.create(referralData);
    }

    // Incrementar submissions
    await this.incrementSubmissions(landingPage._id);

    return { 
      success: true, 
      message: 'Indicação enviada com sucesso!' 
    };
  }

  // Incrementar visualizações
  async incrementViews(id: string): Promise<void> {
    await this.landingPageModel.findByIdAndUpdate(id, {
      $inc: { 'analytics.views': 1 },
      $set: { 'analytics.lastViewed': new Date() }
    });
  }

  // Incrementar submissões
  async incrementSubmissions(id: string): Promise<void> {
    const landingPage = await this.landingPageModel.findById(id);
    if (landingPage) {
      const newSubmissions = landingPage.analytics.submissions + 1;
      const conversionRate = landingPage.analytics.views > 0 
        ? (newSubmissions / landingPage.analytics.views) * 100 
        : 0;

      await this.landingPageModel.findByIdAndUpdate(id, {
        $inc: { 'analytics.submissions': 1 },
        $set: { 'analytics.conversionRate': conversionRate }
      });
    }
  }

  // Obter analytics
  async getAnalytics(id: string, clientId: string): Promise<any> {
    const landingPage = await this.findOne(id);
    
    if (!landingPage || landingPage.clientId.toString() !== clientId) {
      throw new NotFoundException('Landing Page não encontrada');
    }

    return {
      views: landingPage.analytics.views,
      submissions: landingPage.analytics.submissions,
      conversionRate: landingPage.analytics.conversionRate,
      lastViewed: landingPage.analytics.lastViewed,
      publicUrl: `/lp/${landingPage.slug}`,
      status: landingPage.status,
      publishedAt: landingPage.publishedAt,
    };
  }

  // Preview para desenvolvimento
  async generatePreview(id: string): Promise<string> {
    const landingPage = await this.findOne(id);
    
    if (!landingPage) {
      throw new NotFoundException('Landing Page não encontrada');
    }

    return this.renderPublicPage(landingPage);
  }

  // Tracking de eventos
  async trackEvent(slug: string, event: any): Promise<any> {
    // Implementar tracking básico ou integração com analytics
    console.log(`[Analytics] ${slug}:`, event);
    return { success: true };
  }
}
```

---

## 📋 Checklist de Implementação

### **Fase 1: Setup Backend (Semana 1)**
- [ ] Atualizar schema da LandingPage com campos completos
- [ ] Criar DTOs de validação
- [ ] Implementar sistema de slugs únicos
- [ ] Adicionar indexes no MongoDB
- [ ] Configurar module e dependências

### **Fase 2: CRUD APIs (Semana 1-2)**
- [ ] Implementar controller completo
- [ ] Implementar service com todas as operações
- [ ] Adicionar validações e tratamento de erros
- [ ] Implementar sistema de permissões (cliente só vê suas LPs)
- [ ] Testes unitários básicos

### **Fase 3: Sistema de Publicação (Semana 2)**
- [ ] Implementar renderização de páginas públicas
- [ ] Sistema de URLs amigáveis (/lp/slug)
- [ ] Template engine para páginas públicas
- [ ] Processamento de formulários
- [ ] Analytics básico (views/submissions)

### **Fase 4: Integração Frontend (Semana 2-3)**
- [ ] Atualizar editor GrapesJS para usar APIs
- [ ] Implementar lista de LPs carregando do backend
- [ ] Sistema de preview funcionando
- [ ] Publicação/despublicação via interface
- [ ] Feedback visual para operações

### **Fase 5: Formulários e Campanhas (Semana 3)**
- [ ] Integração com sistema de referrals existente
- [ ] Processamento automático de indicações
- [ ] Notificações para clientes
- [ ] Validação de dados de formulário
- [ ] Sistema de metadata e tracking

### **Fase 6: Melhorias e Polish (Semana 4)**
- [ ] SEO automático
- [ ] Otimização de performance
- [ ] Testes E2E
- [ ] Documentação da API
- [ ] Deploy e configuração de produção

---

## 🚀 Comandos de Desenvolvimento

```bash
# 1. Gerar DTOs
nest g class landing-pages/dto/create-landing-page.dto --no-spec
nest g class landing-pages/dto/update-landing-page.dto --no-spec
nest g class landing-pages/dto/publish-landing-page.dto --no-spec

# 2. Atualizar service e controller
# (editar arquivos existentes)

# 3. Testar APIs
npm run start:dev

# 4. Executar testes
npm run test landing-pages

# 5. Build para produção
npm run build
```

---

## 🔗 Integração com Sistema Existente

### **Dependências do módulo**
```typescript
// landing-pages.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LandingPage.name, schema: LandingPageSchema }
    ]),
    CampaignsModule,    // Para validar campanhas
    ReferralsModule,    // Para processar indicações
  ],
  controllers: [LandingPagesController, PublicLandingPageController],
  providers: [LandingPagesService],
  exports: [LandingPagesService],
})
export class LandingPagesModule {}
```

### **Atualização do app.module.ts**
```typescript
@Module({
  imports: [
    // ... outros módulos
    LandingPagesModule,
  ],
})
export class AppModule {}
```

---

## ✅ Pronto para Implementar!

Com essa documentação detalhada, temos:

1. **Estrutura de dados completa** e bem definida
2. **APIs claras** com validação e segurança
3. **Fluxo de trabalho** bem planejado
4. **Integração** com sistema existente mapeada
5. **Roadmap de desenvolvimento** por fases
6. **Checklist prático** para implementação

O próximo passo é começar a implementação seguindo a **Fase 1** do checklist! 🚀 