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
        .badge-blue { display: inline-block; background: #dbeafe; color: #1d4ed8; font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.6rem; border-radius: 999px; margin-right: 0.4rem; }
        .badge-new { display: inline-block; background: #fef9c3; color: #854d0e; font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 999px; margin-left: 0.3rem; vertical-align: middle; }
        .tip { background: #fffbeb; border-left: 3px solid #f59e0b; padding: 0.5rem 0.75rem; border-radius: 0 0.5rem 0.5rem 0; margin: 0.5rem 0; }
        .tip p { margin: 0; color: #92400e; font-size: 0.8rem; }
        .tip strong { color: #78350f; }
        .info { background: #eff6ff; border-left: 3px solid #3b82f6; padding: 0.5rem 0.75rem; border-radius: 0 0.5rem 0.5rem 0; margin: 0.5rem 0; }
        .info p { margin: 0; color: #1e40af; font-size: 0.8rem; }
        .section-card { border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1rem 1.25rem; margin-bottom: 1rem; background: #f9fafb; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
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

      <PrintManualButton />

      {/* Cover */}
      <div className="cover">
        <h1>Financeiro para Casais</h1>
        <p>Manual completo do sistema de gestão financeira</p>
        <div className="version">Versão 3.6 · Abril 2026</div>
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
            <li><a href="#pagamentos-fixos">7. Pagamentos Fixos <span className="badge-new">NOVO</span></a></li>
            <li><a href="#atividades">8. Atividades (Tarefas + Lembretes) <span className="badge-new">NOVO</span></a></li>
            <li><a href="#orcamentos">9. Orçamentos</a></li>
            <li><a href="#metas">10. Metas</a></li>
            <li><a href="#timeline">11. Linha do Tempo</a></li>
            <li><a href="#agenda">12. Agenda + Google Calendar <span className="badge-new">NOVO</span></a></li>
            <li><a href="#projecao">13. Projeção</a></li>
            <li><a href="#planejamento">14. Planejamento</a></li>
            <li><a href="#patrimonio">15. Patrimônio Líquido</a></li>
          </ol>
          <ol className="toc" style={{ marginLeft: '1.25rem', listStyleType: 'none', paddingLeft: 0 }}>
            <li style={{ marginBottom: '0.35rem' }}><a href="#wishlist">16. Listas (Desejos + Compras)</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#relatorios">17. Relatórios</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#viagens">18. Viagens</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#precos">19. Histórico de Preços</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#insights">20. Insights</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#investments">21. Investimentos + Simulador</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#patrimonio-fisico">22. Patrimônio Físico (Veículos + Imóveis) <span className="badge-new">NOVO</span></a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#fechamento">23. Fechamento Mensal</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#busca">24. Busca Global</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#categorias">25. Categorias</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#atividade">26. Atividade (Feed)</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#configuracoes">27. Configurações</a></li>
            <li style={{ marginBottom: '0.35rem' }}><a href="#atalhos">28. Atalhos e dicas</a></li>
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
            <li>Orçamentos por categoria com alertas automáticos</li>
            <li>Metas financeiras com aportes e prazo</li>
            <li>Parcelamentos e contas recorrentes</li>
            <li>Relatórios, projeções e cenários</li>
            <li>Planejamento mensal e anual</li>
            <li>Controle de patrimônio líquido</li>
            <li>Lista de desejos compartilhada</li>
            <li>Planejamento completo de viagens</li>
            <li>Lista de compras colaborativa com controle de gastos</li>
            <li>Histórico de preços de produtos com análise de variação</li>
            <li>Insights automáticos com análise mensal do comportamento financeiro</li>
            <li>Carteira de investimentos com rentabilidade estimada automática</li>
            <li>Simulador de investimentos com projeção de crescimento e cálculo de aportes</li>
            <li>Busca global unificada em transações, metas, investimentos e orçamentos</li>
            <li>Categorias personalizadas além das categorias padrão</li>
            <li>Fechamento mensal guiado com checklist e aportes em metas</li>
          </ul>
        </div>
        <div className="section-card">
          <h4>Recursos técnicos</h4>
          <ul>
            <li>Acesso via navegador (desktop e mobile)</li>
            <li>Instalável como app (PWA) com suporte offline</li>
            <li>Importação de extratos CSV e OFX</li>
            <li>Exportação de relatórios em PDF</li>
            <li>Modo privado para transações pessoais</li>
            <li>Temas de cor e modo escuro</li>
            <li>Auto-categorização por regras</li>
            <li>Atalhos de teclado completos</li>
            <li>Notificações push de vencimentos</li>
          </ul>
        </div>
      </div>

      {/* 2. Acesso */}
      <div className="page-break" />
      <h2 id="acesso">2. Acesso e Onboarding</h2>
      <h3>2.1 Cadastro e login</h3>
      <p>Acesse o sistema pelo navegador. Na primeira vez, clique em <strong>Criar conta</strong> e informe seu e-mail e senha.</p>

      <h3>2.2 Configuração inicial (Onboarding)</h3>
      <p>Ao fazer login pela primeira vez, o assistente de onboarding guia você em 3 etapas:</p>
      <div className="flow-step"><div className="flow-num">1</div><p><strong>Criar o casal:</strong> Defina um nome para o perfil do casal (ex.: &ldquo;João e Maria&rdquo;). Isso cria o espaço compartilhado.</p></div>
      <div className="flow-step"><div className="flow-num">2</div><p><strong>Primeira conta:</strong> Cadastre sua conta principal (banco, carteira ou cartão) com o saldo inicial atual.</p></div>
      <div className="flow-step"><div className="flow-num">3</div><p><strong>Convidar parceiro(a):</strong> Envie um convite por e-mail ou copie o link de convite para compartilhar. O link expira em 7 dias. Você também pode pular e fazer isso depois em Configurações.</p></div>

      <h3>2.3 Convidar o parceiro</h3>
      <p>Vá em <strong>Configurações → Casal</strong> e use o link de convite para adicionar seu parceiro ao mesmo casal. Após aceitar, ambos passam a ver e lançar transações no mesmo espaço.</p>

      <div className="tip"><p><strong>Dica:</strong> O tour interativo aparece automaticamente na primeira vez. Você pode reiniciá-lo a qualquer momento em <strong>Ajuda → Iniciar tour do sistema</strong>.</p></div>

      {/* 3. Dashboard */}
      <h2 id="dashboard">3. Dashboard</h2>
      <p>Visão geral da situação financeira do casal. Exibe os dados do mês atual e alertas importantes.</p>

      <h3>3.1 Widgets disponíveis</h3>
      <div className="two-col">
        <ul>
          <li><strong>Saldo total:</strong> soma de todas as contas</li>
          <li><strong>Gastos do mês:</strong> com comparação ao mês anterior (Δ%)</li>
          <li><strong>Receitas:</strong> com comparação ao mês anterior</li>
          <li><strong>Disponível:</strong> orçamento − gastos</li>
          <li><strong>Score financeiro:</strong> nota 0–100 (poupança · orçamento · metas)</li>
          <li><strong>Taxa de poupança:</strong> média dos últimos 3 meses</li>
          <li><strong>Gastos por pessoa:</strong> quem gastou mais no casal</li>
        </ul>
        <ul>
          <li><strong>Alertas de orçamento:</strong> categorias acima do limite</li>
          <li><strong>Alertas de saldo baixo:</strong> contas abaixo do mínimo configurado</li>
          <li><strong>Metas em andamento:</strong> progresso das 3 metas mais próximas</li>
          <li><strong>Calendário de compromissos:</strong> parcelas e recorrentes no mês <span className="badge-new">NOVO</span></li>
          <li><strong>Histórico 6 meses:</strong> gráfico de barras receitas vs despesas</li>
          <li><strong>Evolução do saldo:</strong> linha de saldo histórico</li>
          <li><strong>Últimas transações:</strong> 5 mais recentes</li>
          <li><strong>Previsão de saldo 30 dias:</strong> saldo descontando parcelas pendentes</li>
        </ul>
      </div>

      <h3>3.2 Calendário de Compromissos <span className="badge-new">NOVO</span></h3>
      <p>Widget interativo no Dashboard que exibe um calendário mensal com todos os vencimentos do mês:</p>
      <ul>
        <li>Pontinhos <strong style={{ color: '#f87171' }}>vermelhos</strong> = parcelas a pagar</li>
        <li>Pontinhos <strong style={{ color: '#60a5fa' }}>azuis</strong> = contas recorrentes</li>
        <li>Clique em qualquer dia para ver os detalhes dos compromissos</li>
        <li>Use as setas para navegar entre meses</li>
      </ul>

      <h3>3.3 Widgets Personalizáveis <span className="badge-new">NOVO</span></h3>
      <p>Clique no botão <strong>Personalizar</strong> (canto superior direito do Dashboard) para abrir o painel de customização. Você pode mostrar ou ocultar cada seção individualmente. As preferências são salvas no navegador (localStorage) e permanecem entre sessões.</p>

      <h3>3.4 Alerta de vencimentos próximos <span className="badge-new">NOVO</span></h3>
      <p>Ao abrir o Dashboard, o sistema verifica automaticamente se há parcelas ou recorrentes vencendo nos próximos 3 dias e exibe um aviso em destaque. O alerta aparece uma vez por dia para não ser intrusivo.</p>

      <div className="tip"><p><strong>Dica:</strong> Pressione <span className="shortcut">N</span> para nova transação a partir de qualquer tela do sistema.</p></div>

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

      <h3>5.2 Detecção de duplicatas <span className="badge-new">NOVO</span></h3>
      <p>Ao salvar uma transação, o sistema verifica automaticamente se já existe outra com o mesmo valor e tipo nos últimos 2 dias. Se encontrar, exibe um aviso laranja antes de salvar:</p>
      <ul>
        <li>Clique <strong>Cancelar</strong> para não salvar</li>
        <li>Clique <strong>Salvar mesmo assim</strong> se a transação for realmente distinta</li>
      </ul>

      <h3>5.3 Filtros</h3>
      <div className="two-col">
        <ul>
          <li>Por mês ou período personalizado</li>
          <li>Por tipo (entrada / saída / transferência)</li>
          <li>Por categoria e conta</li>
        </ul>
        <ul>
          <li>Busca por descrição ou categoria</li>
          <li>Por tag, privadas, conciliadas</li>
          <li>Por faixa de valor</li>
        </ul>
      </div>

      <h3>5.4 Ações por transação</h3>
      <ul>
        <li><strong>Editar:</strong> altera qualquer campo</li>
        <li><strong>Excluir:</strong> com opção de desfazer nos próximos 5 segundos</li>
        <li><strong>Conciliar:</strong> marca como conferida com o extrato bancário</li>
        <li><strong>Tornar recorrente:</strong> cria uma conta recorrente baseada nela</li>
        <li><strong>Comentar:</strong> adiciona notas e observações</li>
      </ul>

      <h3>5.5 Templates</h3>
      <p>Salve combinações frequentes (tipo + valor + categoria) como templates reutilizáveis. No formulário de nova transação, clique em <strong>Templates</strong> para carregar um preset salvo.</p>

      <h3>5.6 Importação</h3>
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

      <h3>5.7 Auto-categorização por regras</h3>
      <p>Acesse <strong>Regras</strong> na barra de ações da página de Transações para definir padrões de texto → categoria.</p>
      <div className="tip"><p><strong>Exemplo:</strong> qualquer descrição que <em>contém</em> &ldquo;iFood&rdquo; → categoria &ldquo;Alimentação&rdquo;.</p></div>

      {/* 6. Parcelamentos */}
      <div className="page-break" />
      <h2 id="parcelamentos">6. Parcelamentos</h2>
      <p>Controla compras parceladas com acompanhamento individual de cada parcela.</p>
      <ul>
        <li>Crie um parcelamento informando descrição, valor total, número de parcelas e data da 1ª parcela</li>
        <li>O sistema gera as parcelas automaticamente, uma por mês</li>
        <li>Marque cada parcela como paga (lança automaticamente na conta escolhida)</li>
        <li>Parcelas em atraso são destacadas em vermelho</li>
        <li>Reagende parcelas individualmente se necessário</li>
        <li>Cancele parcelas futuras se o parcelamento for quitado antecipadamente</li>
      </ul>
      <p>O <strong>painel de resumo</strong> no topo mostra: dívida total restante, valor que vence no mês e total em atraso. O <strong>gráfico de fluxo</strong> projeta os pagamentos dos próximos 6 meses.</p>

      {/* 7. Pagamentos Fixos */}
      <h2 id="pagamentos-fixos">7. Pagamentos Fixos <span className="badge-new">NOVO</span></h2>
      <p>Seção unificada para todas as despesas fixas mensais. Acesse em <strong>/recurring</strong> e navegue entre as 3 abas: <strong>Recorrentes</strong>, <strong>Assinaturas</strong> e <strong>Compromissos</strong>.</p>

      <h3>7.1 Aba Recorrentes</h3>
      <p>Cadastre contas fixas e qualquer despesa/receita que se repete todo mês.</p>
      <table>
        <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>
        <tbody>
          <tr><td>Nome</td><td>Descrição da conta (ex.: Netflix, Aluguel)</td></tr>
          <tr><td>Valor</td><td>Valor mensal padrão</td></tr>
          <tr><td>Dia de vencimento</td><td>Dia do mês em que vence</td></tr>
          <tr><td>Tipo</td><td>Despesa ou receita</td></tr>
          <tr><td>Categoria</td><td>Agrupamento para orçamentos e relatórios</td></tr>
          <tr><td>Conta padrão</td><td>Conta debitada ao marcar como pago (gera transação automaticamente)</td></tr>
          <tr><td>Data de encerramento</td><td>Quando a recorrente deve parar (opcional)</td></tr>
        </tbody>
      </table>
      <p><strong>Geração automática:</strong> ao abrir a página no início de cada mês, o sistema gera automaticamente as transações das recorrentes ativas ainda não lançadas. O botão <strong>Gerar este mês</strong> dispara manualmente quando necessário.</p>
      <ul>
        <li>Marque como pago mês a mês — gera transação automaticamente na conta vinculada com categoria e tipo corretos</li>
        <li>Pause/retome recorrentes temporariamente sem excluí-las</li>
        <li>O mini-histórico (últimos 3 meses) mostra quais meses foram pagos</li>
      </ul>

      <h3>7.2 Aba Assinaturas</h3>
      <p>Controle específico para assinaturas digitais (streaming, SaaS, academias).</p>
      <ul>
        <li>Cadastre nome, valor, ciclo de cobrança (mensal, anual, trimestral) e data de renovação</li>
        <li>Ative/desative assinaturas sem excluir o histórico</li>
        <li>Cards coloridos com logo da categoria para identificação rápida</li>
        <li>Resumo de custo mensal total e custo anual projetado</li>
      </ul>

      <h3>7.3 Aba Compromissos</h3>
      <p>Visão consolidada de todos os compromissos financeiros fixos do casal — une recorrentes e assinaturas em uma tabela única ordenada por valor, com total mensal e anual.</p>
      <div className="tip"><p><strong>Dica:</strong> use a aba Compromissos para ter uma visão rápida de quanto o casal comprometeu em despesas fixas antes de assumir novos gastos.</p></div>

      {/* 8. Atividades */}
      <div className="page-break" />
      <h2 id="atividades">8. Atividades (Tarefas + Lembretes) <span className="badge-new">NOVO</span></h2>
      <p>Seção unificada para organização de tarefas do casal e lembretes financeiros. Acesse em <strong>/tasks</strong> e alterne entre as abas <strong>Tarefas</strong> e <strong>Lembretes</strong>.</p>

      <h3>8.1 Aba Tarefas</h3>
      <p>Lista de tarefas colaborativa compartilhada entre os parceiros.</p>
      <ul>
        <li>Crie tarefas com título, descrição, prioridade (baixa, média, alta, urgente) e prazo</li>
        <li>Atribua uma tarefa a um membro específico do casal</li>
        <li>Status: <em>a fazer</em>, <em>em andamento</em>, <em>concluída</em></li>
        <li>Filtre por responsável, prioridade ou status</li>
        <li>Tarefas podem ser sincronizadas com o Google Calendar (ver seção 12)</li>
      </ul>
      <div className="tip"><p><strong>Badge no menu:</strong> o item &ldquo;Atividades&rdquo; no sidebar exibe uma contagem vermelha com o número de tarefas pendentes + lembretes atrasados.</p></div>

      <h3>8.2 Aba Lembretes</h3>
      <p>Lembretes financeiros com data de vencimento e prioridade.</p>
      <ul>
        <li>Campos: título, descrição, data de vencimento, prioridade (baixa, média, alta, urgente), status (pendente, concluído)</li>
        <li>Lembretes vencidos aparecem destacados em vermelho</li>
        <li>Lembretes com vencimento nos próximos 3 dias geram notificação push automaticamente</li>
        <li>Marque como concluído para arquivar sem excluir</li>
      </ul>

      {/* 9. Orçamentos */}
      <div className="page-break" />
      <h2 id="orcamentos">9. Orçamentos</h2>

      <p>Define limites de gasto por categoria para o mês. O sistema monitora automaticamente e envia alertas.</p>

      <h3>8.1 Criando orçamentos</h3>
      <p>Clique em <strong>Definir Orçamento</strong>, selecione a categoria, o valor limite e o <strong>percentual de alerta</strong> (padrão 80%). Quando o gasto atingir esse limiar, um alerta aparece no Dashboard e na página de Orçamentos.</p>

      <h3>8.2 Automações</h3>
      <ul>
        <li><strong>Copiar do mês anterior:</strong> replica todos os orçamentos do mês passado para o atual</li>
        <li><strong>Rollover:</strong> transfere os saldos não utilizados do mês anterior para o atual</li>
        <li><strong>Sugerir com IA:</strong> calcula a média dos últimos 3 meses por categoria e sugere orçamentos</li>
      </ul>

      <h3>8.3 Acompanhamento</h3>
      <p>Cada categoria exibe uma barra de progresso: verde (abaixo do limite), amarelo (próximo do alerta), vermelho (extrapolado). O card também mostra o <strong>ritmo de gasto</strong> — se você está gastando mais rápido do que o mês permite.</p>

      {/* 9. Metas */}
      <h2 id="metas">10. Metas</h2>
      <p>Acompanhe o progresso de objetivos financeiros: reserva de emergência, entrada de imóvel, viagem, etc.</p>

      <h3>9.1 Criando uma meta</h3>
      <ul>
        <li><strong>Nome:</strong> ex. &ldquo;Reserva de emergência&rdquo;</li>
        <li><strong>Valor alvo:</strong> quanto quer acumular</li>
        <li><strong>Prazo:</strong> data limite (opcional)</li>
        <li><strong>Conta vinculada:</strong> usa o saldo dessa conta como progresso (opcional)</li>
      </ul>

      <h3>9.2 Aportes manuais</h3>
      <p>Se a meta não está vinculada a uma conta, clique em <strong>Aportar</strong> para registrar valores guardados. O histórico completo de aportes fica visível em cada meta com data e observação.</p>

      <h3>9.3 Alertas e projeções</h3>
      <ul>
        <li>Quando o prazo está a 30 dias ou menos, um banner de alerta aparece no topo da página</li>
        <li>O sistema calcula quanto você precisa poupar por mês para atingir a meta no prazo</li>
        <li>A <strong>data projetada de conclusão</strong> é calculada com base na taxa média de aportes</li>
      </ul>

      <div className="tip"><p><strong>Meta concluída:</strong> ao atingir 100% do valor alvo, o card exibe destaque especial.</p></div>

      {/* 10. Linha do Tempo */}
      <div className="page-break" />
      <h2 id="timeline">11. Linha do Tempo</h2>
      <p>Exibe os próximos vencimentos em ordem cronológica — parcelas e recorrentes juntas — para você planejar o fluxo de caixa dos próximos dias.</p>
      <ul>
        <li>Selecione o horizonte: 7, 15, 30 ou 60 dias</li>
        <li>Cada dia mostra o total de compromissos e a soma dos valores</li>
        <li>Parcelas e recorrentes exibem o valor e a conta associada</li>
        <li>Hoje e amanhã são destacados em vermelho e laranja</li>
      </ul>

      {/* 12. Agenda + Google Calendar */}
      <h2 id="agenda">12. Agenda + Google Calendar <span className="badge-new">NOVO</span></h2>
      <p>Visualize todos os eventos financeiros do mês em uma agenda integrada com o Google Calendar.</p>

      <h3>12.1 Calendário financeiro</h3>
      <p>A agenda exibe automaticamente:</p>
      <ul>
        <li><strong>Parcelas a vencer</strong> — dias marcados com ponto rosa</li>
        <li><strong>Contas recorrentes</strong> — dias marcados com ponto laranja</li>
        <li><strong>Tarefas com prazo</strong> — dias marcados com cor por prioridade</li>
        <li>Clique em qualquer dia para ver a lista detalhada de eventos</li>
        <li>Navegue entre meses pelas setas ← →</li>
      </ul>

      <h3>12.2 Sincronizar com Google Calendar <span className="badge-new">NOVO</span></h3>
      <p>Clique em <strong>↺ Sincronizar</strong> no topo da página Agenda para enviar todos os eventos financeiros para o seu Google Calendar.</p>
      <div className="two-col">
        <div className="section-card">
          <h4>O que é sincronizado</h4>
          <ul>
            <li>Parcelas não pagas → eventos todo-dia (rosa)</li>
            <li>Contas recorrentes → eventos todo-dia (laranja)</li>
            <li>Tarefas → eventos todo-dia (cor por prioridade)</li>
          </ul>
        </div>
        <div className="section-card">
          <h4>Como funciona</h4>
          <ul>
            <li>Duplicatas são detectadas automaticamente — sincronizar novamente não cria eventos duplicados</li>
            <li>Exige conexão com Google (autorize em Configurações → Google Calendar)</li>
            <li>Atualiza todos os eventos em lote na mesma operação</li>
          </ul>
        </div>
      </div>

      <h3>12.3 Conectar Google Calendar</h3>
      <p>Acesse <strong>Configurações</strong> e na seção <strong>Google Calendar</strong> clique em <strong>Conectar com Google</strong>. Autorize o acesso ao calendário. A partir daí o botão Sincronizar ficará disponível na Agenda.</p>
      <div className="tip"><p><strong>Dica:</strong> sincronize no início de cada mês para ter todos os vencimentos visíveis no calendário do celular com alertas nativos do Google.</p></div>

      {/* 13. Projeção */}
      <h2 id="projecao">13. Projeção Financeira</h2>

      <p>Simula o saldo futuro com base na média histórica e nos dados cadastrados. Totalmente interativa.</p>

      <h3>11.1 Horizonte de projeção <span className="badge-new">NOVO</span></h3>
      <p>Selecione quantos meses projetar: <strong>3 meses</strong>, <strong>6 meses</strong> ou <strong>12 meses</strong>. Para horizontes maiores (6m/12m), o sistema também exibe o total acumulado de receitas, despesas e saldo projetado.</p>

      <h3>11.2 Simulador de cenários <span className="badge-new">NOVO</span></h3>
      <p>Clique em <strong>Simulador de cenários</strong> para exibir sliders interativos:</p>
      <ul>
        <li><strong>Receita:</strong> ajuste de −50% a +50% em relação à média histórica</li>
        <li><strong>Despesas:</strong> ajuste de −50% a +50% em relação à média histórica</li>
        <li>Os gráficos e valores atualizam em tempo real conforme você move os sliders</li>
        <li>Clique em <em>Resetar para base</em> para voltar à projeção padrão</li>
      </ul>
      <div className="tip"><p><strong>Exemplo de uso:</strong> simule o que acontece se sua receita cair 20% ou se as despesas subirem 30%. Ótimo para planejar antes de mudar de emprego ou assumir um novo compromisso.</p></div>

      <h3>11.3 Projeção por meta <span className="badge-new">NOVO</span></h3>
      <p>No painel <strong>Projeção por meta</strong> (abaixo dos gráficos mensais), cada meta ativa exibe:</p>
      <ul>
        <li>Progresso atual (barra e %)</li>
        <li>Estimativa de <strong>quantos meses</strong> faltam para atingir o valor alvo no ritmo atual</li>
        <li>Mês e ano projetado de conclusão</li>
        <li>Aviso em laranja se a projeção estoura o prazo definido na meta</li>
      </ul>
      <div className="info"><p>A projeção usa a economia mensal do cenário atual (receita ajustada − despesa ajustada). Mova os sliders para simular diferentes ritmos de poupança.</p></div>

      {/* 12. Planejamento */}
      <h2 id="planejamento">14. Planejamento</h2>
      <p>Aloca o orçamento mensal por categoria antes que o mês comece — semelhante ao método de envelope.</p>

      <h3>12.1 Planejamento mensal</h3>
      <p>Para cada categoria, defina quanto planeja gastar. O sistema mostra em tempo real a diferença entre o planejado e o gasto real. Use <strong>Copiar do mês anterior</strong> para reutilizar o planejamento.</p>

      <h3>12.2 Planejamento anual</h3>
      <p>Alterne para a aba <strong>Anual</strong> para ver todos os 12 meses em um grid com valor planejado, gasto real e barra de progresso.</p>

      <h3>12.3 Calculadoras</h3>
      <div className="two-col">
        <div className="section-card">
          <h4>Fundo de emergência</h4>
          <p>Calcula quanto você precisa poupar com base no seu gasto mensal médio e no número de meses desejado de cobertura.</p>
        </div>
        <div className="section-card">
          <h4>Simulador de financiamento</h4>
          <p>Simula o valor da parcela mensal com base no valor total, taxa de juros e número de meses.</p>
        </div>
      </div>

      {/* 13. Patrimônio */}
      <div className="page-break" />
      <h2 id="patrimonio">15. Patrimônio Líquido</h2>
      <p>Calcula e acompanha o patrimônio líquido do casal ao longo do tempo.</p>
      <ul>
        <li><strong>Ativos:</strong> soma de todos os saldos positivos nas contas</li>
        <li><strong>Passivos:</strong> dívidas de cartão de crédito e contas com saldo negativo</li>
        <li><strong>Patrimônio líquido:</strong> ativos − passivos</li>
        <li>Gráfico histórico de evolução (snapshots mensais)</li>
        <li>Salve snapshots mensais manualmente para comparação ao longo do tempo</li>
        <li>Seção de metas mostra o total já guardado em todas as metas</li>
      </ul>

      {/* 16. Listas */}
      <h2 id="wishlist">16. Listas (Desejos + Compras) <span className="badge-new">NOVO</span></h2>
      <p>Seção unificada para listas colaborativas. Acesse em <strong>/wishlist</strong> e navegue entre as abas <strong>Desejos</strong> e <strong>Compras</strong>.</p>

      <h3>16.1 Aba Desejos (Lista de Desejos)</h3>
      <p>Espaço para listar compras e objetivos futuros para discussão e votação antes de comprar.</p>
      <ul>
        <li>Adicione itens com nome, valor estimado, prioridade e link do produto</li>
        <li>Cada parceiro pode votar: 👍 aprovar ou 👎 reprovar</li>
        <li>Itens aprovados pelos dois ficam em destaque</li>
        <li>Marque como comprado para mover para o histórico</li>
      </ul>
      <div className="tip"><p><strong>Dica financeira:</strong> use a Lista de Desejos como filtro anti-impulso. Se o item não tiver votos positivos de ambos após 1 semana, talvez não valha a pena.</p></div>

      <h3>16.2 Aba Compras (Lista de Compras)</h3>
      <p>Listas de compras colaborativas com preços estimados e controle do que já foi pego.</p>
      <ul>
        <li>Crie listas com nome e orçamento opcional. Itens agrupados por categoria (hortifruti, limpeza, carnes…)</li>
        <li>Campos: item, quantidade, unidade, preço estimado, categoria</li>
        <li>Durante as compras: toque no círculo para marcar como pego e registrar o preço real pago</li>
        <li>Barra de progresso mostra % dos itens marcados; total gasto real vs. estimado em tempo real</li>
        <li>Alerta quando o gasto real supera o orçamento definido</li>
        <li>Clique em <strong>Finalizar</strong> para arquivar com o total gasto; histórico fica disponível para consulta</li>
      </ul>

      {/* 17. Relatórios */}
      <h2 id="relatorios">17. Relatórios</h2>
      <p>Análise visual e detalhada das finanças com múltiplas perspectivas.</p>

      <h3>15.1 Visões disponíveis</h3>
      <table>
        <thead><tr><th>Visão</th><th>O que mostra</th></tr></thead>
        <tbody>
          <tr><td>Mensal</td><td>Receitas, despesas e saldo do mês; gráfico de pizza por categoria; breakdown por pessoa e por tag</td></tr>
          <tr><td>Anual</td><td>Totais de receita e despesa por mês em barras; ranking de categorias; drill-down por categoria</td></tr>
          <tr><td>Comparar</td><td>Dois meses lado a lado: receita, despesa, saldo e diferença por categoria (Δ e Δ%)</td></tr>
          <tr><td>Tendência</td><td>Linha de gasto das top categorias nos últimos 6 meses</td></tr>
        </tbody>
      </table>

      <h3>17.2 Exportar PDF <span className="badge-new">NOVO</span></h3>
      <p>Duas formas de exportar:</p>
      <ul>
        <li><strong>Botão &ldquo;Exportar PDF&rdquo;</strong> no Dashboard — gera um relatório completo do mês atual em uma nova aba otimizada para impressão, com resumo, gastos por categoria, parcelamentos, recorrentes e progresso de metas.</li>
        <li><strong>Imprimir / PDF</strong> em qualquer visão de Relatórios — remove menu e botões automaticamente via CSS, gerando um documento limpo.</li>
      </ul>

      {/* 18. Viagens */}
      <div className="page-break" />
      <h2 id="viagens">18. Viagens</h2>
      <p>Módulo completo de planejamento de viagens: orçamento, roteiro, checklist, companheiros e muito mais.</p>

      <h3>16.1 Criando uma viagem</h3>
      <p>Clique em <strong>Nova viagem</strong> e preencha nome, destino, datas e orçamento total. Você pode vincular a viagem a uma <strong>meta financeira</strong> existente para acompanhar o progresso da poupança.</p>

      <h3>16.2 Abas de cada viagem</h3>
      <table>
        <thead><tr><th>Aba</th><th>Funcionalidade</th></tr></thead>
        <tbody>
          <tr><td>Orçamento</td><td>Registre gastos por categoria (transporte, hospedagem, alimentação...). Veja gasto real vs. orçamento com barra de progresso. Suporta referência de reserva (booking ref).</td></tr>
          <tr><td>Locais</td><td>Adicione lugares para visitar com nome, endereço e link do Maps. Botão para abrir rota direto no Google Maps.</td></tr>
          <tr><td>Checklist</td><td>Lista de itens para levar/fazer. Marque como concluído conforme prepara a viagem.</td></tr>
          <tr><td>Companheiros</td><td>Liste quem vai na viagem com nome e contato. Útil para viagens em grupo.</td></tr>
          <tr><td>Roteiro</td><td>Organize as atividades dia a dia. Vincule locais já cadastrados ao itinerário. Defina hora de início/fim.</td></tr>
          <tr><td>Notas</td><td>Diário da viagem com auto-save. Escreva anotações por dia, memórias e observações.</td></tr>
          <tr><td>Arquivos</td><td>Anexe documentos, passagens, vouchers e fotos (armazenamento no Supabase Storage).</td></tr>
          <tr><td>Hoje</td><td>Visão do dia atual: atividades do roteiro de hoje, previsão do tempo no destino e espaço para notas diárias.</td></tr>
        </tbody>
      </table>

      <h3>16.3 Funcionalidades extras</h3>
      <div className="two-col">
        <ul>
          <li><strong>Tags:</strong> categorize viagens por tipo (praia, negócios, aventura...)</li>
          <li><strong>Arquivar:</strong> mova viagens concluídas para o arquivo sem excluir</li>
          <li><strong>Duplicar:</strong> clone uma viagem como base para outra similar</li>
          <li><strong>Compartilhar:</strong> gere um link público de visualização (somente leitura)</li>
        </ul>
        <ul>
          <li><strong>Exportar PDF:</strong> relatório completo da viagem com todos os dados</li>
          <li><strong>Google Calendar:</strong> exporte as datas da viagem para o calendário (.ics)</li>
          <li><strong>Reordenar:</strong> arraste as viagens para organizar por prioridade</li>
          <li><strong>Busca:</strong> filtre viagens por nome ou destino</li>
        </ul>
      </div>

      <h3>16.4 Painel de estatísticas</h3>
      <p>Clique em <strong>Estatísticas</strong> no topo da página para ver um resumo de todas as suas viagens: total de viagens, orçamento total, destinos mais visitados e lista de países. Clique em um destino para filtrar apenas as viagens para aquele lugar.</p>

      {/* 19. Histórico de Preços */}
      <div className="page-break" />
      <h2 id="precos">19. Histórico de Preços</h2>
      <p>Monitore como os preços dos produtos que você compra regularmente evoluem ao longo do tempo. Detecte aumentos e encontre o melhor estabelecimento para cada item.</p>

      <h3>18.1 Registrando um preço</h3>
      <p>Clique em <strong>Registrar preço</strong> e preencha:</p>
      <table>
        <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>
        <tbody>
          <tr><td>Item</td><td>Nome do produto. O campo sugere itens já registrados automaticamente.</td></tr>
          <tr><td>Preço</td><td>Valor total pago</td></tr>
          <tr><td>Qtd / unidade</td><td>Ex.: 5 kg, 1 L — permite calcular preço por unidade para comparação</td></tr>
          <tr><td>Estabelecimento</td><td>Nome do mercado ou posto (opcional)</td></tr>
          <tr><td>Categoria</td><td>Combustível, Mercado, Farmácia… (opcional)</td></tr>
          <tr><td>Data</td><td>Data da compra (padrão: hoje)</td></tr>
        </tbody>
      </table>

      <h3>18.2 Cards de resumo</h3>
      <p>Cada produto monitorado exibe um card com:</p>
      <ul>
        <li>Último preço registrado e data</li>
        <li>Variação percentual em relação ao registro anterior (<span style={{ color: '#dc2626' }}>↑ vermelho</span> = aumento, <span style={{ color: '#16a34a' }}>↓ verde</span> = queda)</li>
        <li>Preço por unidade quando a quantidade é maior que 1</li>
        <li>Total de registros históricos daquele item</li>
      </ul>

      <h3>18.3 Histórico completo</h3>
      <p>Abaixo dos cards, a tabela completa exibe todos os registros em ordem cronológica decrescente com produto, estabelecimento, data e valor. Ideal para responder: &ldquo;o combustível subiu mesmo ou é impressão?&rdquo;</p>
      <div className="info"><p>Dica de uso: registre o preço do combustível e do mercado mensalmente para ter uma visão clara do impacto da inflação no seu orçamento doméstico.</p></div>

      {/* 19. Insights */}
      <h2 id="insights">20. Insights</h2>
      <p>Análises automáticas geradas pelo sistema com base nas suas transações dos últimos 6 meses — sem nenhuma configuração necessária.</p>

      <h3>19.1 Análises geradas automaticamente</h3>
      <div className="two-col">
        <div className="section-card">
          <h4>Comparação mensal</h4>
          <ul>
            <li>Gastos X% acima ou abaixo do mês anterior</li>
            <li>Taxa de poupança melhorou ou caiu</li>
            <li>Gastos acima da média dos últimos 3 meses</li>
          </ul>
        </div>
        <div className="section-card">
          <h4>Categorias</h4>
          <ul>
            <li>Maior categoria de gasto do mês com % da receita</li>
            <li>Categoria que mais aumentou vs. mês anterior</li>
            <li>Breakdown com barra e variação % de cada categoria</li>
          </ul>
        </div>
        <div className="section-card">
          <h4>Conquistas e alertas</h4>
          <ul>
            <li>Melhor mês dos últimos 6 (maior poupança)</li>
            <li>Sequência de meses consecutivos no positivo</li>
            <li>Possível assinatura não cadastrada como recorrente</li>
          </ul>
        </div>
        <div className="section-card">
          <h4>Visão histórica</h4>
          <ul>
            <li>Tabela mensal: receita, despesa, saldo e barra visual</li>
            <li>Últimos 6 meses lado a lado para identificar tendências</li>
          </ul>
        </div>
      </div>

      <h3>19.2 Cores dos insights</h3>
      <table>
        <thead><tr><th>Cor</th><th>Significado</th></tr></thead>
        <tbody>
          <tr><td>🟢 Verde</td><td>Boas notícias — poupança aumentou, gastos caíram</td></tr>
          <tr><td>🟡 Amarelo</td><td>Alerta — gastos subiram, taxa de poupança caiu</td></tr>
          <tr><td>🔵 Azul</td><td>Informativo — fatos sobre o mês sem conotação positiva/negativa</td></tr>
          <tr><td>🟣 Roxo</td><td>Recorde — melhor resultado histórico</td></tr>
        </tbody>
      </table>
      <div className="tip"><p><strong>Dica:</strong> os Insights são mais ricos quanto mais meses de dados você tiver. A partir de 2 meses de transações já começam a aparecer as primeiras análises comparativas.</p></div>

      {/* 20. Investimentos */}
      <div className="page-break" />
      <h2 id="investments">21. Investimentos + Simulador</h2>
      <p>Seção unificada para carteira e planejamento de investimentos. Acesse em <strong>/investments</strong> e alterne entre as abas <strong>Carteira</strong> e <strong>Simulador</strong>.</p>
      <p>Cadastre e acompanhe toda a carteira de investimentos do casal com rentabilidade estimada automática e alertas de vencimento.</p>

      <h3>21.1 Tipos de investimento suportados</h3>
      <div className="three-col">
        <div className="section-card">
          <h4>Renda Fixa</h4>
          <ul>
            <li>CDB</li>
            <li>LCI / LCA</li>
            <li>Poupança</li>
            <li>Tesouro SELIC</li>
            <li>Tesouro IPCA+</li>
            <li>Tesouro Prefixado</li>
          </ul>
        </div>
        <div className="section-card">
          <h4>Renda Variável / Fundos</h4>
          <ul>
            <li>Ações</li>
            <li>FIIs</li>
            <li>ETFs / BDRs</li>
            <li>Fundo DI</li>
            <li>Fundo Multimercado</li>
            <li>Fundo de Ações</li>
          </ul>
        </div>
        <div className="section-card">
          <h4>Outros</h4>
          <ul>
            <li>PGBL / VGBL</li>
            <li>Criptomoedas</li>
            <li>Outro (livre)</li>
          </ul>
        </div>
      </div>

      <h3>21.2 Cadastrando um investimento</h3>
      <p>Clique em <strong>Novo investimento</strong> e preencha:</p>
      <table>
        <thead><tr><th>Campo</th><th>Descrição</th></tr></thead>
        <tbody>
          <tr><td>Tipo</td><td>Categoria do investimento (CDB, Tesouro SELIC, FII…)</td></tr>
          <tr><td>Nome</td><td>Identificação livre (ex.: &ldquo;CDB Nubank 102% CDI&rdquo;)</td></tr>
          <tr><td>Banco / Corretora</td><td>Onde o investimento está custodiado</td></tr>
          <tr><td>Valor investido</td><td>Total aportado até o momento</td></tr>
          <tr><td>Valor atual</td><td>Saldo atual — deixe em branco para usar estimativa automática</td></tr>
          <tr><td>Tipo de rentabilidade</td><td>% CDI, % SELIC, IPCA+, taxa fixa % a.a.</td></tr>
          <tr><td>Taxa</td><td>Ex.: 102 (para 102% CDI) ou 5,5 (para IPCA+5,5%)</td></tr>
          <tr><td>Data de início</td><td>Quando o aporte foi feito</td></tr>
          <tr><td>Vencimento</td><td>Data de resgate obrigatório (renda fixa)</td></tr>
          <tr><td>Liquidez</td><td>Diária, D+30, no vencimento, etc.</td></tr>
          <tr><td>Meta vinculada</td><td>Associa o investimento a uma meta financeira</td></tr>
        </tbody>
      </table>

      <h3>21.3 Rentabilidade estimada automática</h3>
      <p>Para investimentos de renda fixa com taxa informada, o sistema calcula automaticamente o rendimento estimado usando taxas em tempo real obtidas do <strong>Banco Central do Brasil</strong> (API pública). O painel exibe o badge <em>&ldquo;● Dados em tempo real&rdquo;</em> quando a consulta é bem-sucedida.</p>
      <table>
        <thead><tr><th>Índice</th><th>Fonte</th><th>Onde se aplica</th></tr></thead>
        <tbody>
          <tr><td>SELIC</td><td>BCB série 432 (atualizada diariamente)</td><td>Tesouro SELIC, % SELIC</td></tr>
          <tr><td>CDI</td><td>BCB série 4391 (atualizada diariamente)</td><td>CDB, LCI, LCA, Fundo DI</td></tr>
          <tr><td>IPCA 12m</td><td>BCB série 13522 (atualizada mensalmente)</td><td>Tesouro IPCA+</td></tr>
        </tbody>
      </table>
      <div className="info"><p>As taxas são cacheadas por 24 horas. Se a API do BCB estiver indisponível, o sistema usa os últimos valores conhecidos como fallback.</p></div>
      <div className="info"><p>Investimentos de renda variável (ações, FIIs, cripto) não têm estimativa automática — atualize o valor atual manualmente pelo botão <strong>↺</strong> de cada item.</p></div>

      <h3>21.4 Painel de resumo</h3>
      <ul>
        <li><strong>Total investido:</strong> soma de todos os aportes ativos</li>
        <li><strong>Valor atual (est.):</strong> soma de valores atuais informados + estimativas de renda fixa</li>
        <li><strong>Rendimento total:</strong> diferença em R$ e % desde o início</li>
        <li><strong>Rendimento/mês:</strong> estimativa de quanto a renda fixa rende mensalmente</li>
      </ul>

      <h3>21.5 Alocação por categoria</h3>
      <p>Barras coloridas mostram a proporção de cada grupo (Renda Fixa, Renda Variável, Fundos, Previdência) em relação ao total investido. Útil para verificar se a carteira está diversificada conforme o planejado.</p>

      <h3>21.6 Alertas de vencimento</h3>
      <p>Investimentos de renda fixa com vencimento nos próximos <strong>60 dias</strong> aparecem em um painel amarelo de destaque. Cada item mostra quantos dias faltam para ajudar a planejar o reinvestimento.</p>

      <h3>21.7 Atualizar valor e arquivar</h3>
      <ul>
        <li>Clique no botão <strong>↺</strong> ao lado de qualquer investimento para informar o valor atual e registrar a data da atualização</li>
        <li>Use o botão <strong>📦</strong> para arquivar investimentos encerrados sem perder o histórico</li>
        <li>Investimentos arquivados ficam visíveis numa seção colapsada no final da página</li>
      </ul>

      <h3>21.8 Aba Simulador</h3>
      <p>Alterne para a aba <strong>Simulador</strong> dentro de Investimentos para projetar crescimento ou calcular o aporte necessário para atingir um objetivo.</p>
      <div className="two-col">
        <div className="section-card">
          <h4>Modo &ldquo;Quanto terei?&rdquo;</h4>
          <p>Informe valor inicial, aporte mensal, taxa de juros (preset CDI/SELIC/IPCA+ ou personalizada) e período em anos. O resultado exibe total investido, rendimento acumulado, valor final e uma tabela de evolução anual.</p>
        </div>
        <div className="section-card">
          <h4>Modo &ldquo;Quanto investir?&rdquo;</h4>
          <p>Informe o objetivo, valor já acumulado, taxa e prazo. O simulador retorna o aporte mensal necessário e uma tabela comparativa com 6 taxas de referência (Poupança, CDI 100%/110%, SELIC, IPCA+5%/6%).</p>
        </div>
      </div>
      <div className="tip"><p><strong>Dica:</strong> use o modo &ldquo;Quanto investir?&rdquo; junto com a página de Metas — calcule o aporte necessário no simulador e registre-o como aporte recorrente mensal na meta correspondente.</p></div>

      {/* 22. Patrimônio Físico */}
      <div className="page-break" />
      <h2 id="patrimonio-fisico">22. Patrimônio Físico <span className="badge-new">NOVO</span></h2>
      <p>Controle de veículos e imóveis do casal em uma seção unificada. Acesse em <strong>/vehicles</strong> e alterne entre as abas <strong>Veículos</strong> e <strong>Imóveis</strong>.</p>

      <h3>22.1 Veículos</h3>
      <p>Controle manutenções, custos e histórico de cada carro ou moto do casal com alertas automáticos por KM e por data.</p>
      <ul>
        <li><strong>Cadastro:</strong> nome/apelido, marca, modelo, ano, placa, combustível, KM atual e cor (14 opções visuais)</li>
        <li><strong>Manutenções:</strong> 25 tipos predefinidos (troca de óleo, pneus, freios, correia, IPVA, seguro, abastecimento…) com data, KM no serviço, valor, próximo KM e próxima data</li>
      </ul>
      <div className="two-col">
        <div className="section-card">
          <h4>🟡 Em breve</h4>
          <p>Próxima manutenção em até 30 dias ou dentro de 1.000 km do KM atual.</p>
        </div>
        <div className="section-card">
          <h4>🔴 Atrasada</h4>
          <p>Data ou KM de retorno já ultrapassados — card com borda vermelha e badge de alerta.</p>
        </div>
      </div>
      <div className="tip"><p><strong>Dica:</strong> registre IPVA, licenciamento e seguro como manutenções para ter o custo anual real de cada veículo e receber alertas de vencimento.</p></div>

      <h3>22.2 Imóveis</h3>
      <p>Gerencie imóveis do casal — manutenções residenciais, reformas, IPTU, garantias e valorização patrimonial.</p>
      <ul>
        <li><strong>Cadastro:</strong> tipo (Casa, Apartamento, Terreno, Comercial, Sítio…), valor de compra, valor atual estimado (calcula % de valorização), IPTU anual, condomínio mensal, endereço e área em m²</li>
        <li><strong>Manutenções:</strong> 22 tipos predefinidos (pintura, hidráulica, elétrica, telhado, dedetização, IPTU, seguro residencial, reforma…) com status (Concluído / Agendado / Em orçamento), prioridade (Baixa / Média / Alta / Urgente) e data de garantia do serviço</li>
      </ul>
      <table>
        <thead><tr><th>Prioridade</th><th>Efeito visual</th></tr></thead>
        <tbody>
          <tr><td>Alta</td><td>Destaque amarelo no histórico</td></tr>
          <tr><td>Urgente</td><td>Card vermelho imediatamente, independente de datas</td></tr>
        </tbody>
      </table>
      <div className="tip"><p><strong>Dica:</strong> use status &ldquo;Em orçamento&rdquo; para registrar cotações antes de contratar — mantém o histórico de preços sem poluir as manutenções concluídas.</p></div>

      {/* 23. Fechamento Mensal */}
      <div className="page-break" />
      <h2 id="fechamento">23. Fechamento Mensal <span className="badge-new">NOVO</span></h2>
      <p>Página guiada para encerrar o mês de forma organizada. Acesse em <strong>/monthly-close</strong> (link no sidebar). O sistema sempre exibe os dados do mês anterior.</p>

      <h3>23.1 Resumo financeiro</h3>
      <p>Cards com os números consolidados do mês: receitas, despesas, saldo e taxa de poupança. A taxa de poupança é destacada em verde (≥ 20%), azul (≥ 10%) ou vermelho (&lt; 10%).</p>

      <h3>23.2 Checklist de fechamento</h3>
      <p>Lista de verificações automáticas que o sistema executa para indicar se o mês foi gerido bem:</p>
      <table>
        <thead><tr><th>Item</th><th>Condição para ✅</th></tr></thead>
        <tbody>
          <tr><td>Transações registradas</td><td>Pelo menos 1 transação lançada no mês</td></tr>
          <tr><td>Saldo positivo</td><td>Receitas &gt; Despesas</td></tr>
          <tr><td>Taxa de poupança saudável</td><td>Taxa ≥ 10%</td></tr>
          <tr><td>Orçamentos respeitados</td><td>Nenhuma categoria acima do limite</td></tr>
          <tr><td>Parcelas do mês pagas</td><td>Nenhuma parcela vencida em aberto</td></tr>
        </tbody>
      </table>
      <div className="tip"><p><strong>Dica:</strong> quando todos os itens estão marcados, aparece uma mensagem de parabéns confirmando o fechamento com sucesso.</p></div>

      <h3>23.3 Aportes rápidos em metas</h3>
      <p>Clique em <strong>Registrar aportes nas metas</strong> para expandir o painel. Para cada meta em andamento você pode digitar o valor e clicar em <strong>Aportar</strong> — o sistema atualiza o saldo da meta e registra no histórico sem sair da página.</p>

      <h3>23.4 Visão de orçamentos e categorias</h3>
      <ul>
        <li>Barras coloridas mostrando as 5 maiores categorias de despesa do mês</li>
        <li>Orçamentos excedidos destacados em vermelho com o valor extrapolado</li>
        <li>Orçamentos respeitados listados com barra de progresso</li>
        <li>Parcelas vencidas não pagas listadas por nome e valor</li>
      </ul>

      {/* 24. Busca Global */}
      <h2 id="busca">24. Busca Global <span className="badge-new">NOVO</span></h2>
      <p>Encontre qualquer registro do sistema sem precisar navegar página por página.</p>

      <h3>24.1 Como acessar</h3>
      <ul>
        <li>Pressione <span className="shortcut">⌘K</span> (Mac) ou <span className="shortcut">Ctrl+K</span> (Windows) de qualquer página</li>
        <li>Clique no ícone de lupa no cabeçalho</li>
      </ul>

      <h3>24.2 O que é buscado</h3>
      <table>
        <thead><tr><th>Tipo</th><th>Campo pesquisado</th><th>Informação exibida</th></tr></thead>
        <tbody>
          <tr><td>Transação</td><td>Descrição</td><td>Tipo · Data · Categoria · Valor</td></tr>
          <tr><td>Meta</td><td>Nome</td><td>% concluída · Valor alvo</td></tr>
          <tr><td>Investimento</td><td>Nome</td><td>Tipo · Status (ativo/arquivado) · Valor investido</td></tr>
          <tr><td>Orçamento</td><td>Categoria</td><td>Mês de referência · Valor orçado</td></tr>
        </tbody>
      </table>

      <h3>24.3 Navegação por teclado</h3>
      <ul>
        <li><span className="shortcut">↑ ↓</span> — navegar pelos resultados</li>
        <li><span className="shortcut">Enter</span> — abrir a página do resultado selecionado</li>
        <li><span className="shortcut">Esc</span> — fechar a busca</li>
      </ul>
      <div className="info"><p>A busca tem debounce de 300ms e retorna até 8 transações, 5 metas, 5 investimentos e 4 orçamentos por consulta.</p></div>

      {/* 25. Categorias */}
      <h2 id="categorias">25. Categorias <span className="badge-new">NOVO</span></h2>
      <p>O sistema inclui categorias padrão (Alimentação, Transporte, Saúde, etc.) e permite criar categorias personalizadas para o casal.</p>

      <h3>25.1 Acessando</h3>
      <p>Acesse pelo sidebar em <strong>Categorias</strong>, ou pelo botão <strong>Categorias</strong> na página de Transações.</p>

      <h3>25.2 Criando uma categoria personalizada</h3>
      <div className="flow-step"><div className="flow-num">1</div><p>Clique em <strong>Gerenciar Categorias</strong></p></div>
      <div className="flow-step"><div className="flow-num">2</div><p>Digite o nome (ex.: &ldquo;Pets&rdquo;, &ldquo;Academia do João&rdquo;)</p></div>
      <div className="flow-step"><div className="flow-num">3</div><p>Escolha uma cor e se é <strong>Saída</strong> (despesa) ou <strong>Entrada</strong> (receita)</p></div>
      <div className="flow-step"><div className="flow-num">4</div><p>Clique no botão <strong>+</strong> — a categoria aparece imediatamente nas listas de transações</p></div>

      <h3>25.3 Funcionalidades da página</h3>
      <ul>
        <li>Exibe quantas transações cada categoria já tem (&ldquo;12 usos&rdquo;)</li>
        <li>Categorias sem uso aparecem como &ldquo;Não usada&rdquo;</li>
        <li>Use as setas ↑↓ no modal para reordenar categorias personalizadas</li>
        <li>Categorias padrão não podem ser excluídas, mas personalizadas sim</li>
      </ul>
      <div className="tip"><p><strong>Dica:</strong> use categorias personalizadas para despesas específicas do seu estilo de vida que não estão nas categorias padrão, como &ldquo;Curso de Inglês&rdquo;, &ldquo;Veterinário&rdquo; ou &ldquo;Clube&rdquo;.</p></div>

      {/* 26. Atividade */}
      <div className="page-break" />
      <h2 id="atividade">26. Atividade</h2>
      <p>Feed cronológico de todas as ações realizadas pelo casal no sistema.</p>
      <ul>
        <li>Exibe transações, aportes em metas e pagamentos de parcelas</li>
        <li>Mostra usuário, valor e tempo relativo (há X minutos/horas)</li>
        <li>Filtre por tipo: todas as ações, somente transações ou somente metas</li>
        <li>Ícones coloridos: verde = entrada, vermelho = saída, azul = transferência</li>
      </ul>

      {/* 27. Configurações */}
      <h2 id="configuracoes">27. Configurações</h2>
      <h3>27.1 Perfil pessoal</h3>
      <ul>
        <li>Alterar nome de exibição</li>
        <li>Ativar/desativar modo privacidade (oculta todos os valores financeiros)</li>
        <li>Ativar modo escuro</li>
        <li>Escolher tema de cor (verde, azul, roxo, etc.)</li>
      </ul>

      <h3>27.2 Configurações do casal</h3>
      <ul>
        <li>Alterar nome do casal</li>
        <li>Definir moeda padrão (BRL, USD, EUR...)</li>
        <li>Configurar limite diário de gastos (alerta no Dashboard)</li>
        <li>Gerenciar membros e papéis (proprietário / membro)</li>
        <li>Gerar link de convite com validade de 7 dias</li>
      </ul>

      <h3>27.3 Notificações</h3>
      <p>Ative as <strong>notificações push</strong> para receber alertas no navegador e no celular (PWA instalado). Notificações enviadas:</p>
      <ul>
        <li>🔴 <strong>Vence hoje</strong> — parcelas, recorrentes e compromissos com vencimento no dia</li>
        <li>Vencimentos nos próximos 7 dias (parcelas e recorrentes)</li>
        <li>Orçamento de categoria excedido</li>
        <li>Alerta de cartão de crédito ao atingir 80% e 95% do limite</li>
        <li>Resumo semanal (toda segunda-feira)</li>
        <li>Meta financeira atingida</li>
      </ul>

      <h3>27.4 Backup e restauração</h3>
      <ul>
        <li><strong>Exportar backup:</strong> baixa um arquivo JSON com todos os dados do casal</li>
        <li><strong>Importar backup:</strong> restaura dados a partir de um arquivo de backup anterior</li>
      </ul>

      <h3>27.5 Zona de perigo (somente proprietário)</h3>
      <p style={{ color: '#dc2626' }}>Permite excluir permanentemente todos os dados do casal. A ação é irreversível e exige a confirmação digitando &ldquo;EXCLUIR TUDO&rdquo;.</p>

      {/* 28. Atalhos */}
      <div className="page-break" />
      <h2 id="atalhos">28. Atalhos de teclado e dicas</h2>

      <h3>28.1 Atalhos de navegação</h3>
      <table>
        <thead><tr><th>Tecla</th><th>Ação</th></tr></thead>
        <tbody>
          <tr><td><span className="shortcut">N</span></td><td>Abre o formulário de nova transação (de qualquer página)</td></tr>
          <tr><td><span className="shortcut">⌘K</span> / <span className="shortcut">Ctrl+K</span></td><td>Abre a busca global</td></tr>
          <tr><td><span className="shortcut">D</span></td><td>Ir para Dashboard</td></tr>
          <tr><td><span className="shortcut">T</span></td><td>Ir para Transações</td></tr>
          <tr><td><span className="shortcut">A</span></td><td>Ir para Contas</td></tr>
          <tr><td><span className="shortcut">G</span></td><td>Ir para Metas</td></tr>
          <tr><td><span className="shortcut">B</span></td><td>Ir para Orçamentos <span className="badge-new">NOVO</span></td></tr>
          <tr><td><span className="shortcut">P</span></td><td>Ir para Projeção <span className="badge-new">NOVO</span></td></tr>
          <tr><td><span className="shortcut">R</span></td><td>Ir para Relatórios</td></tr>
          <tr><td><span className="shortcut">?</span></td><td>Exibe a lista de todos os atalhos</td></tr>
          <tr><td><span className="shortcut">Esc</span></td><td>Fecha modais e painéis abertos</td></tr>
        </tbody>
      </table>

      <div className="info"><p>Os atalhos de navegação funcionam apenas quando o cursor não está sobre um campo de texto, select ou textarea.</p></div>

      <h3>28.2 Modo offline e PWA</h3>
      <p>O sistema usa um <strong>Service Worker</strong> para funcionar mesmo sem conexão:</p>
      <ul>
        <li><strong>Assets estáticos</strong> (JS, CSS, ícones): carregados do cache instantaneamente</li>
        <li><strong>Páginas já visitadas:</strong> disponíveis offline com os últimos dados carregados</li>
        <li><strong>Dados de API:</strong> o último resultado é salvo em cache e exibido quando offline</li>
      </ul>
      <div className="tip"><p>Instale o app como PWA (<strong>Adicionar à tela inicial</strong> no celular ou <strong>Instalar</strong> no Chrome desktop) para a melhor experiência offline.</p></div>

      <h3>28.3 Navegação mobile (bottom nav)</h3>
      <p>No celular, uma barra de navegação fixa na parte inferior da tela oferece acesso rápido às 5 seções principais:</p>
      <table>
        <thead><tr><th>Ícone</th><th>Destino</th></tr></thead>
        <tbody>
          <tr><td>🏠 Dashboard</td><td>Visão geral e saldo do mês</td></tr>
          <tr><td>💳 Lançamentos</td><td>Lista de transações</td></tr>
          <tr><td>📅 Agenda</td><td>Calendário de compromissos e Google Calendar</td></tr>
          <tr><td>✅ Atividades</td><td>Tarefas e lembretes pendentes</td></tr>
          <tr><td>📊 Análise</td><td>Relatórios, insights e projeção</td></tr>
        </tbody>
      </table>
      <div className="info"><p>O botão <strong>+</strong> flutuante (canto inferior direito) abre o formulário de nova transação rápida — em mobile fica acima da barra inferior para não sobrepor.</p></div>

      <h3>28.4 Badges no menu lateral</h3>
      <p>O menu lateral (sidebar) exibe badges vermelhos com contagem em tempo real para alertar sobre itens pendentes:</p>
      <ul>
        <li><strong>Atividades:</strong> tarefas pendentes + lembretes com prazo vencido</li>
        <li><strong>Pagamentos Fixos:</strong> parcelas de compromissos com vencimento em aberto</li>
      </ul>
      <div className="tip"><p><strong>Dica:</strong> os badges somem automaticamente à medida que você resolve os itens — use-os como guia diário de pendências financeiras.</p></div>

      <h3>28.5 Fluxo de trabalho recomendado</h3>
      <div className="flow-step"><div className="flow-num">1</div><p><strong>Início do mês:</strong> acesse Planejamento e defina o orçamento de cada categoria. O sistema também gera automaticamente as recorrentes ao abrir a página Recorrentes.</p></div>
      <div className="flow-step"><div className="flow-num">2</div><p><strong>Ao longo do mês:</strong> lance transações diariamente (atalho <span className="shortcut">N</span>). Use o Dashboard para monitorar orçamentos e o Calendário de Compromissos para não perder vencimentos.</p></div>
      <div className="flow-step"><div className="flow-num">3</div><p><strong>Semanalmente:</strong> cheque o Dashboard. Marque parcelas pagas na página de Parcelamentos. Consulte a Projeção para ver se o ritmo atual é sustentável.</p></div>
      <div className="flow-step"><div className="flow-num">4</div><p><strong>Final do mês:</strong> acesse <strong>Fechamento Mensal</strong> para o checklist guiado — concilie transações, faça aportes nas metas diretamente na página e revise os orçamentos excedidos.</p></div>
      <div className="flow-step"><div className="flow-num">5</div><p><strong>Planejando uma viagem:</strong> crie a viagem no módulo Viagens, vincule a uma meta de poupança e use o simulador de Projeção para calcular em quantos meses atinge o orçamento necessário.</p></div>
      <div className="flow-step"><div className="flow-num">6</div><p><strong>Fim do ano:</strong> use a visão Anual nos Relatórios e no Planejamento para avaliar o desempenho. Salve um snapshot do Patrimônio Líquido para comparação futura.</p></div>

      <h3>28.6 Ajuda contextual por página</h3>
      <p>
        Cada página do sistema possui um botão <strong>?</strong> no cabeçalho (header). Ao clicar, um painel lateral
        desliza da direita exibindo:
      </p>
      <ul>
        <li><strong>Funcionalidades</strong> — o que cada elemento da tela faz</li>
        <li><strong>Dicas</strong> — sugestões de uso específicas para aquela página</li>
        <li><strong>Atalhos</strong> — teclas de atalho disponíveis naquele contexto</li>
      </ul>
      <p>
        Clique em qualquer área fora do painel, ou no <strong>×</strong>, para fechá-lo. No rodapé do painel há um link
        direto para este manual.
      </p>
      <div className="tip"><p><strong>Dica:</strong> Use o botão <strong>?</strong> sempre que tiver dúvida sobre uma tela específica — é mais rápido do que procurar no manual completo.</p></div>

      <h3>28.7 Personalizar menu (sidebar)</h3>
      <p>
        No rodapé da sidebar há o botão <strong>Personalizar menu</strong>. Ao clicar, um modal lista todos os itens
        de navegação organizados por grupo. Você pode:
      </p>
      <ul>
        <li><strong>Ocultar</strong> seções que não usa (ex.: Viagens, Histórico de Preços)</li>
        <li><strong>Mostrar</strong> novamente qualquer item oculto a qualquer momento</li>
        <li>Usar <strong>Resetar</strong> para restaurar o menu padrão</li>
      </ul>
      <p>
        Grupos marcados como <em>fixo</em> (Essencial e Sistema) não podem ser ocultados. Itens ocultos também são
        removidos dos Favoritos automaticamente. As preferências são salvas no navegador (localStorage) — cada
        dispositivo tem sua própria configuração.
      </p>
      <div className="info"><p>O badge no botão &ldquo;Personalizar menu&rdquo; mostra quantos itens estão ocultos no momento.</p></div>

      <h3>28.8 Dicas rápidas</h3>
      <div className="two-col">
        <ul>
          <li>Use <strong>tags</strong> para agrupar gastos por evento (ex.: &ldquo;viagem-bahia&rdquo;)</li>
          <li>Crie <strong>regras de auto-categorização</strong> para economizar tempo</li>
          <li>Use <strong>templates</strong> para transações que se repetem com valores variáveis</li>
          <li>Ative o <strong>modo privacidade</strong> ao mostrar a tela para alguém</li>
          <li>Instale como <strong>app (PWA)</strong> para acesso mais rápido no celular</li>
          <li>Use <strong>Orçamento → Rollover</strong> para acumular saldo não gasto no próximo mês</li>
        </ul>
        <ul>
          <li>Importe extratos <strong>OFX</strong> para lançar todas as transações de uma vez</li>
          <li>Use <strong>Conciliação</strong> para detectar divergências entre o sistema e o banco</li>
          <li>A <strong>Lista de Desejos</strong> evita compras impulsivas — vote antes de comprar</li>
          <li>O simulador de <strong>Projeção</strong> mostra o impacto de mudanças de renda/gasto</li>
          <li>O <strong>Calendário de compromissos</strong> no Dashboard evita surpresas no fluxo de caixa</li>
          <li>Use <span className="shortcut">B</span> para acessar Orçamentos rapidamente durante o mês</li>
          <li>Use os <strong>Insights</strong> mensalmente para identificar tendências antes de virar hábito</li>
          <li>Registre preços no <strong>Histórico</strong> após cada ida ao mercado ou posto</li>
          <li>Crie a lista de compras antes de sair de casa para não esquecer itens e controlar o gasto</li>
          <li>Mantenha os <strong>Investimentos</strong> atualizados mensalmente — clique em ↺ após ver o extrato da corretora</li>
          <li>Vincule cada investimento a uma <strong>meta</strong> para visualizar o progresso de poupança no mesmo lugar</li>
          <li>Use <span className="shortcut">⌘K</span> para buscar qualquer lançamento sem navegar até a página</li>
          <li>Use o <strong>Simulador</strong> antes de tomar decisões de investimento — compare CDI vs. IPCA+ no modo &ldquo;Quanto investir?&rdquo;</li>
          <li>Crie <strong>categorias personalizadas</strong> para despesas específicas do seu estilo de vida (pets, cursos, hobby)</li>
          <li>Use o <strong>Fechamento Mensal</strong> para um ritual mensal rápido — leva menos de 5 minutos e mantém as metas em dia</li>
        </ul>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '3rem', borderTop: '2px solid #dcfce7', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: 0 }}>Financeiro para Casais — Manual do Sistema v3.6</p>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: 0 }}>Abril 2026</p>
      </div>
    </div>
  )
}
