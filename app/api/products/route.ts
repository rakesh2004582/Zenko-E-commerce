export const runtime = 'edge';



import { NextResponse } from 'next/server'
import { getAllProducts, searchProducts } from '@/lib/dataLoader'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('ids')
  const q = searchParams.get('q')

  if (q) {
    const results = await searchProducts(q)
    return NextResponse.json(results)
  }

  if (ids) {
    const idList = ids.split(',')
    const products = await getAllProducts()
    return NextResponse.json(products.filter(p => idList.includes(p.id)))
  }

  const products = await getAllProducts()
  return NextResponse.json(products)
}
