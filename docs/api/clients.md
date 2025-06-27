# API – Clientes

> Consulte este documento para detalhes de integração, payloads e exemplos dos endpoints de clientes.
> Última atualização: 2024-06

---

## Sumário
- [Visão Geral](#visão-geral)
- [Endpoints](#endpoints)
  - [Listar clientes](#listar-clientes)
  - [Buscar cliente por ID](#buscar-cliente-por-id)
  - [Criar cliente](#criar-cliente)
  - [Editar cliente](#editar-cliente)
  - [Excluir cliente](#excluir-cliente)
- [Exemplos de Payloads](#exemplos-de-payloads)
- [Observações de Integração](#observações-de-integração)
- [Referências](#referências)

---

## Visão Geral
Os endpoints de clientes permitem o cadastro, edição, listagem e exclusão de empresas que utilizam o sistema. Todas as rotas são protegidas por autenticação JWT (admin).

Base URL: `/api/clients`

---

## Endpoints

### Listar clientes
- **GET** `/api/clients`
- **Query params:** `page`, `search` (opcional)
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:**
```json
{
  "clients": [ { ... } ],
  "page": 1,
  "totalPages": 3
}
```

### Buscar cliente por ID
- **GET** `/api/clients/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:**
```json
{
  "_id": "...",
  "companyName": "Empresa X",
  "cnpj": "...",
  "responsibleName": "...",
  "responsibleEmail": "...",
  ...
}
```

### Criar cliente
- **POST** `/api/clients`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "companyName": "Empresa X",
  "cnpj": "...",
  "responsibleName": "...",
  "responsiblePosition": "...",
  "responsibleEmail": "...",
  "responsiblePhone": "...",
  "responsibleCPF": "...",
  "cep": "...",
  "street": "...",
  "number": "...",
  "complement": "...",
  "neighborhood": "...",
  "city": "...",
  "state": "...",
  "accessEmail": "...",
  "password": "...",
  "plan": "...",
  "status": "ativo"
}
```
- **Resposta:**
```json
{
  "_id": "...",
  "companyName": "Empresa X",
  ...
}
```
- **Status:** `201 Created` (sucesso), `400 Bad Request` (validação), `401 Unauthorized`

### Editar cliente
- **PUT** `/api/clients/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** (mesmo do POST)
- **Resposta:**
```json
{
  "_id": "...",
  "companyName": "Empresa X",
  ...
}
```
- **Status:** `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`

### Excluir cliente
- **DELETE** `/api/clients/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Resposta:**
```json
{
  "message": "Cliente excluído com sucesso"
}
```
- **Status:** `200 OK`, `401 Unauthorized`, `404 Not Found`

---

## Exemplos de Payloads

### Cadastro de cliente
```json
{
  "companyName": "Empresa XPTO",
  "cnpj": "12.345.678/0001-99",
  "responsibleName": "João Silva",
  "responsiblePosition": "Diretor",
  "responsibleEmail": "joao@empresa.com",
  "responsiblePhone": "(11) 91234-5678",
  "responsibleCPF": "123.456.789-00",
  "cep": "01001-000",
  "street": "Rua Exemplo",
  "number": "123",
  "complement": "Sala 1",
  "neighborhood": "Centro",
  "city": "São Paulo",
  "state": "SP",
  "accessEmail": "joao@empresa.com",
  "password": "senha123",
  "plan": "<id do plano>",
  "status": "ativo"
}
```

---

## Observações de Integração
- Todos os endpoints exigem autenticação JWT de administrador.
- O campo `plan` pode ser temporariamente omitido se o fluxo de planos estiver desabilitado.
- O campo `accessEmail` deve ser igual ao e-mail do responsável.
- O backend envia e-mail de credenciais se solicitado.
- Valide sempre os status HTTP e mensagens de erro para UX adequada.

---

## Referências
- [Visão geral do projeto](../promptify-project-overview.md)
- [Checklist de desenvolvimento](../dev-checklist.md) 