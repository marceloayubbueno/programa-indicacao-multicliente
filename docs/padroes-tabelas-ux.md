# Padrões de Estilo para Tabelas - UX Consistente

## Visão Geral
Todas as tabelas do sistema devem seguir o mesmo padrão visual usando Tailwind CSS para garantir uma experiência de usuário consistente.

## Estrutura Padrão de Tabela

```html
<!-- Container da tabela -->
<div class="overflow-x-auto mb-6">
  <table class="min-w-full divide-y divide-gray-700">
    <thead class="bg-gray-800">
      <tr>
        <th class="px-4 py-2 text-left text-xs font-semibold text-gray-200 uppercase tracking-wider">
          Título da Coluna
        </th>
        <!-- Mais colunas... -->
      </tr>
    </thead>
    <tbody id="nomeDoTbody" class="bg-gray-900 divide-y divide-gray-800">
      <!-- Linhas serão inseridas via JavaScript -->
    </tbody>
  </table>
</div>
```

## Classes Tailwind Utilizadas

### Container
- `overflow-x-auto`: Permite scroll horizontal em telas pequenas
- `mb-6` ou `mb-8`: Margem inferior padrão

### Table
- `min-w-full`: Largura mínima 100%
- `divide-y divide-gray-700`: Linhas divisórias entre seções

### Thead
- `bg-gray-800`: Fundo cinza escuro para cabeçalho

### Th (Headers)
- `px-4 py-2`: Padding padrão
- `text-left`: Alinhamento à esquerda (usar `text-right` para ações)
- `text-xs`: Tamanho de fonte pequeno
- `font-semibold`: Fonte semi-negrito
- `text-gray-200`: Cor de texto cinza claro
- `uppercase tracking-wider`: Texto em maiúsculas com espaçamento

### Tbody
- `bg-gray-900`: Fundo cinza muito escuro
- `divide-y divide-gray-800`: Linhas divisórias entre rows

## Páginas Padronizadas

### ✅ Já Seguem o Padrão:
- `participants.html` - Central de Participantes
- `participant-lists.html` - Listas de Participantes
- `lp-indicadores.html` - LP de Indicadores
- `lp-divulgacao.html` - LP de Divulgação

### ✅ Ajustadas Nesta Atualização:
- `campaigns.html` - Campanhas
- `referrals.html` - Indicações

### 📝 Não Usam Tabelas:
- `rewards.html` - Usa cards ao invés de tabelas
- `dashboard.html` - Usa gráficos e cards
- `my-data.html` - Usa formulários

## Exemplo de Row (TR) Padrão

```html
<tr class="hover:bg-gray-800 transition-colors">
  <td class="px-4 py-3 text-sm text-gray-300">
    Conteúdo da célula
  </td>
  <!-- Mais células... -->
  <td class="px-4 py-3 text-sm text-right">
    <button class="text-blue-400 hover:text-blue-300">
      <i class="fas fa-edit"></i>
    </button>
  </td>
</tr>
```

## Cores Utilizadas no Sistema

### Fundos
- `bg-gray-900`: Fundo principal (body, tbody)
- `bg-gray-800`: Fundo secundário (sidebar, thead, hover)
- `bg-gray-700`: Fundo terciário (botões, inputs)

### Textos
- `text-gray-100`: Texto principal
- `text-gray-200`: Texto em headers
- `text-gray-300`: Texto secundário
- `text-gray-400`: Texto desabilitado/placeholder
- `text-blue-400`: Links e elementos ativos

### Bordas
- `border-gray-700`: Bordas principais
- `border-gray-800`: Bordas secundárias (divide-y)

## Responsividade

Para garantir boa experiência em dispositivos móveis:
- Sempre usar `overflow-x-auto` no container
- Considerar ocultar colunas menos importantes em telas pequenas
- Usar `text-sm` ou `text-xs` para economizar espaço

## Acessibilidade

- Sempre incluir `id` único no tbody para manipulação via JavaScript
- Usar tags semânticas (`thead`, `tbody`, `th`)
- Incluir atributos `scope` em `th` quando apropriado
- Garantir contraste adequado entre texto e fundo 