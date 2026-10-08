document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginInput = document.getElementById('login').value.trim();
    const senhaInput = document.getElementById('senha').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: loginInput, senha: senhaInput })
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.erro || 'Erro ao realizar login.');
        }

        // Guarda os dados do utilizador no navegador
        localStorage.setItem('usuarioLogado', JSON.stringify(resultado.usuario));

        // Redireciona para o painel principal (index.html)
        window.location.href = 'index.html';

    } catch (err) {
        alert(err.message);
    }
});