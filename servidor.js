// servidor.js

// Importar as dependências principais
const express = require('express');
const path = require('path'); // Módulo 'path' do Node.js para lidar com caminhos de arquivos
require('dotenv').config(); // Carrega as variáveis de ambiente do arquivo .env

// Importar módulos locais (que ainda vamos criar)
const config = require('./config'); // Nossas configurações (porta, detalhes do BD)
const routes = require('./routes'); // Nossas rotas da API
// const db = require('./db'); // Nosso módulo de banco de dados (para inicializar a conexão, se necessário aqui)

// Inicializar a aplicação Express
const app = express();

// --- Configuração de Middlewares ---

// Middleware para permitir que o Express parseie JSON no corpo das requisições
app.use(express.json());

// Middleware para permitir que o Express parseie dados de formulários URL-encoded
app.use(express.urlencoded({ extended: true }));

// Middleware para servir arquivos estáticos (HTML, CSS, JS do cliente)
// Todos os arquivos na pasta 'public' estarão acessíveis diretamente pela URL
// Ex: http://localhost:PORTA/login.html, http://localhost:PORTA/css/style.css
app.use(express.static(path.join(__dirname, 'public')));

// --- Rotas da Aplicação ---
// Montar as rotas definidas no arquivo routes.js
// Todas as rotas definidas em routes.js serão prefixadas com '/api' (opcional, mas boa prática)
app.use('/api', routes);

// Rota principal para servir o index.html (ou login.html) como página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html')); // Ou 'index.html' se preferir
});

// --- Tratamento de Erros Básico (Opcional, mas recomendado) ---
// Middleware para tratar rotas não encontradas (404)
app.use((req, res, next) => {
  res.status(404).send('Desculpe, a página não foi encontrada.');
});

// Middleware para tratar outros erros (500)
app.use((err, req, res, next) => {
  console.error(err.stack); // Loga o erro no console do servidor
  res.status(500).send('Algo deu errado no servidor!');
});

// --- Inicialização do Servidor ---
const PORTA = config.PORTA_SERVIDOR || 3000; // Usa a porta do config ou 3000 como padrão

app.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA}`);
  console.log(`Acesse o sistema em http://localhost:${PORTA}`);
  // Aqui poderíamos adicionar uma chamada para db.testConnection() ou algo similar
  // para verificar a conexão com o banco de dados na inicialização.
});

// Exportar o 'app' pode ser útil para testes, mas não é estritamente necessário para rodar o servidor.
// module.exports = app;
