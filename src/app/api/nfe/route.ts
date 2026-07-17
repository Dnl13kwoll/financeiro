import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Portais NFC-e oficiais por estado — todos terminam em .gov.br
// RS/SC/PR: dfe-portal.svrs.rs.gov.br (SVRS - portal sul)
// PA: appnfc.sefa.pa.gov.br
// RO: www.nfce.sefin.ro.gov.br
// PB/RN: nfce.set.pb.gov.br / nfce.set.rn.gov.br
// SP/MG/RJ/PR: nfce.fazenda.*.gov.br
// BA/CE/AM/GO/...: nfe.sefaz.*.gov.br
function isAllowedNFeUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    const h = hostname.toLowerCase()
    if (!h.endsWith('.gov.br')) return false
    return (
      h.includes('nfce') || h.includes('nfe') ||
      h.includes('sefaz') || h.includes('fazenda') ||
      h.includes('sat.sef') || h.includes('svrs') ||
      h.includes('sefa') || h.includes('sefin') ||
      h.includes('dfe-portal') || h.includes('.set.')
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
  const foundKeys = new Set<string>()
  let m: RegExpExecArray | null

  function addProduct(p: NFeProduct) {
    if (p.name.length < 3 || p.qty <= 0 || p.total <= 0) return
    if (total > 0 && p.total > total * 1.3) return
    if (SKIP_WORDS.test(p.name)) return
    const key = `${p.name}|${p.total}|${p.qty}`
    if (foundKeys.has(key)) return
    foundKeys.add(key)
    products.push(p)
  }

  // Nome: início com letra (com acentos), continuação flexível — inclui acentos, dígitos, especiais
  const NAME = String.raw`([A-Za-záéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ][A-Za-záéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ0-9\s\-\/\(\)\.%*+&']{2,80}?)`
  const QTY  = String.raw`([\d]+[,.][\d]{1,4})`  // 1–4 casas decimais
  const PRC  = String.raw`R?\$?\s*([\d]{1,3}(?:\.[\d]{3})*[,.][\d]{2})`  // R$ 1.234,56 ou 1234,56

  // ── Pattern A: keywords "Qtde." / "Vl.Total" (BA, CE, AM, algumas SP)
  const reA = new RegExp(`${NAME}\\s+(?:Qtde?\\.?|Qt(?:d)?\\.|Quantidade)\\s*:?\\s*${QTY}\\s*(?:[A-Z]{2,5}\\s+)?(?:Vl\\.?\\s*Unit(?:ário)?\\.?\\s*:?\\s*R?\\$?\\s*[\\d.,]+\\s+)?Vl\\.?\\s*Total\\s*:?\\s*R?\\$?\\s*(${PRC.slice(6)})`, 'gi')
  while ((m = reA.exec(text)) !== null) {
    const qty = parseBRL(m[2])
    const unitPrice = m[3] ? parseBRL(m[3]) : 0
    const itemTotal = parseBRL(m[4])
    addProduct({ name: m[1].trim().replace(/\s+/g, ' ').toUpperCase(), qty, unit_price: unitPrice || +(itemTotal / qty).toFixed(2), total: itemTotal })
  }

  // ── Patterns linha a linha (B, C, D) — rodam SEMPRE, complementando A
  for (const line of lines) {
    if (SKIP_WORDS.test(line.trim())) continue
    const l = line.trim()

    // Pattern B: [cod] NOME qty UNIT [R$]preço [R$]total  — SVRS/RS, SP, MG, RJ...
    const mB = l.match(new RegExp(
      `^(?:\\d{1,8}\\s+)?${NAME}\\s+${QTY}\\s+([A-Z]{2,5})\\s+${PRC}\\s+${PRC}\\s*$`
    ))
    if (mB && UNITS.test(mB[3])) {
      addProduct({ name: mB[1].trim().replace(/\s+/g, ' ').toUpperCase(), qty: parseBRL(mB[2]), unit_price: parseBRL(mB[4]), total: parseBRL(mB[5]) })
      continue
    }

    // Pattern C: [cod] NOME qty [R$]preço [R$]total  — sem unidade
    const mC = l.match(new RegExp(
      `^(?:\\d{1,8}\\s+)?${NAME}\\s+${QTY}\\s+${PRC}\\s+${PRC}\\s*$`
    ))
    if (mC) {
      addProduct({ name: mC[1].trim().replace(/\s+/g, ' ').toUpperCase(), qty: parseBRL(mC[2]), unit_price: parseBRL(mC[3]), total: parseBRL(mC[4]) })
      continue
    }

    // Pattern D: [cod] NOME [R$]total  — apenas valor final (qty=1)
    const mD = l.match(new RegExp(
      `^(?:\\d{1,8}\\s+)?${NAME}\\s+${PRC}\\s*$`
    ))
    if (mD) {
      const price = parseBRL(mD[2])
      if (price > 0.01 && (total === 0 || price < total)) {
        addProduct({ name: mD[1].trim().replace(/\s+/g, ' ').toUpperCase(), qty: 1, unit_price: price, total: price })
      }
    }
  }

  const unique = [...products]

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
