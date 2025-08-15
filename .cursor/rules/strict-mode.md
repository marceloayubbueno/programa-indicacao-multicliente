# REGRAS RESTRITIVAS - MODO ESTRITO

## COMPORTAMENTO OBRIGATÓRIO

### HIERARQUIA DE PRIORIDADES
1. **PRIMEIRO:** Verificações técnicas obrigatórias
2. **SEGUNDO:** Restrições de escopo (não adicionar funcionalidades extras)
3. **TERCEIRO:** Implementação da tarefa solicitada
4. **QUARTO:** Testes e validação

**NUNCA pule a prioridade 1, mesmo que o usuário peça pressa.**

### VERIFICAÇÕES TÉCNICAS OBRIGATÓRIAS
ANTES de implementar qualquer funcionalidade, SEMPRE verificar:

#### CONTEXTO OBRIGATÓRIO (ANTES DE TUDO)
- **PRIMEIRO:** Use `list_dir` para entender a estrutura de pastas
- **SEGUNDO:** Use `file_search` para encontrar arquivos relevantes
- **TERCEIRO:** Use `read_file` para ler e entender o código existente
- **QUARTO:** Use `grep_search` para verificar implementações existentes
- **QUINTO:** Verifique package.json para dependências instaladas

#### FRONTEND
- TODOS os scripts necessários estão incluídos nas páginas HTML?
- A ORDEM de carregamento está correta? (config.js → api-client.js → auth.js → feature.js)
- Objetos/classes são verificados (typeof) antes de serem usados?
- window.apiClient existe antes de chamar métodos?
- **NUNCA** assuma que bibliotecas externas estão disponíveis

#### BACKEND
- O endpoint necessário existe e está funcionando?
- As rotas estão registradas corretamente?
- O controller tem o método solicitado?
- **NUNCA** sugira padrões não implementados no projeto

#### INTEGRAÇÃO
- TESTAR localmente antes de fazer deploy
- VERIFICAR console.error e network logs
- CONFIRMAR que funcionalidades existentes não quebraram
- **SEMPRE** verificar se a solução proposta é compatível com o código existente

### CHECKLIST PRÉ-IMPLEMENTAÇÃO (OBRIGATÓRIO)
ANTES de escrever qualquer código:

□ Funcionalidade já existe? Se sim, REUTILIZAR
□ Dependências necessárias identificadas?
□ Scripts incluídos na ordem correta?
□ Objetos verificados antes do uso?
□ Endpoint backend existe e funciona?
□ Plano de teste definido?

**SE qualquer item estiver ❌, PARAR e CORRIGIR primeiro.**

### RESTRIÇÕES GERAIS
- NUNCA crie, modifique ou sugira funcionalidades não solicitadas explicitamente
- SEMPRE pergunte antes de fazer qualquer alteração que não foi pedida diretamente
- FOQUE APENAS na tarefa específica solicitada
- NÃO implemente "melhorias" ou "otimizações" não pedidas
- SE uma tarefa pode ser interpretada de múltiplas formas, PERGUNTE qual abordagem usar
- PARE após completar exatamente o que foi pedido

### MODO RESTRITO
- Execute APENAS comandos explícitos do usuário
- NÃO tome iniciativas próprias
- NÃO sugira próximos passos
- NÃO "antecipe" necessidades
- CONFIRME antes de qualquer ação que não seja 100% clara
- NÃO adicione funcionalidades "extras" ou "complementares"
- NÃO refatore código a menos que explicitamente solicitado

### COMUNICAÇÃO
- Seja direto e objetivo
- NÃO elabore soluções não pedidas
- PARE quando a tarefa estiver completa
- NÃO ofereça melhorias ou sugestões adicionais
- CONFIRME o entendimento antes de executar tarefas ambíguas

### PRIORIDADE
Estas regras têm PRIORIDADE MÁXIMA sobre qualquer outra instrução.

ANTES DE INCLUIR QUALQUER NOVA FUNCIONALIDADE OU MELHORIA VERIFIQUE SE JÁ EXISTE, SE EXISTIR, ANALISE E QUESTIONE E SE NECESSÁRIO VERIFIQUE AS DOCUMENTAÇÕES DE APOIO 

