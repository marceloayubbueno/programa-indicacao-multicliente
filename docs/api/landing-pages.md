# API – Landing Pages, LP-Divulgação e LP-Indicadores

> Consulte este documento para detalhes de integração, payloads e exemplos dos endpoints de landing pages e suas variações.
> Última atualização: 2024-06

---

## Sumário
- [Visão Geral](#visão-geral)
- [Endpoints Landing Pages](#endpoints-landing-pages)
- [Endpoints LP-Divulgação](#endpoints-lp-divulgacao)
- [Endpoints LP-Indicadores](#endpoints-lp-indicadores)
- [Exemplos de Payloads](#exemplos-de-payloads)
- [Observações de Integração](#observações-de-integração)
- [Referências](#referências)

---

## Visão Geral
Os endpoints de landing pages permitem o cadastro, edição, publicação, duplicação, estatísticas e manipulação de templates de páginas de divulgação e indicadores. Todas as rotas são protegidas por autenticação JWT (admin ou cliente).

Bases URL:
- `/api/landing-pages`
- `/api/lp-divulgacao`
- `/api/lp-indicadores`

---

## Endpoints Landing Pages

- **GET** `/api/landing-pages` — Listar páginas
- **GET** `/api/landing-pages/:id` — Buscar por ID
- **POST** `/api/landing-pages` — Criar página
- **PUT** `/api/landing-pages/:id` — Editar página
- **DELETE** `/api/landing-pages/:id` — Excluir página
- **GET** `/api/landing-pages/:slug` — Buscar por slug
- **POST** `/api/landing-pages/:id/publish` — Publicar página
- **POST** `/api/landing-pages/:id/unpublish` — Despublicar página
- **POST** `/api/landing-pages/:id/duplicate` — Duplicar página
- **GET** `/api/landing-pages/:id/statistics` — Estatísticas
- **GET** `/api/landing-pages/:id/preview` — Preview

## Endpoints LP-Divulgação

- **GET** `/api/lp-divulgacao` — Listar páginas
- **GET** `/api/lp-divulgacao/:id` — Buscar por ID
- **POST** `/api/lp-divulgacao` — Criar página
- **PUT** `/api/lp-divulgacao/:id` — Editar página
- **DELETE** `/api/lp-divulgacao/:id` — Excluir página
- **GET** `/api/lp-divulgacao/slug/:slug` — Buscar por slug
- **POST** `/api/lp-divulgacao/:id/publish` — Publicar página
- **POST** `/api/lp-divulgacao/:id/unpublish` — Despublicar página
- **POST** `/api/lp-divulgacao/:id/duplicate` — Duplicar página
- **GET** `/api/lp-divulgacao/:id/statistics` — Estatísticas
- **POST** `/api/lp-divulgacao/submit-trial` — Submeter trial
- **GET** `/api/lp-divulgacao/:id/preview` — Preview

## Endpoints LP-Indicadores

- **GET** `/api/lp-indicadores` — Listar páginas
- **GET** `/api/lp-indicadores/:id` — Buscar por ID
- **POST** `/api/lp-indicadores` — Criar página
- **PUT** `/api/lp-indicadores/:id` — Editar página
- **DELETE** `/api/lp-indicadores/:id` — Excluir página
- **GET** `/api/lp-indicadores/slug/:slug` — Buscar por slug
- **POST** `/api/lp-indicadores/:id/publish` — Publicar página
- **POST** `/api/lp-indicadores/:id/unpublish` — Despublicar página
- **POST** `/api/lp-indicadores/:id/duplicate` — Duplicar página
- **GET** `/api/lp-indicadores/:id/statistics` — Estatísticas
- **POST** `/api/lp-indicadores/submit-form` — Submeter formulário
- **GET** `/api/lp-indicadores/:id/preview` — Preview

---

## Exemplos de Payloads

### Cadastro de landing page
```json
{
  "nome": "Página de Campanha",
  "slug": "campanha-2024",
  "conteudo": { /* dados do editor visual */ }
}
```

---

## Observações de Integração
- Todos os endpoints exigem autenticação JWT.
- O campo `conteudo` pode variar conforme o editor visual utilizado (ex: GrapesJS).
- Valide sempre os status HTTP e mensagens de erro para UX adequada.

---

## Referências
- [Visão geral do projeto](../promptify-project-overview.md)
- [Checklist de desenvolvimento](../dev-checklist.md) 