// routes.js

const express = require('express');
const { db } = require('./db');
const router = express.Router();

// Função para gerar GDH no formato DD/MM/AAAA HH:MM:SS
function gerarGDHAtual() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado
  const ano = agora.getFullYear();
  const horas = String(agora.getHours()).padStart(2, '0');
  const minutos = String(agora.getMinutes()).padStart(2, '0');
  const segundos = String(agora.getSeconds()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
}

// Função para converter DD/MM/AAAA HH:MM:SS para objeto Date do JS
function parseGDHtoDate(gdhString) {
    if (!gdhString || typeof gdhString !== 'string') return null;
    const parts = gdhString.match(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) return null;
    return new Date(parts[3], parts[2] - 1, parts[1], parts[4], parts[5], parts[6]);
}

// Middleware de log
router.use((req, res, next) => {
  console.log(`Requisição recebida em /api${req.path} (${req.method}) às ${new Date().toLocaleTimeString()}`);
  if (Object.keys(req.body).length > 0) console.log('Corpo:', req.body);
  if (Object.keys(req.query).length > 0) console.log('Query:', req.query);
  next();
});

// --- Middleware de Autenticação de Administrador ---
const isAdmin = (req, res, next) => {
  const idAdminOperacaoBody = req.body.id_militar_admin_operacao;
  const idAdminOperacaoQuery = req.query.id_militar_admin_operacao; // Para GET/DELETE via query
  let adminIdToCheck = idAdminOperacaoBody || idAdminOperacaoQuery;

  if (!adminIdToCheck) {
    return res.status(400).json({ sucesso: false, mensagem: "ID do administrador operador (id_militar_admin_operacao) é obrigatório para esta operação." });
  }
  
  const sql = `SELECT is_admin FROM pessoal WHERE id_militar = ?`;
  db.get(sql, [adminIdToCheck], (err, adminUser) => {
    if (err) {
      console.error("Erro ao verificar status de admin:", err.message);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao verificar permissões." });
    }
    if (!adminUser || adminUser.is_admin !== 1) {
      return res.status(403).json({ sucesso: false, mensagem: "Acesso negado. Esta operação requer privilégios de administrador." });
    }
    next();
  });
};

// Rota de status da API (opcional)
router.get('/status', (req, res) => {
  res.status(200).json({ status: 'API Funcionando', timestamp: new Date() });
});

// --- Rota de Autenticação ---
router.post('/login', (req, res) => {
  const { identidadeMilitar, senha } = req.body;
  if (!identidadeMilitar || !senha) {
    return res.status(400).json({ sucesso: false, mensagem: 'Identidade militar e senha são obrigatórios.' });
  }
  const sql = `SELECT id_militar, nome_completo, secao, identidade_militar, status, senha, is_admin 
               FROM pessoal 
               WHERE identidade_militar = ?`;
  db.get(sql, [identidadeMilitar], (err, usuario) => {
    if (err) {
      console.error('Erro ao buscar usuário para login:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno do servidor.' });
    }
    if (!usuario) return res.status(401).json({ sucesso: false, mensagem: 'Identidade militar não encontrada.' });
    if (usuario.status !== 1) return res.status(403).json({ sucesso: false, mensagem: 'Usuário inativo.' });
    if (usuario.senha === senha) { // ATENÇÃO: Comparação de texto claro
      const dadosUsuarioParaSessao = {
        id_militar: usuario.id_militar,
        nome_completo: usuario.nome_completo,
        identidade_militar: usuario.identidade_militar,
        secao: usuario.secao,
        is_admin: usuario.is_admin
      };
      return res.status(200).json({ sucesso: true, mensagem: 'Login realizado com sucesso!', usuario: dadosUsuarioParaSessao });
    } else {
      return res.status(401).json({ sucesso: false, mensagem: 'Senha incorreta.' });
    }
  });
});

