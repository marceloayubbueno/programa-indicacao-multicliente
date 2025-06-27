# API – Login de Administrador

## Endpoint

- **URL:** `/api/auth/admin-login`
- **Método:** `POST`

## Payload de Requisição
```json
{
  "email": "admin@empresa.com",
  "password": "senha123"
}
```

## Resposta de Sucesso (200)
```json
{
  "token": "jwt_token_aqui",
  "admin": {
    "_id": "...",
    "nome": "...",
    "email": "...",
    "role": "admin|superadmin"
  }
}
```

## Resposta de Erro (401 Unauthorized)
```json
{
  "statusCode": 401,
  "message": "Credenciais inválidas",
  "error": "Unauthorized"
}
```

## Observações
- O token JWT deve ser salvo no `localStorage` como `adminToken` para autenticação nas próximas requisições.
- O campo `role` pode ser `admin` ou `superadmin`.
- Em caso de erro, exiba mensagem amigável ao usuário e não detalhe o motivo da falha por segurança. 