document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/api/dashboards/stats');
        if (!response.ok) throw new Error('Erro ao buscar dados do dashboard');
        
        const data = await response.json();

        // 1. Atualizar Cartões de Resumo
        const elTotalAgua = document.getElementById('totalAgua');
        if (elTotalAgua) elTotalAgua.textContent = `${Number(data.totalAgua).toLocaleString('pt-BR')} L`;

        const elTotalViagens = document.getElementById('totalViagens');
        if (elTotalViagens) elTotalViagens.textContent = data.totalViagens;

        const elTotalFamilias = document.getElementById('totalFamilias');
        if (elTotalFamilias) elTotalFamilias.textContent = data.totalFamilias;

        // 2. Atualizar ou Criar o Gráfico de Frota com os dados reais do MySQL
        const canvasFrota = document.getElementById('frotaChart');
        if (canvasFrota && data.distribuicaoFrota) {
            const ctx = canvasFrota.getContext('2d');

            // Se já existir uma instância anterior do gráfico, destruímos para evitar sobreposição
            if (window.frotaChartInstance) {
                window.frotaChartInstance.destroy();
            }

            // Extrair etiquetas (Modelo + Placa) e valores (Litros) do banco
            const labels = data.distribuicaoFrota.map(c => `${c.modelo} - ${c.placa}`);
            const valores = data.distribuicaoFrota.map(c => c.total_litros);

            window.frotaChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: valores,
                        backgroundColor: ['#2563eb', '#16a34a', '#ca8a04', '#dc2626', '#9333ea']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

    } catch (error) {
        console.error('Erro ao atualizar o dashboard:', error);
    }
});