// public/js/dashboard.js
console.log('dashboard.js carregado.');

document.addEventListener('DOMContentLoaded', () => {
    // Elementos da UI Globais
    const nomeUsuarioSpan = document.getElementById('nomeUsuario');
    const btnLogout = document.getElementById('btnLogout');
    const navLinks = document.querySelectorAll('.dashboard-nav ul li a');
    const contentSections = document.querySelectorAll('.content-section');
    
    // Elementos do Modal de Inventário
    const modalInventario = document.getElementById('modalInventario');
    const btnAdicionarItem = document.getElementById('btnAdicionarItem');
    const formInventario = document.getElementById('formInventario');
    const modalInventarioTitulo = document.getElementById('modalInventarioTitulo');
    const idItemInventarioInput = document.getElementById('idItemInventario'); 
    const codigoItemInput = document.getElementById('codigoItem');
    const nomeItemInput = document.getElementById('nomeItem');
    const descricaoItemInput = document.getElementById('descricaoItem');
    const quantidadeItemInput = document.getElementById('quantidadeItem');
    const localItemInput = document.getElementById('localItem');

    // Elementos do Modal de Cautela
    const modalCautela = document.getElementById('modalCautela');
    const formCautela = document.getElementById('formCautela');
    const modalCautelaTitulo = document.getElementById('modalCautelaTitulo');
    const codigoItemCautelaInput = document.getElementById('codigoItemCautela');
    const quantidadeCautelaInput = document.getElementById('quantidadeCautela');
    const idMilitarCautelaInput = document.getElementById('idMilitarCautela'); 
    const nomeExternoCautelouInput = document.getElementById('nomeExternoCautelou'); 
    const docExternoCautelouInput = document.getElementById('docExternoCautelou');   
    const camposCautelaInternoDiv = document.getElementById('camposCautelaInterno');
    const camposCautelaExternoDiv = document.getElementById('camposCautelaExterno');
    const tipoCautelaRadios = document.querySelectorAll('input[name="tipoCautela"]');

    const destinoCautelaInput = document.getElementById('destinoCautela');
    const gdhEsperadoCautelaInput = document.getElementById('gdhEsperadoCautela');

    // Elementos da Seção de Relatórios
    const tipoRelatorioSelect = document.getElementById('tipoRelatorio');
    const filtrosInventarioTotalDiv = document.getElementById('filtrosInventarioTotal');
    const filtroInvNomeItemInput = document.getElementById('filtroInvNomeItem');
    const filtroInvLocalInput = document.getElementById('filtroInvLocal');
    const filtroInvIdDonoInput = document.getElementById('filtroInvIdDono');
    
    const filtrosMaterialEmUsoDiv = document.getElementById('filtrosMaterialEmUso');
    const filtroUsoIdDonoItemInput = document.getElementById('filtroUsoIdDonoItem');
    const filtroUsoIdPessoalCautelouInput = document.getElementById('filtroUsoIdPessoalCautelou');
    const filtroUsoDestinoInput = document.getElementById('filtroUsoDestino');

    const filtrosDevolucoesAtrasadasDiv = document.getElementById('filtrosDevolucoesAtrasadas');
    const filtroAtrasoIdDonoItemInput = document.getElementById('filtroAtrasoIdDonoItem');
    const filtroAtrasoIdPessoalCautelouInput = document.getElementById('filtroAtrasoIdPessoalCautelou');

    const btnGerarRelatorio = document.getElementById('btnGerarRelatorio');
    const areaRelatorioDiv = document.getElementById('areaRelatorio');

    // Elementos da Seção e Modal de Pessoal (para Admin)
    const btnAdicionarMilitar = document.getElementById('btnAdicionarMilitar');
    const colAcoesPessoalHeader = document.getElementById('colAcoesPessoalHeader');
    const modalPessoal = document.getElementById('modalPessoal');
    const formPessoal = document.getElementById('formPessoal');
    const modalPessoalTitulo = document.getElementById('modalPessoalTitulo');
    const idMilitarEdicaoInput = document.getElementById('idMilitarEdicao');
    const pessoalIdMilitarInput = document.getElementById('pessoalIdMilitar');
    const pessoalNomeCompletoInput = document.getElementById('pessoalNomeCompleto');
    const pessoalIdentidadeMilitarInput = document.getElementById('pessoalIdentidadeMilitar');
    const pessoalSenhaInput = document.getElementById('pessoalSenha');
    const pessoalNumeroContatoInput = document.getElementById('pessoalNumeroContato');
    const pessoalSecaoInput = document.getElementById('pessoalSecao');
    const pessoalStatusSelect = document.getElementById('pessoalStatus');
    const pessoalIsAdminSelect = document.getElementById('pessoalIsAdmin');

    // Estado da ordenação para cada tabela
    let sortState = {
        inventario: { column: 'nome_item', direction: 'asc' },
        movimentacoes: { column: 'gdh_saida', direction: 'desc' },
        pessoal: { column: 'nome_completo', direction: 'asc' }
    };
    let localInventarioData = [];
    let localMovimentacoesData = [];
    let localPessoalData = [];

    // --- Verificação de Autenticação ---
    const usuarioLogadoString = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogadoString) {
        console.log('Nenhum usuário logado. Redirecionando para login...');
        window.location.href = 'login.html';
        return; 
    }
    let usuarioLogado = null;
    try {
        usuarioLogado = JSON.parse(usuarioLogadoString);
    } catch (e) {
        console.error('Erro ao parsear dados do usuário. Redirecionando para login...', e);
        sessionStorage.removeItem('usuarioLogado'); 
        window.location.href = 'login.html';
        return;
    }
    if (!usuarioLogado || !usuarioLogado.id_militar) {
        console.log('Dados do usuário inválidos. Redirecionando para login...');
        sessionStorage.removeItem('usuarioLogado');
        window.location.href = 'login.html';
        return;
    }
    const isAdminUser = usuarioLogado.is_admin === 1;
    if (nomeUsuarioSpan) nomeUsuarioSpan.textContent = `${usuarioLogado.nome_completo || 'Usuário'} ${isAdminUser ? '(Admin)' : ''}`;

    if (isAdminUser) {
        if (btnAdicionarMilitar) btnAdicionarMilitar.style.display = 'inline-block';
        if (colAcoesPessoalHeader) colAcoesPessoalHeader.style.display = 'table-cell';
    }

    // --- Event Listeners Globais ---
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            sessionStorage.removeItem('usuarioLogado');
            window.location.href = 'login.html';
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(innerLink => innerLink.classList.remove('active-link'));
            link.classList.add('active-link');
            const targetId = link.id.replace('link', 'secao');
            contentSections.forEach(section => {
                section.style.display = (section.id === targetId) ? 'block' : 'none';
            });
            if (targetId === 'secaoInventario') carregarInventario();
            else if (targetId === 'secaoMovimentacoes') carregarMovimentacoes();
            else if (targetId === 'secaoPessoal') carregarPessoal();
            else if (targetId === 'secaoRelatorios') prepararSecaoRelatorios();
        });
    });

    const linkInventario = document.getElementById('linkInventario');
    if (linkInventario) linkInventario.click(); 

    document.querySelectorAll('.modal .close-button').forEach(btn => {
        btn.onclick = function() { this.closest('.modal').style.display = 'none'; }
    });
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) event.target.style.display = "none";
    }

    // --- Lógica do Modal de Inventário ---
    if (btnAdicionarItem) {
        btnAdicionarItem.addEventListener('click', () => {
            modalInventarioTitulo.textContent = 'Adicionar Novo Item ao Inventário';
            formInventario.reset();
            idItemInventarioInput.value = ''; 
            codigoItemInput.readOnly = false; 
            modalInventario.style.display = 'block';
        });
    }
    if (formInventario) {
        formInventario.addEventListener('submit', async (event) => {
            event.preventDefault();
            const codigoItemOriginalParaEdicao = idItemInventarioInput.value;
            const dadosItem = {
                nome_item: nomeItemInput.value.trim(),
                descricao_item: descricaoItemInput.value.trim(),
                quantidade: parseInt(quantidadeItemInput.value),
                local_armazenamento: localItemInput.value.trim(),
                id_militar_dono: usuarioLogado.id_militar 
            };
            if (!codigoItemOriginalParaEdicao) {
                dadosItem.codigo_item_bd = codigoItemInput.value.trim();
            }
            if ((!codigoItemOriginalParaEdicao && !dadosItem.codigo_item_bd) || !dadosItem.nome_item || isNaN(dadosItem.quantidade) || dadosItem.quantidade < 0) {
                alert('Preencha Código do Item (novos), Nome e Quantidade válida (>=0).');
                return;
            }
            const submitButton = formInventario.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';
            try {
                let resposta;
                if (codigoItemOriginalParaEdicao) {
                    resposta = await atualizarItemInventario(codigoItemOriginalParaEdicao, dadosItem); 
                } else {
                    resposta = await adicionarItemInventario(dadosItem); 
                }
                if (resposta && resposta.sucesso) {
                    alert(resposta.mensagem || `Item ${codigoItemOriginalParaEdicao ? 'atualizado' : 'adicionado'}!`);
                    modalInventario.style.display = 'none';
                    carregarInventario(); 
                } else {
                    alert(resposta?.mensagem || `Falha ao ${codigoItemOriginalParaEdicao ? 'atualizar' : 'adicionar'} item.`);
                }
            } catch (erro) {
                alert(`Erro: ${erro.dados?.mensagem || erro.message || 'Erro desconhecido.'}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    // --- Lógica do Modal de Cautela ---
    if (tipoCautelaRadios) {
        tipoCautelaRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'interno') {
                    if(camposCautelaInternoDiv) camposCautelaInternoDiv.style.display = 'block';
                    if(camposCautelaExternoDiv) camposCautelaExternoDiv.style.display = 'none';
                    if (nomeExternoCautelouInput) nomeExternoCautelouInput.value = '';
                    if (docExternoCautelouInput) docExternoCautelouInput.value = '';
                } else { 
                    if(camposCautelaInternoDiv) camposCautelaInternoDiv.style.display = 'none';
                    if(camposCautelaExternoDiv) camposCautelaExternoDiv.style.display = 'block';
                    if (idMilitarCautelaInput) idMilitarCautelaInput.value = '';
                }
            });
        });
        const tipoCautelaInicial = document.querySelector('input[name="tipoCautela"]:checked');
        if (tipoCautelaInicial && tipoCautelaInicial.value === 'interno') {
            if(camposCautelaInternoDiv) camposCautelaInternoDiv.style.display = 'block';
            if(camposCautelaExternoDiv) camposCautelaExternoDiv.style.display = 'none';
        } else if (tipoCautelaInicial && tipoCautelaInicial.value === 'externo') {
            if(camposCautelaInternoDiv) camposCautelaInternoDiv.style.display = 'none';
            if(camposCautelaExternoDiv) camposCautelaExternoDiv.style.display = 'block';
        } else {
             if(document.getElementById('tipoCautelaInterno')) document.getElementById('tipoCautelaInterno').checked = true;
             if(camposCautelaInternoDiv) camposCautelaInternoDiv.style.display = 'block';
             if(camposCautelaExternoDiv) camposCautelaExternoDiv.style.display = 'none';
        }
    }

    if (formCautela) {
        formCautela.addEventListener('submit', async (event) => {
            event.preventDefault();
            const tipoCautelaSelecionadoRadio = document.querySelector('input[name="tipoCautela"]:checked');
            if (!tipoCautelaSelecionadoRadio) {
                alert('Por favor, selecione o tipo de cautela (Interno ou Externo).');
                return;
            }
            const tipoCautelaSelecionado = tipoCautelaSelecionadoRadio.value;
            const dadosCautela = {
                codigo_item_fk: codigoItemCautelaInput.value,
                quantidade_movimentada: parseInt(quantidadeCautelaInput.value),
                destino_movimentacao: destinoCautelaInput.value.trim(),
                gdh_esperado_devolucao: gdhEsperadoCautelaInput.value.trim(),
                id_militar_dono_operacao: usuarioLogado.id_militar
            };
            if (tipoCautelaSelecionado === 'interno') {
                dadosCautela.id_pessoal_cautelou = idMilitarCautelaInput.value.trim();
                if (!dadosCautela.id_pessoal_cautelou) {
                    alert('Por favor, forneça o ID do Militar que está cautelando.');
                    return;
                }
            } else if (tipoCautelaSelecionado === 'externo') {
                dadosCautela.nome_externo_cautelou = nomeExternoCautelouInput.value.trim();
                dadosCautela.doc_externo_cautelou = docExternoCautelouInput.value.trim();
                if (!dadosCautela.nome_externo_cautelou || !dadosCautela.doc_externo_cautelou) {
                    alert('Por favor, forneça o Nome e Documento do Militar Externo.');
                    return;
                }
            }
            if (!dadosCautela.codigo_item_fk || isNaN(dadosCautela.quantidade_movimentada) || dadosCautela.quantidade_movimentada <= 0 || !dadosCautela.gdh_esperado_devolucao) {
                alert('Preencha todos os campos obrigatórios da cautela com valores válidos.');
                return;
            }
            const gdhRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;
            if (!gdhRegex.test(dadosCautela.gdh_esperado_devolucao)) {
                alert('Formato do GDH Esperado inválido. Use DD/MM/AAAA HH:MM:SS.');
                return;
            }
            const submitButton = formCautela.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Registrando...';
            try {
                const resposta = await registrarCautelaItem(dadosCautela);
                if (resposta && resposta.sucesso) {
                    alert(resposta.mensagem || 'Cautela registrada!');
                    modalCautela.style.display = 'none';
                    carregarInventario(); 
                    if (document.getElementById('linkMovimentacoes').classList.contains('active-link')) {
                        carregarMovimentacoes(); 
                    }
                } else {
                    alert(resposta?.mensagem || 'Falha ao registrar cautela.');
                }
            } catch (erro) {
                alert(`Erro: ${erro.dados?.mensagem || erro.message || 'Erro desconhecido.'}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }

    // --- Lógica da Seção e Modal de Pessoal (Admin) ---
    if (isAdminUser && btnAdicionarMilitar) {
        btnAdicionarMilitar.addEventListener('click', () => {
            modalPessoalTitulo.textContent = 'Adicionar Novo Militar';
            formPessoal.reset();
            idMilitarEdicaoInput.value = '';
            pessoalIdMilitarInput.readOnly = false;
            modalPessoal.style.display = 'block';
        });
    }
    if (formPessoal) {
        formPessoal.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!isAdminUser) { alert("Acesso negado."); return; }
            const idMilitarOriginalParaEdicao = idMilitarEdicaoInput.value;
            const dadosMilitar = {
                id_militar: pessoalIdMilitarInput.value.trim(),
                nome_completo: pessoalNomeCompletoInput.value.trim(),
                identidade_militar: pessoalIdentidadeMilitarInput.value.trim(),
                senha: pessoalSenhaInput.value, 
                numero_contato: pessoalNumeroContatoInput.value.trim(),
                secao: pessoalSecaoInput.value.trim(),
                status: parseInt(pessoalStatusSelect.value),
                is_admin: parseInt(pessoalIsAdminSelect.value)
            };
            if (!dadosMilitar.id_militar || !dadosMilitar.nome_completo || !dadosMilitar.identidade_militar) {
                alert('ID Militar, Nome Completo e Identidade Militar são obrigatórios.');
                return;
            }
            if (!idMilitarOriginalParaEdicao && !dadosMilitar.senha) { 
                alert('Senha é obrigatória para novos militares.');
                return;
            }
             if (dadosMilitar.senha && dadosMilitar.senha.length > 0 && dadosMilitar.senha.length < 6) {
                 alert('Se fornecida, a senha deve ter pelo menos 6 caracteres.');
                 return;
            }

            const submitButton = formPessoal.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando Militar...';
            try {
                let resposta;
                const dadosParaEnvio = { ...dadosMilitar };
                if (!dadosParaEnvio.senha) { 
                    delete dadosParaEnvio.senha; 
                }
                if (idMilitarOriginalParaEdicao) {
                    delete dadosParaEnvio.id_militar; 
                    resposta = await atualizarMilitar(idMilitarOriginalParaEdicao, dadosParaEnvio, usuarioLogado.id_militar);
                } else {
                    resposta = await adicionarMilitar(dadosParaEnvio, usuarioLogado.id_militar);
                }
                if (resposta && resposta.sucesso) {
                    alert(resposta.mensagem || `Militar ${idMilitarOriginalParaEdicao ? 'atualizado' : 'adicionado'}!`);
                    modalPessoal.style.display = 'none';
                    carregarPessoal(); 
                } else {
                    alert(resposta?.mensagem || `Falha ao ${idMilitarOriginalParaEdicao ? 'atualizar' : 'adicionar'} militar.`);
                }
            } catch (erro) {
                alert(`Erro: ${erro.dados?.mensagem || erro.message || 'Erro desconhecido.'}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }
    
    // --- Funções de Ordenação ---
    function parseGDH(gdhString) {
        if (!gdhString || typeof gdhString !== 'string') return null;
        const parts = gdhString.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
        if (!parts) return null;
        return new Date(parts[3], parts[2] - 1, parts[1], parts[4], parts[5], parts[6]);
    }

    function sortData(dataArray, columnKey, direction) {
        if (!Array.isArray(dataArray)) return [];
        return [...dataArray].sort((a, b) => {
            let valA = a[columnKey];
            let valB = b[columnKey];
            if (columnKey && (columnKey.toLowerCase().includes('gdh') || columnKey.toLowerCase().includes('data'))) {
                valA = parseGDH(valA);
                valB = parseGDH(valB);
                if (valA === null && valB === null) return 0;
                if (valA === null) return direction === 'asc' ? 1 : -1;
                if (valB === null) return direction === 'asc' ? -1 : 1;
            } else if (typeof valA === 'string' && !isNaN(parseFloat(valA)) && typeof valB === 'string' && !isNaN(parseFloat(valB)) && 
                       columnKey !== 'codigo_item_bd' && columnKey !== 'id_militar' && 
                       columnKey !== 'identidade_militar' && columnKey !== 'numero_contato' &&
                       columnKey !== 'codigo_item_fk') {
                if (String(valA).match(/^\d+(\.\d+)?$/) && String(valB).match(/^\d+(\.\d+)?$/)) {
                    valA = parseFloat(valA);
                    valB = parseFloat(valB);
                }
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                // No action needed
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
            }
             if (typeof valB === 'string') {
                valB = valB.toLowerCase();
            }
            let comparison = 0;
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;
            return direction === 'desc' ? comparison * -1 : comparison;
        });
    }

    function updateSortIndicators(tableSelector, columnKey, direction) {
        const tableHeaders = document.querySelectorAll(`${tableSelector} th.sortable-header`);
        tableHeaders.forEach(th => {
            const indicator = th.querySelector('.sort-indicator');
            if (indicator) {
                indicator.classList.remove('asc', 'desc');
                if (th.dataset.columnKey === columnKey) {
                    indicator.classList.add(direction);
                }
            }
        });
    }

    function addSortListenersToTable(tableSelector, dataStorageKey, renderFunction) {
        const headers = document.querySelectorAll(`${tableSelector} th.sortable-header`);
        headers.forEach(header => {
            header.addEventListener('click', () => {
                const columnKey = header.dataset.columnKey;
                let currentSort = sortState[dataStorageKey];
                let direction = 'asc';
                if (currentSort && currentSort.column === columnKey) {
                    direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                }
                sortState[dataStorageKey] = { column: columnKey, direction: direction };
                let dataToRender;
                if (dataStorageKey === 'inventario') dataToRender = localInventarioData;
                else if (dataStorageKey === 'movimentacoes') dataToRender = localMovimentacoesData;
                else if (dataStorageKey === 'pessoal') dataToRender = localPessoalData;
                if (dataToRender) {
                    const sortedData = sortData(dataToRender, columnKey, direction);
                    renderFunction(sortedData); 
                    updateSortIndicators(tableSelector, columnKey, direction);
                }
            });
        });
    }

    // --- Funções de Carregamento e Renderização de Dados ---
    async function carregarInventario() {
        const tbody = document.getElementById('tabelaInventarioCorpo');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Carregando inventário...</td></tr>`;
        try {
            const respostaAPI = await buscarInventario(usuarioLogado.id_militar);
            if (respostaAPI.sucesso && Array.isArray(respostaAPI.inventario)) {
                localInventarioData = respostaAPI.inventario;
                const sortedData = sortData(localInventarioData, sortState.inventario.column, sortState.inventario.direction);
                renderInventario(sortedData);
                updateSortIndicators('#secaoInventario table', sortState.inventario.column, sortState.inventario.direction);
            } else { throw new Error(respostaAPI.mensagem || 'Resposta inválida.'); }
        } catch (erro) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">Falha: ${erro.message}</td></tr>`;
            localInventarioData = [];
        }
    }

    function renderInventario(inventarioData) {
        const tbody = document.getElementById('tabelaInventarioCorpo');
        if (!tbody) return;
        if (inventarioData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center">Nenhum item. Adicione um novo.</td></tr>`;
        } else {
            tbody.innerHTML = ''; 
            inventarioData.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.codigo_item_bd || ''}</td><td>${item.nome_item || ''}</td>
                    <td>${item.descricao_item || ''}</td><td>${item.quantidade || 0}</td>
                    <td>${item.local_armazenamento || ''}</td><td>${item.id_militar_dono || ''}</td>
                    <td>${item.gdh_inicial || ''}</td>
                    <td>
                        <button class="btn btn-action btn-editar-inventario" data-id="${item.codigo_item_bd}">Editar</button>
                        <button class="btn btn-action btn-cautelar-item" data-id="${item.codigo_item_bd}" data-nome="${item.nome_item || ''}" data-qtd-disp="${item.quantidade || 0}">Cautelar</button>
                        <button class="btn btn-delete btn-deletar-inventario" data-id="${item.codigo_item_bd}">Excluir</button>
                    </td>`;
                tbody.appendChild(tr);
            });
            adicionarListenersBotoesAcaoInventario(); 
        }
    }

    async function carregarMovimentacoes() {
        const tbody = document.getElementById('tabelaMovimentacoesCorpo');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">Carregando movimentações...</td></tr>`;
        try {
            const respostaAPI = await buscarMovimentacoes(usuarioLogado.id_militar);
            if (respostaAPI.sucesso && Array.isArray(respostaAPI.movimentacoes)) {
                localMovimentacoesData = respostaAPI.movimentacoes;
                const sortedData = sortData(localMovimentacoesData, sortState.movimentacoes.column, sortState.movimentacoes.direction);
                renderMovimentacoes(sortedData);
                updateSortIndicators('#secaoMovimentacoes table', sortState.movimentacoes.column, sortState.movimentacoes.direction);
            } else { throw new Error(respostaAPI.mensagem || 'Resposta inválida.'); }
        } catch (erro) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center">Falha: ${erro.message}</td></tr>`;
            localMovimentacoesData = [];
        }
    }

    function renderMovimentacoes(movimentacoesData) {
        const tbody = document.getElementById('tabelaMovimentacoesCorpo');
        if (!tbody) return;
        if (movimentacoesData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center">Nenhuma movimentação encontrada.</td></tr>`;
        } else {
            tbody.innerHTML = ''; 
            movimentacoesData.forEach(mov => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${mov.codigo_item_fk || ''}</td><td>${mov.nome_item_cautelado || 'N/A'}</td>
                    <td>${mov.quantidade_movimentada || 0}</td><td>${mov.destino_movimentacao || ''}</td>
                    <td>${mov.gdh_saida || ''}</td><td>${mov.gdh_entrada || 'Pendente'}</td>
                    <td>${mov.gdh_esperado_devolucao || ''}</td>
                    <td>${mov.nome_responsavel_cautela || (mov.id_pessoal_cautelou || 'N/A')} ${mov.doc_externo_cautelou ? `(${mov.doc_externo_cautelou})` : ''}</td>
                    <td>
                        ${!mov.gdh_entrada ? 
                          `<button class="btn btn-action btn-devolver-item" data-id-movimentacao="${mov.id_movimentacao}">Devolver</button>` 
                          : 'Devolvido'}
                    </td>`;
                tbody.appendChild(tr);
            });
            adicionarListenersBotoesAcaoMovimentacao(); 
        }
    }

    async function carregarPessoal() {
        const tbody = document.getElementById('tabelaPessoalCorpo');
        if (!tbody) return;
        const colspan = isAdminUser ? 8 : 7;
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">Carregando pessoal...</td></tr>`;
        try {
            const respostaAPI = await buscarPessoal(); 
            if (respostaAPI.sucesso && Array.isArray(respostaAPI.pessoal)) {
                localPessoalData = respostaAPI.pessoal;
                const sortedData = sortData(localPessoalData, sortState.pessoal.column, sortState.pessoal.direction);
                renderPessoal(sortedData);
                updateSortIndicators('#secaoPessoal table', sortState.pessoal.column, sortState.pessoal.direction);
            } else { throw new Error(respostaAPI.mensagem || 'Resposta inválida.'); }
        } catch (erro) {
            tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">Falha: ${erro.message}</td></tr>`;
            localPessoalData = [];
        }
    }

    function renderPessoal(pessoalData) {
        const tbody = document.getElementById('tabelaPessoalCorpo');
        if (!tbody) return;
        const colspan = isAdminUser ? 8 : 7;
        if (pessoalData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${colspan}" class="text-center">Nenhum militar cadastrado.</td></tr>`;
        } else {
            tbody.innerHTML = ''; 
            pessoalData.forEach(militar => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${militar.id_militar || ''}</td><td>${militar.nome_completo || ''}</td>
                    <td>${militar.numero_contato || ''}</td><td>${militar.secao || ''}</td>
                    <td>${militar.identidade_militar || ''}</td>
                    <td>${militar.status === 1 ? 'Ativo' : 'Inativo'}</td>
                    <td>${militar.is_admin === 1 ? 'Sim' : 'Não'}</td>
                    ${isAdminUser ? 
                        `<td>
                            <button class="btn btn-action btn-editar-pessoal" data-id="${militar.id_militar}">Editar</button>
                            ${usuarioLogado.id_militar !== militar.id_militar ? 
                                `<button class="btn btn-delete btn-deletar-pessoal" data-id="${militar.id_militar}">Excluir</button>` 
                                : ''}
                        </td>` 
                        : ''}`;
                tbody.appendChild(tr);
            });
            if (isAdminUser) adicionarListenersBotoesAcaoPessoal(); 
        }
    }
    
    // --- Lógica da Seção de Relatórios ---
    function prepararSecaoRelatorios() {
        if(areaRelatorioDiv) areaRelatorioDiv.innerHTML = '<p class="text-center">Selecione o tipo de relatório e os filtros desejados, depois clique em "Gerar Relatório".</p>';
        
        if (filtroInvNomeItemInput) filtroInvNomeItemInput.value = '';
        if (filtroInvLocalInput) filtroInvLocalInput.value = '';
        if (filtroInvIdDonoInput) filtroInvIdDonoInput.value = '';
        if (filtroUsoIdDonoItemInput) filtroUsoIdDonoItemInput.value = '';
        if (filtroUsoIdPessoalCautelouInput) filtroUsoIdPessoalCautelouInput.value = '';
        if (filtroUsoDestinoInput) filtroUsoDestinoInput.value = '';
        if (filtroAtrasoIdDonoItemInput) filtroAtrasoIdDonoItemInput.value = '';
        if (filtroAtrasoIdPessoalCautelouInput) filtroAtrasoIdPessoalCautelouInput.value = '';

        const tipoSelecionado = tipoRelatorioSelect ? tipoRelatorioSelect.value : 'inventario_total';
        if (filtrosInventarioTotalDiv) filtrosInventarioTotalDiv.style.display = (tipoSelecionado === 'inventario_total') ? 'block' : 'none';
        if (filtrosMaterialEmUsoDiv) filtrosMaterialEmUsoDiv.style.display = (tipoSelecionado === 'material_em_uso') ? 'block' : 'none';
        if (filtrosDevolucoesAtrasadasDiv) filtrosDevolucoesAtrasadasDiv.style.display = (tipoSelecionado === 'devolucao_atrasada') ? 'block' : 'none';
    }

    if (tipoRelatorioSelect) {
        tipoRelatorioSelect.addEventListener('change', prepararSecaoRelatorios);
        if (document.getElementById('linkRelatorios')?.classList.contains('active-link')) {
            prepararSecaoRelatorios();
        }
    }

    if (btnGerarRelatorio) {
        btnGerarRelatorio.addEventListener('click', async () => {
            const tipoRelatorio = tipoRelatorioSelect.value;
            if(areaRelatorioDiv) areaRelatorioDiv.innerHTML = '<p class="text-center">Gerando relatório...</p>';
            let filtros = {};
            let tituloParaRelatorio = '';
            let dadosParaRelatorio = null;

            try {
                if (tipoRelatorio === 'inventario_total') {
                    filtros = {
                        nome_item: filtroInvNomeItemInput ? filtroInvNomeItemInput.value.trim() : '',
                        local: filtroInvLocalInput ? filtroInvLocalInput.value.trim() : '',
                        id_dono: filtroInvIdDonoInput ? filtroInvIdDonoInput.value.trim() : ''
                    };
                    tituloParaRelatorio = 'Relatório de Inventário Total';
                    const respostaAPI = await gerarRelatorioInventarioTotal(filtros);
                    if (respostaAPI.sucesso && Array.isArray(respostaAPI.relatorio)) dadosParaRelatorio = respostaAPI.relatorio;
                    else throw new Error(respostaAPI.mensagem || 'Resposta inválida da API.');
                } else if (tipoRelatorio === 'material_em_uso') {
                    filtros = {
                        id_dono_item: filtroUsoIdDonoItemInput ? filtroUsoIdDonoItemInput.value.trim() : '',
                        id_pessoal_cautelou: filtroUsoIdPessoalCautelouInput ? filtroUsoIdPessoalCautelouInput.value.trim() : '',
                        destino: filtroUsoDestinoInput ? filtroUsoDestinoInput.value.trim() : ''
                    };
                    tituloParaRelatorio = 'Relatório de Material em Uso';
                    const respostaAPI = await gerarRelatorioMaterialEmUso(filtros);
                    if (respostaAPI.sucesso && Array.isArray(respostaAPI.relatorio)) dadosParaRelatorio = respostaAPI.relatorio;
                    else throw new Error(respostaAPI.mensagem || 'Resposta inválida da API.');
                } else if (tipoRelatorio === 'devolucao_atrasada') {
                    filtros = {
                        id_dono_item: filtroAtrasoIdDonoItemInput ? filtroAtrasoIdDonoItemInput.value.trim() : '',
                        id_pessoal_cautelou: filtroAtrasoIdPessoalCautelouInput ? filtroAtrasoIdPessoalCautelouInput.value.trim() : ''
                    };
                    tituloParaRelatorio = 'Relatório de Devoluções Atrasadas';
                    const respostaAPI = await gerarRelatorioDevolucoesAtrasadas(filtros);
                    if (respostaAPI.sucesso && Array.isArray(respostaAPI.relatorio)) dadosParaRelatorio = respostaAPI.relatorio;
                    else throw new Error(respostaAPI.mensagem || 'Resposta inválida da API.');
                } else {
                    if(areaRelatorioDiv) areaRelatorioDiv.innerHTML = '<p class="text-center">Tipo de relatório não implementado.</p>';
                    return;
                }

                sessionStorage.setItem('dadosParaRelatorio', JSON.stringify(dadosParaRelatorio));
                sessionStorage.setItem('tituloParaRelatorio', tituloParaRelatorio);
                sessionStorage.setItem('filtrosParaRelatorio', JSON.stringify(filtros));
                const novaAba = window.open('relatorio.html', '_blank');
                if (novaAba) {
                   novaAba.focus();
                   if(areaRelatorioDiv) areaRelatorioDiv.innerHTML = `<p class="text-center">${tituloParaRelatorio} gerado em uma nova aba.</p>`;
                } else {
                   if(areaRelatorioDiv) areaRelatorioDiv.innerHTML = '<p class="text-center" style="color:red;">Falha ao abrir aba do relatório. Verifique bloqueador de pop-ups.</p>';
                }
            } catch (erro) {
                if(areaRelatorioDiv) areaRelatorioDiv.innerHTML = `<p class="text-center" style="color: red;">Falha: ${erro.message}</p>`;
            }
        });
    }

    // --- Funções de Adição de Listeners para Botões de Ação ---
    function adicionarListenersBotoesAcaoInventario() {
        document.querySelectorAll('.btn-editar-inventario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const codigoItemParaEditar = e.target.dataset.id;
                const inventarioLocal = JSON.parse(sessionStorage.getItem('inventarioLocal'));
                const itemParaEditar = inventarioLocal?.find(item => item.codigo_item_bd === codigoItemParaEditar);
                modalInventarioTitulo.textContent = `Editar Item: ${codigoItemParaEditar}`;
                formInventario.reset(); 
                idItemInventarioInput.value = codigoItemParaEditar; 
                if (itemParaEditar) {
                    codigoItemInput.value = itemParaEditar.codigo_item_bd;
                    codigoItemInput.readOnly = true; 
                    nomeItemInput.value = itemParaEditar.nome_item;
                    descricaoItemInput.value = itemParaEditar.descricao_item || '';
                    quantidadeItemInput.value = itemParaEditar.quantidade;
                    localItemInput.value = itemParaEditar.local_armazenamento || '';
                } else {
                    codigoItemInput.value = codigoItemParaEditar;
                    codigoItemInput.readOnly = true;
                    console.warn("Dados do item não encontrados localmente para edição.");
                }
                modalInventario.style.display = 'block';
            });
        });
        document.querySelectorAll('.btn-cautelar-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idItem = e.target.dataset.id;
                const nomeItem = e.target.dataset.nome;
                const qtdDisponivel = parseInt(e.target.dataset.qtdDisp);
                modalCautelaTitulo.innerHTML = `Cautelar Item: <strong>${nomeItem} (${idItem})</strong> - Disponível: ${qtdDisponivel}`;
                formCautela.reset();
                codigoItemCautelaInput.value = idItem;
                quantidadeCautelaInput.max = qtdDisponivel;
                quantidadeCautelaInput.placeholder = `Máx: ${qtdDisponivel}`;
                if (document.getElementById('tipoCautelaInterno')) document.getElementById('tipoCautelaInterno').checked = true;
                if (camposCautelaInternoDiv) camposCautelaInternoDiv.style.display = 'block';
                if (camposCautelaExternoDiv) camposCautelaExternoDiv.style.display = 'none';
                modalCautela.style.display = 'block';
            });
        });
        document.querySelectorAll('.btn-deletar-inventario').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const codigoItemParaDeletar = e.target.dataset.id;
                if (confirm(`Tem certeza que deseja excluir o item "${codigoItemParaDeletar}"?`)) {
                    try {
                        const resposta = await deletarItemInventario(codigoItemParaDeletar, usuarioLogado.id_militar);
                        if (resposta.sucesso) {
                            alert(resposta.mensagem || 'Item deletado!');
                            carregarInventario(); 
                        } else {
                            alert(resposta.mensagem || 'Falha ao deletar.');
                        }
                    } catch (erro) {
                        alert(`Erro: ${erro.dados?.mensagem || erro.message || 'Erro desconhecido.'}`);
                    }
                }
            });
        });
    }

    function adicionarListenersBotoesAcaoMovimentacao() {
        document.querySelectorAll('.btn-devolver-item').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idMovimentacao = parseInt(e.target.dataset.idMovimentacao);
                if (confirm(`Confirmar devolução para a movimentação ID: ${idMovimentacao}?`)) {
                    const targetButton = e.target;
                    const originalButtonText = targetButton.textContent;
                    targetButton.disabled = true;
                    targetButton.textContent = 'Devolvendo...';
                    try {
                        const resposta = await registrarDevolucaoItem(idMovimentacao, usuarioLogado.id_militar);
                        if (resposta.sucesso) {
                            alert(resposta.mensagem || 'Devolução registrada!');
                            carregarMovimentacoes(); 
                            carregarInventario();   
                        } else {
                            alert(resposta.mensagem || 'Falha ao registrar devolução.');
                        }
                    } catch (erro) {
                        alert(`Erro: ${erro.dados?.mensagem || erro.message || 'Erro desconhecido.'}`);
                    } finally {
                        targetButton.disabled = false;
                        targetButton.textContent = originalButtonText;
                    }
                }
            });
        });
    }
    
    function adicionarListenersBotoesAcaoPessoal() {
        if (!isAdminUser) return;
        document.querySelectorAll('.btn-editar-pessoal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idMilitarParaEditar = e.target.dataset.id;
                const pessoalLocal = JSON.parse(sessionStorage.getItem('pessoalLocal'));
                const militarParaEditar = pessoalLocal?.find(m => m.id_militar === idMilitarParaEditar);
                modalPessoalTitulo.textContent = `Editar Militar: ${idMilitarParaEditar}`;
                formPessoal.reset();
                idMilitarEdicaoInput.value = idMilitarParaEditar;
                if (militarParaEditar) {
                    pessoalIdMilitarInput.value = militarParaEditar.id_militar;
                    pessoalIdMilitarInput.readOnly = true;
                    pessoalNomeCompletoInput.value = militarParaEditar.nome_completo;
                    pessoalIdentidadeMilitarInput.value = militarParaEditar.identidade_militar;
                    pessoalSenhaInput.value = '';
                    pessoalSenhaInput.placeholder = 'Deixe em branco para não alterar';
                    pessoalNumeroContatoInput.value = militarParaEditar.numero_contato || '';
                    pessoalSecaoInput.value = militarParaEditar.secao || '';
                    pessoalStatusSelect.value = militarParaEditar.status;
                    pessoalIsAdminSelect.value = militarParaEditar.is_admin;
                } else {
                    pessoalIdMilitarInput.value = idMilitarParaEditar;
                    pessoalIdMilitarInput.readOnly = true;
                    console.warn("Dados do militar não encontrados localmente para edição.");
                }
                modalPessoal.style.display = 'block';
            });
        });
        document.querySelectorAll('.btn-deletar-pessoal').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const idMilitarParaDeletar = e.target.dataset.id;
                if (idMilitarParaDeletar === usuarioLogado.id_militar) {
                    alert("Você não pode deletar sua própria conta de administrador.");
                    return;
                }
                if (confirm(`Tem certeza que deseja excluir o militar "${idMilitarParaDeletar}"?`)) {
                    const targetButton = e.target;
                    const originalButtonText = targetButton.textContent;
                    targetButton.disabled = true;
                    targetButton.textContent = 'Excluindo...';
                    try {
                        const resposta = await deletarMilitar(idMilitarParaDeletar, usuarioLogado.id_militar);
                        if (resposta.sucesso) {
                            alert(resposta.mensagem || 'Militar deletado!');
                            carregarPessoal(); 
                        } else {
                            alert(resposta.mensagem || 'Falha ao deletar militar.');
                        }
                    } catch (erro) {
                        alert(`Erro: ${erro.dados?.mensagem || erro.message || 'Erro desconhecido.'}`);
                    } finally {
                        targetButton.disabled = false;
                        targetButton.textContent = originalButtonText;
                    }
                }
            });
        });
    }

    // Adicionar listeners de ordenação às tabelas
    addSortListenersToTable('#secaoInventario table', 'inventario', renderInventario);
    addSortListenersToTable('#secaoMovimentacoes table', 'movimentacoes', renderMovimentacoes);
    addSortListenersToTable('#secaoPessoal table', 'pessoal', renderPessoal);

}); // Fim do DOMContentLoaded

