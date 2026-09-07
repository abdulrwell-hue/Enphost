import { formatSAR } from '../../../lib/pricing'
import {
  portfolioUsageLabel,
  type ContractClauseSnapshot, type ContractItem, type ContractTotals,
} from '../../../lib/contracts'

export interface ContractPrintData {
  contractNumber: string
  orderNumber: string
  signDate: string
  signCity: string
  durationFrom: string
  durationTo: string

  provider: {
    legalName: string; registration: string; address: string
    repName: string; repTitle: string; phone: string; email: string
  }
  client: {
    name: string; idNumber: string; address: string
    repName: string; repTitle: string; phone: string; email: string
  }

  propertyName: string
  propertyLocation: string
  shootDate: string
  shootTime: string
  siteContactName: string
  siteContactPhone: string

  items: ContractItem[]
  totals: ContractTotals
  discountPct: number
  vatEnabled: boolean
  vatPct: number
  depositPct: number
  balanceDueOn: string

  revisionRounds: number
  deliveryFormat: string
  platforms: string
  rawFilesIncluded: boolean
  rawFilesPrice: number
  travelFeeIncluded: boolean
  travelFee: number
  rescheduleTerms: string

  portfolioUsage: string
  notes: string
  clauses: ContractClauseSnapshot[]
  businessName: string
}

const BLANK = '____________________'
const fill = (v: string | undefined | null) => (v && String(v).trim()) || BLANK

/** صف في جدول بيانات من عمودين */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="border border-[#ddd] bg-[#faf7ee] py-1.5 px-3 font-bold text-[#7a6420] w-44 align-top">
        {label}
      </td>
      <td className="border border-[#ddd] py-1.5 px-3 align-top">{children}</td>
    </tr>
  )
}

function DataTable({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5" style={{ breakInside: 'avoid' }}>
      {title && <p className="text-sm font-black text-[#b8952e] mb-1.5">{title}</p>}
      <table className="w-full text-[11px] border-collapse"><tbody>{children}</tbody></table>
    </div>
  )
}

