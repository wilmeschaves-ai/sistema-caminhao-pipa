const API_URL = 'http://localhost:3000/api/entregas';
const API_CARREGAMENTOS = 'http://localhost:3000/api/carregamentos';
const API_BENEFICIARIOS = 'http://localhost:3000/api/beneficiarios';

document.addEventListener('DOMContentLoaded', () => {
    carregarEntregas();
    
    // Atualiza os selects sempre que o modal de nova entrega for aberto
    const modalEntrega = document.getElementById('modalEntrega');
    if (modalEntrega) {
        modalEntrega.addEventListener('show.bs.modal', () => {
            carregarSelects();
        });
    }

    // Configura o evento do formulário de forma segura
    const formEntrega = document.getElementById('formEntrega');
    if (formEntrega) {
        formEntrega.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const novaEntrega = {
                carregamento_id: document.getElementById('carregamento_id').value,
                beneficiario_id: document.getElementById('beneficiario_id').value,
                litros_entregues: document.getElementById('litros_entregues').value,
                observacao: document.getElementById('observacao')?.value || ''
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(novaEntrega)
                });

                if (response.ok) {
                    formEntrega.reset();
                    carregarEntregas();
                    
                    // Fecha o modal após o registo bem-sucedido
                    const modalInstance = bootstrap.Modal.getInstance(modalEntrega);
                    if (modalInstance) modalInstance.hide();
                } else {
                    const erro = await response.json();
                    alert('Erro: ' + (erro.erro || 'Não foi possível registar a entrega.'));
                }
            } catch (err) {
                console.error('Erro ao guardar entrega:', err);
            }
        });
    }
});

async function carregarEntregas() {
    try {
        const response = await fetch(API_URL);
        const entregas = await response.json();
        
        const tbody = document.getElementById('tabelaEntregas');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (entregas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Nenhuma entrega registada.</td></tr>`;
            return;
        }

        entregas.forEach(e => {
            const dataFormatada = new Date(e.data_hora).toLocaleString('pt-BR');
            tbody.innerHTML += `
                <tr>
                    <td class="fw-semibold">${e.beneficiario_nome}</td>
                    <td>${e.beneficiario_rua ? `${e.beneficiario_rua},${e.beneficiario_num || 'S/N'}` : 'Endereço não informado'}</td>
                    <td>${e.caminhao_placa} (${e.motorista_nome})</td>
                    <td><span class="badge bg-success px-2 py-1">${e.litros_entregues.toLocaleString()} L</span></td>
                    <td>${dataFormatada}</td>
                    <td class="text-end">
                        <button class="btn btn-outline-danger btn-sm rounded-circle" onclick="deletarEntrega(${e.id})" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Erro ao carregar entregas:', err);
    }
}

async function carregarSelects() {
    try {
        // Carregar Carregamentos Disponíveis
        const resCarregamentos = await fetch(API_CARREGAMENTOS);
        const carregamentos = await resCarregamentos.json();
        const selectCarregamento = document.getElementById('carregamento_id');
        if (selectCarregamento) {
            selectCarregamento.innerHTML = '<option value="">Selecione a Viagem de Carregamento</option>';
            carregamentos.forEach(c => {
                selectCarregamento.innerHTML += `<option value="${c.id}">Fonte: ${c.fonte_agua} | Caminhão: ${c.caminhao_placa} (${c.litros_carregados}L)</option>`;
            });
        }

        // Carregar Beneficiários
        const resBeneficiarios = await fetch(API_BENEFICIARIOS);
        const beneficiarios = await resBeneficiarios.json();
        const selectBeneficiario = document.getElementById('beneficiario_id');
        if (selectBeneficiario) {
            selectBeneficiario.innerHTML = '<option value="">Selecione o Beneficiário</option>';
            beneficiarios.forEach(b => {
                selectBeneficiario.innerHTML += `<option value="${b.id}">${b.nome} - ${b.logradouro || 'Sem rua'}</option>`;
            });
        }
    } catch (err) {
        console.error('Erro ao carregar selects para entregas:', err);
    }
}

async function deletarEntrega(id) {
    if (confirm('Tem certeza que deseja excluir este registo de entrega?')) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            carregarEntregas();
        } catch (err) {
            console.error('Erro ao excluir entrega:', err);
        }
    }
}