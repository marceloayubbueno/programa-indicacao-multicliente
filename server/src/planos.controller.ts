import { Controller, Get } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Controller('planos')
export class PlanosController {
  @Get()
  findAll() {
    const filePath = path.resolve(__dirname, '../../planos.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
} 