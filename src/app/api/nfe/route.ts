import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Only allow official Brazilian government fiscal domains
function isAllowedNFeUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    const h = hostname.toLowerCase()
    return h.endsWith('.gov.br') && (
      h.includes('nfce') || h.includes('nfe') ||
      h.includes('sefaz') || h.includes('fazenda') ||
      h.includes('sat.sef')
    )
  } catch {
    return false
  }
}

function parseBRL(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface NFeProduct {
  name: string
  qty: number
  unit_price: number
  total: number
}

export interface NFeData {
  establishment: string
  cnpj: string
  date: string
  total: number
  products: NFeProduct[]
}

function parseNFe(html: string): NFeData {
  const text = stripHtml(html)

  // CNPJ
  const cnpjMatch = text.match(/\d{2}\.?\d{3}\.?\d{3}\/\d{4}-\d{2}/)
  const cnpj = cnpjMatch ? cnpjMatch[0] : ''

  // Establishment name — text immediately before the CNPJ
  let establishment = ''
  if (cnpj && cnpjMatch) {
    const idx = text.indexOf(cnpjMatch[0])
    const before = text.substring(Math.max(0, idx - 300), idx).trim()
    const words = before.split(/\s+/)
    // Take last 6–10 words (typical business name length)
    establishment = words.slice(-8).join(' ').replace(/[^A-Za-záéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ0-9\s\-&.,]/g, '').trim()
  }

  // Date — DD/MM/YYYY
  const dateMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  const date = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : new Date().toISOString().slice(0, 10)

  // Total — try several keywords
  let total = 0
  for (const pattern of [
    /VALOR\s+TOTAL\s+R?\$?\s*([\d.,]+)/i,
    /TOTAL\s+A\s+PAGAR\s+R?\$?\s*([\d.,]+)/i,
    /TOTAL\s+R?\$?\s*([\d.,]+)/i,
    /VALOR\s+A\s+PAGAR\s+R?\$?\s*([\d.,]+)/i,
  ]) {
    const m = text.match(pattern)
    if (m) { total = parseBRL(m[1]); break }
  }

  // Products — common NFC-e patterns across states
  const products: NFeProduct[] = []

  // Pattern A: "NAME ... Qtde.: X UN Vl. Unit.: R$ Y Vl. Total R$ Z"
  const patternA = /([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ][^\d]{3,60}?)\s+(?:Qtde?\.?|Qt(?:d)?\.?|Quantidade)\s*:?\s*([\d,]+)\s*(?:[A-Z]{2,3}\s+)?(?:Vl\.?\s*Unit(?:ário)?\.?\s*:?\s*R?\$?\s*([\d.,]+)\s+)?Vl\.?\s*Total\s*:?\s*R?\$?\s*([\d.,]+)/gi
  let m: RegExpExecArray | null
  while ((m = patternA.exec(text)) !== null) {
    const name = m[1].trim().replace(/\s+/g, ' ')
    const qty = parseBRL(m[2])
    const unitPrice = m[3] ? parseBRL(m[3]) : 0
    const itemTotal = parseBRL(m[4])
    if (name.length >= 3 && qty > 0 && itemTotal > 0 && itemTotal <= total * 1.1) {
      products.push({
        name: name.toUpperCase(),
        qty,
        unit_price: unitPrice > 0 ? unitPrice : +(itemTotal / qty).toFixed(2),
        total: itemTotal,
      })
    }
  }

  // Pattern B (table-like): repeated "NAME R$ PRICE" outside known sections
  if (products.length === 0) {
    const skipWords = /^(TOTAL|SUBTOTAL|DESCONTO|ACRESCIMO|TROCO|PAGO|FORMA|DATA|HORA|CNPJ|NOTA|NÚMERO|SÉRIE|CHAVE|PROTOCOLO|VALOR|ENDEREÇO|BAIRRO|MUNICÍPIO|CEP|FONE|IE|CPF|CAIXA|OPERADOR)/i
    const patternB = /([A-ZÁÉÍÓÚÀÂÊÔÃÕÇ][^\n]{4,50}?)\s+R\$\s*([\d.,]+)/g
    while ((m = patternB.exec(text)) !== null) {
      const name = m[1].trim().replace(/\s+/g, ' ')
      const price = parseBRL(m[2])
      if (price > 0 && price < total && !skipWords.test(name)) {
        products.push({ name: name.toUpperCase(), qty: 1, unit_price: price, total: price })
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  const unique = products.filter(p => {
    const key = `${p.name}|${p.total}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { establishment, cnpj, date, total, products: unique }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { url } = body as { url?: string }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 })
  }

  if (!isAllowedNFeUrl(url)) {
    return NextResponse.json({ error: 'URL não reconhecida como SEFAZ/NFC-e oficial (.gov.br)' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `SEFAZ retornou ${res.status}. Tente novamente.` }, { status: 502 })
    }

    const html = await res.text()
    const nfe = parseNFe(html)

    return NextResponse.json(nfe)
  } catch (err: any) {
    if (err?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'A SEFAZ demorou para responder. Tente novamente.' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Erro ao acessar a nota fiscal' }, { status: 500 })
  }
}
