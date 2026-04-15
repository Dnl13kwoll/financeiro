import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { RestartTourButton } from '@/components/features/onboarding/restart-tour-button'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Layers, RefreshCw,
  PieChart, Target, CalendarClock, TrendingUp, ClipboardList,
  Landmark, Heart, BarChart2, Activity, Settings,
  CheckCircle2, FileInput, Bookmark, Download, Search,
  Bell, Palette, EyeOff, Scissors, Zap, FileText,
  AlertTriangle, History, Copy, Pencil, Trash2, RefreshCcw,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Ajuda & Tutorial' }

type Section = {
  id: string
  icon: React.ReactNode
  title: string
  href: string
  color: string
  description: string
  features: { icon?: React.ReactNode; label: string; detail: string }[]
  tips?: string[]
}

const sections: Section[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: 'Dashboard',
    href: '/dashboard',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    description: 'Visão geral das suas finanças. É a primeira tela após o login e reúne os indicadores mais importantes num só lugar.',
    features: [
      { label: 'Cards de resumo', detail: 'Saldo total, gastos do mês, receitas e disponível (orçamento − gastos).' },
      { label: 'Alertas de orçamento', detail: 'Categorias que atingiram o percentual de alerta configurado aparecem em destaque.' },
      { label: 'Alertas de saldo baixo', detail: 'Contas abaixo do saldo mínimo configurado são sinalizadas em vermelho.' },
      { label: 'Saldo por conta', detail: 'Grade com o saldo atual de cada conta, agrupado por tipo.' },
      { label: 'Metas em andamento', detail: 'Até 3 metas ativas com barra de progresso e link para a página completa.' },
      { label: 'Vencimentos em 7 dias', detail: 'Parcelas e recorrentes com vencimento nos próximos 7 dias.' },
      { label: 'Histórico 6 meses', detail: 'Gráfico de barras duplas (receitas × despesas) dos últimos 6 meses.' },
      { label: 'Evolução do saldo', detail: 'Gráfico de linha mostrando como o saldo evoluiu mês a mês.' },
      { label: 'Previsão 30 dias', detail: 'Saldo estimado descontando parcelas pendentes nos próximos 30 dias.' },
      { label: 'Últimas transações', detail: 'As 5 transações mais recentes com link para ver todas.' },
      { label: 'Gastos por categoria', detail: 'Gráfico de pizza com as top categorias de despesa do mês.' },
    ],
    tips: [
      'Acesse o Dashboard como ponto de partida para identificar problemas rapidamente.',
      'Os alertas de orçamento disparam notificações automáticas no sino quando você abre a página de Orçamentos.',
    ],
  },
  {
    id: 'accounts',
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Contas',
    href: '/accounts',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    description: 'Gerencie todas as contas do casal: corrente, poupança, investimento, cartão de crédito, carteira e outros.',
    features: [
      { label: 'Criar conta', detail: 'Informe nome, tipo, saldo inicial e cor. O saldo é calculado automaticamente com base nas transações.' },
      { label: 'Cor da conta', detail: 'Cada conta pode ter uma cor para facilitar identificação visual.' },
      { label: 'Editar e excluir', detail: 'Edite qualquer dado da conta ou exclua (soft delete — dados preservados).' },
      { label: 'Saldo mínimo', detail: 'Configure um saldo de alerta: o Dashboard avisa quando a conta ficar abaixo desse valor.' },
      { label: 'Extrato da conta', detail: 'Clique no nome da conta para ver todas as transações vinculadas a ela.' },
      { label: 'Cartão de crédito', detail: 'Contas do tipo cartão têm página de fatura com ciclos de vencimento, pagamentos registrados e breakdown por categoria.' },
      { label: 'Patrimônio líquido', detail: 'O total de ativos menos passivos é calculado automaticamente e exibido no topo.' },
    ],
    tips: [
      'Use o tipo "Investimento" para contas que rendem e configure o rendimento esperado.',
      'A fatura do cartão (/cards/[id]) mostra o total da fatura, quanto já foi pago e o saldo devedor.',
    ],
  },
  {
    id: 'transactions',
    icon: <ArrowLeftRight className="w-5 h-5" />,
    title: 'Transações',
    href: '/transactions',
    color: 'bg-violet-50 text-violet-600 border-violet-100',
    description: 'O núcleo do sistema. Registre, filtre, edite e analise todas as movimentações financeiras do casal.',
    features: [
      { icon: <ArrowLeftRight className="w-3.5 h-3.5" />, label: 'Nova transação', detail: 'Tipos: Entrada (receita), Saída (despesa) ou Transferência entre contas. Campos: valor, descrição, conta, categoria, data, tags, comentário, privacidade.' },
      { icon: <Bookmark className="w-3.5 h-3.5" />, label: 'Templates', detail: 'Salve o formulário atual como template e reutilize em cliques futuros. Dropdown "Templates" no topo do modal.' },
      { label: 'Parcelas', detail: 'No modal de nova transação, escolha de 1× a 24×. O sistema cria um grupo de parcelamento com itens mensais.' },
      { icon: <Search className="w-3.5 h-3.5" />, label: 'Filtros', detail: 'Filtre por mês, período personalizado, tipo, categoria, conta, tag, texto e transações privadas.' },
      { label: 'Ações por linha', detail: 'Editar (lápis), Duplicar (copy), Dividir 50/50 (tesoura), Converter em recorrente, Excluir.' },
      { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Conciliação', detail: 'Ícone de círculo ao lado do valor: clique para marcar a transação como conciliada com o extrato bancário.' },
      { label: 'Ações em massa', detail: 'Selecione várias transações com os checkboxes e use a barra que aparece na parte inferior para categorizar ou excluir em lote.' },
      { label: 'Undo ao excluir', detail: 'Ao excluir, uma notificação com botão "Desfazer" aparece por 4 segundos. Clique para cancelar.' },
      { icon: <Download className="w-3.5 h-3.5" />, label: 'Exportar', detail: 'Botão "Exportar" com opções CSV (.csv) e Excel (.xls). Exporta as transações do filtro atual.' },
      { icon: <FileInput className="w-3.5 h-3.5" />, label: 'Importar CSV', detail: 'Importe transações de uma planilha CSV. A primeira linha deve conter os cabeçalhos.' },
      { label: 'Importar OFX/QIF', detail: 'Importe arquivos exportados pelo internet banking (.ofx) ou Quicken (.qif). O sistema detecta e exibe preview antes de confirmar.' },
      { label: 'Tags', detail: 'Marque transações com etiquetas livres. Clique em uma tag para filtrar. Visíveis nos relatórios por tag.' },
      { label: 'Privado', detail: 'Marque como privado para que só você veja. O parceiro não vê a transação.' },
    ],
    tips: [
      'Use Ctrl+K (ou o ícone de lupa no header) para busca global em transações, parcelamentos e recorrentes.',
      'A sugestão automática de categoria analisa seu histórico ao digitar a descrição.',
      'Transações conciliadas ajudam a fechar o mês: filtre as não conciliadas para revisar o extrato.',
    ],
  },
  {
    id: 'installments',
    icon: <Layers className="w-5 h-5" />,
    title: 'Parcelamentos',
    href: '/installments',
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    description: 'Controle de compras parceladas. Visualize o progresso de cada parcelamento e gerencie as parcelas individualmente.',
    features: [
      { label: 'Criar parcelamento', detail: 'Informe descrição, valor total, número de parcelas, conta e data da primeira parcela.' },
      { label: 'Marcar como pago', detail: 'Clique no checkbox de cada parcela para marcá-la como paga. Isso cria uma transação na conta vinculada.' },
      { label: 'Editar parcela', detail: 'Altere o valor ou vencimento de uma parcela individual sem afetar as demais.' },
      { label: 'Cancelar parcela', detail: 'Cancele uma parcela sem excluí-la (aparece como cancelada no histórico).' },
      { label: 'Reagendar parcela', detail: 'Mova o vencimento de uma parcela para outra data.' },
      { label: 'Progresso', detail: 'Barra de progresso mostrando quantas parcelas foram pagas e o valor total pago/restante.' },
    ],
    tips: [
      'Parcelamentos criados via modal de Nova Transação (com 2× ou mais) aparecem automaticamente aqui.',
      'Vencimentos próximos aparecem no Dashboard e na Linha do Tempo.',
    ],
  },
  {
    id: 'recurring',
    icon: <RefreshCw className="w-5 h-5" />,
    title: 'Recorrentes',
    href: '/recurring',
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    description: 'Contas fixas mensais: aluguel, assinaturas, academias, planos. Controle o pagamento mês a mês.',
    features: [
      { label: 'Cadastrar recorrente', detail: 'Informe nome, valor, dia de vencimento, categoria e se tem data de término.' },
      { label: 'Marcar como pago', detail: 'Toggle por mês: ao marcar, cria automaticamente uma transação de despesa na conta selecionada.' },
      { label: 'Mini-histórico', detail: '3 bolinhas coloridas mostram os últimos 3 meses (verde = pago, cinza = pendente).' },
      { label: 'Pausar', detail: 'Pause uma recorrente temporariamente sem excluir (ex: assinatura pausada).' },
      { icon: <Zap className="w-3.5 h-3.5" />, label: 'Gerar este mês', detail: 'Botão que cria transações para todas as recorrentes ativas que ainda não têm transação no mês atual.' },
    ],
    tips: [
      'Use "Gerar este mês" no início de cada mês para lançar todas as despesas fixas de uma vez.',
      'Recorrentes vencendo em 7 dias aparecem como alerta no Dashboard.',
    ],
  },
  {
    id: 'budgets',
    icon: <PieChart className="w-5 h-5" />,
    title: 'Orçamentos',
    href: '/budgets',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    description: 'Defina limites de gasto por categoria para o mês. O sistema acompanha o uso em tempo real.',
    features: [
      { label: 'Definir orçamento', detail: 'Escolha categoria, valor e threshold de alerta (padrão: 80%). Um orçamento por categoria por mês.' },
      { label: 'Barra de progresso', detail: 'Cada categoria mostra: pago / limite. Barra amarela ao atingir o threshold, vermelha ao estourar.' },
      { label: 'Copiar do mês anterior', detail: 'Botão que copia todos os orçamentos do mês anterior para o mês atual (sem sobrescrever existentes).' },
      { label: 'Rollover', detail: 'Transfere o saldo não usado do mês anterior para o atual. Ex: sobrou R$100 em Alimentação → R$100 é somado ao orçamento deste mês.' },
      { label: 'Alerta automático', detail: 'Ao abrir a página, categorias acima do threshold geram notificações no sino automaticamente (sem duplicatas).' },
    ],
    tips: [
      'Configure o threshold em 70-80% para ser avisado antes de estourar o limite.',
      'Use o Rollover no início do mês para aproveitar as economias do mês anterior.',
    ],
  },
  {
    id: 'goals',
    icon: <Target className="w-5 h-5" />,
    title: 'Metas',
    href: '/goals',
    color: 'bg-green-50 text-green-600 border-green-100',
    description: 'Defina objetivos financeiros (viagem, reserva de emergência, casa própria) e acompanhe os aportes.',
    features: [
      { label: 'Criar meta', detail: 'Informe nome, valor alvo, prazo (opcional) e conta vinculada (opcional).' },
      { label: 'Registrar aporte', detail: 'Botão "Aportes" → modal para registrar depósito com valor, data e observação.' },
      { label: 'Histórico de aportes', detail: 'Lista completa de todos os depósitos realizados, com data e nota.' },
      { label: 'Sugestão mensal', detail: 'Se houver prazo, o sistema calcula quanto você precisa poupar por mês para atingir a meta a tempo.' },
      { label: 'Celebração', detail: 'Ao atingir 100% da meta, uma animação de confetes e um painel de celebração aparecem na tela.' },
    ],
    tips: [
      'Vincule a meta a uma conta poupança para acompanhar o saldo real.',
      'A sugestão de aporte mensal é recalculada automaticamente conforme você registra aportes.',
    ],
  },
  {
    id: 'timeline',
    icon: <CalendarClock className="w-5 h-5" />,
    title: 'Linha do Tempo',
    href: '/timeline',
    color: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    description: 'Visualize cronologicamente todos os vencimentos futuros: parcelas e recorrentes.',
    features: [
      { label: 'Janela de tempo', detail: 'Selecione 7, 15, 30 ou 60 dias à frente para visualizar os próximos vencimentos.' },
      { label: 'Parcelas pendentes', detail: 'Todas as parcelas ainda não pagas no período, com valor e conta vinculada.' },
      { label: 'Recorrentes', detail: 'Ocorrências das contas recorrentes ativas no período, com dia de vencimento calculado.' },
      { label: 'Total previsto', detail: 'Soma de todos os compromissos financeiros no período selecionado.' },
    ],
    tips: [
      'Use a Linha do Tempo para planejar o caixa da próxima quinzena.',
      'Combine com a Projeção para ter uma visão de longo prazo.',
    ],
  },
  {
    id: 'projection',
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Projeção',
    href: '/projection',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    description: 'Previsão financeira para os próximos 6 meses baseada na média histórica dos últimos 3 meses.',
    features: [
      { label: 'Receita projetada', detail: 'Média de receitas dos últimos 3 meses aplicada aos próximos 6.' },
      { label: 'Despesa projetada', detail: 'Média de despesas históricas + valor mensal das recorrentes ativas.' },
      { label: 'Saldo projetado', detail: 'Receita − Despesa projetada por mês, com indicador de tendência (↑↓).' },
      { label: 'Tabela de 6 meses', detail: 'Linha por mês com receita, despesa e saldo projetados.' },
    ],
    tips: [
      'A projeção é mais precisa após 3+ meses de histórico registrado.',
      'Recorrentes pausadas não entram no cálculo de despesa projetada.',
    ],
  },
  {
    id: 'planning',
    icon: <ClipboardList className="w-5 h-5" />,
    title: 'Planejamento',
    href: '/planning',
    color: 'bg-teal-50 text-teal-600 border-teal-100',
    description: 'Plano financeiro mensal livre: liste receitas e despesas previstas para o mês e compare com o realizado.',
    features: [
      { label: 'Adicionar item', detail: 'Crie linhas de planejamento com label, valor previsto, tipo (entrada/saída) e categoria.' },
      { label: 'Realizado vs planejado', detail: 'Para cada item, o sistema busca as transações reais da categoria e exibe a diferença.' },
      { label: 'Copiar mês anterior', detail: 'Botão que importa todos os itens do mês anterior para o mês atual.' },
      { label: 'Totais', detail: 'Soma de entradas e saídas planejadas, com saldo previsto.' },
    ],
    tips: [
      'Use o Planejamento no início do mês para definir suas metas de gasto por categoria.',
      'Compare com Relatórios ao final do mês para ver onde divergiu do planejado.',
    ],
  },
  {
    id: 'networth',
    icon: <Landmark className="w-5 h-5" />,
    title: 'Patrimônio',
    href: '/networth',
    color: 'bg-slate-50 text-slate-600 border-slate-100',
    description: 'Visão do patrimônio líquido: ativos (saldos positivos) versus passivos (saldos negativos).',
    features: [
      { label: 'Ativos e passivos', detail: 'Lista de contas separadas por ativo (saldo positivo) e passivo (saldo negativo), com totais.' },
      { label: 'Patrimônio líquido', detail: 'Total de ativos − total de passivos, com indicador de variação.' },
      { label: 'Snapshot mensal', detail: 'Botão de câmera salva o patrimônio atual como registro histórico do mês.' },
      { label: 'Histórico', detail: 'Gráfico de barras com a evolução do patrimônio mês a mês (a partir dos snapshots salvos).' },
    ],
    tips: [
      'Salve um snapshot no início de cada mês para construir o histórico de evolução patrimonial.',
      'Cartões de crédito com saldo negativo são contabilizados como passivos automaticamente.',
    ],
  },
  {
    id: 'wishlist',
    icon: <Heart className="w-5 h-5" />,
    title: 'Lista de Desejos',
    href: '/wishlist',
    color: 'bg-pink-50 text-pink-600 border-pink-100',
    description: 'Lista de compras e desejos do casal, com sistema de votação para decidir juntos.',
    features: [
      { label: 'Adicionar item', detail: 'Informe nome, valor estimado, categoria e prioridade (baixa/média/alta).' },
      { label: 'Votação', detail: 'Cada membro pode votar 👍 ou 👎 em cada item. Os votos de aprovação e rejeição ficam visíveis.' },
      { label: 'Marcar como comprado', detail: 'Quando adquirido, mova o item para "Comprados".' },
      { label: 'Prioridade', detail: 'Itens de alta prioridade aparecem em destaque.' },
    ],
    tips: [
      'Use a votação para alinhar prioridades entre o casal antes de comprar.',
      'Combine com Metas: crie uma meta para acumular o valor de um item desejado.',
    ],
  },
  {
    id: 'reports',
    icon: <BarChart2 className="w-5 h-5" />,
    title: 'Relatórios',
    href: '/reports',
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    description: 'Análise detalhada das finanças com três visões: mensal, anual e comparativo entre meses.',
    features: [
      { label: 'Visão Mensal', detail: 'Resumo de receitas/despesas/saldo com % de variação vs mês anterior. Breakdown por categoria (pizza + barras), por membro e por tag.' },
      { label: 'Tendência 6 meses', detail: 'Mini-gráfico de barras por categoria mostrando a evolução das despesas nos últimos 6 meses.' },
      { label: 'Visão Anual', detail: 'Gráfico de barras mensais do ano, tabela com detalhe por mês e ranking de categorias.' },
      { label: 'Comparar meses', detail: 'Selecione dois meses quaisquer para comparar lado a lado receitas, despesas e saldo. Tabela de categorias com variação absoluta e percentual.' },
      { icon: <Download className="w-3.5 h-3.5" />, label: 'Exportar CSV/XLS', detail: 'Exporte o relatório do mês atual em CSV ou Excel.' },
      { icon: <FileText className="w-3.5 h-3.5" />, label: 'Imprimir/PDF', detail: 'Botão PDF abre o diálogo de impressão do navegador. Sidebar e botões são ocultados automaticamente.' },
    ],
    tips: [
      'Use "Comparar" para identificar meses atípicos (férias, gastos extras).',
      'A tendência por categoria ajuda a detectar categorias com gasto crescente mês a mês.',
    ],
  },
  {
    id: 'activity',
    icon: <Activity className="w-5 h-5" />,
    title: 'Atividade',
    href: '/activity',
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    description: 'Feed cronológico de todas as ações realizadas pelo casal no sistema.',
    features: [
      { label: 'Feed unificado', detail: 'Transações, parcelamentos, metas e recorrentes recentes do casal em ordem cronológica.' },
      { label: 'Tempo relativo', detail: 'Cada ação mostra "há 5min", "há 2h", "há 3d" etc.' },
      { label: 'Ícone por tipo', detail: 'Cada tipo de atividade tem ícone e cor diferentes para fácil identificação visual.' },
    ],
    tips: [
      'Útil para acompanhar o que o parceiro registrou recentemente sem precisar filtrar em cada página.',
    ],
  },
  {
    id: 'settings',
    icon: <Settings className="w-5 h-5" />,
    title: 'Configurações',
    href: '/settings',
    color: 'bg-zinc-50 text-zinc-600 border-zinc-200',
    description: 'Configurações do perfil, do casal, notificações, backup e opções avançadas.',
    features: [
      { label: 'Perfil', detail: 'Exibe seu nome e e-mail cadastrado.' },
      { label: 'Casal', detail: 'Dono pode convidar o parceiro por e-mail, alterar a moeda padrão e ver os membros.' },
      { label: 'Convidar parceiro', detail: 'Envie um link de convite por e-mail. O convite expira em 7 dias.' },
      { label: 'Moeda', detail: 'Altere a moeda de exibição (BRL, USD, EUR etc.). Dono do casal apenas.' },
      { label: 'Notificações push', detail: 'Ative para receber alertas de vencimento mesmo com o app fechado (requer permissão do navegador).' },
      { label: 'Backup', detail: 'Exporta todos os dados do casal em formato JSON para backup local.' },
      { label: 'Importar backup', detail: 'Restaura dados a partir de um arquivo JSON exportado anteriormente.' },
      { icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />, label: 'Zona de Perigo', detail: 'Exclui permanentemente todos os dados do casal. Requer digitar "EXCLUIR TUDO". Visível apenas para o dono.' },
    ],
    tips: [
      'Faça backup antes de qualquer operação destrutiva.',
      'A zona de perigo exclui tudo: transações, contas, metas, orçamentos e histórico.',
    ],
  },
]

