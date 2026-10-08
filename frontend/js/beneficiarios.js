// Defina aqui a URL base da sua API do backend (ajuste a porta se necessário, ex: 3000)
const API_URL = 'http://localhost:3000/api'; 

// Variável global para controlar se estamos a editar ou a criar um novo beneficiário
let editandoId = null;

// Função para listar todos os beneficiários na tabela
async function carregarBeneficiarios() {
    try {
        const response = await fetch(`${API_URL}/beneficiarios`);
        if (!response.ok) throw new Error('Erro ao buscar beneficiários.');
        
        const beneficiarios = await response.json();
        const tbody = document.getElementById('tabelaBeneficiarios');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (beneficiarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-4">Nenhum beneficiário cadastrado.</td>
                </tr>
            `;
            return;
        }

        beneficiarios.forEach(b => {
            const endereco = `${b.logradouro || ''}, ${b.numero || 'S/N'} - ${b.bairro || ''}`;
            
            // Coluna da Foto: Se existir foto, cria um botão para visualizar
            let colunaFoto = '<span class="text-muted small">Sem foto</span>';
            if (b.foto_residencia) {
                // Ajuste a URL base conforme o endereço do seu backend (ex: http://localhost:3000/uploads/...)
                const urlFoto = `http://localhost:3000/uploads/${b.foto_residencia}`;
                colunaFoto = `
                    <button class="btn btn-sm btn-outline-secondary rounded-pill px-2 py-1" onclick="abrirModalFoto('${urlFoto}', '${b.nome}')">
                        <i class="fas fa-image me-1"></i> Ver Foto
                    </button>
                `;
            }

            tbody.innerHTML += `
                <tr>
                    <td class="ps-3 fw-semibold text-dark">${b.nome}</td>
                    <td>${b.documento || '-'}</td>
                    <td>${b.telefone || '-'}</td>
                    <td>${endereco}</td>
                    <td class="text-center">${colunaFoto}</td>
                    <td class="text-end pe-3">
                        <button class="btn btn-sm btn-outline-primary me-1 rounded-pill px-3" onclick='abrirEditarBeneficiario(${JSON.stringify(b)})'>
                            <i class="fas fa-edit me-1"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="deletarBeneficiario(${b.id})">
                            <i class="fas fa-trash me-1"></i> Excluir
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Erro ao carregar beneficiários:', err);
    }
}
// Evento disparado ao clicar no botão "Novo Beneficiário"
const btnNovo = document.querySelector('[data-bs-target="#modalBeneficiario"]');
if (btnNovo) {
    btnNovo.addEventListener('click', () => {
        editandoId = null;
        const form = document.getElementById('formBeneficiario');
        if (form) form.reset();
        
        const labelModal = document.getElementById('modalBeneficiarioLabel');
        if (labelModal) {
            labelModal.innerHTML = '<i class="fas fa-user-plus me-2"></i>Novo Beneficiário';
        }
    });
}

// Função para abrir o modal preenchido com os dados do beneficiário selecionado para edição
window.abrirEditarBeneficiario = function(beneficiario) {
    editandoId = beneficiario.id;
    
    document.getElementById('nome').value = beneficiario.nome || '';
    document.getElementById('documento').value = beneficiario.documento || '';
    document.getElementById('telefone').value = beneficiario.telefone || '';
    document.getElementById('cep').value = beneficiario.cep || '';
    document.getElementById('logradouro').value = beneficiario.logradouro || '';
    document.getElementById('numero').value = beneficiario.numero || '';
    document.getElementById('complemento').value = beneficiario.complemento || '';
    document.getElementById('bairro').value = beneficiario.bairro || '';
    document.getElementById('cidade').value = beneficiario.cidade || 'Jaramataia';
    document.getElementById('estado').value = beneficiario.estado || 'AL';
    
    const labelModal = document.getElementById('modalBeneficiarioLabel');
    if (labelModal) {
        labelModal.innerHTML = '<i class="fas fa-user-edit me-2"></i>Editar Beneficiário';
    }

    const modalEl = document.getElementById('modalBeneficiario');
    if (modalEl) {
        const modalInstance = new bootstrap.Modal(modalEl);
        modalInstance.show();
    }
};

// Manipulador do envio do formulário (Criar [POST] ou Atualizar [PUT])
const formBeneficiario = document.getElementById('formBeneficiario');
if (formBeneficiario) {
    formBeneficiario.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('nome', document.getElementById('nome').value);
        formData.append('documento', document.getElementById('documento').value);
        formData.append('telefone', document.getElementById('telefone').value);
        formData.append('cep', document.getElementById('cep').value);
        formData.append('logradouro', document.getElementById('logradouro').value);
        formData.append('numero', document.getElementById('numero').value);
        formData.append('complemento', document.getElementById('complemento').value);
        formData.append('bairro', document.getElementById('bairro').value);
        formData.append('cidade', document.getElementById('cidade').value);
        formData.append('estado', document.getElementById('estado').value);

        const fotoInput = document.getElementById('foto_residencia');
        if (fotoInput && fotoInput.files[0]) {
            formData.append('foto_residencia', fotoInput.files[0]);
        }

        const url = editandoId ? `${API_URL}/beneficiarios/${editandoId}` : `${API_URL}/beneficiarios`;
        const method = editandoId ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                body: formData
            });

            const resultado = await response.json();
            if (!response.ok) {
                throw new Error(resultado.erro || 'Erro ao salvar beneficiário.');
            }

            if (typeof mostrarToast === 'function') {
                mostrarToast(editandoId ? 'Beneficiário atualizado com sucesso!' : 'Beneficiário cadastrado com sucesso!', 'success');
            }

            formBeneficiario.reset();
            editandoId = null;
            carregarBeneficiarios();

            const modalEl = document.getElementById('modalBeneficiario');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();

        } catch (err) {
            console.error('Erro ao submeter formulário:', err);
            if (typeof mostrarToast === 'function') {
                mostrarToast(err.message, 'danger');
            } else {
                alert(err.message);
            }
        }
    });
}

// Função para excluir um beneficiário
window.deletarBeneficiario = async function(id) {
    if (!confirm('Tem certeza de que deseja excluir este beneficiário?')) return;

    try {
        const response = await fetch(`${API_URL}/beneficiarios/${id}`, {
            method: 'DELETE'
        });

        const resultado = await response.json();
        if (!response.ok) {
            throw new Error(resultado.erro || 'Erro ao excluir beneficiário.');
        }

        if (typeof mostrarToast === 'function') {
            mostrarToast('Beneficiário excluído com sucesso!', 'success');
        }
        carregarBeneficiarios();

    } catch (err) {
        console.error('Erro ao excluir:', err);
        if (typeof mostrarToast === 'function') {
            mostrarToast(err.message, 'danger');
        } else {
            alert(err.message);
        }
    }
};

// Executa o carregamento inicial ao abrir a página
document.addEventListener('DOMContentLoaded', () => {
    carregarBeneficiarios();
});
// Função para abrir a foto num modal de visualização rápida
window.abrirModalFoto = function(urlFoto, nomeBeneficiario) {
    // Procura ou cria dinamicamente um modal para exibir a imagem
    let modalVisualizador = document.getElementById('modalVisualizadorFoto');
    
    if (!modalVisualizador) {
        const modalHtml = `
            <div class="modal fade" id="modalVisualizadorFoto" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-light">
                            <h5 class="modal-title fw-bold" id="tituloModalFoto">Foto da Residência</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body text-center bg-dark">
                            <img id="imgVisualizacao" src="" alt="Foto da Residência" class="img-fluid rounded" style="max-height: 75vh; object-fit: contain;">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modalVisualizador = document.getElementById('modalVisualizadorFoto');
    }

    document.getElementById('tituloModalFoto').innerText = `Residência de: ${nomeBeneficiario}`;
    document.getElementById('imgVisualizacao').src = urlFoto;

    const bsModal = new bootstrap.Modal(modalVisualizador);
    bsModal.show();
};