/** نص البند — الأسطر التي تبدأ بشرطة تُعرض كنقاط */
function ClauseBody({ body }: { body: string }) {
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean)
  const out: React.ReactNode[] = []
  let bullets: string[] = []

  const flush = (key: string) => {
    if (!bullets.length) return
    const current = bullets
    out.push(
      <ul key={key} className="mt-1 mb-1 space-y-0.5">
        {current.map((b, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="text-[#d4af37] flex-shrink-0">◄</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>,
    )
    bullets = []
  }

  lines.forEach((line, i) => {
    if (line.startsWith('-')) {
      bullets.push(line.replace(/^-\s*/, ''))
    } else {
      flush(`ul-${i}`)
      out.push(<p key={i} className="leading-relaxed">{line}</p>)
    }
  })
  flush('ul-end')
  return <div className="text-[11px] text-[#333] space-y-1">{out}</div>
}

/**
 * Paper version of the contract — the document the client receives and signs.
 * Hidden on screen (`.print-sheet`) and revealed by the print rules in
 * styles/index.css, so «طباعة / PDF» prints only this.
 */
export default function ContractPrint({ data }: { data: ContractPrintData }) {
  const {
    contractNumber, orderNumber, signDate, signCity, durationFrom, durationTo,
    provider, client, propertyName, propertyLocation, shootDate, shootTime,
    siteContactName, siteContactPhone, items, totals, discountPct, vatEnabled,
    vatPct, depositPct, balanceDueOn, revisionRounds, deliveryFormat, platforms,
    rawFilesIncluded, rawFilesPrice, travelFeeIncluded, travelFee,
    rescheduleTerms, portfolioUsage, notes, clauses, businessName,
  } = data

  return (
    <div
      id="print-sheet"
      className="print-sheet bg-white text-[#111]"
      dir="rtl"
      style={{ fontFamily: "'Cairo', sans-serif" }}
    >
      {/* ── Title ──────────────────────────────────────────────────────────── */}
      <div className="text-center border-b-2 border-[#d4af37] pb-4 mb-5">
        <p className="text-lg font-black text-[#b8952e] tracking-wide">
          {businessName || 'ENPHO STUDIO'}
        </p>
        <h1 className="text-xl font-black mt-1.5">
          عقد تقديم خدمات التصوير والتسويق البصري العقاري
        </h1>
      </div>

      {/* ── بيانات العقد ───────────────────────────────────────────────────── */}
      <DataTable title="بيانات العقد">
        <Row label="رقم العقد">{fill(contractNumber)}</Row>
        <Row label="تاريخ التوقيع">{fill(signDate)}</Row>
        <Row label="مدينة التوقيع">{fill(signCity)}</Row>
        <Row label="مدة العقد">
          من {fill(durationFrom)} إلى {fill(durationTo)}
        </Row>
      </DataTable>

      {/* ── أولًا: أطراف العقد ─────────────────────────────────────────────── */}
      <p className="text-sm font-black text-[#b8952e] mb-1.5">أولًا: أطراف العقد</p>

      <DataTable>
        <Row label="الطرف الأول — مقدم الخدمة">{fill(provider.legalName)}</Row>
        <Row label="السجل / وثيقة العمل">{fill(provider.registration)}</Row>
        <Row label="العنوان">{fill(provider.address)}</Row>
        <Row label="الممثل">
          {fill(provider.repName)}، بصفته {fill(provider.repTitle)}
        </Row>
        <Row label="التواصل">
          <span dir="ltr">{fill(provider.phone)}</span>
          {'  |  '}
          <span dir="ltr">{fill(provider.email)}</span>
        </Row>
      </DataTable>

      <DataTable>
        <Row label="الطرف الثاني — العميل">{fill(client.name)}</Row>
        <Row label="الهوية / السجل">{fill(client.idNumber)}</Row>
        <Row label="العنوان">{fill(client.address)}</Row>
        <Row label="الممثل والصفة">
          {fill(client.repName)}
          {client.repTitle ? `، بصفته ${client.repTitle}` : ''}
        </Row>
        <Row label="التواصل">
          <span dir="ltr">{fill(client.phone)}</span>
          {'  |  '}
          <span dir="ltr">{fill(client.email)}</span>
        </Row>
      </DataTable>

      <p className="text-[11px] text-[#333] leading-relaxed mb-5">
        ويُشار إلى كل منهما منفردًا بـ«طرف»، ومجتمعين بـ«الطرفين». وقد اتفقا، وهما بكامل
        الأهلية المعتبرة، على الآتي:
      </p>

      {/* ── البنود ─────────────────────────────────────────────────────────── */}
      {clauses.map((c, i) => (
        <div key={i} className="mb-4" style={{ breakInside: 'avoid' }}>
          <p className="text-[13px] font-black text-[#b8952e] mb-1">{c.title}</p>
          <ClauseBody body={c.body} />

          {/* خيار استخدام الأعمال يتبع بند حقوق الملكية مباشرة */}
          {c.slug === 'ip_usage' && (
            <p className="text-[11px] text-[#333] mt-1.5">
              <span className="font-bold">استخدام الطرف الأول للأعمال في ملفه ومعارضه: </span>
              {portfolioUsageLabel(portfolioUsage) || BLANK}
            </p>
          )}
        </div>
      ))}

      {/* ── نموذج طلب الخدمة ───────────────────────────────────────────────── */}
      <div style={{ breakBefore: 'page' }} className="pt-2">
        <div className="text-center border-b-2 border-[#d4af37] pb-3 mb-5">
          <h2 className="text-lg font-black">نموذج طلب خدمة</h2>
          <p className="text-[11px] text-[#666] mt-1">
            جزء لا يتجزأ من العقد رقم {fill(contractNumber)}
          </p>
        </div>

        <DataTable title="بيانات المشروع">
          <Row label="رقم الطلب">{fill(orderNumber)}</Row>
          <Row label="مرجع العقد">{fill(contractNumber)}</Row>
          <Row label="اسم العميل">{fill(client.name)}</Row>
          <Row label="اسم / نوع العقار">{fill(propertyName)}</Row>
          <Row label="الموقع">{fill(propertyLocation)}</Row>
          <Row label="موعد التصوير">
            {fill(shootDate)}{shootTime ? `، الساعة ${shootTime}` : ''}
          </Row>
          <Row label="جهة الاتصال بالموقع">
            {fill(siteContactName)}
            {'  —  '}
            <span dir="ltr">{fill(siteContactPhone)}</span>
          </Row>
        </DataTable>

        {/* جدول الخدمات */}
        <table className="w-full text-[11px] border-collapse mb-5">
          <thead>
            <tr className="bg-[#f6f2e6] text-[#7a6420]">
              <th className="text-right font-bold py-2 px-2.5 border border-[#e6ddc4]">الخدمة</th>
              <th className="text-right font-bold py-2 px-2.5 border border-[#e6ddc4]">المواصفات / الكمية</th>
              <th className="text-center font-bold py-2 px-2.5 border border-[#e6ddc4] w-24">مدة التسليم</th>
              <th className="text-center font-bold py-2 px-2.5 border border-[#e6ddc4] w-24">السعر (ر.س)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="border border-[#e6ddc4] py-6 text-center text-[#999]">
                  لم تُضف خدمات بعد
                </td>
              </tr>
            ) : items.map(item => (
              <tr key={item.id} style={{ breakInside: 'avoid' }}>
                <td className="py-2 px-2.5 border border-[#e6ddc4] align-top font-bold">
                  {item.service || '—'}
                </td>
                <td className="py-2 px-2.5 border border-[#e6ddc4] align-top text-[#555]">
                  {item.spec || '—'}
                </td>
                <td className="py-2 px-2.5 border border-[#e6ddc4] align-top text-center">
                  {item.delivery || '—'}
                </td>
                <td className="py-2 px-2.5 border border-[#e6ddc4] align-top text-center font-bold">
                  {formatSAR(item.price)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* القيمة والدفعات */}
        <DataTable title="القيمة والدفعات">
          {totals.discountAmount > 0 && (
            <Row label="المجموع قبل الخصم">{formatSAR(totals.subtotal)} ر.س</Row>
          )}
          {totals.discountAmount > 0 && (
            <Row label={`الخصم (${discountPct}%)`}>- {formatSAR(totals.discountAmount)} ر.س</Row>
          )}
          <Row label="الإجمالي قبل الضريبة">{formatSAR(totals.afterDiscount)} ر.س</Row>
          <Row label="الضريبة إن وجبت">
            {vatEnabled ? `${formatSAR(totals.vatAmount)} ر.س (${vatPct}%)` : 'غير مشمولة'}
          </Row>
          <Row label="الإجمالي النهائي">
            <span className="font-black text-[#b8952e]">{formatSAR(totals.total)} ر.س</span>
          </Row>
          <Row label="الدفعة المقدمة">
            {depositPct}% = {formatSAR(totals.depositAmount)} ر.س
          </Row>
          <Row label="الرصيد وموعده">
            {formatSAR(totals.balanceAmount)} ر.س، يستحق عند {fill(balanceDueOn)}
          </Row>
        </DataTable>

        {/* شروط التنفيذ */}
        <DataTable title="شروط التنفيذ">
          <Row label="عدد جولات المراجعة">{revisionRounds} جولة</Row>
          <Row label="صيغة التسليم">{fill(deliveryFormat)}</Row>
          <Row label="المقاسات والمنصات">{fill(platforms)}</Row>
          <Row label="الملفات الخام">
            {rawFilesIncluded
              ? `مشمولة${rawFilesPrice > 0 ? ` بسعر ${formatSAR(rawFilesPrice)} ر.س` : ''}`
              : 'غير مشمولة'}
          </Row>
          <Row label="رسوم الانتقال">
            {travelFeeIncluded ? 'مشمولة' : `${formatSAR(travelFee)} ر.س`}
          </Row>
          <Row label="إعادة الجدولة">{rescheduleTerms.trim() || 'وفق العقد'}</Row>
        </DataTable>

        {notes && (
          <div className="mb-5" style={{ breakInside: 'avoid' }}>
            <p className="text-sm font-black text-[#b8952e] mb-1.5">ملاحظات ونطاق خاص</p>
            <p className="text-[11px] text-[#333] leading-relaxed whitespace-pre-line border border-[#ddd] rounded p-3">
              {notes}
            </p>
          </div>
        )}

        <p className="text-[11px] text-[#333] leading-relaxed mb-5">
          بالتوقيع أدناه، يقر الطرفان بأن هذا الطلب خاضع لعقد خدمات التصوير والتسويق البصري
          العقاري المشار إليه أعلاه.
        </p>

        {/* التوقيعات */}
        <div style={{ breakInside: 'avoid' }}>
          <p className="text-sm font-black text-[#b8952e] mb-1.5">التوقيعات</p>
          <table className="w-full text-[11px] border-collapse">
            <tbody>
              <tr>
                <td className="border border-[#ddd] bg-[#faf7ee] py-2 px-3 font-bold text-[#7a6420] w-44 align-top">
                  الطرف الأول
                </td>
                <td className="border border-[#ddd] py-2 px-3 align-top leading-loose">
                  الاسم: {fill(provider.repName)}
                  <br />
                  التوقيع: {BLANK}   التاريخ: ____ / ____ / ______م
                </td>
              </tr>
              <tr>
                <td className="border border-[#ddd] bg-[#faf7ee] py-2 px-3 font-bold text-[#7a6420] align-top">
                  الطرف الثاني
                </td>
                <td className="border border-[#ddd] py-2 px-3 align-top leading-loose">
                  الاسم: {fill(client.repName || client.name)}
                  {'   '}الصفة: {fill(client.repTitle)}
                  <br />
                  التوقيع: {BLANK}   التاريخ: ____ / ____ / ______م
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
