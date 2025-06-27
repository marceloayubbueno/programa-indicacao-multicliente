# API – Administradores

> Consulte este documento para detalhes de integração, payloads e exemplos dos endpoints de administradores.
> Última atualização: 2024-06

---

## Sumário
- [Visão Geral](#visão-geral)
- [Endpoints](#endpoints)
  - [Listar admins](#listar-admins)
  - [Buscar admin por ID](#buscar-admin-por-id)
  - [Criar admin](#criar-admin)
  - [Editar admin](#editar-admin)
  - [Excluir admin](#excluir-admin)
- [Exemplos de Payloads](#exemplos-de-payloads)
- [Observações de Integração](#observações-de-integração)
- [Referências](#referências)

---

## Visão Geral
Os endpoints de administradores permitem o cadastro, edição, listagem e exclusão de usuários com acesso administrativo ao sistema. Todas as rotas são protegidas por autenticação JWT (admin).

Base URL: `/api/admins`

---

## Endpoints

### Listar admins
- **GET** `/api/admins`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:**
```json
[
  {
    "_id": "...",
    "nome": "...",
    "email": "...",
    "role": "admin|superadmin"
  }
]
```

### Buscar admin por ID
- **GET** `/api/admins/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:** (igual ao objeto acima)

### Criar admin
- **POST** `/api/admins`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "nome": "Maria Admin",
  "email": "maria@empresa.com",
  "password": "senha123",
  "role": "admin"
}
```
- **Resposta:** (admin criado)
- **Status:** `201 Created`, `400 Bad Request`, `401 Unauthorized`

### Editar admin
- **PUT** `/api/admins/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** (campos editáveis: nome, email, role, password)
- **Resposta:** (admin atualizado)
- **Status:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

### Excluir admin
- **DELETE** `/api/admins/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:**
```json
{ "message": "Admin excluído com sucesso" }
```
- **Status:** `200 OK`, `401 Unauthorized`, `404 Not Found`

---

## Exemplos de Payloads

### Cadastro de admin
```json
{
  "nome": "João Admin",
  "email": "joao@empresa.com",
  "password": "senha123",
  "role": "admin"
}
```

---

## Observações de Integração
- Todos os endpoints exigem autenticação JWT de administrador.
- O campo `role` pode ser `admin` ou `superadmin`.
- O backend envia e-mail de boas-vindas ao criar um novo admin.
- Valide sempre os status HTTP e mensagens de erro para UX adequada.

---

## Referências
- [Visão geral do projeto](../promptify-project-overview.md)
- [Checklist de desenvolvimento](../dev-checklist.md) 