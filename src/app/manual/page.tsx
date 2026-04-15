import type { Metadata } from 'next'
import { PrintManualButton } from './print-button'

export const metadata: Metadata = { title: 'Manual do Sistema — Financeiro para Casais' }

export default function ManualPage() {
  return (
    <div className="manual-page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          body { font-size: 11pt; }
          .manual-page { padding: 0 !important; }
        }
        @media screen {
          .manual-page { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem; }
        }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: white; }
        h1 { font-size: 2rem; font-weight: 800; color: #166534; margin-bottom: 0.25rem; }
        h2 { font-size: 1.3rem; font-weight: 700; color: #15803d; border-bottom: 2px solid #dcfce7; padding-bottom: 0.4rem; margin-top: 2rem; margin-bottom: 0.75rem; }
        h3 { font-size: 1.05rem; font-weight: 700; color: #1f2937; margin-top: 1.25rem; margin-bottom: 0.4rem; }
        h4 { font-size: 0.9rem; font-weight: 600; color: #374151; margin-top: 0.75rem; margin-bottom: 0.25rem; }
        p { font-size: 0.875rem; line-height: 1.6; color: #374151; margin-bottom: 0.5rem; }
        ul { margin: 0.4rem 0 0.75rem 1.25rem; }
        ul li { font-size: 0.875rem; line-height: 1.6; color: #374151; margin-bottom: 0.2rem; }
        .badge { display: inline-block; background: #dcfce7; color: #166534; font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.6rem; border-radius: 999px; margin-right: 0.4rem; }
        .tip { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 0.5rem 0.75rem; border-radius: 0 0.5rem 0.5rem 0; margin: 0.5rem 0; }
        .tip p { margin: 0; color: #92400e; font-size: 0.8rem; }
        .tip strong { color: #78350f; }
        .section-card { border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1rem 1.25rem; margin-bottom: 1rem; background: #f9fafb; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .cover { background: linear-gradient(135deg, #166534, #16a34a); color: white; padding: 3rem 2rem; border-radius: 1rem; margin-bottom: 2rem; }
        .cover h1 { color: white; font-size: 2.5rem; }
        .cover p { color: #bbf7d0; font-size: 1rem; }
        .cover .version { background: rgba(255,255,255,0.2); display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.8rem; color: white; margin-top: 0.75rem; }
        .toc a { color: #166534; text-decoration: none; font-size: 0.875rem; }
        .toc a:hover { text-decoration: underline; }
        .toc li { margin-bottom: 0.35rem; }
        .shortcut { display: inline-block; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.1rem 0.4rem; font-family: monospace; font-size: 0.8rem; color: #374151; }
        .flow-step { display: flex; gap: 0.75rem; align-items: flex-start; margin-bottom: 0.6rem; }
        .flow-num { background: #16a34a; color: white; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; margin-top: 0.1rem; }
        table { width: 100%; border-collapse: collapse; font-size: 0.8rem; margin: 0.75rem 0; }
        th { background: #dcfce7; color: #166534; font-weight: 600; padding: 0.4rem 0.6rem; text-align: left; border: 1px solid #d1fae5; }
        td { padding: 0.4rem 0.6rem; border: 1px solid #e5e7eb; vertical-align: top; }
        tr:nth-child(even) td { background: #f9fafb; }
      `}</style>

      {/* Print button */}
      <PrintManualButton />

      {/* Cover */}
      <div className="cover">
        <h1>Financeiro para Casais</h1>
        <p>Manual completo do sistema de gestão financeira</p>
        <div className="version">Versão 1.0 · Abril 2026</div>
      </div>

      {/* Table of contents */}
      <div className="section-card">
        <h2 style={{ marginTop: 0 }}>Sumário</h2>
        <div className="two-col">
          <ol className="toc" style={{ marginLeft: '1.25rem' }}>
            <li><a href="#intro">1. Introdução</a></li>
            <li><a href="#acesso">2. Acesso e Onboarding</a></li>
            <li><a href="#dashboard">3. Dashboard</a></li>
            <li><a href="#contas">4. Contas</a></li>
            <li><a href="#transacoes">5. Transações</a></li>
            <li><a href="#parcelamentos">6. Parcelamentos</a></li>
            <li><a href="#recorrentes">7. Recorrentes</a></li>
            <li><a href="#orcamentos">8. Orçamentos</a></li>
            <li><a href="#metas">9. Metas</a></li>
          </ol>
          <ol className="toc" style={{ marginLeft: '1.25rem', listStyleType: 'none', paddingLeft: 0 }}>
            <li style={{ marginBottom: '0.35rem' }}><a href="#timeline">10. Linha do Tempo</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#projecao">11. Projeção</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#planejamento">12. Planejamento</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#patrimonio">13. Patrimônio</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#wishlist">14. Lista de Desejos</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#relatorios">15. Relatórios</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#atividade">16. Atividade</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#configuracoes">17. Configurações</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#atalhos">18. Atalhos e dicas</a></li>
          </ol>
        </div>
      </div>

      {/* 1. Introdução */}
      <h2 id="intro">1. Introdução</h2>
      <p>
        O <strong>Financeiro para Casais</strong> é um sistema web completo para gestão financeira a dois. Ele permite
        que você e seu parceiro acompanhem juntos receitas, despesas, metas, orçamentos e patrimônio — tudo em tempo real,
        a partir de qualquer dispositivo.
      </p>
      <div className="two-col">
        <div className="section-card">
          <h4>Principais funcionalidades</h4>
          <ul>
            <li>Lançamento de receitas, despesas e transferências</li>
            <li>Orçamentos por categoria com alertas</li>
            <li>Metas financeiras com aportes e prazo</li>
            <li>Parcelamentos e contas recorrentes</li>
            <li>Relatórios e projeções</li>
            <li>Planejamento mensal e anual</li>
            <li>Controle de patrimônio líquido</li>
            <li>Lista de desejos compartilhada</li>
          </ul>
        </div>
        <div className="section-card">
          <h4>Recursos técnicos</h4>
          <ul>
            <li>Acesso via navegador (desktop e mobile)</li>
            <li>Instalável como app (PWA)</li>
            <li>Importação de extratos CSV e OFX</li>
            <li>Exportação de relatórios em PDF</li>
            <li>Modo privado para transações pessoais</li>
            <li>Temas de cor personalizáveis</li>
            <li>Auto-categorização por regras</li>
            <li>Atalhos de teclado</li>
          </ul>
        </div>
      </div>

      {/* 2. Acesso */}
      <div className="page-break" />
      <h2 id="acesso">2. Acesso e Onboarding</h2>
      <h3>2.1 Cadastro e login</h3>
      <p>Acesse o sistema pelo navegador. Na primeira vez, clique em <strong>Criar conta</strong> e informe seu e-mail e senha. Você também pode entrar com Google, se disponível.</p>

      <h3>2.2 Configuração inicial (Onboarding)</h3>
      <p>Ao fazer login pela primeira vez, o assistente de onboarding guia você em 2 etapas:</p>
      <div className="flow-step"><div className="flow-num">1</div><p><strong>Criar o casal:</strong> Defina um nome para o perfil do casal (ex.: &ldquo;João e Maria&rdquo;). Isso cria o espaço compartilhado.</p></div>
      <div className="flow-step"><div className="flow-num">2</div><p><strong>Primeira conta:</strong> Cadastre sua conta principal (banco, carteira ou cartão) com o saldo inicial atual.</p></div>

      <h3>2.3 Convidar o parceiro</h3>
      <p>Vá em <strong>Configurações → Casal</strong> e use o link de convite para adicionar seu parceiro ao mesmo casal. Após aceitar, ambos passam a ver e lançar transações no mesmo espaço.</p>

      <div className="tip"><p><strong>Dica:</strong> O tour interativo aparece automaticamente na primeira vez. Você pode reiniciá-lo a qualquer momento em <strong>Ajuda → Iniciar tour do sistema</strong>.</p></div>

      {/* 3. Dashboard */}
      <h2 id="dashboard">3. Dashboard</h2>
      <p>Visão geral da situação financeira do casal. Exibe os dados do mês atual.</p>
      <div className="two-col">
        <div>
          <h4>O que você vê</h4>
          <ul>
            <li><strong>Cards de saldo:</strong> saldo total de todas as contas</li>
            <li><strong>Receitas e despesas:</strong> total do mês</li>
            <li><strong>Orçamentos:</strong> status das categorias (% usado)</li>
            <li><strong>Metas:</strong> progresso das metas ativas</li>
            <li><strong>Próximos vencimentos:</strong> recorrentes e parcelamentos</li>
            <li><strong>Últimas transações:</strong> 5 mais recentes</li>
          </ul>
        </div>
        <div>
          <h4>Ações rápidas</h4>
          <ul>
            <li>Pressione <span className="shortcut">N</span> para nova transação</li>
            <li>Clique no botão <strong>+</strong> flutuante (mobile)</li>
            <li>Acesse qualquer seção pelo menu lateral</li>
          </ul>
        </div>
      </div>

      {/* 4. Contas */}
      <div className="page-break" />
      <h2 id="contas">4. Contas</h2>
      <p>Gerencia todas as contas financeiras do casal.</p>
      <h3>4.1 Tipos de conta</h3>
      <table>
        <thead><tr><th>Tipo</th><th>Uso</th><th>Funcionalidades extras</th></tr></thead>
        <tbody>
          <tr><td>Conta Bancária</td><td>Conta corrente ou poupança</td><td>Saldo em tempo real</td></tr>
          <tr><td>Dinheiro</td><td>Carteira física</td><td>Saldo manual</td></tr>
          <tr><td>Cartão de Crédito</td><td>Crédito rotativo</td><td>Limite, % utilizado, datas de fechamento/vencimento</td></tr>
        </tbody>
      </table>
      <h3>4.2 Funcionalidades</h3>
      <ul>
        <li><strong>Extrato por conta:</strong> clique na conta para ver transações por mês com entradas, saídas e saldo</li>
        <li><strong>Histórico de saldo:</strong> gráfico dos últimos 6 meses na página de extrato</li>
        <li><strong>Conciliação:</strong> informe o saldo real do banco para detectar diferenças</li>
        <li><strong>Transferência:</strong> mova saldo entre contas com registro automático</li>
        <li><strong>Ordenação:</strong> arraste ou use as setas para reordenar os cards</li>
        <li><strong>Cor personalizada:</strong> cada conta pode ter uma cor de identificação</li>
      </ul>

      {/* 5. Transações */}
      <h2 id="transacoes">5. Transações</h2>
      <p>Centro principal de lançamentos. Registre entradas, saídas e transferências com categorias, tags e notas.</p>

      <h3>5.1 Lançar transação</h3>
      <p>Clique em <strong>Nova transação</strong> ou pressione <span className="shortcut">N</span> em qualquer tela.</p>
      <table>
        <thead><tr><th>Campo</th><th>Obrigatório</th><th>Descrição</th></tr></thead>
        <tbody>
          <tr><td>Tipo</td><td>Sim</td><td>Entrada, Saída ou Transferência</td></tr>
          <tr><td>Valor</td><td>Sim</td><td>Valor em reais</td></tr>
          <tr><td>Descrição</td><td>Não</td><td>Nome do gasto. Sugestões automáticas conforme você digita</td></tr>
          <tr><td>Categoria</td><td>Não</td><td>Agrupamento para relatórios e orçamentos</td></tr>
          <tr><td>Conta</td><td>Sim</td><td>Conta debitada/creditada</td></tr>
          <tr><td>Data</td><td>Sim</td><td>Data de competência</td></tr>
          <tr><td>Tags</td><td>Não</td><td>Rótulos livres separados por vírgula</td></tr>
          <tr><td>Privado</td><td>Não</td><td>Transação visível apenas para o lançador</td></tr>
          <tr><td>Parcelas</td><td>Não</td><td>Divide automaticamente em N parcelas mensais</td></tr>
        </tbody>
      </table>

      <h3>5.2 Filtros</h3>
      <p>A página de transações oferece filtragem completa:</p>
      <div className="two-col">
        <ul>
          <li>Por mês ou período personalizado</li>
          <li>Botões de atalho: esta semana, este mês, últimos 30 dias</li>
          <li>Por tipo (entrada / saída / transferência)</li>
          <li>Por categoria</li>
        </ul>
        <ul>
          <li>Por conta</li>
          <li>Busca por descrição ou categoria</li>
          <li>Por tag</li>
          <li>Apenas privadas</li>
          <li>Apenas conciliadas</li>
        </ul>
      </div>

      <h3>5.3 Ações por transação</h3>
      <ul>
        <li><strong>Editar:</strong> altera qualquer campo</li>
        <li><strong>Excluir:</strong> com opção de desfazer nos próximos 5 segundos</li>
        <li><strong>Conciliar:</strong> marca como conferida com o extrato bancário</li>
        <li><strong>Tornar recorrente:</strong> cria uma conta recorrente baseada nela</li>
        <li><strong>Comentar:</strong> adiciona notas e observações</li>
      </ul>

      <h3>5.4 Templates</h3>
      <p>Salve combinações frequentes (tipo + valor + categoria) como templates reutilizáveis. No formulário de nova transação, clique em <strong>Templates</strong> para carregar um preset salvo ou salve a configuração atual com um nome.</p>

      <h3>5.5 Importação</h3>
      <div className="two-col">
        <div className="section-card">
          <h4>CSV</h4>
          <p>Exporte o extrato do seu banco em CSV. O importador aceita colunas de data, descrição e valor em formato brasileiro.</p>
        </div>
        <div className="section-card">
          <h4>OFX / QIF</h4>
          <p>Formato OFX (padrão bancário) e QIF são suportados. Baixe o arquivo no internet banking e importe diretamente.</p>
        </div>
      </div>

      <h3>5.6 Auto-categorização por regras</h3>
      <p>Acesse <strong>Regras</strong> na barra de ações da página de Transações para definir padrões de texto → categoria.</p>
      <div className="tip"><p><strong>Exemplo:</strong> qualquer descrição que <em>contém</em> &ldquo;iFood&rdquo; → categoria &ldquo;Alimentação&rdquo;. Use <strong>Aplicar a todas as transações</strong> para recategorizar o histórico de uma vez.</p></div>

      {/* 6. Parcelamentos */}
      <div className="page-break" />
      <h2 id="parcelamentos">6. Parcelamentos</h2>
      <p>Controla compras parceladas com acompanhamento individual de cada parcela.</p>
      <ul>
        <li>Crie um parcelamento informando descrição, valor total, número de parcelas e data da 1ª parcela</li>
        <li>O sistema gera as parcelas automaticamente, uma por mês</li>
        <li>Marque cada parcela como paga (lança automaticamente na conta escolhida)</li>
        <li>Parcelas em atraso são destacadas em vermelho</li>
        <li>Reagende parcelas individualmente</li>
        <li>Cancele parcelas futuras se necessário</li>
      </ul>
      <p>O <strong>painel de resumo</strong> no topo da página mostra: dívida total restante, valor que vence no mês atual e total em atraso.</p>

      {/* 7. Recorrentes */}
      <h2 id="recorrentes">7. Contas Recorrentes</h2>
      <p>Cadastre assinaturas, contas fixas e qualquer despesa/receita que se repete todo mês.</p>
      <table>
        <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>
        <tbody>
          <tr><td>Nome</td><td>Descrição da conta (ex.: Netflix, Aluguel)</td></tr>
          <tr><td>Valor</td><td>Valor mensal</td></tr>
          <tr><td>Dia de vencimento</td><td>Dia do mês em que vence</td></tr>
          <tr><td>Tipo</td><td>Despesa ou receita</td></tr>
          <tr><td>Categoria</td><td>Agrupamento para orçamentos</td></tr>
          <tr><td>Conta padrão</td><td>Conta debitada ao gerar a transação</td></tr>
        </tbody>
      </table>
      <p>Use o botão <strong>Gerar transações do mês</strong> para criar automaticamente todas as transações recorrentes que ainda não foram lançadas no mês atual. Você também pode converter qualquer transação avulsa em recorrente diretamente pela tabela de transações.</p>

      {/* 8. Orçamentos */}
      <div className="page-break" />
      <h2 id="orcamentos">8. Orçamentos</h2>
      <p>Define limites de gasto por categoria para o mês. O sistema monitora automaticamente.</p>

      <h3>8.1 Criando orçamentos</h3>
      <p>Clique em <strong>Novo orçamento</strong> e selecione a categoria e o valor limite mensal. Você pode definir um <strong>percentual de alerta</strong> (padrão 80%) — o sistema envia uma notificação quando o gasto atingir esse limiar.</p>

      <h3>8.2 Automações</h3>
      <ul>
        <li><strong>Copiar do mês anterior:</strong> replica todos os orçamentos do mês passado para o atual</li>
        <li><strong>Rollover:</strong> transfere os saldos não utilizados do mês anterior para o atual (aumenta o limite pelo valor economizado)</li>
        <li><strong>Sugerir com IA:</strong> calcula a média de gastos reais dos últimos 3 meses por categoria e sugere orçamentos</li>
      </ul>

      <h3>8.3 Acompanhamento</h3>
      <p>Cada categoria exibe uma barra de progresso colorida: verde (abaixo do limite), amarelo (próximo do alerta), vermelho (extrapolado). O resumo no topo mostra total orçado vs. total gasto no mês.</p>

      {/* 9. Metas */}
      <h2 id="metas">9. Metas</h2>
      <p>Acompanhe o progresso de objetivos financeiros como reserva de emergência, entrada de imóvel, viagem, etc.</p>

      <h3>9.1 Criando uma meta</h3>
      <ul>
        <li><strong>Nome:</strong> ex. &ldquo;Reserva de emergência&rdquo;</li>
        <li><strong>Valor alvo:</strong> quanto quer acumular</li>
        <li><strong>Prazo:</strong> data limite (opcional)</li>
        <li><strong>Conta vinculada:</strong> usa o saldo dessa conta como progresso</li>
      </ul>

      <h3>9.2 Aportes manuais</h3>
      <p>Se a meta não está vinculada a uma conta, clique em <strong>Aportar</strong> para registrar valores guardados. O histórico completo de aportes fica visível em cada meta.</p>

      <h3>9.3 Alertas de prazo</h3>
      <p>Quando o prazo de uma meta está a 30 dias ou menos, um banner de alerta aparece no topo da página. O sistema também calcula quanto você precisa poupar por mês para atingir a meta no prazo.</p>

      <div className="tip"><p><strong>Meta concluída:</strong> ao atingir 100% do valor alvo, uma animação de celebração é exibida automaticamente.</p></div>

      {/* 10. Linha do Tempo */}
      <div className="page-break" />
      <h2 id="timeline">10. Linha do Tempo</h2>
      <p>Exibe as transações em formato cronológico visual, agrupadas por dia. Ideal para revisar o que aconteceu ao longo do mês sem a visão de tabela.</p>
      <ul>
        <li>Navegue por mês usando as setas</li>
        <li>Cada dia mostra o total de entradas e saídas</li>
        <li>Clique em uma transação para ver os detalhes</li>
      </ul>

      {/* 11. Projeção */}
      <h2 id="projecao">11. Projeção</h2>
      <p>Simula o saldo futuro das contas com base nos dados cadastrados.</p>
      <ul>
        <li>Considera as contas recorrentes com seus dias de vencimento</li>
        <li>Considera parcelas futuras dos parcelamentos</li>
        <li>Projeta o saldo mês a mês para os próximos 6 meses</li>
        <li>Permite ajustar receitas e despesas esperadas manualmente</li>
      </ul>
      <div className="tip"><p><strong>Dica:</strong> mantenha as contas recorrentes atualizadas para que a projeção seja precisa.</p></div>

      {/* 12. Planejamento */}
      <h2 id="planejamento">12. Planejamento</h2>
      <p>Aloca o orçamento mensal por categoria antes que o mês comece — semelhante ao método de envelope.</p>

      <h3>12.1 Planejamento mensal</h3>
      <p>Para cada categoria, defina quanto planeja gastar. O sistema mostra em tempo real a diferença entre o planejado e o gasto real.</p>
      <ul>
        <li>Use <strong>Copiar do mês anterior</strong> para reutilizar o planejamento</li>
        <li>O painel de resumo mostra: receita, total planejado e valor não alocado</li>
      </ul>

      <h3>12.2 Planejamento anual</h3>
      <p>Alterne para a aba <strong>Anual</strong> para ver todos os 12 meses do ano em um grid. Cada mês exibe: valor planejado, gasto real e uma barra de progresso. Clique em qualquer mês para editar seu planejamento.</p>

      {/* 13. Patrimônio */}
      <div className="page-break" />
      <h2 id="patrimonio">13. Patrimônio Líquido</h2>
      <p>Calcula e acompanha o patrimônio líquido do casal ao longo do tempo.</p>
      <ul>
        <li><strong>Ativos:</strong> soma de todos os saldos positivos nas contas</li>
        <li><strong>Passivos:</strong> dívidas de cartão de crédito, parcelamentos a pagar</li>
        <li><strong>Patrimônio líquido:</strong> ativos − passivos</li>
        <li>Gráfico histórico de evolução mensal</li>
        <li>Possibilidade de salvar snapshots mensais para comparação</li>
      </ul>

      {/* 14. Lista de Desejos */}
      <h2 id="wishlist">14. Lista de Desejos</h2>
      <p>Espaço para o casal listar compras e objetivos futuros para discussão e votação.</p>
      <ul>
        <li>Adicione itens com nome, valor estimado e descrição</li>
        <li>Cada parceiro pode votar (aprovar/reprovar)</li>
        <li>Filtre por itens aprovados pelos dois</li>
        <li>Quando aprovado, converta em meta financeira</li>
      </ul>

      {/* 15. Relatórios */}
      <h2 id="relatorios">15. Relatórios</h2>
      <p>Análise visual e detalhada das finanças com múltiplas perspectivas.</p>

      <h3>15.1 Visões disponíveis</h3>
      <table>
        <thead><tr><th>Visão</th><th>O que mostra</th></tr></thead>
        <tbody>
          <tr><td>Mensal</td><td>Receitas, despesas e saldo do mês selecionado, com gráfico de pizza por categoria</td></tr>
          <tr><td>Anual</td><td>Totais de receita e despesa por mês em formato de barras, ao longo do ano</td></tr>
          <tr><td>Comparar</td><td>Dois meses lado a lado: receita, despesa, saldo e diferença por categoria</td></tr>
          <tr><td>Tendência</td><td>Linha de gasto das top 4 categorias nos últimos 6 meses</td></tr>
        </tbody>
      </table>

      <h3>15.2 Exportar relatório</h3>
      <p>Clique no botão <strong>Imprimir</strong> em qualquer visão para abrir o diálogo de impressão do navegador. Selecione <em>Salvar como PDF</em> para guardar o relatório. O CSS de impressão remove automaticamente o menu lateral e botões.</p>

      {/* 16. Atividade */}
      <div className="page-break" />
      <h2 id="atividade">16. Atividade</h2>
      <p>Log de todas as ações realizadas pelo casal no sistema. Útil para auditoria e rastreabilidade.</p>
      <ul>
        <li>Registra criações, edições e exclusões de transações, contas, metas, etc.</li>
        <li>Mostra usuário, data/hora e descrição da ação</li>
        <li>Filtrável por período</li>
      </ul>

      {/* 17. Configurações */}
      <h2 id="configuracoes">17. Configurações</h2>
      <h3>17.1 Perfil pessoal</h3>
      <ul>
        <li>Alterar nome e e-mail</li>
        <li>Trocar senha</li>
        <li>Escolher tema de cor (verde, azul, roxo, rosa, laranja)</li>
        <li>Ativar modo escuro</li>
        <li>Ativar/desativar modo privacidade (oculta valores)</li>
      </ul>

      <h3>17.2 Configurações do casal</h3>
      <ul>
        <li>Alterar nome do casal</li>
        <li>Gerenciar membros (ver quem está no casal)</li>
        <li>Gerar link de convite para o parceiro</li>
        <li>Definir moeda padrão</li>
      </ul>

      <h3>17.3 Zona de perigo (somente proprietário)</h3>
      <p style={{ color: '#dc2626' }}>Esta seção permite excluir permanentemente todos os dados do casal: transações, contas, metas, orçamentos e históricos. A ação é irreversível e exige a confirmação digitando &ldquo;EXCLUIR TUDO&rdquo;.</p>

      {/* 18. Atalhos */}
      <div className="page-break" />
      <h2 id="atalhos">18. Atalhos de teclado e dicas</h2>

      <h3>18.1 Atalhos de teclado</h3>
      <table>
        <thead><tr><th>Tecla</th><th>Ação</th></tr></thead>
        <tbody>
          <tr><td><span className="shortcut">N</span></td><td>Abre o formulário de nova transação (de qualquer página)</td></tr>
          <tr><td><span className="shortcut">?</span></td><td>Exibe a lista de atalhos disponíveis</td></tr>
          <tr><td><span className="shortcut">Esc</span></td><td>Fecha modais e painéis abertos</td></tr>
        </tbody>
      </table>

      <h3>18.2 Fluxo de trabalho recomendado</h3>
      <div className="flow-step"><div className="flow-num">1</div><p><strong>Início do mês:</strong> acesse Planejamento e defina o orçamento de cada categoria com base na sua receita esperada.</p></div>
      <div className="flow-step"><div className="flow-num">2</div><p><strong>Primeiro dia útil:</strong> use <em>Gerar transações do mês</em> em Recorrentes para lançar automaticamente assinaturas e contas fixas.</p></div>
      <div className="flow-step"><div className="flow-num">3</div><p><strong>Ao longo do mês:</strong> lance transações diariamente (atalho <span className="shortcut">N</span>). Marque parcelas pagas conforme vencerem.</p></div>
      <div className="flow-step"><div className="flow-num">4</div><p><strong>Semanalmente:</strong> verifique o Dashboard para checar se algum orçamento está no limite.</p></div>
      <div className="flow-step"><div className="flow-num">5</div><p><strong>Final do mês:</strong> concilie as transações com o extrato bancário. Faça um aporte nas metas. Revise os Relatórios.</p></div>
      <div className="flow-step"><div className="flow-num">6</div><p><strong>Fim do ano:</strong> use a visão Anual nos Relatórios e no Planejamento para avaliar o desempenho do ano.</p></div>

      <h3>18.3 Dicas rápidas</h3>
      <div className="two-col">
        <ul>
          <li>Use <strong>tags</strong> para agrupar gastos por evento (ex.: &ldquo;viagem-bahia&rdquo;)</li>
          <li>Crie <strong>regras de auto-categorização</strong> para economizar tempo</li>
          <li>Use <strong>templates</strong> para transações que se repetem com valores variáveis</li>
          <li>Ative o <strong>modo privacidade</strong> ao mostrar a tela para alguém</li>
          <li>Instale como <strong>app (PWA)</strong> para acesso mais rápido no celular</li>
        </ul>
        <ul>
          <li>Importe extratos <strong>OFX</strong> para lançar todas as transações de uma vez</li>
          <li>Use <strong>Conciliação</strong> para detectar divergências entre o sistema e o banco</li>
          <li>A <strong>Lista de Desejos</strong> evita compras impulsivas — vote antes de comprar</li>
          <li>O <strong>Rollover de orçamento</strong> recompensa quem economiza no mês</li>
          <li>Consulte a <strong>Projeção</strong> antes de assumir novos compromissos financeiros</li>
        </ul>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '3rem', borderTop: '2px solid #dcfce7', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: 0 }}>Financeiro para Casais — Manual do Sistema v1.0</p>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: 0 }}>Abril 2026</p>
      </div>
    </div>
  )
}
