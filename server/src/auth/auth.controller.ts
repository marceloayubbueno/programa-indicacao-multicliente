import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ClientsService } from '../clients/clients.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly clientsService: ClientsService
  ) {}

  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() loginDto: LoginDto) {
    return this.authService.loginAdmin(loginDto);
  }

  @Post('client-login')
  @HttpCode(HttpStatus.OK)
  async clientLogin(@Body() loginDto: LoginDto) {
    // 🚀 NOVO: Login para clientes com JWT que inclui clientId
    try {
      const result = await this.clientsService.login(loginDto.email, loginDto.password);
      return {
        success: true,
        ...result,
        message: 'Login realizado com sucesso'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  @Get('admins')
  async listAdmins() {
    return this.authService.listAdmins();
  }
} 