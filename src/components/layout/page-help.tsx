'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { HelpCircle, X, Lightbulb, Zap, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type HelpSection = {
  icon: 'info' | 'tip' | 'shortcut'
  title: string
  items: string[]
}

type PageHelpContent = {
  title: string
  description: string
  sections: HelpSection[]
}

const HELP: Record<string, PageHelpContent> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'Visão geral da situação financeira do casal em tempo real.',
    sections: [
      {
        icon: 'info',
        title: 'O que você vê aqui',
        items: [
          'Saldo total de todas as contas',
          'Receitas e despesas do mês atual com variação vs. mês anterior',
          'Score financeiro (0–100) baseado em poupança, orçamentos e metas',
          'Alertas de vencimentos próximos e orçamentos excedidos',
          'Histórico de 6 meses em barras e últimas transações',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Clique em "Personalizar" para escolher quais widgets aparecem',
          'O calendário de compromissos mostra pontos vermelhos (parcelas) e azuis (recorrentes)',
          'O alerta de vencimentos próximos aparece uma vez por dia para não ser intrusivo',
        ],
      },
      {
        icon: 'shortcut',
        title: 'Atalhos',
        items: ['N — nova transação', 'D — voltar ao Dashboard de qualquer página'],
      },
    ],
  },

  '/accounts': {
    title: 'Contas',
    description: 'Gerencie todas as contas financeiras do casal.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Cadastrar contas bancárias, carteiras e cartões de crédito',
          'Ver o extrato de cada conta com entradas, saídas e saldo por mês',
          'Fazer transferências entre contas com registro automático',
          'Reordenar os cards arrastando ou usando as setas',
          'Definir cor personalizada para identificar cada conta rapidamente',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Use conciliação para detectar diferenças entre o sistema e o extrato bancário',
          'Cartões de crédito mostram limite, % utilizado e datas de corte/vencimento',
          'Clique no nome da conta para ver o histórico de saldo dos últimos 6 meses',
        ],
      },
    ],
  },

  '/transactions': {
    title: 'Transações',
    description: 'Centro principal de lançamentos de receitas, despesas e transferências.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Lançar entradas, saídas e transferências com categoria, tags e notas',
          'Filtrar por mês, tipo, categoria, conta, tag ou período personalizado',
          'Importar extratos em CSV ou OFX do seu banco',
          'Exportar transações filtradas em CSV',
          'Dividir a tela em parcelas (N meses) no próprio lançamento',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'O sistema detecta duplicatas automático antes de salvar',
          'Use auto-categorização (botão Categorias) para criar regras por palavra-chave',
          'Marque como "Privado" para que o parceiro não veja a transação',
          'Templates salvam um lançamento pré-preenchido para reusar depois',
        ],
      },
      {
        icon: 'shortcut',
        title: 'Atalhos',
        items: ['N — nova transação', 'T — ir direto para Transações'],
      },
    ],
  },

  '/installments': {
    title: 'Parcelamentos',
    description: 'Controle de compras parceladas com parcelas individuais.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Registrar compras parceladas com vencimento de cada parcela',
          'Marcar parcelas como pagas individualmente',
          'Ver progresso (X de N parcelas pagas) e total ainda a pagar',
          'Cancelar parcelas futuras sem perder o histórico',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Parcelas com vencimento em até 7 dias aparecem no Dashboard como alerta',
          'Use a Linha do Tempo para ver todos os vencimentos do mês em calendário',
          'Para compras recorrentes de valor fixo, prefira Recorrentes em vez de Parcelamentos',
        ],
      },
    ],
  },

  '/recurring': {
    title: 'Recorrentes',
    description: 'Contas que se repetem todo mês (streaming, aluguel, academia...).',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Cadastrar contas com dia de vencimento, valor e categoria',
          'O sistema gera automaticamente as transações mensais ao abrir esta página',
          'Pausar temporariamente sem excluir (ex: plano em suspensão)',
          'Ver histórico de pagamentos de cada recorrente',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Recorrentes aparecem no calendário do Dashboard e na Linha do Tempo',
          'Ative notificações push para receber alerta 3 dias antes do vencimento',
          'Contas anuais (IPVA, IPTU) podem ser cadastradas com frequência anual',
        ],
      },
    ],
  },

  '/budgets': {
    title: 'Orçamentos',
    description: 'Defina limites mensais por categoria e acompanhe o consumo.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Criar orçamentos por categoria com valor máximo mensal',
          'Ver em tempo real quanto foi gasto vs. o limite em barras de progresso',
          'Copiar orçamentos do mês anterior com um clique',
          'Usar rollover para acumular saldo não gasto no mês seguinte',
          '"Sugerir orçamento" calcula automaticamente com base na média dos últimos 3 meses',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Orçamentos excedidos disparam notificação push se você tiver ativo',
          'Crie categorias personalizadas em /categories para orçamentos específicos',
          'Use o Fechamento Mensal para revisar quais orçamentos foram respeitados',
        ],
      },
      {
        icon: 'shortcut',
        title: 'Atalhos',
        items: ['B — ir direto para Orçamentos'],
      },
    ],
  },

  '/goals': {
    title: 'Metas',
    description: 'Defina objetivos financeiros e acompanhe o progresso dos aportes.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Criar metas com valor alvo, prazo e conta vinculada',
          'Registrar aportes com histórico e observação',
          'Ver progresso em barra e % concluído',
          'Vincular investimentos a uma meta para unificar o acompanhamento',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Use o Simulador (/simulator) para calcular o aporte mensal ideal para cada meta',
          'No Fechamento Mensal você pode aportar em todas as metas sem sair da página',
          'Metas atingidas disparam notificação push de parabéns',
        ],
      },
      {
        icon: 'shortcut',
        title: 'Atalhos',
        items: ['G — ir direto para Metas'],
      },
    ],
  },

  '/timeline': {
    title: 'Linha do Tempo',
    description: 'Calendário unificado de todos os compromissos financeiros do mês.',
    sections: [
      {
        icon: 'info',
        title: 'O que você vê aqui',
        items: [
          'Parcelas vencendo no mês atual com valor e status de pagamento',
          'Contas recorrentes com dia de vencimento',
          'Visão consolidada de quanto vai sair em cada dia do mês',
          'Total comprometido do mês vs. saldo disponível',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Use para planejar o fluxo de caixa antes de fazer compras grandes',
          'Dias com vencimento são destacados em vermelho quando o total é alto',
          'Marque parcelas como pagas diretamente pela Linha do Tempo',
        ],
      },
    ],
  },

  '/projection': {
    title: 'Projeção',
    description: 'Simule cenários futuros com base na sua renda e gastos atuais.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Ver projeção de saldo para os próximos meses com base no padrão atual',
          'Ajustar renda e despesas para simular diferentes cenários',
          'Calcular em quantos meses atinge uma meta com o ritmo atual',
          'Ver o impacto de uma compra grande no saldo projetado',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Quanto mais meses de histórico você tiver, mais precisa é a projeção',
          'Use junto com o Simulador de Investimentos para projeções de longo prazo',
        ],
      },
      {
        icon: 'shortcut',
        title: 'Atalhos',
        items: ['P — ir direto para Projeção'],
      },
    ],
  },

  '/planning': {
    title: 'Planejamento',
    description: 'Planejamento financeiro mensal e anual com visão de categorias.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Planejar receitas e despesas por categoria para o mês',
          'Comparar o planejado vs. o realizado em tempo real',
          'Visualizar o ano inteiro em uma tabela por mês',
          'Importar planejamento do mês anterior como base',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Comece o mês definindo o planejamento antes de gastar',
          'Use junto com Orçamentos para ter dois níveis de controle (teto vs. meta)',
        ],
      },
    ],
  },

  '/networth': {
    title: 'Patrimônio Líquido',
    description: 'Visão consolidada do patrimônio: ativos menos passivos.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Ver o patrimônio líquido total (contas + investimentos − dívidas)',
          'Salvar snapshots mensais para acompanhar a evolução histórica',
          'Adicionar ativos externos (imóvel, veículo) que não estão nas contas',
          'Adicionar passivos (financiamentos, dívidas) para abater do patrimônio',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Salve um snapshot no último dia de cada mês para ter um histórico preciso',
          'O valor dos imóveis deve ser atualizado manualmente com base no mercado',
        ],
      },
    ],
  },

  '/wishlist': {
    title: 'Lista de Desejos',
    description: 'Itens que o casal quer comprar, com votação antes de decidir.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Adicionar itens com nome, preço estimado, link e prioridade',
          'Votar nos itens do parceiro (ambos precisam querer para avançar)',
          'Marcar como comprado quando realizar a compra',
          'Ver o total estimado de todos os desejos pendentes',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Use como filtro anti-impulso — espere 48h antes de adicionar um item',
          'Vincule um desejo a uma meta para acompanhar o progresso de poupança',
          'Ordene por prioridade para focar no que realmente importa',
        ],
      },
    ],
  },

  '/travel': {
    title: 'Viagens',
    description: 'Planejamento completo de viagens com orçamento, roteiro e gastos.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Criar viagens com destino, datas e orçamento total',
          'Dividir o orçamento por categorias (hospedagem, voos, alimentação, passeios)',
          'Registrar gastos reais durante a viagem e comparar com o planejado',
          'Adicionar itinerário com horários, endereços e confirmações',
          'Vincular a uma meta de poupança para acompanhar o quanto falta',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Use a Projeção para calcular em quantos meses consegue juntar o orçamento da viagem',
          'Registre gastos em moeda estrangeira — o sistema converte automaticamente',
          'A lista de confirmações (passagem, hotel, visto) evita esquecer documentos',
        ],
      },
    ],
  },

  '/investments': {
    title: 'Investimentos',
    description: 'Carteira completa com 18 tipos de investimentos e rentabilidade estimada.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Cadastrar CDBs, Tesouro Direto, ações, FIIs, ETFs, fundos e criptomoedas',
          'Acompanhar rentabilidade estimada automática com taxas do Banco Central',
          'Ver alocação por grupo (Renda Fixa, Renda Variável, Fundos...)',
          'Receber alerta de vencimentos nos próximos 60 dias',
          'Exportar a carteira em CSV para análise externa',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Clique em ↺ mensalmente para atualizar o valor de renda variável',
          'Vincule investimentos a metas para ver o progresso em um só lugar',
          'Use o Simulador para comparar diferentes taxas antes de investir',
          'As taxas SELIC/CDI/IPCA são atualizadas automaticamente via Banco Central',
        ],
      },
    ],
  },

  '/simulator': {
    title: 'Simulador de Investimentos',
    description: 'Calcule crescimento futuro ou o aporte necessário para atingir um objetivo.',
    sections: [
      {
        icon: 'info',
        title: 'Dois modos disponíveis',
        items: [
          '"Quanto terei?" — informe inicial, aporte mensal, taxa e anos → valor futuro com tabela anual',
          '"Quanto investir?" — informe objetivo, prazo e taxa → aporte mensal necessário',
          'Comparativo automático entre Poupança, CDI 100/110%, SELIC, IPCA+5/6%',
          'Taxas em tempo real do Banco Central do Brasil',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Use "Quanto investir?" antes de criar uma meta para saber o aporte correto',
          'O comparativo de taxas mostra quanto você perde ficando na Poupança vs. CDI',
          'Teste a taxa personalizada para simular ações ou fundos com retorno esperado',
        ],
      },
    ],
  },

  '/shopping': {
    title: 'Lista de Compras',
    description: 'Lista colaborativa com estimativa de gastos e controle de preços.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Criar listas por evento (mercado semanal, farmácia, festa)',
          'Adicionar itens com categoria, quantidade e preço estimado',
          'Marcar itens como comprados e registrar o preço real pago',
          'Ver total estimado vs. total real ao final da compra',
          'Definir orçamento por lista e ver alerta se ultrapassar',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Crie a lista antes de sair de casa para não esquecer itens',
          'O preço real pago vai automaticamente para o Histórico de Preços',
          'Compartilhe a lista com o parceiro — ambos podem marcar itens simultaneamente',
        ],
      },
    ],
  },

  '/price-history': {
    title: 'Histórico de Preços',
    description: 'Rastreie o preço de produtos ao longo do tempo para comprar no melhor momento.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Registrar preços de produtos com local de compra e data',
          'Ver variação % entre o menor e o maior preço encontrado',
          'Calcular preço por unidade/kg para comparar embalagens diferentes',
          'Acompanhar a tendência de preço ao longo do tempo',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Registre sempre que achar um preço diferente do habitual (promoção ou aumento)',
          'Produtos do mercado/farmácia são os que mais se beneficiam do rastreamento',
          'Use para decidir quando vale a pena comprar em quantidade (promoção real ou não)',
        ],
      },
    ],
  },

  '/vehicles': {
    title: 'Veículos & Manutenções',
    description: 'Controle os custos e manutenções de cada veículo do casal.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Cadastrar carros e motos com marca, modelo, ano, placa e combustível',
          'Registrar cada manutenção: tipo, data, KM, valor e oficina',
          'Definir próxima manutenção por KM ou por data para receber alertas',
          'Atualizar o KM atual clicando no contador do veículo',
          'Ver histórico completo e total gasto em cada veículo',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Preencha "Próximo KM" na troca de óleo para ser avisado antes de vencer',
          'O card fica vermelho quando alguma manutenção está atrasada',
          'Clique em ↓ no card para expandir o histórico completo de manutenções',
          'Registre também IPVA, licenciamento e seguro para ver o custo anual real do veículo',
        ],
      },
    ],
  },

  '/insights': {
    title: 'Insights',
    description: 'Análises automáticas do seu comportamento financeiro dos últimos meses.',
    sections: [
      {
        icon: 'info',
        title: 'O que você vê aqui',
        items: [
          'Comparação de gastos vs. mês anterior com variação %',
          'Taxa de poupança atual e tendência',
          'Categoria que mais cresceu e categoria principal de gasto',
          'Melhor mês dos últimos 6 e sequência de meses positivos',
          'Detecção de possível assinatura não cadastrada como recorrente',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Os insights ficam mais ricos a partir de 2 meses de dados completos',
          'Insights amarelos são alertas — insights verdes são conquistas',
          'Acesse mensalmente como complemento ao Fechamento Mensal',
        ],
      },
    ],
  },

  '/monthly-close': {
    title: 'Fechamento Mensal',
    description: 'Ritual guiado para encerrar o mês de forma organizada.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Ver resumo do mês anterior: receitas, despesas, saldo e taxa de poupança',
          'Verificar checklist automático (transações, saldo, orçamentos, parcelas)',
          'Aportar em metas diretamente, sem navegar para outra página',
          'Ver orçamentos excedidos e parcelas não pagas do mês',
          'Identificar as 5 categorias com maiores gastos',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Faça o fechamento sempre no início do mês seguinte — leva menos de 5 minutos',
          'Quando todos os itens do checklist estão ✅ o mês foi gerido perfeitamente',
          'Use junto com Insights para entender as causas por trás dos números',
        ],
      },
    ],
  },

  '/reports': {
    title: 'Relatórios',
    description: 'Análise detalhada por período, categoria e conta.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Ver relatório mensal ou anual por categoria com gráficos',
          'Comparar dois meses lado a lado para identificar tendências',
          'Filtrar por conta, tipo ou categoria específica',
          'Exportar os dados em CSV para planilha externa',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Use a visão anual em dezembro para avaliar o desempenho do ano',
          'Compare meses sazonais — julho e dezembro costumam ter padrões específicos',
        ],
      },
      {
        icon: 'shortcut',
        title: 'Atalhos',
        items: ['R — ir direto para Relatórios'],
      },
    ],
  },

  '/activity': {
    title: 'Atividade',
    description: 'Feed cronológico de todas as ações do casal no sistema.',
    sections: [
      {
        icon: 'info',
        title: 'O que você vê aqui',
        items: [
          'Transações lançadas por qualquer membro do casal',
          'Aportes em metas e pagamentos de parcelas',
          'Usuário responsável por cada ação e tempo relativo',
          'Filtro por tipo: todas as ações, só transações, só metas',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Use para ver o que o parceiro lançou sem precisar filtrar em Transações',
          'Ícones coloridos: verde = entrada, vermelho = saída, azul = transferência',
        ],
      },
    ],
  },

  '/categories': {
    title: 'Categorias',
    description: 'Gerencie categorias padrão e crie as suas próprias.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode fazer',
        items: [
          'Criar categorias personalizadas com cor e tipo (entrada ou saída)',
          'Ver quantas transações cada categoria já tem ("12 usos")',
          'Reordenar categorias personalizadas com as setas',
          'Excluir categorias que não usa mais',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Crie categorias específicas do seu estilo de vida: "Pets", "Cursos", "Hobby"',
          'Categorias padrão não podem ser excluídas, mas podem ser ignoradas',
          'Use auto-categorização (em Transações) para aplicar categorias automaticamente',
        ],
      },
    ],
  },

  '/settings': {
    title: 'Configurações',
    description: 'Configurações do perfil pessoal e do casal.',
    sections: [
      {
        icon: 'info',
        title: 'O que você pode configurar',
        items: [
          'Nome de exibição e avatar',
          'Tema de cor e modo escuro',
          'Moeda padrão do casal (BRL, USD, EUR...)',
          'Limite diário de gastos com alerta no Dashboard',
          'Notificações push de vencimentos e orçamentos',
          'Backup completo dos dados em JSON',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Gere o link de convite para adicionar o parceiro ao mesmo casal',
          'Faça backup mensal antes de grandes mudanças nos dados',
          'O limite diário de gastos é individual, não compartilhado',
        ],
      },
    ],
  },

  '/help': {
    title: 'Ajuda',
    description: 'Central de ajuda com tour interativo e manual completo.',
    sections: [
      {
        icon: 'info',
        title: 'O que você encontra aqui',
        items: [
          'Tour interativo do sistema com destaques visuais',
          'Link para o manual completo com todas as funcionalidades',
          'Lista de todos os atalhos de teclado',
          'Informações sobre a versão atual',
        ],
      },
      {
        icon: 'tip',
        title: 'Dicas',
        items: [
          'Use ⌘K (ou Ctrl+K) para busca global em qualquer tela',
          'Pressione ? a qualquer momento para ver a lista de atalhos',
          'Este botão "?" está disponível em todas as páginas do sistema',
        ],
      },
    ],
  },
}

