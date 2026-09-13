import { Package as PackageIcon } from 'lucide-react'
import { normalizeItems, packageItemOf } from '../../../lib/catalog'

/** اسم الباقة المختارة في عرض سعر أو عقد — لا يظهر شيء إن لم تُختر باقة */
export default function PackageBadge({ items }: { items: unknown }) {
  const pkg = packageItemOf(normalizeItems(items))
  if (!pkg) return null
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-[#d4af37]/10 text-[#d4af37]">
      <PackageIcon className="w-3 h-3" />
      {pkg.name}
    </span>
  )
}
