const API_URL = 'http://localhost:3000/api/caminhoes';
let idCaminhaoEdicao = null; // Variável para controlar se estamos editando

document.addEventListener('DOMContentLoaded', () => {
    carregarCaminhoes();

    const formCaminhao = document.getElementById('formCaminhao');
    if (formCaminhao) {
        formCaminhao.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('placa', document.getElementById('placa').value);
            formData.append('modelo', document.getElementById('modelo').value);
            formData.append('capacidade_litros', document.getElementById('capacidade_litros').value);
            formData.append('renavam', document.getElementById('renavam').value);
            formData.append('vencimento_ipva', document.getElementById('vencimento_ipva').value || '');

            const inputFoto = document.getElementById('fotoCaminhao');
            if (inputFoto && inputFoto.files[0]) {
                formData.append('foto', inputFoto.files[0]);
            }

            try {
                let url = API_URL;
                let method = 'POST';

                // Se estivermos editando, muda a URL para o ID específico e o método para PUT
                if (idCaminhaoEdicao) {
                    url = `${API_URL}/${idCaminhaoEdicao}`;
                    method = 'PUT';
                }

                const res = await fetch(url, {
                    method: method,
                    body: formData
                });

                const resultado = await res.json();
                
                if (!res.ok) {
                    throw new Error(resultado.erro || 'Erro ao salvar caminhão.');
                }

                mostrarToast(resultado.mensagem || 'Operação realizada com sucesso!', 'success');
                cancelarEdicao();
                carregarCaminhoes();

            } catch (error) {
                mostrarToast(error.message, 'danger');
            }
        });
    }
});

function formatarData(dataIso) {
    if (!dataIso) return '-';
    // Evita problemas de fuso horário cortando a string ISO (YYYY-MM-DD)
    const partes = dataIso.split('T')[0].split('-');
    if (partes.length !== 3) return dataIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function verificarIpvaVencido(dataIso) {
    if (!dataIso) return false;
    const dataVencimento = new Date(dataIso);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataVencimento.setHours(0, 0, 0, 0);
    return dataVencimento < hoje;
}

async function carregarCaminhoes() {
    try {
        const res = await fetch(API_URL);
        const caminhoes = await res.json();
        
        const tbody = document.getElementById('tabelaCaminhoes');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (caminhoes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Nenhum caminhão cadastrado.</td></tr>`;
            return;
        }

        caminhoes.forEach(c => {
            const ipvaVencido = verificarIpvaVencido(c.vencimento_ipva);
            
            let badgeClass = 'bg-secondary';
            let statusTexto = c.status || 'Disponível';

            if (ipvaVencido) {
                badgeClass = 'bg-danger';
                statusTexto = 'Vencido';
            }

            let htmlFoto = `<span class="text-muted"><i class="fas fa-image-slash"></i></span>`;
            if (c.foto) {
                htmlFoto = `<img src="uploads/${c.foto}" alt="Foto" style="width: 45px; height: 35px; object-fit: cover;" class="rounded shadow-sm">`;
            }

            // Tratamento da data para o input type="date" (YYYY-MM-DD)
            const dataIsoFormatada = c.vencimento_ipva ? c.vencimento_ipva.split('T')[0] : '';

            tbody.innerHTML += `
            <tr>
                <td class="ps-3">${c.id}</td>
                <td class="text-center">${htmlFoto}</td>
                <td><strong>${c.placa}</strong></td>
                <td>${c.modelo || '-'}</td>
                <td>${formatarData(c.vencimento_ipva)}</td>
                <td><span class="badge ${badgeClass}">${statusTexto}</span></td> <!-- Status logo após a data -->
                <td>${Number(c.capacidade_litros).toLocaleString('pt-BR')} L</td>
                <td class="text-center pe-3">
                    <button class="btn btn-outline-warning btn-sm rounded-circle me-1" onclick="prepararEdicao(${c.id}, '${c.placa}', '${c.modelo || ''}', '${c.renavam || ''}', '${dataIsoFormatada}', '${c.capacidade_litros}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm rounded-circle" onclick="deletarCaminhao(${c.id})" title="Excluir">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;

        });
    } catch (error) {
        console.error(error);
        mostrarToast('Erro ao carregar lista de caminhões.', 'danger');
    }
}

function prepararEdicao(id, placa, modelo, renavam, vencimento_ipva, capacidade_litros) {
    idCaminhaoEdicao = id;
    
    // Preenche os campos do formulário com os dados atuais
    document.getElementById('placa').value = placa;
    document.getElementById('modelo').value = modelo !== 'null' ? modelo : '';
    document.getElementById('renavam').value = renavam !== 'null' ? renavam : '';
    document.getElementById('vencimento_ipva').value = vencimento_ipva !== 'null' ? vencimento_ipva : '';
    document.getElementById('capacidade_litros').value = capacidade_litros;

    // Altera visualmente o botão de salvar para indicar edição
    const cardHeader = document.querySelector('.card-header h5');
    if (cardHeader) cardHeader.innerHTML = `<i class="fas fa-edit me-2"></i>Editar Caminhão (ID: ${id})`;

    const btnSubmit = document.querySelector('#formCaminhao button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = `<i class="fas fa-sync-alt me-1"></i> Atualizar`;
        btnSubmit.classList.remove('btn-primary');
        btnSubmit.classList.add('btn-warning', 'text-dark');
    }

    // Adiciona botão de cancelar edição se já não existir
    let containerBotoes = btnSubmit.parentElement;
    if (!document.getElementById('btnCancelarEdicao')) {
        const btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.id = 'btnCancelarEdicao';
        btnCancelar.className = 'btn btn-secondary btn-sm ms-2 shadow-sm fw-bold px-3 py-2';
        btnCancelar.innerHTML = `<i class="fas fa-times me-1"></i> Cancelar`;
        btnCancelar.onclick = cancelarEdicao;
        containerBotoes.appendChild(btnCancelar);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicao() {
    idCaminhaoEdicao = null;
    document.getElementById('formCaminhao').reset();

    // Restaura o visual padrão do formulário
    const cardHeader = document.querySelector('.card-header h5');
    if (cardHeader) cardHeader.innerHTML = `<i class="fas fa-plus-circle me-2"></i>Cadastrar Novo Caminhão`;

    const btnSubmit = document.querySelector('#formCaminhao button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = `<i class="fas fa-save me-1"></i> Salvar`;
        btnSubmit.classList.remove('btn-warning', 'text-dark');
        btnSubmit.classList.add('btn-primary');
    }

    const btnCancelar = document.getElementById('btnCancelarEdicao');
    if (btnCancelar) btnCancelar.remove();
}

async function deletarCaminhao(id) {
    if (!confirm('Deseja realmente excluir este caminhão?')) return;

    try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        
        if (!res.ok) {
            const resultado = await res.json().catch(() => ({}));
            throw new Error(resultado.erro || 'Erro ao excluir caminhão.');
        }

        mostrarToast('Caminhão excluído com sucesso!', 'success');
        carregarCaminhoes();
    } catch (error) {
        mostrarToast(error.message, 'danger');
    }
}