const ICON_MAP = {
  info: Info,
  tip: Lightbulb,
  shortcut: Zap,
}

const ICON_STYLE = {
  info: 'text-blue-500',
  tip: 'text-amber-500',
  shortcut: 'text-purple-500',
}

const SECTION_BG = {
  info: 'bg-blue-50 border-blue-100',
  tip: 'bg-amber-50 border-amber-100',
  shortcut: 'bg-purple-50 border-purple-100',
}

export function PageHelp() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Match exact or strip trailing slash
  const key = pathname.replace(/\/$/, '') || '/dashboard'
  const content = HELP[key]

  if (!content) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        title="Ajuda desta página"
        aria-label="Ajuda"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-end pt-16 pr-4 pb-4 pointer-events-none"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 pointer-events-auto"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[calc(100vh-5rem)] overflow-hidden animate-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary-500" />
                  <p className="text-sm font-semibold text-gray-900">{content.title}</p>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{content.description}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg shrink-0 ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {content.sections.map((section, i) => {
                const Icon = ICON_MAP[section.icon]
                return (
                  <div key={i} className={cn('rounded-xl border p-3.5', SECTION_BG[section.icon])}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn('w-3.5 h-3.5 shrink-0', ICON_STYLE[section.icon])} />
                      <p className="text-xs font-semibold text-gray-700">{section.title}</p>
                    </div>
                    <ul className="space-y-1.5">
                      {section.items.map((item, j) => (
                        <li key={j} className="text-xs text-gray-600 flex gap-2">
                          <span className="text-gray-300 shrink-0 mt-0.5">·</span>
                          <span dangerouslySetInnerHTML={{ __html: item }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-50 shrink-0">
              <a
                href="/manual"
                target="_blank"
                className="text-xs text-primary-600 hover:underline"
              >
                Ver manual completo →
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
