// public/js/auth.js
console.log('auth.js carregado.');

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const mensagemErroEl = document.getElementById('mensagemErro');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault(); 
      if (mensagemErroEl) {
        mensagemErroEl.textContent = ''; 
        mensagemErroEl.style.display = 'none';
      }

      const identidadeMilitarInput = document.getElementById('identidadeMilitar');
      const senhaInput = document.getElementById('senha');

      const identidadeMilitar = identidadeMilitarInput.value.trim();
      const senha = senhaInput.value.trim();

      if (!identidadeMilitar || !senha) {
        if (mensagemErroEl) {
            mensagemErroEl.textContent = 'Por favor, preencha todos os campos.';
            mensagemErroEl.style.display = 'block';
        }
        return;
      }

      const submitButton = loginForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Aguarde...';

      try {
        // Verifica se a função loginUsuario está definida antes de chamá-la
        if (typeof loginUsuario === 'function') {
          console.log('Tentando login com (auth.js):', { identidadeMilitar }); // Não logar senha
          const respostaAPI = await loginUsuario(identidadeMilitar, senha);

          if (respostaAPI.sucesso) {
            console.log('Login bem-sucedido (auth.js):', respostaAPI.usuario);
            sessionStorage.setItem('usuarioLogado', JSON.stringify(respostaAPI.usuario));
            window.location.href = 'dashboard.html';
          } else {
            // Este caso é menos provável se handleApiResponse estiver lançando erros para !resposta.ok
            if (mensagemErroEl) {
                mensagemErroEl.textContent = respostaAPI.mensagem || 'Falha no login. Tente novamente.';
                mensagemErroEl.style.display = 'block';
            }
          }
        } else {
          console.error('Função loginUsuario não está definida! Verifique se api.js foi carregado corretamente e antes de auth.js.');
          if (mensagemErroEl) {
            mensagemErroEl.textContent = 'Erro de configuração da página. Tente novamente mais tarde.';
            mensagemErroEl.style.display = 'block';
          }
        }
      } catch (erro) {
        console.error('Erro durante o processo de login (auth.js):', erro);
        if (mensagemErroEl) {
            // A mensagem de erro já deve vir tratada de handleApiResponse
            mensagemErroEl.textContent = erro.message || 'Erro ao tentar conectar ao servidor.';
            mensagemErroEl.style.display = 'block';
        }
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    });
  }

  // Verifica se o usuário já está logado ao carregar a página de login
  // if (sessionStorage.getItem('usuarioLogado')) {
  //   console.log('Usuário já logado, redirecionando para o dashboard...');
  //   window.location.href = 'dashboard.html';
  // }
});