// --- Rotas para Inventário ---
router.get('/inventario', (req, res) => {
  const idMilitarDono = req.query.id_militar_dono;
  if (!idMilitarDono) {
    return res.status(400).json({ sucesso: false, mensagem: 'Parâmetro id_militar_dono é obrigatório.' });
  }
  const sql = `SELECT codigo_item_bd, nome_item, descricao_item, quantidade, local_armazenamento, id_militar_dono, gdh_inicial 
               FROM inventario 
               WHERE id_militar_dono = ? 
               ORDER BY nome_item ASC`;
  db.all(sql, [idMilitarDono], (err, itens) => {
    if (err) {
      console.error('Erro ao buscar itens do inventário:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao buscar inventário.' });
    }
    res.status(200).json({ sucesso: true, inventario: itens });
  });
});

router.post('/inventario', (req, res) => {
  const {
    codigo_item_bd, nome_item, descricao_item, quantidade,
    local_armazenamento, id_militar_dono
  } = req.body;
  if (!codigo_item_bd || !nome_item || quantidade === undefined || !id_militar_dono) {
    return res.status(400).json({ sucesso: false, mensagem: 'Código do item, nome, quantidade e ID do militar dono são obrigatórios.' });
  }
  const qtdNum = parseInt(quantidade);
  if (isNaN(qtdNum) || qtdNum < 0) {
    return res.status(400).json({ sucesso: false, mensagem: 'A quantidade deve ser um número não negativo.' });
  }
  const gdh_inicial = gerarGDHAtual();
  const sql = `INSERT INTO inventario (codigo_item_bd, nome_item, descricao_item, quantidade, local_armazenamento, id_militar_dono, gdh_inicial)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [codigo_item_bd, nome_item, descricao_item || null, qtdNum, local_armazenamento || null, id_militar_dono, gdh_inicial];
  db.run(sql, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed: inventario.codigo_item_bd')) {
        return res.status(409).json({ sucesso: false, mensagem: `Já existe um item com o código '${codigo_item_bd}'.` });
      }
      console.error('Erro ao adicionar item ao inventário:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao adicionar item.' });
    }
    if (this.changes > 0) {
      res.status(201).json({ sucesso: true, mensagem: 'Item adicionado com sucesso!', itemAdicionado: { codigo_item_bd, nome_item, descricao_item, quantidade: qtdNum, local_armazenamento, id_militar_dono, gdh_inicial } });
    } else {
      res.status(500).json({ sucesso: false, mensagem: 'Item não pôde ser adicionado.' });
    }
  });
});

router.put('/inventario/:codigo_item_bd_param', (req, res) => {
  const codigoItemParam = req.params.codigo_item_bd_param;
  const {
    nome_item, descricao_item, quantidade,
    local_armazenamento, id_militar_dono 
  } = req.body;
  if (!nome_item || quantidade === undefined || !id_militar_dono) {
    return res.status(400).json({ sucesso: false, mensagem: 'Nome, quantidade e ID do dono são obrigatórios para atualização.' });
  }
  const qtdNum = parseInt(quantidade);
  if (isNaN(qtdNum) || qtdNum < 0) {
    return res.status(400).json({ sucesso: false, mensagem: 'A quantidade deve ser um número não negativo.' });
  }
  const sql = `UPDATE inventario 
               SET nome_item = ?, descricao_item = ?, quantidade = ?, local_armazenamento = ?
               WHERE codigo_item_bd = ? AND id_militar_dono = ?`;
  const params = [nome_item, descricao_item || null, qtdNum, local_armazenamento || null, codigoItemParam, id_militar_dono];
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Erro ao atualizar item do inventário:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao atualizar item.' });
    }
    if (this.changes > 0) {
      res.status(200).json({ sucesso: true, mensagem: 'Item atualizado com sucesso!', itemAtualizado: { codigo_item_bd: codigoItemParam, nome_item, descricao_item, quantidade: qtdNum, local_armazenamento, id_militar_dono } });
    } else {
      res.status(404).json({ sucesso: false, mensagem: 'Item não encontrado ou você não tem permissão para editá-lo.' });
    }
  });
});

router.delete('/inventario/:codigo_item_bd_param', (req, res) => {
  const codigoItemParaDeletar = req.params.codigo_item_bd_param;
  const { id_militar_dono } = req.body; 
  if (!id_militar_dono) {
      return res.status(400).json({ sucesso: false, mensagem: 'ID do militar dono é obrigatório para deletar (no corpo da requisição).' });
  }
  const sqlCheckMovimentacoes = `SELECT COUNT(*) AS count FROM movimentacao WHERE codigo_item_fk = ?`;
  db.get(sqlCheckMovimentacoes, [codigoItemParaDeletar], (errCheck, row) => {
    if (errCheck) {
      console.error('Erro ao verificar movimentações:', errCheck.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao verificar movimentações.' });
    }
    if (row.count > 0) {
      return res.status(409).json({ sucesso: false, mensagem: `Este item (${codigoItemParaDeletar}) não pode ser excluído pois possui ${row.count} registro(s) de movimentação.` });
    }
    const sqlDeleteInventario = `DELETE FROM inventario WHERE codigo_item_bd = ? AND id_militar_dono = ?`;
    db.run(sqlDeleteInventario, [codigoItemParaDeletar, id_militar_dono], function(errDelete) {
      if (errDelete) {
        console.error('Erro ao deletar item do inventário:', errDelete.message);
        return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao deletar item.' });
      }
      if (this.changes > 0) {
        res.status(200).json({ sucesso: true, mensagem: 'Item deletado com sucesso.' });
      } else {
        res.status(404).json({ sucesso: false, mensagem: 'Item não encontrado ou não pertence a você.' });
      }
    });
  });
});

// --- Rotas para Movimentações ---
router.post('/movimentacoes/cautelar', (req, res) => {
  const {
    codigo_item_fk, quantidade_movimentada, destino_movimentacao,
    gdh_esperado_devolucao, 
    id_pessoal_cautelou, nome_externo_cautelou, doc_externo_cautelou,
    id_militar_dono_operacao 
  } = req.body;

  if (!codigo_item_fk || !quantidade_movimentada || !id_militar_dono_operacao || !gdh_esperado_devolucao) {
    return res.status(400).json({ sucesso: false, mensagem: 'Código do item, quantidade, ID do dono do item e GDH esperado são obrigatórios.' });
  }
  if (!id_pessoal_cautelou && (!nome_externo_cautelou || !doc_externo_cautelou)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Deve ser fornecido o ID do militar interno OU o nome e documento do militar externo.' });
  }
  if (id_pessoal_cautelou && (nome_externo_cautelou || doc_externo_cautelou)) {
    return res.status(400).json({ sucesso: false, mensagem: 'Forneça informações de militar interno OU externo, não ambos.' });
  }

  const qtdMovimentadaNum = parseInt(quantidade_movimentada);
  if (isNaN(qtdMovimentadaNum) || qtdMovimentadaNum <= 0) {
    return res.status(400).json({ sucesso: false, mensagem: 'Quantidade movimentada deve ser um número positivo.' });
  }
  const gdh_saida = gerarGDHAtual();

  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");
    const sqlVerificaItem = `SELECT quantidade FROM inventario WHERE codigo_item_bd = ? AND id_militar_dono = ?`;
    db.get(sqlVerificaItem, [codigo_item_fk, id_militar_dono_operacao], (errItem, item) => {
      if (errItem) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Erro ao verificar item no inventário." }); }
      if (!item) { db.run("ROLLBACK;"); return res.status(404).json({ sucesso: false, mensagem: "Item não encontrado no inventário ou não pertence a este militar." }); }
      if (item.quantidade < qtdMovimentadaNum) { db.run("ROLLBACK;"); return res.status(400).json({ sucesso: false, mensagem: `Quantidade insuficiente em estoque. Disponível: ${item.quantidade}, Solicitado: ${qtdMovimentadaNum}.` }); }
      
      const novaQuantidadeInventario = item.quantidade - qtdMovimentadaNum;
      const sqlAtualizaInventario = `UPDATE inventario SET quantidade = ? WHERE codigo_item_bd = ? AND id_militar_dono = ?`;
      db.run(sqlAtualizaInventario, [novaQuantidadeInventario, codigo_item_fk, id_militar_dono_operacao], function(errUpdate) {
        if (errUpdate) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar quantidade no inventário." }); }
        if (this.changes === 0) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Falha ao atualizar inventário (item não encontrado ou não modificado)." }); }
        
        const sqlInsereMovimentacao = `
          INSERT INTO movimentacao 
            (codigo_item_fk, quantidade_movimentada, destino_movimentacao, gdh_saida, gdh_esperado_devolucao, 
             id_pessoal_cautelou, nome_externo_cautelou, doc_externo_cautelou, id_militar_dono_item)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const paramsMov = [
          codigo_item_fk, qtdMovimentadaNum, destino_movimentacao || null, gdh_saida, gdh_esperado_devolucao,
          id_pessoal_cautelou || null, nome_externo_cautelou || null, doc_externo_cautelou || null,
          id_militar_dono_operacao
        ];
        db.run(sqlInsereMovimentacao, paramsMov, function(errInsertMov) {
          if (errInsertMov) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Erro ao registrar a movimentação." }); }
          db.run("COMMIT;", (commitErr) => {
            if (commitErr) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Erro crítico ao finalizar a cautela." }); }
            res.status(201).json({ sucesso: true, mensagem: "Cautela registrada com sucesso!", movimentacaoId: this.lastID });
          });
        });
      });
    });
  });
});

