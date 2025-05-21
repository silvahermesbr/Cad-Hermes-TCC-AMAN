// public/js/api.js
console.log('api.js carregado.');

const API_BASE_URL = '/api';

// Função helper para tratar respostas da API de forma consistente
async function handleApiResponse(resposta) {
  if (!resposta.ok) { // Verifica se o status HTTP não é 2xx (sucesso)
    let errorText = `Erro HTTP ${resposta.status} - ${resposta.statusText}`;
    try {
      const rawText = await resposta.text();
      errorText = rawText || errorText;
      const errorData = JSON.parse(rawText); 
      errorText = errorData.mensagem || errorText;
      
      const erro = new Error(errorText);
      erro.dados = errorData;
      erro.status = resposta.status;
      throw erro;

    } catch (e) {
      const erro = new Error(errorText);
      erro.status = resposta.status;
      throw erro;
    }
  }
  return await resposta.json();
}

/**
 * Realiza a chamada de login para a API.
 * @param {string} identidadeMilitar A identidade militar do usuário.
 * @param {string} senha A senha do usuário.
 * @returns {Promise<object>} Uma promessa que resolve com os dados da resposta da API.
 */
async function loginUsuario(identidadeMilitar, senha) {
  console.log('Chamando loginUsuario com:', identidadeMilitar);
  try {
    const resposta = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identidadeMilitar, senha }),
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error('Falha ao tentar fazer login (api.js):', erro);
    throw erro; 
  }
}

/**
 * Busca os itens do inventário para um militar específico.
 * @param {string} idMilitarDono O ID do militar dono dos itens.
 * @returns {Promise<object>}
 */
async function buscarInventario(idMilitarDono) {
  if (!idMilitarDono) throw new Error('ID do Militar Dono não fornecido para buscarInventario.');
  try {
    const resposta = await fetch(`${API_BASE_URL}/inventario?id_militar_dono=${encodeURIComponent(idMilitarDono)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error('Falha ao buscar inventário (api.js):', erro);
    throw erro;
  }
}

/**
 * Adiciona um novo item ao inventário.
 * @param {object} dadosItem Objeto contendo os detalhes do item.
 * @returns {Promise<object>}
 */
async function adicionarItemInventario(dadosItem) {
  try {
    const resposta = await fetch(`${API_BASE_URL}/inventario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosItem),
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error('Falha ao adicionar item ao inventário (api.js):', erro);
    throw erro;
  }
}

/**
 * Atualiza um item existente no inventário.
 * @param {string} codigoItemOriginal O código original do item a ser atualizado (PK).
 * @param {object} dadosItem Objeto contendo os novos detalhes do item.
 * @returns {Promise<object>}
 */
async function atualizarItemInventario(codigoItemOriginal, dadosItem) {
  try {
    const resposta = await fetch(`${API_BASE_URL}/inventario/${encodeURIComponent(codigoItemOriginal)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosItem),
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error(`Falha ao atualizar item ${codigoItemOriginal} (api.js):`, erro);
    throw erro;
  }
}

/**
 * Deleta um item do inventário.
 * @param {string} codigoItem O código do item a ser deletado.
 * @param {string} idMilitarDono O ID do militar dono (para verificação de permissão no backend).
 * @returns {Promise<object>}
 */
async function deletarItemInventario(codigoItem, idMilitarDono) {
  try {
    const resposta = await fetch(`${API_BASE_URL}/inventario/${encodeURIComponent(codigoItem)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_militar_dono: idMilitarDono })
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error(`Falha ao deletar item ${codigoItem} (api.js):`, erro);
    throw erro;
  }
}

/**
 * Registra uma nova cautela de item.
 * @param {object} dadosCautela Objeto contendo os detalhes da cautela.
 * @returns {Promise<object>}
 */
