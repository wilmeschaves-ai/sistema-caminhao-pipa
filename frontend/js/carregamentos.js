const API_URL = 'http://localhost:3000/api/carregamentos';
const API_CAMINHOES = 'http://localhost:3000/api/caminhoes';
const API_MOTORISTAS = 'http://localhost:3000/api/motoristas';

document.addEventListener('DOMContentLoaded', () => {
    carregarCarregamentos();
    carregarSelects();

    const formCarregamento = document.getElementById('formCarregamento');
    if (formCarregamento) {
        formCarregamento.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const novoCarregamento = {
                caminhao_id: document.getElementById('caminhao_id').value,
                motorista_id: document.getElementById('motorista_id').value,
                fonte_agua: document.getElementById('fonte_agua').value,
                litros_carregados: document.getElementById('litros_carregados').value
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novoCarregamento)
                });

                const resultado = await response.json();

                if (!response.ok) {
                    throw new Error(resultado.erro || 'Não foi possível registar o carregamento.');
                }

                mostrarToast(resultado.mensagem || 'Carregamento registado com sucesso!', 'success');
                formCarregamento.reset();
                carregarCarregamentos();

                // Fechar o modal do Bootstrap (caso esteja a utilizar um)
                const modalEl = document.getElementById('modalCarregamento');
                if (modalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) modalInstance.hide();
                }

            } catch (err) {
                mostrarToast(err.message, 'danger');
            }
        });
    }
});

async function carregarCarregamentos() {
    try {
        const response = await fetch(API_URL);
        const carregamentos = await response.json();
        
        const tbody = document.getElementById('tabelaCarregamentos');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (carregamentos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhum carregamento registado.</td></tr>`;
            return;
        }

        carregamentos.forEach(c => {
            const dataFormatada = new Date(c.data_hora).toLocaleString('pt-BR');
            tbody.innerHTML += `
                <tr>
                    <td class="fw-semibold">${c.caminhao_placa} (${c.caminhao_modelo})</td>
                    <td>${c.motorista_nome}</td>
                    <td>${c.fonte_agua}</td>
                    <td><span class="badge bg-info text-dark px-2 py-1">${c.litros_carregados.toLocaleString()} L</span></td>
                    <td>${dataFormatada}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-danger btn-sm rounded-circle" onclick="deletarCarregamento(${c.id})" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        mostrarToast('Erro ao carregar lista de carregamentos.', 'danger');
    }
}

async function carregarSelects() {
    try {
        // Carregar Caminhões
        const resCaminhoes = await fetch(API_CAMINHOES);
        const caminhoes = await resCaminhoes.json();
        const selectCaminhao = document.getElementById('caminhao_id');
        if (selectCaminhao) {
            selectCaminhao.innerHTML = '<option value="">Selecione o Caminhão</option>';
            caminhoes.forEach(cam => {
                selectCaminhao.innerHTML += `<option value="${cam.id}">${cam.placa} - ${cam.modelo} (${cam.capacidade_litros}L)</option>`;
            });
        }

        // Carregar Motoristas
        const resMotoristas = await fetch(API_MOTORISTAS);
        const motoristas = await resMotoristas.json();
        const selectMotorista = document.getElementById('motorista_id');
        if (selectMotorista) {
            selectMotorista.innerHTML = '<option value="">Selecione o Motorista</option>';
            motoristas.forEach(m => {
                selectMotorista.innerHTML += `<option value="${m.id}">${m.nome}</option>`;
            });
        }
    } catch (err) {
        mostrarToast('Erro ao carregar os dados dos selects (caminhões/motoristas).', 'danger');
    }
}

async function deletarCarregamento(id) {
    if (confirm('Tem certeza que deseja excluir este registo de carregamento?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            
            if (!response.ok) {
                const erro = await response.json().catch(() => ({}));
                throw new Error(erro.erro || 'Erro ao excluir carregamento.');
            }

            mostrarToast('Carregamento excluído com sucesso!', 'success');
            carregarCarregamentos();
        } catch (err) {
            mostrarToast(err.message, 'danger');
        }
    }
}