router.get('/movimentacoes', (req, res) => {
  const idMilitarDonoItem = req.query.id_militar_dono_item;
  if (!idMilitarDonoItem) {
    return res.status(400).json({ sucesso: false, mensagem: 'Parâmetro id_militar_dono_item é obrigatório.' });
  }
  const sql = `
    SELECT 
      m.id_movimentacao, m.codigo_item_fk, i.nome_item AS nome_item_cautelado,
      m.quantidade_movimentada, m.destino_movimentacao, m.gdh_saida,
      m.gdh_entrada, m.gdh_esperado_devolucao, 
      m.id_pessoal_cautelou, 
      COALESCE(p_cautelou.nome_completo, m.nome_externo_cautelou) AS nome_responsavel_cautela,
      m.doc_externo_cautelou, m.id_militar_dono_item
    FROM movimentacao m
    JOIN inventario i ON m.codigo_item_fk = i.codigo_item_bd
    LEFT JOIN pessoal p_cautelou ON m.id_pessoal_cautelou = p_cautelou.id_militar
    WHERE m.id_militar_dono_item = ?
    ORDER BY m.gdh_saida DESC`;
  db.all(sql, [idMilitarDonoItem], (err, movimentacoes) => {
    if (err) {
      console.error('Erro ao buscar movimentações:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao buscar movimentações.' });
    }
    res.status(200).json({ sucesso: true, movimentacoes: movimentacoes });
  });
});

