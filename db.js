// db.js

const sqlite3 = require('sqlite3').verbose();
const { sqlite: sqliteConfig } = require('./config');

const db = new sqlite3.Database(sqliteConfig.file, (err) => {
  if (err) {
    console.error('Erro ao conectar/abrir o banco de dados SQLite:', err.message);
  } else {
    console.log(`Conectado ao banco de dados SQLite em: ${sqliteConfig.file}`);
    db.serialize(() => { // Garante que os comandos db.run() sejam executados em sequência
      db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
        if (pragmaErr) console.error("Erro ao habilitar foreign_keys:", pragmaErr.message);
        else console.log("Chaves estrangeiras habilitadas para SQLite.");
      });

      // Criar tabela 'pessoal'
      db.run(`CREATE TABLE IF NOT EXISTS pessoal (
                id_militar TEXT PRIMARY KEY,
                nome_completo TEXT NOT NULL,
                numero_contato TEXT,
                secao TEXT,
                identidade_militar TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                status INTEGER DEFAULT 1,
                is_admin INTEGER DEFAULT 0
              )`, (tableErr) => {
        if (tableErr) console.error("Erro ao criar tabela 'pessoal':", tableErr.message);
        else {
          console.log("Tabela 'pessoal' verificada/criada.");
          db.run("ALTER TABLE pessoal ADD COLUMN is_admin INTEGER DEFAULT 0", (alterErr) => {
            if (alterErr && !alterErr.message.includes('duplicate column name')) {
                 console.error("Erro ao tentar adicionar coluna is_admin:", alterErr.message);
            } else if (!alterErr || alterErr.message.includes('duplicate column name')) {
                 console.log("Coluna 'is_admin' verificada/adicionada à tabela 'pessoal'.");
            }
          });
          db.get("SELECT COUNT(*) as count FROM pessoal WHERE id_militar = ?", ["admin"], (countErr, row) => {
            if (countErr) return console.error("Erro ao contar admin:", countErr.message);
            if (row.count === 0) {
              db.run(`INSERT INTO pessoal (id_militar, nome_completo, identidade_militar, senha, secao, numero_contato, is_admin) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`,
                      ["admin", "admin", "admin", "admin", "1ª Cia Com", "admin", 1], 
                      (insertErr) => {
                if (insertErr) console.error("Erro ao inserir usuário admin exemplo:", insertErr.message);
                else console.log("Usuário admin exemplo inserido/verificado em 'pessoal'.");
              });
            } else {
              db.run("UPDATE pessoal SET is_admin = 1 WHERE id_militar = ?", ["admin"], (updateErr) => {
                if (updateErr) console.error("Erro ao atualizar admin para admin:", updateErr.message);
                else console.log("Usuário admin verificado/atualizado como admin.");
              });
            }
          });
        }
      });

      // Criar tabela 'inventario'
      db.run(`CREATE TABLE IF NOT EXISTS inventario (
                codigo_item_bd TEXT PRIMARY KEY,
                nome_item TEXT NOT NULL,
                descricao_item TEXT,
                quantidade INTEGER NOT NULL DEFAULT 0,
                local_armazenamento TEXT,
                id_militar_dono TEXT NOT NULL,
                gdh_inicial TEXT NOT NULL,
                FOREIGN KEY (id_militar_dono) REFERENCES pessoal (id_militar)
              )`, (tableErr) => {
        if (tableErr) console.error("Erro ao criar tabela 'inventario':", tableErr.message);
        else console.log("Tabela 'inventario' verificada/criada.");
      });

      // Criar tabela 'movimentacao' com modificações
      // id_pessoal_cautelou agora é NULLABLE (DEFAULT NULL)
      // Novas colunas: nome_externo_cautelou, doc_externo_cautelou
      db.run(`CREATE TABLE IF NOT EXISTS movimentacao (
                id_movimentacao INTEGER PRIMARY KEY AUTOINCREMENT,
                codigo_item_fk TEXT NOT NULL,
                quantidade_movimentada INTEGER NOT NULL,
                destino_movimentacao TEXT,
                gdh_saida TEXT,
                gdh_entrada TEXT,
                gdh_esperado_devolucao TEXT,
                id_pessoal_cautelou TEXT DEFAULT NULL, -- Alterado para permitir NULL
                nome_externo_cautelou TEXT DEFAULT NULL, -- Novo campo
                doc_externo_cautelou TEXT DEFAULT NULL,  -- Novo campo
                id_militar_dono_item TEXT NOT NULL,
                FOREIGN KEY (codigo_item_fk) REFERENCES inventario (codigo_item_bd),
                FOREIGN KEY (id_pessoal_cautelou) REFERENCES pessoal (id_militar), -- FK ainda existe, mas só se aplica se não for NULL
                FOREIGN KEY (id_militar_dono_item) REFERENCES pessoal (id_militar)
              )`, (tableErr) => {
        if (tableErr) console.error("Erro ao criar/modificar tabela 'movimentacao':", tableErr.message);
        else {
            console.log("Tabela 'movimentacao' verificada/criada com campos para cautela externa.");
            // Tentar adicionar as novas colunas se a tabela já existir e não as tiver
            db.run("ALTER TABLE movimentacao ADD COLUMN nome_externo_cautelou TEXT DEFAULT NULL", 
                (errAlter1) => { 
                    if (errAlter1 && !errAlter1.message.includes('duplicate column name')) console.error("Erro ao adicionar nome_externo_cautelou:", errAlter1.message); 
                    else if (!errAlter1 || errAlter1.message.includes('duplicate column name')) console.log("Coluna nome_externo_cautelou verificada/adicionada.");
                }
            );
            db.run("ALTER TABLE movimentacao ADD COLUMN doc_externo_cautelou TEXT DEFAULT NULL", 
                (errAlter2) => { 
                    if (errAlter2 && !errAlter2.message.includes('duplicate column name')) console.error("Erro ao adicionar doc_externo_cautelou:", errAlter2.message); 
                    else if (!errAlter2 || errAlter2.message.includes('duplicate column name')) console.log("Coluna doc_externo_cautelou verificada/adicionada.");
                }
            );
            // Nota: Alterar uma coluna para NULLABLE em SQLite com FKs é complicado.
            // Se a tabela 'movimentacao' já existe com id_pessoal_cautelou NOT NULL,
            // esta definição CREATE TABLE IF NOT EXISTS não mudará a nulidade da coluna.
            // A melhor abordagem seria recriar a tabela (o que apagaria dados) ou usar um processo de migração.
            // Para este exercício, assumimos que se o banco for novo, a coluna será criada como NULLABLE.
            // Se já existir, a lógica no backend terá que ser robusta.
        }
      });
      
      // Tabela de teste (mantida)
      db.run(`CREATE TABLE IF NOT EXISTS teste (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL
              )`, (tableErr) => {
        if (tableErr) console.error("Erro ao criar tabela 'teste':", tableErr.message);
        else {
          db.get("SELECT COUNT(*) as count FROM teste", [], (countErr, row) => {
            if (countErr) return console.error("Erro ao contar em 'teste':", countErr.message);
            if (row.count === 0) {
              db.run("INSERT INTO teste (content) VALUES (?)", ["Olá do SQLite!"], (insertErr) => {
                if (insertErr) console.error("Erro ao inserir em 'teste':", insertErr.message);
              });
            }
          });
        }
      });
    }); // Fim do db.serialize
  }
});

// Função de teste (mantida)
async function testReadFromSQLite() {
  return new Promise((resolve, reject) => {
    db.get("SELECT content FROM teste LIMIT 1;", [], (err, row) => {
      if (err) {
        console.error('Erro ao ler da tabela "teste" no SQLite:', err.message);
        return reject(err);
      }
      if (row) {
        resolve({ status: 'Sucesso', mensagem: 'Dados lidos da tabela "teste" (SQLite) com sucesso.', dados: row.content });
      } else {
        resolve({ status: 'Sucesso com Aviso', mensagem: 'Tabela "teste" (SQLite) está vazia.', dados: null });
      }
    });
  });
}

module.exports = {
  db,
  testReadFromSQLite
};

