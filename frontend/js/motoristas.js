const API_URL = 'http://localhost:3000/api/motoristas';
const CAMINHOES_URL = 'http://localhost:3000/api/caminhoes';
let idMotoristaEdicao = null;

// Inicialização única quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    carregarMotoristas();
    carregarCaminhoesSelect();

    const formMotorista = document.getElementById('formMotorista');
    if (formMotorista) {
        formMotorista.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nomeEl = document.getElementById('nome');
            const cnhEl = document.getElementById('cnh');
            const validadeCnhEl = document.getElementById('validade_cnh');
            const telefoneEl = document.getElementById('telefone');
            const caminhaoEl = document.getElementById('caminhao_id');
            const fotoInput = document.getElementById('fotoMotorista'); // Referência ao input de ficheiro da foto

            // Criamos o FormData para enviar texto e ficheiros em simultâneo
            const formData = new FormData();
            formData.append('nome', nomeEl ? nomeEl.value : '');
            formData.append('cnh', cnhEl ? cnhEl.value : '');
            formData.append('validade_cnh', validadeCnhEl && validadeCnhEl.value ? validadeCnhEl.value : '');
            formData.append('telefone', telefoneEl ? telefoneEl.value : '');
            formData.append('caminhao_id', caminhaoEl && caminhaoEl.value ? caminhaoEl.value : '');
            
            // Adiciona a foto se o utilizador tiver selecionado uma imagem
            if (fotoInput && fotoInput.files[0]) {
                formData.append('foto', fotoInput.files[0]);
            }

            try {
                let url = API_URL;
                let method = 'POST';

                if (typeof idMotoristaEdicao !== 'undefined' && idMotoristaEdicao) {
                    url = `${API_URL}/${idMotoristaEdicao}`;
                    method = 'PUT';
                }

                const response = await fetch(url, {
                    method: method,
                    // ATENÇÃO: Nunca defina 'Content-Type': 'application/json' ao enviar FormData. 
                    // O navegador define o tipo multipart/form-data e o boundary automaticamente.
                    body: formData 
                });

                const resultado = await response.json();

                if (!response.ok) {
                    throw new Error(resultado.erro || 'Não foi possível salvar o motorista.');
                }

                mostrarToast(resultado.mensagem || 'Operação realizada com sucesso!', 'success');
                
                // Limpa o input da foto
                if (fotoInput) fotoInput.value = '';

                if (typeof cancelarEdicaoMotorista === 'function') {
                    cancelarEdicaoMotorista();
                }
                
                carregarMotoristas();
                carregarCaminhoesSelect();

            } catch (err) {
                mostrarToast(err.message, 'danger');
            }
        });
    }
});
// Função para carregar e renderizar os motoristas na tabela
async function carregarMotoristas() {
    try {
        const res = await fetch(API_URL);
        const motoristas = await res.json();
        
        const tbody = document.getElementById('tabelaMotoristas');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (motoristas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Nenhum motorista registado.</td></tr>`;
            return;
        }

        motoristas.forEach(m => {
            const statusCnh = verificarStatusCnh(m.validade_cnh);
            const dataIsoFormatada = m.validade_cnh ? m.validade_cnh.split('T')[0] : '';
            
            const placa = m.placa_caminhao || m.caminhao_placa || m.placa;
            const modelo = m.modelo_caminhao || m.caminhao_modelo || m.modelo;
            const viaturaTexto = placa ? `${placa} - ${modelo || ''}` : 'Nenhuma';
        
            // Miniatura da foto
            // Se não tiver foto, mostramos um ícone em vez de tentar carregar um link externo
            const imagemSrc = m.foto ? `uploads/${m.foto}` : null;

            let elementoFoto = imagemSrc 
            ? `<img src="${imagemSrc}" alt="Foto" class="rounded-circle" width="35" height="35" style="object-fit: cover;">`
            : `<div class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center" style="width: 35px; height: 35px;"><i class="fas fa-user font-sm"></i></div>`;
                
            tbody.innerHTML += `
                <tr>
                    <td class="ps-3">
                        ${elementoFoto}
                    </td>
                    <td><strong>${m.nome}</strong></td>
                    <td class="text-nowrap">${m.telefone || '-'}</td>
                    <td>${m.cnh || '-'}</td>
                    <td>${formatarData(m.validade_cnh)}</td>
                    <td><span class="badge ${statusCnh.classe}">${statusCnh.texto}</span></td>
                    <td>${viaturaTexto}</td>
                    <td class="text-center pe-3">
                        <button class="btn btn-outline-warning btn-sm rounded-circle me-1" onclick="prepararEdicaoMotorista(${m.id}, '${m.nome}', '${m.cnh || ''}', '${m.telefone || ''}', '${dataIsoFormatada}', '${m.caminhao_id || ''}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm rounded-circle" onclick="deletarMotorista(${m.id})" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                </tr>
            `;
        });


    } catch (error) {
        console.error(error);
        mostrarToast('Erro ao carregar lista de motoristas.', 'danger');
    }
}
function formatarData(dataIso) {
    if (!dataIso) return '-';
    const partes = dataIso.split('T')[0].split('-');
    if (partes.length !== 3) return dataIso;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Função para verificar se a CNH está vencida, próxima de vencer (30 dias) ou válida
function verificarStatusCnh(dataIso) {
    if (!dataIso) return { texto: 'Indefinido', classe: 'bg-secondary' };
    
    const dataVencimento = new Date(dataIso);
    const hoje = new Date();
    
    hoje.setHours(0, 0, 0, 0);
    dataVencimento.setHours(0, 0, 0, 0);
    
    const diferencaTempo = dataVencimento - hoje;
    const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
    
    if (diferencaDias < 0) {
        return { texto: 'CNH Vencida', classe: 'bg-danger' };
    } else if (diferencaDias <= 30) {
        return { texto: 'Vence em Breve', classe: 'bg-warning text-dark' };
    } else {
        return { texto: 'Regular', classe: 'bg-success' };
    }
}

async function carregarCaminhoesSelect() {
    try {
        const response = await fetch(CAMINHOES_URL);
        const caminhoes = await response.json();
        
        const selectCaminhao = document.getElementById('caminhao_id');
        if (!selectCaminhao) return;

        selectCaminhao.innerHTML = '<option value="">Nenhum / Sem Caminhão</option>';

        caminhoes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id;
            option.textContent = `Placa: ${c.placa} - ${c.modelo || 'Sem Modelo'}`;
            selectCaminhao.appendChild(option);
        });
    } catch (err) {
        mostrarToast('Erro ao carregar lista de caminhões.', 'danger');
    }
}

