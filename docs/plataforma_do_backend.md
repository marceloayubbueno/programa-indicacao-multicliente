# Plataforma do Backend

- **Linguagem:** TypeScript (NestJS) e JavaScript (Express)
- **Frameworks:** NestJS (API principal), Express (servidor de arquivos e rotas básicas)
- **Banco de Dados:** PostgreSQL (via TypeORM) e MongoDB (via Mongoose para scripts/rotas específicas)
- **Ambiente de Execução:** Node.js (versão recomendada >= 16)
- **Gerenciador de Pacotes:** npm
- **Principais dependências:**
  - @nestjs/core, @nestjs/common, @nestjs/typeorm
  - express, mongoose, typeorm, bcryptjs, cors, nodemailer, dotenv, jsonwebtoken

O backend pode ser executado em ambientes Linux, Windows ou containers Docker, desde que as variáveis de ambiente estejam corretamente configuradas. 