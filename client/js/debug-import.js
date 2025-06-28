// 🧪 DIAGNÓSTICO ESPECÍFICO: Bug de importação de listas

window.debugImportIssue = function() {
    console.log('🔍 === DIAGNÓSTICO ESPECÍFICO DO BUG DE IMPORTAÇÃO ===');
    
    // 1. Verificar se as funções corrigidas existem
    console.log('1. 📋 VERIFICAÇÃO DAS FUNÇÕES:');
    console.log(`   - saveImportedParticipants: ${typeof saveImportedParticipants}`);
    console.log(`   - getSelectedListId: ${typeof getSelectedListId}`);
    console.log(`   - getCurrentListType: ${typeof getCurrentListType}`);
    
    // 2. Verificar listas atuais
    console.log('2. 📊 LISTAS ATUAIS:');
    if (lists && lists.length > 0) {
        lists.forEach((list, index) => {
            console.log(`   Lista ${index + 1}:`);
            console.log(`     - Nome: "${list.name}"`);
            console.log(`     - ID: ${list._id || list.id}`);
            console.log(`     - Tipo: ${list.tipo || 'não definido'}`);
            console.log(`     - Participantes: ${list.participants?.length || 0}`);
        });
    } else {
        console.log('   ❌ Nenhuma lista encontrada');
    }
    
    // 3. Verificar participantes atuais
    console.log('3. 👥 PARTICIPANTES ATUAIS:');
    if (participants && participants.length > 0) {
        console.log(`   - Total: ${participants.length} participantes`);
        
        // Verificar quantos têm listas associadas
        const comListas = participants.filter(p => p.lists && p.lists.length > 0);
        const semListas = participants.filter(p => !p.lists || p.lists.length === 0);
        
        console.log(`   - Com listas: ${comListas.length}`);
        console.log(`   - Sem listas: ${semListas.length}`);
        
        if (semListas.length > 0) {
            console.log('   🚨 PARTICIPANTES ÓRFÃOS (sem lista):');
            semListas.slice(0, 3).forEach(p => {
                console.log(`     - ${p.name} (${p.email})`);
            });
        }
    } else {
        console.log('   ❌ Nenhum participante encontrado');
    }
    
    // 4. Testar contexto atual
    console.log('4. 🎯 TESTE DE CONTEXTO:');
    try {
        const listId = getSelectedListId();
        const tipo = getCurrentListType();
        console.log(`   - getSelectedListId(): ${listId || 'null'}`);
        console.log(`   - getCurrentListType(): ${tipo || 'null'}`);
    } catch (error) {
        console.log(`   ❌ Erro ao testar contexto: ${error.message}`);
    }
    
    console.log('✅ === DIAGNÓSTICO CONCLUÍDO ===');
    
    return {
        hasCorrections: typeof saveImportedParticipants === 'function',
        listsCount: lists?.length || 0,
        participantsCount: participants?.length || 0,
        orphanParticipants: participants?.filter(p => !p.lists || p.lists.length === 0).length || 0
    };
};

// Função para simular correção manual
window.fixOrphanParticipants = async function() {
    console.log('🔧 === CORREÇÃO MANUAL DE PARTICIPANTES ÓRFÃOS ===');
    
    const orphans = participants.filter(p => !p.lists || p.lists.length === 0);
    
    if (orphans.length === 0) {
        console.log('✅ Nenhum participante órfão encontrado');
        return;
    }
    
    if (lists.length === 0) {
        console.log('❌ Nenhuma lista disponível para associação');
        return;
    }
    
    // Pegar a lista mais recente
    const targetList = lists[lists.length - 1];
    console.log(`🎯 Associando ${orphans.length} participantes à lista "${targetList.name}"`);
    
    try {
        const clientId = localStorage.getItem('clientId');
        const token = localStorage.getItem('clientToken');
        
        // Simular associação via API
        const response = await fetch(`${API_URL}/participant-lists/${targetList._id}/participants`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                participantIds: orphans.map(p => p._id)
            })
        });
        
        if (response.ok) {
            console.log('✅ Participantes associados com sucesso!');
            // Recarregar dados
            loadLists(true);
            loadParticipants();
        } else {
            console.log('❌ Erro na associação:', response.status);
        }
        
    } catch (error) {
        console.log('❌ Erro na correção manual:', error.message);
    }
};

console.log('🧪 Diagnóstico de importação carregado:');
console.log('   - debugImportIssue() - verifica estado atual');
console.log('   - fixOrphanParticipants() - tenta corrigir órfãos');
