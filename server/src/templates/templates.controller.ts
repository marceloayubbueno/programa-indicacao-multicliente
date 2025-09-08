import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';

@Controller('templates')
export class TemplatesController {
  
  @Get('planilha-exemplo')
  async downloadPlanilhaExemplo(@Res() res: Response) {
    try {
      // Caminho para o arquivo na pasta client/templates
      const filePath = join(process.cwd(), 'client', 'templates', 'planilha-de-exemplo.xlsx');
      
      // Configurar headers para download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="planilha-de-exemplo.xlsx"');
      
      // Enviar arquivo
      res.sendFile(filePath);
    } catch (error) {
      console.error('Erro ao servir arquivo:', error);
      res.status(404).json({ 
        success: false, 
        message: 'Arquivo não encontrado' 
      });
    }
  }
}