async function registrarCautelaItem(dadosCautela) {
  try {
    const resposta = await fetch(`${API_BASE_URL}/movimentacoes/cautelar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosCautela),
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error('Falha ao registrar cautela de item (api.js):', erro);
    throw erro;
  }
}

/**
 * Busca as movimentações (cautelas) registradas por um militar dono de item.
 * @param {string} idMilitarDonoItem O ID do militar que é o dono dos itens movimentados.
 * @returns {Promise<object>}
 */
async function buscarMovimentacoes(idMilitarDonoItem) {
  if (!idMilitarDonoItem) throw new Error('ID do Militar Dono do Item não fornecido para buscarMovimentacoes.');
  try {
    const resposta = await fetch(`${API_BASE_URL}/movimentacoes?id_militar_dono_item=${encodeURIComponent(idMilitarDonoItem)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error('Falha ao buscar movimentações (api.js):', erro);
    throw erro;
  }
}

/**
 * Registra a devolução de um item cautelado.
 * @param {number} idMovimentacao O ID da movimentação (cautela) a ser devolvida.
 * @param {string} idMilitarDonoOperacao O ID do militar que está registrando a devolução (dono do item).
 * @returns {Promise<object>}
 */
async function registrarDevolucaoItem(idMovimentacao, idMilitarDonoOperacao) {
  if (!idMovimentacao || !idMilitarDonoOperacao) throw new Error('Dados insuficientes para registrar devolução.');
  try {
    const resposta = await fetch(`${API_BASE_URL}/movimentacoes/${idMovimentacao}/devolver`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_militar_dono_operacao: idMilitarDonoOperacao }),
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error(`Falha ao registrar devolução para ID ${idMovimentacao} (api.js):`, erro);
    throw erro;
  }
}

/**
 * Busca a lista de todo o pessoal (militares) cadastrado.
 * @returns {Promise<object>}
 */
async function buscarPessoal() {
  try {
    const resposta = await fetch(`${API_BASE_URL}/pessoal`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error('Falha ao buscar lista de pessoal (api.js):', erro);
    throw erro;
  }
}

/**
 * Adiciona um novo militar ao sistema (requer privilégios de admin).
 * @param {object} dadosMilitar Objeto contendo os detalhes do novo militar.
 * @param {string} idAdminOperacao ID do administrador realizando a operação.
 * @returns {Promise<object>}
 */
async function adicionarMilitar(dadosMilitar, idAdminOperacao) {
  const corpoRequisicao = { ...dadosMilitar, id_militar_admin_operacao: idAdminOperacao };
  try {
    const resposta = await fetch(`${API_BASE_URL}/pessoal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpoRequisicao),
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error('Falha ao adicionar militar (api.js):', erro);
    throw erro;
  }
}

/**
 * Atualiza os dados de um militar existente (requer privilégios de admin).
 * @param {string} idMilitarParaEditar ID do militar cujos dados serão editados.
 * @param {object} dadosMilitar Objeto contendo os novos detalhes do militar.
 * @param {string} idAdminOperacao ID do administrador realizando a operação.
 * @returns {Promise<object>}
 */
async function atualizarMilitar(idMilitarParaEditar, dadosMilitar, idAdminOperacao) {
  const corpoRequisicao = { ...dadosMilitar, id_militar_admin_operacao: idAdminOperacao };
  try {
    const resposta = await fetch(`${API_BASE_URL}/pessoal/${encodeURIComponent(idMilitarParaEditar)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpoRequisicao),
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error(`Falha ao atualizar militar ${idMilitarParaEditar} (api.js):`, erro);
    throw erro;
  }
}

/**
 * Deleta um militar do sistema (requer privilégios de admin).
 * @param {string} idMilitarParaDeletar ID do militar a ser deletado.
 * @param {string} idAdminOperacao ID do administrador realizando a operação.
 * @returns {Promise<object>}
 */
async function deletarMilitar(idMilitarParaDeletar, idAdminOperacao) {
  try {
    const resposta = await fetch(`${API_BASE_URL}/pessoal/${encodeURIComponent(idMilitarParaDeletar)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_militar_admin_operacao: idAdminOperacao }),
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error(`Falha ao deletar militar ${idMilitarParaDeletar} (api.js):`, erro);
    throw erro;
  }
}

/**
 * Gera o relatório de inventário total, aplicando filtros opcionais.
 * @param {object} filtros Objeto contendo os filtros.
 * @returns {Promise<object>}
 */
async function gerarRelatorioInventarioTotal(filtros = {}) {
  const queryParams = new URLSearchParams();
  if (filtros.nome_item) queryParams.append('filtro_nome_item', filtros.nome_item);
  if (filtros.local) queryParams.append('filtro_local', filtros.local);
  if (filtros.id_dono) queryParams.append('filtro_id_dono', filtros.id_dono);
  try {
    const resposta = await fetch(`${API_BASE_URL}/relatorios/inventario-total?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error('Falha ao gerar relatório de inventário total (api.js):', erro);
    throw erro;
  }
}

/**
 * Gera o relatório de material em uso, aplicando filtros opcionais.
 * @param {object} filtros Objeto contendo os filtros. 
 * @returns {Promise<object>}
 */
async function gerarRelatorioMaterialEmUso(filtros = {}) {
  const queryParams = new URLSearchParams();
  if (filtros.id_dono_item) queryParams.append('filtro_id_dono_item', filtros.id_dono_item);
  if (filtros.id_pessoal_cautelou) queryParams.append('filtro_id_pessoal_cautelou', filtros.id_pessoal_cautelou);
  if (filtros.destino) queryParams.append('filtro_destino', filtros.destino);
  try {
    const resposta = await fetch(`${API_BASE_URL}/relatorios/material-em-uso?${queryParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await handleApiResponse(resposta);
  } catch (erro) {
    console.error('Falha ao gerar relatório de material em uso (api.js):', erro);
    throw erro;
  }
}

/**
 * Gera o relatório de devoluções atrasadas, aplicando filtros opcionais.
 * @param {object} filtros Objeto contendo os filtros.
 * Ex: { id_dono_item: 'ID_DONO', id_pessoal_cautelou: 'ID_CAUTELOU' }
 * @returns {Promise<object>} Uma promessa que resolve com os dados da resposta da API.
 */
async function gerarRelatorioDevolucoesAtrasadas(filtros = {}) {
  const queryParams = new URLSearchParams();
  if (filtros.id_dono_item) queryParams.append('filtro_id_dono_item', filtros.id_dono_item);
  if (filtros.id_pessoal_cautelou) queryParams.append('filtro_id_pessoal_cautelou', filtros.id_pessoal_cautelou);
  // Poderíamos adicionar mais filtros se necessário (ex: por período)

  try {
    const resposta = await fetch(`${API_BASE_URL}/relatorios/devolucoes-atrasadas?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${seu_token_jwt}` // Se esta rota fosse protegida
      },
    });
    return await handleApiResponse(resposta); // Reutiliza o handler de resposta
  } catch (erro) {
    console.error('Falha ao gerar relatório de devoluções atrasadas (api.js):', erro);
    throw erro;
  }
}