function prepararEdicaoMotorista(id, nome, cnh, telefone, validade_cnh, caminhao_id) {
    idMotoristaEdicao = id;
    
    document.getElementById('nome').value = nome;
    document.getElementById('cnh').value = cnh !== 'null' ? cnh : '';
    document.getElementById('telefone').value = telefone !== 'null' ? telefone : '';
    document.getElementById('validade_cnh').value = validade_cnh !== 'null' ? validade_cnh : '';
    document.getElementById('caminhao_id').value = caminhao_id !== 'null' ? caminhao_id : '';

    const cardHeader = document.querySelector('.col-lg-4 .card h5');
    if (cardHeader) cardHeader.innerHTML = `<i class="fas fa-edit me-2"></i>Editar Motorista (ID: ${id})`;

    const btnSubmit = document.querySelector('#formMotorista button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = `<i class="fas fa-sync-alt me-1"></i> Atualizar Motorista`;
        btnSubmit.classList.remove('btn-success');
        btnSubmit.classList.add('btn-warning', 'text-dark');
    }

    if (!document.getElementById('btnCancelarEdicaoMotorista')) {
        const btnCancelar = document.createElement('button');
        btnCancelar.type = 'button';
        btnCancelar.id = 'btnCancelarEdicaoMotorista';
        btnCancelar.className = 'btn btn-secondary rounded-pill w-100 fw-semibold py-2 shadow-sm mt-2';
        btnCancelar.innerHTML = `<i class="fas fa-times me-1"></i> Cancelar`;
        btnCancelar.onclick = cancelarEdicaoMotorista;
        btnSubmit.parentElement.appendChild(btnCancelar);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelarEdicaoMotorista() {
    idMotoristaEdicao = null;
    document.getElementById('formMotorista').reset();

    const cardHeader = document.querySelector('.col-lg-4 .card h5');
    if (cardHeader) cardHeader.innerHTML = `<i class="fas fa-user-plus me-2"></i>Novo Motorista`;

    const btnSubmit = document.querySelector('#formMotorista button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.innerHTML = `<i class="fas fa-save me-2"></i>Guardar Motorista`;
        btnSubmit.classList.remove('btn-warning', 'text-dark');
        btnSubmit.classList.add('btn-success');
    }

    const btnCancelar = document.getElementById('btnCancelarEdicaoMotorista');
    if (btnCancelar) btnCancelar.remove();
}

async function deletarMotorista(id) {
    if (confirm('Tem certeza que deseja excluir este motorista?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            
            if (!response.ok) {
                const erro = await response.json().catch(() => ({}));
                throw new Error(erro.erro || 'Erro ao excluir motorista.');
            }

            mostrarToast('Motorista excluído com sucesso!', 'success');
            carregarMotoristas();
            carregarCaminhoesSelect();
        } catch (err) {
            mostrarToast(err.message, 'danger');
        }
    }
}
// No seu controllers/motoristaController.js, confirme se tem esta exata estrutura:
