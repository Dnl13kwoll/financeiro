'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

type TourStep = {
  title: string
  description: string
  tip?: string
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Bem-vindo ao Financeiro!',
    description: 'Este tour rápido vai te mostrar as principais funcionalidades do sistema para casais.',
    tip: 'Você pode fechar a qualquer momento e retomar mais tarde.',
  },
  {
    title: 'Dashboard',
    description: 'Veja um resumo financeiro completo: saldo das contas, receitas e despesas do mês, metas e próximos vencimentos.',
    tip: 'Acesse o Dashboard clicando no primeiro item do menu lateral.',
  },
  {
    title: 'Transações',
    description: 'Registre todas as entradas e saídas. Use o atalho "N" para abrir rapidamente o formulário de nova transação.',
    tip: 'Você pode importar extratos em formato CSV ou OFX!',
  },
  {
    title: 'Orçamentos',
    description: 'Defina limites de gasto por categoria. Receba alertas quando estiver se aproximando do limite.',
    tip: 'Use "Sugerir" para criar orçamentos baseados no seu histórico automaticamente.',
  },
  {
    title: 'Metas',
    description: 'Crie metas financeiras com valor alvo e prazo. Acompanhe o progresso e faça aportes regulares.',
    tip: 'O sistema calcula quanto você precisa poupar por mês para atingir a meta no prazo.',
  },
  {
    title: 'Regras de categorias',
    description: 'Na página de Transações, use "Regras" para criar padrões de auto-categorização baseados na descrição.',
    tip: 'Exemplo: qualquer transação que contém "Uber" vira automaticamente "Transporte".',
  },
  {
    title: 'Relatórios',
    description: 'Analise seus gastos com gráficos, compare meses e veja a tendência de cada categoria.',
    tip: 'Use o botão de impressão para salvar como PDF.',
  },
  {
    title: 'Tudo pronto!',
    description: 'Você já conhece as principais funcionalidades. Explore o sistema e não hesite em consultar a Ajuda (menu lateral).',
    tip: 'Pressione "N" em qualquer página para lançar uma nova transação rapidamente.',
  },
]

const STORAGE_KEY = 'onboarding_tour_done'

export function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      // Small delay so layout settles
      const t = setTimeout(() => setVisible(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function next() {
    if (step < TOUR_STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      dismiss()
    }
  }

  function prev() {
    setStep(s => Math.max(0, s - 1))
  }

  if (!visible) return null

  const current = TOUR_STEPS[step]
  const isLast = step === TOUR_STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-5">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full flex-1 transition-colors cursor-pointer ${i === step ? 'bg-primary-600' : i < step ? 'bg-primary-200' : 'bg-gray-100'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">
            Passo {step + 1} de {TOUR_STEPS.length}
          </p>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{current.description}</p>
          {current.tip && (
            <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-700">
                <span className="font-semibold">Dica: </span>{current.tip}
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <button
            onClick={next}
            className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
          >
            {isLast ? 'Começar!' : 'Próximo'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
