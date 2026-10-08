document.addEventListener('DOMContentLoaded', () => {
    carregarCaminhoes();
});

// Função para buscar e preencher o select de caminhões
async function carregarCaminhoes() {
    try {
        const baseURL = 'http://localhost:3000';
        const response = await fetch(`${baseURL}/api/caminhoes`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar caminhões');
        }

        const caminhoes = await response.json();
        const select = document.getElementById('filtro_caminhao');
        
        if (!select) return;

        select.innerHTML = '<option value="">Todos os Caminhões</option>';

        caminhoes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id || c.caminhao_id;
            option.textContent = `${c.modelo || 'Caminhão'} - ${c.placa || ''}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao buscar caminhões:', error);
        mostrarToast('Erro ao carregar lista de caminhões para o filtro.', 'danger');
    }
}

// Função principal chamada pelo botão "Gerar Relatório"
async function obterRelatorios() {
    const dataInicio = document.getElementById('data_inicio')?.value || '';
    const dataFim = document.getElementById('data_fim')?.value || '';
    const caminhaoId = document.getElementById('filtro_caminhao')?.value || '';

    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (caminhaoId) params.append('caminhao_id', caminhaoId);

    try {
        const baseURL = 'http://localhost:3000'; 
        const response = await fetch(`${baseURL}/api/relatorios?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error('Erro na resposta do servidor ao buscar relatórios.');
        }

        const dados = await response.json();
        preencherTabelaRelatorios(dados);
        
        // Opcional: Toast de sucesso subtil ou feedback visual se desejar
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        mostrarToast('Erro ao gerar relatório. Verifique os filtros ou a ligação à API.', 'danger');
        
        const tbody = document.getElementById('tabelaRelatorio');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">Erro ao ligar ao servidor ou carregar dados. Verifique se a API está ativa.</td></tr>`;
        }
    }
}

function preencherTabelaRelatorios(dados) {
    const tbody = document.getElementById('tabelaRelatorio');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhum registo encontrado.</td></tr>`;
        return;
    }

    dados.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-3">${item.data}</td>
            <td>${item.caminhao}</td>
            <td>${item.beneficiario}</td>
            <td><strong>${item.litros.toLocaleString('pt-BR')} L</strong></td>
            <td class="text-end pe-3"><span class="badge bg-success bg-opacity-75 text-white">${item.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}
function exportarPDF() {
    const dataInicio = document.getElementById('data_inicio')?.value || '';
    const dataFim = document.getElementById('data_fim')?.value || '';
    const caminhaoId = document.getElementById('filtro_caminhao')?.value || '';

    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (caminhaoId) params.append('caminhao_id', caminhaoId);

    const baseURL = 'http://localhost:3000';
    
    // Abre a rota no navegador, o que dispara o download automático do PDF formatado
    window.location.href = `${baseURL}/api/relatorios/pdf?${params.toString()}`;
}
function exportarExcel() {
    const dataInicio = document.getElementById('data_inicio')?.value || '';
    const dataFim = document.getElementById('data_fim')?.value || '';
    const caminhaoId = document.getElementById('filtro_caminhao')?.value || '';

    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    if (caminhaoId) params.append('caminhao_id', caminhaoId);

    const baseURL = 'http://localhost:3000';
    
    // Abre a rota no navegador para iniciar o download do arquivo .xlsx formatado
    window.location.href = `${baseURL}/api/relatorios/excel?${params.toString()}`;
}
// Função para buscar relatório por Beneficiário
async function obterRelatorioPorBeneficiario() {
    const dataInicio = document.getElementById('data_inicio')?.value || '';
    const dataFim = document.getElementById('data_fim')?.value || '';

    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);

    try {
        const baseURL = 'http://localhost:3000';
        const response = await fetch(`${baseURL}/api/relatorios/por-beneficiario?${params.toString()}`);
        
        if (!response.ok) throw new Error('Erro ao buscar relatório por beneficiário.');

        const dados = await response.json();
        preencherTabelaBeneficiarios(dados);
    } catch (error) {
        console.error(error);
        mostrarToast('Erro ao carregar relatório por beneficiário.', 'danger');
    }
}

// Função para preencher tabela de beneficiários
function preencherTabelaBeneficiarios(dados) {
    const tbody = document.getElementById('tabelaRelatorio'); // ou outro ID específico
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Nenhum registo encontrado.</td></tr>`;
        return;
    }

    dados.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-3">${item.beneficiario}</td>
            <td>${item.endereco || 'N/D'}</td>
            <td class="text-center">${item.total_entregas}</td>
            <td class="text-end pe-3"><strong>${Number(item.total_litros).toLocaleString('pt-BR')} L</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

// Função para buscar relatório por Caminhão
async function obterRelatorioPorCaminhao() {
    const dataInicio = document.getElementById('data_inicio')?.value || '';
    const dataFim = document.getElementById('data_fim')?.value || '';

    const params = new URLSearchParams();
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);

    try {
        const baseURL = 'http://localhost:3000';
        const response = await fetch(`${baseURL}/api/relatorios/por-caminhao?${params.toString()}`);
        
        if (!response.ok) throw new Error('Erro ao buscar relatório por caminhão.');

        const dados = await response.json();
        preencherTabelaCaminhoes(dados);
    } catch (error) {
        console.error(error);
        mostrarToast('Erro ao carregar relatório por caminhão.', 'danger');
    }
}

// Função para preencher tabela de desempenho de caminhões
function preencherTabelaCaminhoes(dados) {
    const tbody = document.getElementById('tabelaRelatorio');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (!dados || dados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Nenhum registo encontrado.</td></tr>`;
        return;
    }

    dados.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="ps-3">${item.caminhao}</td>
            <td class="text-center">${item.total_carregamentos || 0}</td>
            <td class="text-center">${item.total_entregas || 0}</td>
            <td class="text-end pe-3"><strong>${Number(item.total_litros || 0).toLocaleString('pt-BR')} L</strong></td>
        `;
        tbody.appendChild(tr);
    });
}