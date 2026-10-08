const API_URL = 'http://localhost:3000/api/usuarios';

document.addEventListener('DOMContentLoaded', carregarUsuarios);

async function carregarUsuarios() {
    try {
        const response = await fetch(API_URL);
        const usuarios = await response.json();
        const tbody = document.getElementById('tabelaUsuarios');
        tbody.innerHTML = '';

        usuarios.forEach(u => {
            let badgeClass = u.perfil === 'Administrador' || u.perfil === 'admin' ? 'bg-danger' : 'bg-success';
            
            // Exibir foto ou ícone padrão
            let imagemHtml = u.foto 
                ? `<img src="uploads/${u.foto}" class="rounded-circle shadow-sm" width="40" height="40" style="object-fit: cover;">`
                : `<div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 40px; height: 40px;"><i class="fas fa-user"></i></div>`;

            tbody.innerHTML += `
                <tr>
                    <td>#${u.id}</td>
                    <td>${imagemHtml}</td>
                    <td class="fw-semibold">${u.nome}</td>
                    <td>${u.login}</td>
                    <td><span class="badge ${badgeClass} py-2 text-center d-inline-block" style="width: 100px;">${u.perfil}</span></td>
                    <td>${new Date(u.criado_em).toLocaleDateString('pt-BR')}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editarUsuario(${u.id}, '${u.nome}', '${u.login}', '${u.perfil}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deletarUsuario(${u.id})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Erro ao carregar tabela:', error);
    }
}

document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('usuarioId').value;
    
    // Usando FormData para enviar ficheiro e campos de texto juntos
    const formData = new FormData();
    formData.append('nome', document.getElementById('nome').value);
    formData.append('login', document.getElementById('login').value);
    formData.append('senha', document.getElementById('senha').value);
    formData.append('perfil', document.getElementById('perfil').value);
    
    const fotoInput = document.getElementById('foto');
    if (fotoInput.files[0]) {
        formData.append('foto', fotoInput.files[0]);
    }

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;

        const response = await fetch(url, {
            method: method,
            body: formData // Sem Content-Type header, o navegador define automaticamente com o boundary do FormData
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
            carregarUsuarios();
        } else {
            const err = await response.json();
            alert(err.erro || 'Erro ao salvar usuário.');
        }
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
    }
});

function prepararCadastro() {
    document.getElementById('modalTitulo').innerHTML = '<i class="fas fa-user-plus me-2"></i> Novo Usuário';
    document.getElementById('formUsuario').reset();
    document.getElementById('usuarioId').value = '';
}

function editarUsuario(id, nome, login, perfil) {
    document.getElementById('modalTitulo').innerHTML = '<i class="fas fa-user-edit me-2"></i> Editar Usuário';
    document.getElementById('usuarioId').value = id;
    document.getElementById('nome').value = nome;
    document.getElementById('login').value = login;
    document.getElementById('senha').value = '';
    document.getElementById('perfil').value = perfil;
    
    const modal = new bootstrap.Modal(document.getElementById('modalUsuario'));
    modal.show();
}

document.getElementById('formUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('usuarioId').value;
    const dados = {
        nome: document.getElementById('nome').value,
        login: document.getElementById('login').value,
        senha: document.getElementById('senha').value,
        perfil: document.getElementById('perfil').value
    };

    try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
            carregarUsuarios();
        } else {
            const err = await response.json();
            alert(err.erro || 'Erro ao salvar usuário.');
        }
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
    }
});

async function deletarUsuario(id) {
    if (confirm('Tem certeza que deseja eliminar este usuário?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (response.ok) {
                carregarUsuarios();
            } else {
                alert('Erro ao eliminar usuário.');
            }
        } catch (error) {
            console.error('Erro ao eliminar:', error);
        }
    }
}