router.put('/movimentacoes/:id_movimentacao/devolver', (req, res) => {
  const idMovimentacao = parseInt(req.params.id_movimentacao);
  const { id_militar_dono_operacao } = req.body;
  if (isNaN(idMovimentacao)) return res.status(400).json({ sucesso: false, mensagem: "ID da movimentação inválido." });
  if (!id_militar_dono_operacao) return res.status(400).json({ sucesso: false, mensagem: "ID do militar dono (operação) é obrigatório." });
  const gdh_entrada_atual = gerarGDHAtual();
  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");
    const sqlGetMov = `SELECT codigo_item_fk, quantidade_movimentada, gdh_entrada, id_militar_dono_item 
                       FROM movimentacao 
                       WHERE id_movimentacao = ?`;
    db.get(sqlGetMov, [idMovimentacao], (errGet, mov) => {
      if (errGet) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Erro ao buscar movimentação." }); }
      if (!mov) { db.run("ROLLBACK;"); return res.status(404).json({ sucesso: false, mensagem: "Movimentação não encontrada." }); }
      if (mov.id_militar_dono_item !== id_militar_dono_operacao) { db.run("ROLLBACK;"); return res.status(403).json({ sucesso: false, mensagem: "Não autorizado." }); }
      if (mov.gdh_entrada) { db.run("ROLLBACK;"); return res.status(400).json({ sucesso: false, mensagem: "Item já devolvido." }); }
      const sqlUpdateMov = `UPDATE movimentacao SET gdh_entrada = ? WHERE id_movimentacao = ?`;
      db.run(sqlUpdateMov, [gdh_entrada_atual, idMovimentacao], function(errUpdateMov) {
        if (errUpdateMov) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar movimentação." }); }
        if (this.changes === 0) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Falha ao atualizar movimentação." }); }
        const sqlUpdateInv = `UPDATE inventario SET quantidade = quantidade + ? 
                              WHERE codigo_item_bd = ? AND id_militar_dono = ?`;
        db.run(sqlUpdateInv, [mov.quantidade_movimentada, mov.codigo_item_fk, mov.id_militar_dono_item], function(errUpdateInv) {
          if (errUpdateInv) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Erro ao atualizar inventário." }); }
          if (this.changes === 0) { 
            db.run("ROLLBACK;"); 
            console.error(`ERRO GRAVE: Item ${mov.codigo_item_fk} não encontrado no inventário do dono ${mov.id_militar_dono_item} durante devolução.`);
            return res.status(500).json({ sucesso: false, mensagem: "Erro crítico: Falha ao encontrar item no inventário." });
          }
          db.run("COMMIT;", (commitErr) => {
            if (commitErr) { db.run("ROLLBACK;"); return res.status(500).json({ sucesso: false, mensagem: "Erro crítico ao finalizar devolução." }); }
            res.status(200).json({ sucesso: true, mensagem: "Devolução registrada com sucesso!" });
          });
        });
      });
    });
  });
});

