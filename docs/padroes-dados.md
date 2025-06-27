# Padronização de Dados – Contratos Frontend/Backend

Este documento centraliza as convenções e padrões para troca de dados entre frontend e backend, garantindo integração consistente, manutenção facilitada e onboarding rápido.

---

## 1. Convenções Gerais

- **Nomenclatura:** camelCase para todos os campos (ex: `companyName`, `responsibleEmail`).
- **Tipos:** Seguir os tipos definidos nos DTOs do backend (`string`, `number`, `boolean`, `array`, `object`).
- **Datas:** Sempre em formato ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **IDs:** Sempre como string (`_id`), padrão MongoDB.
- **Status:** Usar valores controlados/documentados (ver enumerações).
- **Autenticação:** JWT no header `Authorization: Bearer <token>`.
- **Erros:** Padrão `{ statusCode, message, error }`.

---

## 2. Exemplos de Payloads

### Cliente

**POST /api/clients**
```json
{
  "companyName": "Empresa X",
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

### Indicador

**POST /api/indicators**
```json
{
  "name": "Maria Oliveira",
  "email": "maria@email.com",
  "phone": "(11) 99999-9999",
  "clientId": "<id do cliente>",
  "campaignId": "<id da campanha>",
  "lpId": "<id da LP>",
  "status": "ativo"
}
```

### Recompensa

**POST /api/rewards**
```json
{
  "type": "cash",
  "value": 100,
  "description": "Bônus por indicação",
  "campaign": "<id da campanha>",
  "indicator": "<id do indicador>"
}
```

---

## 3. Enumerações e Valores Controlados

- **Status de Cliente/Indicador:** `"pendente"`, `"ativo"`, `"inativo"`
- **Tipo de Recompensa:** `"cash"`, `"voucher"`, `"gift"`, etc. (verificar enum no backend)
- **Role de Usuário:** `"admin"`, `"superadmin"`

---

## 4. Convenções para Datas e Números

- Datas: Sempre ISO 8601 (ex: `"2024-06-01T12:00:00Z"`)
- Valores monetários: Sempre em centavos (inteiro) ou float, documentar o padrão adotado.

---

## 5. Padrão de Resposta de Erro

```json
{
  "statusCode": 400,
  "message": "Campo obrigatório ausente: companyName",
  "error": "Bad Request"
}
```

---

## 6. Boas Práticas e Melhorias Sugeridas

- Centralizar enumerações em um único arquivo no backend e documentar aqui.
- Garantir que todos os endpoints retornem sempre o mesmo padrão de erro.
- Documentar exemplos de todos os endpoints críticos (criação, edição, deleção, listagem).
- Adotar versionamento de API (`/api/v1/`) para facilitar evolução sem breaking changes.
- Validar e padronizar campos opcionais e obrigatórios em todos os contratos.
- Automatizar a geração desta documentação a partir dos DTOs e schemas do backend.

---

## 7. Referências

- [API – Clientes](./api/clients.md)
- [API – Login de Administrador](./api/auth-admin-login.md)
- [Overview do Projeto](./promptify-project-overview.md)

---

> **Este documento deve ser atualizado sempre que houver mudança nos contratos de dados ou inclusão de novos endpoints.** 