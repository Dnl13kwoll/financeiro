import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { differenceInDays, parseISO } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false }, { status: 401 })

    const { data: member } = await supabase
      .from('couple_members').select('couple_id').eq('user_id', user.id).maybeSingle()
    const coupleId = (member as any)?.couple_id
    if (!coupleId) return NextResponse.json({ ok: false })

    const db = supabase as any

    // Fetch vehicle maintenances with next_date
    const { data: vehicleMaints } = await db
      .from('vehicle_maintenances')
      .select('id, type, next_date, next_km, vehicles(name, current_km)')
      .eq('couple_id', coupleId)
      .not('next_date', 'is', null)

    // Fetch property maintenances with next_date or urgent pending
    const { data: propMaints } = await db
      .from('property_maintenances')
      .select('id, type, next_date, priority, status, properties(name)')
      .eq('couple_id', coupleId)

    // Fetch existing notification keys to avoid duplicates
    const { data: existingNotifs } = await db
      .from('notifications')
      .select('body')
      .eq('couple_id', coupleId)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())

    const existingBodies = new Set((existingNotifs ?? []).map((n: any) => n.body))

    const toInsert: any[] = []

    // Vehicle alerts
    for (const m of vehicleMaints ?? []) {
      const vehicle = (m.vehicles as any)
      if (!m.next_date) continue
      const diff = differenceInDays(parseISO(m.next_date), new Date())
      let title = '', body = '', type = 'warning'

      if (diff < 0) {
        title = `Manutenção atrasada: ${m.type}`
        body = `${vehicle?.name ?? 'Veículo'} — venceu há ${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? 's' : ''}`
        type = 'error'
      } else if (diff <= 7) {
        title = `Manutenção próxima: ${m.type}`
        body = `${vehicle?.name ?? 'Veículo'} — vence em ${diff} dia${diff !== 1 ? 's' : ''}`
      }

      if (title && !existingBodies.has(body)) {
        toInsert.push({ couple_id: coupleId, title, body, type, href: '/vehicles', read: false })
      }

      // KM alert
      if (m.next_km && vehicle?.current_km) {
        const kmDiff = m.next_km - vehicle.current_km
        if (kmDiff <= 1000 && kmDiff > 0) {
          const kmBody = `${vehicle.name} — faltam ${kmDiff} km para ${m.type}`
          if (!existingBodies.has(kmBody)) {
            toInsert.push({ couple_id: coupleId, title: `Manutenção por km: ${m.type}`, body: kmBody, type: 'warning', href: '/vehicles', read: false })
          }
        } else if (kmDiff <= 0) {
          const kmBody = `${vehicle.name} — ${m.type} ultrapassou o km de retorno`
          if (!existingBodies.has(kmBody)) {
            toInsert.push({ couple_id: coupleId, title: `Manutenção vencida por km: ${m.type}`, body: kmBody, type: 'error', href: '/vehicles', read: false })
          }
        }
      }
    }

    // Property alerts
    for (const m of propMaints ?? []) {
      const property = (m.properties as any)
      const pName = property?.name ?? 'Imóvel'

      // Urgent pending
      if (m.priority === 'urgente' && m.status !== 'concluido') {
        const body = `${pName} — ${m.type} com prioridade urgente`
        if (!existingBodies.has(body)) {
          toInsert.push({ couple_id: coupleId, title: `Manutenção urgente: ${m.type}`, body, type: 'error', href: '/imoveis', read: false })
        }
      }

      // Next date
      if (m.next_date && m.status === 'concluido') {
        const diff = differenceInDays(parseISO(m.next_date), new Date())
        if (diff < 0) {
          const body = `${pName} — ${m.type} venceu há ${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? 's' : ''}`
          if (!existingBodies.has(body)) {
            toInsert.push({ couple_id: coupleId, title: `Manutenção residencial atrasada: ${m.type}`, body, type: 'error', href: '/imoveis', read: false })
          }
        } else if (diff <= 14) {
          const body = `${pName} — ${m.type} vence em ${diff} dia${diff !== 1 ? 's' : ''}`
          if (!existingBodies.has(body)) {
            toInsert.push({ couple_id: coupleId, title: `Manutenção residencial próxima: ${m.type}`, body, type: 'warning', href: '/imoveis', read: false })
          }
        }
      }
    }

    if (toInsert.length > 0) {
      await db.from('notifications').insert(toInsert)
    }

    return NextResponse.json({ ok: true, inserted: toInsert.length })
  } catch (e) {
    return NextResponse.json({ ok: false })
  }
}