const globalFeatures = [
  { icon: <Search className="w-4 h-4" />, label: 'Busca global', detail: 'Ícone de lupa no header (ou Ctrl+K). Busca em transações, parcelamentos e recorrentes.' },
  { icon: <Bell className="w-4 h-4" />, label: 'Notificações', detail: 'Sino no header com badge de não lidas. Alertas de orçamento, metas e vencimentos.' },
  { icon: <Palette className="w-4 h-4" />, label: 'Temas', detail: 'Ícone de paleta no rodapé da sidebar. Temas: Verde, Rosa, Azul e Escuro (dark mode).' },
  { icon: <EyeOff className="w-4 h-4" />, label: 'Modo privado', detail: 'Ícone de olho na sidebar. Oculta todos os valores financeiros com blur (útil em locais públicos).' },
  { icon: <Settings className="w-4 h-4" />, label: 'Atalhos de teclado', detail: '? abre lista de atalhos. Navegação rápida entre páginas via teclado.' },
]

export default function HelpPage() {
  return (
    <div className="flex flex-col flex-1">
      <Header title="Ajuda & Tutorial" />

      <div className="p-4 md:p-6 max-w-4xl space-y-8">
        {/* Intro */}
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-primary-900 mb-2">Bem-vindo ao Financeiro para casais</h2>
          <p className="text-primary-700 text-sm leading-relaxed">
            Este app ajuda você e seu parceiro a gerenciar as finanças juntos — transações, orçamentos, metas,
            parcelamentos, patrimônio e muito mais. Use este guia para entender cada seção e tirar o máximo do sistema.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {sections.map(s => (
              <Link
                key={s.id}
                href={`#${s.id}`}
                className="text-xs px-3 py-1.5 bg-white border border-primary-200 text-primary-700 rounded-full hover:bg-primary-100 transition-colors"
              >
                {s.title}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <RestartTourButton />
            <Link
              href="/manual"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-primary-200 text-primary-700 rounded-lg hover:bg-primary-50 transition-colors font-medium"
            >
              Baixar manual em PDF
            </Link>
          </div>
        </div>

        {/* Global features */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recursos globais (disponíveis em todas as páginas)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {globalFeatures.map(f => (
              <div key={f.label} className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <span className="text-primary-600 mt-0.5 shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Per-page sections */}
        {sections.map(section => (
          <section key={section.id} id={section.id} className="scroll-mt-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={`p-2 rounded-lg border ${section.color}`}>{section.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                <Link href={section.href} className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
                  Ir para {section.title} <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{section.description}</p>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-3">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Funcionalidades</p>
              </div>
              <div className="divide-y divide-gray-50">
                {section.features.map(f => (
                  <div key={f.label} className="flex items-start gap-3 px-4 py-3">
                    {f.icon && <span className="text-gray-400 mt-0.5 shrink-0">{f.icon}</span>}
                    <div className={f.icon ? '' : 'pl-0'}>
                      <span className="text-sm font-medium text-gray-800">{f.label}</span>
                      <span className="text-gray-400 mx-2">—</span>
                      <span className="text-sm text-gray-600">{f.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {section.tips && section.tips.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1.5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Dicas</p>
                {section.tips.map((tip, i) => (
                  <p key={i} className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                    {tip}
                  </p>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* Workflow sugerido */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Fluxo de uso recomendado</h2>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-3">
            {[
              { step: '1ª vez', action: 'Configurações → criar casal → convidar parceiro → cadastrar contas' },
              { step: 'Início do mês', action: 'Recorrentes → "Gerar este mês" · Orçamentos → Copiar / Rollover · Planejamento → Copiar mês anterior' },
              { step: 'Dia a dia', action: 'Transações → Nova transação (ou tecla N) para cada movimentação' },
              { step: 'Semanal', action: 'Dashboard → revisar alertas · Transações → conciliar com extrato bancário' },
              { step: 'Fim do mês', action: 'Relatórios → ver resumo mensal · Patrimônio → salvar snapshot · Metas → registrar aportes' },
              { step: 'Revisão anual', action: 'Relatórios → Visão anual · Exportar CSV/PDF para arquivo' },
            ].map(({ step, action }) => (
              <div key={step} className="flex items-start gap-3 text-sm">
                <span className="shrink-0 font-semibold text-primary-700 w-28">{step}</span>
                <span className="text-gray-600">{action}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Perguntas frequentes</h2>
          <div className="space-y-3">
            {[
              { q: 'Como convidar meu parceiro?', a: 'Configurações → seção Casal → botão "Convidar parceiro". Informe o e-mail. Seu parceiro receberá um link para aceitar o convite.' },
              { q: 'O saldo da conta está errado, o que fazer?', a: 'O saldo é calculado como saldo inicial + entradas − saídas. Verifique se o saldo inicial da conta foi configurado corretamente em Contas → Editar.' },
              { q: 'Como registrar uma compra parcelada?', a: 'Nova Transação → tipo Saída → preencha os campos → em "Parcelas" selecione o número de vezes. O sistema cria automaticamente as parcelas mensais em Parcelamentos.' },
              { q: 'Qual a diferença entre Recorrente e Parcelamento?', a: 'Recorrente é uma despesa fixa que se repete indefinidamente (aluguel, academia). Parcelamento tem um número definido de vezes (12× no cartão).' },
              { q: 'Como funciona o modo privado?', a: 'Clique no ícone de olho na sidebar. Todos os valores são ocultados com blur. Útil ao usar o app em locais públicos. A configuração é local por dispositivo.' },
              { q: 'Posso exportar todos os meus dados?', a: 'Sim. Configurações → Backup de dados → botão "Exportar backup". Gera um arquivo JSON com todos os dados do casal.' },
              { q: 'Como desfazer uma exclusão?', a: 'Ao excluir uma transação, uma notificação com botão "Desfazer" aparece por 4 segundos. Após isso, a exclusão é confirmada e não pode ser revertida pela interface.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-800 mb-1">{q}</p>
                <p className="text-sm text-gray-600">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
