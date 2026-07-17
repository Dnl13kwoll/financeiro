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
    // Preserve newlines for block/row elements so product lines stay separated
    .replace(/<\/?(tr|br|li|p|div|h[1-6])[^>]*>/gi, '\n')
    .replace(/<\/?(td|th)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
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

const SKIP_WORDS = /^(TOTAL|SUBTOTAL|DESCONTO|ACRESCIMO|ACRÉSCIMO|TROCO|PAGO|FORMA|DATA|HORA|CNPJ|NOTA|NÚMERO|SÉRIE|CHAVE|PROTOCOLO|VALOR|ENDEREÇO|BAIRRO|MUNICÍPIO|CEP|FONE|IE|CPF|CAIXA|OPERADOR|EMISSÃO|PAGAMENTO)/i
const UNITS = /^(UN|KG|GR|G|LT|L|ML|MT|M|PC|CX|PT|SC|DZ|CT|FR|FD|BJ|RL|AM|VD|TB|BD|GA|KT|ST|SV|CM|MG|AMP|CAP|CMP|ENV|BIS|UN|PC)$/

function parseNFe(html: string): NFeData {
  const text = stripHtml(html)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // CNPJ
  const cnpjMatch = text.match(/\d{2}\.?\d{3}\.?\d{3}\/\d{4}-\d{2}/)
  const cnpj = cnpjMatch ? cnpjMatch[0] : ''

  // Establishment name — text immediately before the CNPJ
  let establishment = ''
  if (cnpj && cnpjMatch) {
    const idx = text.indexOf(cnpjMatch[0])
    const before = text.substring(Math.max(0, idx - 300), idx).trim()
    const words = before.split(/\s+/)
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

  const products: NFeProduct[] = []
  let m: RegExpExecArray | null

  // ── Pattern A: keyword-based (multi-states)
  // "NAME ... Qtde.: X UN Vl. Unit.: R$ Y Vl. Total R$ Z"
  const patternA = /([\w][\w\s\-\/\(\)\.]{2,70}?)\s+(?:Qtde?\.?|Qt(?:d)?\.?|Quantidade)\s*:?\s*([\d,.]+)\s*(?:[A-Z]{2,5}\s+)?(?:Vl\.?\s*Unit(?:ário)?\.?\s*:?\s*R?\$?\s*([\d.,]+)\s+)?Vl\.?\s*Total\s*:?\s*R?\$?\s*([\d.,]+)/gi
  while ((m = patternA.exec(text)) !== null) {
    const name = m[1].trim().replace(/\s+/g, ' ')
    const qty = parseBRL(m[2])
    const unitPrice = m[3] ? parseBRL(m[3]) : 0
    const itemTotal = parseBRL(m[4])
    if (name.length >= 3 && qty > 0 && itemTotal > 0 && itemTotal <= total * 1.2 && !SKIP_WORDS.test(name)) {
      products.push({
        name: name.toUpperCase(),
        qty,
        unit_price: unitPrice > 0 ? unitPrice : +(itemTotal / qty).toFixed(2),
        total: itemTotal,
      })
    }
  }

  // ── Pattern B: line-based table (SP, MG, RS and others)
  // Format per line: [code] NAME qty UNIT unitprice total
  // qty has exactly 3 decimal places: "1,000" "2,500"
  if (products.length === 0) {
    for (const line of lines) {
      if (SKIP_WORDS.test(line)) continue
      // Optional leading item number, then product name, then qty (d,ddd), unit, price, total
      const mLine = line.match(
        /^(?:\d{1,6}\s+)?([A-Za-záéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ][\w\s\-\/\(\)\.]{2,60}?)\s+([\d]+[,.][\d]{3})\s+([A-Z]{2,5})\s+([\d.,]+)\s+([\d.,]+)\s*$/
      )
      if (!mLine) continue
      const name = mLine[1].trim().replace(/\s+/g, ' ')
      const unit = mLine[3]
      if (!UNITS.test(unit)) continue
      const qty = parseBRL(mLine[2])
      const unitPrice = parseBRL(mLine[4])
      const itemTotal = parseBRL(mLine[5])
      if (qty > 0 && itemTotal > 0 && itemTotal <= total * 1.2) {
        products.push({ name: name.toUpperCase(), qty, unit_price: unitPrice, total: itemTotal })
      }
    }
  }

  // ── Pattern C: line-based without unit (simplified receipts)
  // Format per line: [code] NAME qty price total  OR  NAME price total
  if (products.length === 0) {
    for (const line of lines) {
      if (SKIP_WORDS.test(line)) continue
      const mLine = line.match(
        /^(?:\d{1,6}\s+)?([A-Za-záéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ][\w\s\-\/\(\)\.]{2,60}?)\s+([\d]+[,.][\d]{3})\s+([\d.,]+)\s+([\d.,]+)\s*$/
      )
      if (!mLine) continue
      const name = mLine[1].trim().replace(/\s+/g, ' ')
      const qty = parseBRL(mLine[2])
      const unitPrice = parseBRL(mLine[3])
      const itemTotal = parseBRL(mLine[4])
      if (qty > 0 && itemTotal > 0 && itemTotal <= total * 1.2) {
        products.push({ name: name.toUpperCase(), qty, unit_price: unitPrice, total: itemTotal })
      }
    }
  }

  // ── Pattern D: fallback "R$ price" per line
  if (products.length === 0) {
    for (const line of lines) {
      if (SKIP_WORDS.test(line)) continue
      const mLine = line.match(/^(?:\d{1,6}\s+)?([A-Za-záéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ][\w\s\-\/\(\)\.]{2,60}?)\s+R\$\s*([\d.,]+)\s*$/)
      if (!mLine) continue
      const name = mLine[1].trim().replace(/\s+/g, ' ')
      const price = parseBRL(mLine[2])
      if (price > 0 && price < total) {
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
