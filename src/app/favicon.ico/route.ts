import { NextRequest, NextResponse } from 'next/server'

export function GET(request: NextRequest) {
  const url = new URL('/icon.svg', request.url)
  return NextResponse.redirect(url, { status: 301 })
}