// --- Rotas para Pessoal ---
router.get('/pessoal', (req, res) => {
  const sql = `SELECT id_militar, nome_completo, numero_contato, secao, identidade_militar, status, is_admin 
               FROM pessoal 
               ORDER BY nome_completo ASC`;
  db.all(sql, [], (err, pessoal) => {
    if (err) {
      console.error('Erro ao buscar pessoal:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao buscar lista de pessoal.' });
    }
    res.status(200).json({ sucesso: true, pessoal: pessoal });
  });
});

router.post('/pessoal', isAdmin, (req, res) => {
  const {
    id_militar, nome_completo, numero_contato, secao,
    identidade_militar, senha, status, is_admin
  } = req.body;
  if (!id_militar || !nome_completo || !identidade_militar || !senha) {
    return res.status(400).json({ sucesso: false, mensagem: 'ID Militar, Nome Completo, Identidade Militar e Senha são obrigatórios.' });
  }
  const sql = `INSERT INTO pessoal (id_militar, nome_completo, numero_contato, secao, identidade_militar, senha, status, is_admin)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    id_militar, nome_completo, numero_contato || null, secao || null,
    identidade_militar, senha, status !== undefined ? status : 1, is_admin !== undefined ? is_admin : 0
  ];
  db.run(sql, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed: pessoal.id_militar')) {
        return res.status(409).json({ sucesso: false, mensagem: `Já existe um militar com o ID '${id_militar}'.` });
      }
      if (err.message.includes('UNIQUE constraint failed: pessoal.identidade_militar')) {
        return res.status(409).json({ sucesso: false, mensagem: `Já existe um militar com a Identidade Militar '${identidade_militar}'.` });
      }
      console.error("Erro ao adicionar militar:", err.message);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao adicionar militar." });
    }
    res.status(201).json({ sucesso: true, mensagem: "Militar adicionado com sucesso!", id_militar_adicionado: id_militar });
  });
});

router.put('/pessoal/:id_militar_param', isAdmin, (req, res) => {
  const idMilitarParam = req.params.id_militar_param;
  const {
    nome_completo, numero_contato, secao,
    identidade_militar, senha, status, is_admin
  } = req.body;
  if (!nome_completo || !identidade_militar) {
    return res.status(400).json({ sucesso: false, mensagem: 'Nome Completo e Identidade Militar são obrigatórios.' });
  }
  let sqlSetParts = [
    `nome_completo = ?`, `numero_contato = ?`, `secao = ?`,
    `identidade_militar = ?`, `status = ?`, `is_admin = ?`
  ];
  let params = [
    nome_completo, numero_contato || null, secao || null,
    identidade_militar, 
    (status !== undefined && !isNaN(parseInt(status))) ? parseInt(status) : 1,
    (is_admin !== undefined && !isNaN(parseInt(is_admin))) ? parseInt(is_admin) : 0
  ];
  if (senha) {
    sqlSetParts.push(`senha = ?`);
    params.push(senha);
  }
  params.push(idMilitarParam);
  const sql = `UPDATE pessoal SET ${sqlSetParts.join(', ')} WHERE id_militar = ?`;
  db.run(sql, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed: pessoal.identidade_militar')) {
        return res.status(409).json({ sucesso: false, mensagem: `Já existe outro militar com a Identidade Militar '${identidade_militar}'.` });
      }
      console.error("Erro ao atualizar militar:", err.message);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao atualizar militar." });
    }
    if (this.changes > 0) {
      res.status(200).json({ sucesso: true, mensagem: "Dados do militar atualizados com sucesso." });
    } else {
      res.status(404).json({ sucesso: false, mensagem: "Militar não encontrado para atualização." });
    }
  });
});

router.delete('/pessoal/:id_militar_param', isAdmin, (req, res) => {
  const idMilitarParaDeletar = req.params.id_militar_param;
  const { id_militar_admin_operacao } = req.body;
  if (idMilitarParaDeletar === id_militar_admin_operacao) {
    return res.status(403).json({ sucesso: false, mensagem: "Um administrador não pode deletar a si mesmo." });
  }
  const sql = `DELETE FROM pessoal WHERE id_militar = ?`;
  db.run(sql, [idMilitarParaDeletar], function(err) {
    if (err) {
      console.error("Erro ao deletar militar:", err.message);
      return res.status(500).json({ sucesso: false, mensagem: "Erro interno ao deletar militar." });
    }
    if (this.changes > 0) {
      res.status(200).json({ sucesso: true, mensagem: "Militar deletado com sucesso." });
    } else {
      res.status(404).json({ sucesso: false, mensagem: "Militar não encontrado para deleção." });
    }
  });
});

// --- Rotas para Relatórios ---
router.get('/relatorios/inventario-total', (req, res) => {
  const { filtro_nome_item, filtro_local, filtro_id_dono } = req.query;
  let sql = `SELECT 
               i.codigo_item_bd, i.nome_item, i.descricao_item, i.quantidade, 
               i.local_armazenamento, i.id_militar_dono,
               p.nome_completo AS nome_militar_dono, i.gdh_inicial 
             FROM inventario i
             JOIN pessoal p ON i.id_militar_dono = p.id_militar
             WHERE 1=1`;
  const params = [];
  if (filtro_nome_item) {
    sql += ` AND i.nome_item LIKE ?`;
    params.push(`%${filtro_nome_item}%`);
  }
  if (filtro_local) {
    sql += ` AND i.local_armazenamento LIKE ?`;
    params.push(`%${filtro_local}%`);
  }
  if (filtro_id_dono) {
    sql += ` AND i.id_militar_dono = ?`;
    params.push(filtro_id_dono);
  }
  sql += ` ORDER BY p.nome_completo ASC, i.nome_item ASC`;
  db.all(sql, params, (err, itens) => {
    if (err) {
      console.error('Erro ao gerar relatório de inventário total:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao gerar relatório.' });
    }
    res.status(200).json({ sucesso: true, relatorio: itens });
  });
});

router.get('/relatorios/material-em-uso', (req, res) => {
  const { filtro_id_dono_item, filtro_id_pessoal_cautelou, filtro_destino } = req.query;
  let sql = `
    SELECT 
      m.id_movimentacao, m.codigo_item_fk, i.nome_item AS nome_item_cautelado,
      i.id_militar_dono AS id_dono_real_item, p_dono_item.nome_completo AS nome_dono_real_item,
      m.quantidade_movimentada, m.destino_movimentacao, m.gdh_saida,
      m.gdh_esperado_devolucao, 
      m.id_pessoal_cautelou, 
      COALESCE(p_cautelou.nome_completo, m.nome_externo_cautelou) AS nome_responsavel_cautela,
      m.doc_externo_cautelou,
      p_cautelou.secao AS secao_pessoal_cautelou
    FROM movimentacao m
    JOIN inventario i ON m.codigo_item_fk = i.codigo_item_bd
    LEFT JOIN pessoal p_cautelou ON m.id_pessoal_cautelou = p_cautelou.id_militar
    JOIN pessoal p_dono_item ON i.id_militar_dono = p_dono_item.id_militar 
    WHERE m.gdh_entrada IS NULL`;
  const params = [];
  if (filtro_id_dono_item) {
    sql += ` AND i.id_militar_dono = ?`;
    params.push(filtro_id_dono_item);
  }
  if (filtro_id_pessoal_cautelou) { // Filtra por ID interno ou nome externo
    sql += ` AND (m.id_pessoal_cautelou = ? OR m.nome_externo_cautelou LIKE ?)`;
    params.push(filtro_id_pessoal_cautelou, `%${filtro_id_pessoal_cautelou}%`);
  }
  if (filtro_destino) {
    sql += ` AND m.destino_movimentacao LIKE ?`;
    params.push(`%${filtro_destino}%`);
  }
  sql += ` ORDER BY m.gdh_esperado_devolucao ASC, i.nome_item ASC`;
  db.all(sql, params, (err, itensEmUso) => {
    if (err) {
      console.error('Erro ao gerar relatório de material em uso:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao gerar relatório de material em uso.' });
    }
    res.status(200).json({ sucesso: true, relatorio: itensEmUso });
  });
});

router.get('/relatorios/devolucoes-atrasadas', (req, res) => {
  const { filtro_id_dono_item, filtro_id_pessoal_cautelou } = req.query;
  const dataHoraAtual = new Date(); 
  let sql = `
    SELECT 
      m.id_movimentacao, m.codigo_item_fk, i.nome_item AS nome_item_cautelado,
      i.id_militar_dono AS id_dono_real_item, p_dono_item.nome_completo AS nome_dono_real_item,
      m.quantidade_movimentada, m.destino_movimentacao, m.gdh_saida,
      m.gdh_esperado_devolucao, 
      m.id_pessoal_cautelou,
      COALESCE(p_cautelou.nome_completo, m.nome_externo_cautelou) AS nome_responsavel_cautela,
      m.doc_externo_cautelou,
      p_cautelou.secao AS secao_pessoal_cautelou
    FROM movimentacao m
    JOIN inventario i ON m.codigo_item_fk = i.codigo_item_bd
    LEFT JOIN pessoal p_cautelou ON m.id_pessoal_cautelou = p_cautelou.id_militar
    JOIN pessoal p_dono_item ON i.id_militar_dono = p_dono_item.id_militar
    WHERE m.gdh_entrada IS NULL`;
  const params = [];
  if (filtro_id_dono_item) {
    sql += ` AND i.id_militar_dono = ?`;
    params.push(filtro_id_dono_item);
  }
  if (filtro_id_pessoal_cautelou) {
    sql += ` AND (m.id_pessoal_cautelou = ? OR m.nome_externo_cautelou LIKE ?)`;
    params.push(filtro_id_pessoal_cautelou, `%${filtro_id_pessoal_cautelou}%`);
  }
  db.all(sql, params, (err, todasMovimentacoesPendentes) => {
    if (err) {
      console.error('Erro ao buscar movimentações pendentes:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno ao buscar movimentações.' });
    }
    const devolucoesAtrasadas = todasMovimentacoesPendentes.filter(mov => {
      const gdhEsperado = parseGDHtoDate(mov.gdh_esperado_devolucao);
      return gdhEsperado && gdhEsperado < dataHoraAtual;
    });
    devolucoesAtrasadas.sort((a, b) => {
        const dataA = parseGDHtoDate(a.gdh_esperado_devolucao);
        const dataB = parseGDHtoDate(b.gdh_esperado_devolucao);
        if (!dataA) return 1;
        if (!dataB) return -1;
        return dataA - dataB;
    });
    res.status(200).json({ sucesso: true, relatorio: devolucoesAtrasadas });
  });
});

module.exports = router;

