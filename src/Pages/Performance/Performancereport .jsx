import { useState } from 'react'
import { useGet } from '@/hooks/useGet' // adjust to where useGet.js lives

const PERFORMANCE_URL = '/api/superadmin/report/performance'
const CHARTS_URL = '/api/superadmin/report/charts'

/* ---------- helpers ---------- */

const fmt = (n) => Number(n ?? 0).toLocaleString('en-US')

const fmtDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : ''

const errorMessage = (reason) =>
    reason?.response?.data?.message || reason?.message || 'Something went wrong while loading this data.'

/* ---------- icons ---------- */

const ICON_PATHS = {
    orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6" /></>,
    building: <><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" /><path d="M9 21v-4h3v4M8 7h1m3 0h1M8 11h1m3 0h1M2 21h19" /></>,
    activity: <path d="M3 12h4l2.5-7 4 14 2.5-7h5" />,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M16 5a3 3 0 0 1 0 6M17 14a4 4 0 0 1 4 4v2" /></>,
    warning: <><path d="M12 3 2.5 20h19Z" /><path d="M12 9v4m0 3h.01" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    rocket: <><path d="M14 5c3-3 6-2 6-2s1 3-2 6l-5 5-4-4Z" /><path d="m9 10-4 1-2 3 6 1m4-1 1 6 3-2 1-5M7 17l-3 3" /><circle cx="15.5" cy="7.5" r="1" /></>,
    trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
    refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
}

function Icon({ name, size = 18, className = '' }) {
    return (
        <svg aria-hidden="true" className={className} fill="none" height={size} viewBox="0 0 24 24" width={size}>
            <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
                {ICON_PATHS[name]}
            </g>
        </svg>
    )
}

/* ---------- KPI cards ---------- */

const growth = (c) => c.growthPercentage

const KPI_DEFS = [
    { key: 'totalOrders', icon: 'orders', value: (c) => fmt(c.value), change: growth, unit: '%' },
    { key: 'totalRestaurants', icon: 'building', value: (c) => fmt(c.value), change: growth, unit: '%' },
    { key: 'activeRestaurants', icon: 'activity', value: (c) => fmt(c.value), change: growth, unit: '%' },
    { key: 'demoRestaurants', icon: 'people', value: (c) => fmt(c.value), change: growth, unit: '%' },
    { key: 'notDelivered', icon: 'warning', value: (c) => `${c.percentage}%`, change: (c) => c.changePercentage, unit: '%', lowerIsBetter: true },
    { key: 'avgOnboardingTime', icon: 'clock', value: (c) => `${c.valueInDays} days`, change: (c) => c.changeInDays, unit: ' days', lowerIsBetter: true },
    { key: 'successfulGoLives', icon: 'rocket', value: (c) => fmt(c.value), change: growth, unit: '%' },
    { key: 'leads', icon: 'trend', value: (c) => `${c.percentage}%`, change: (c) => c.changePercentage, unit: '%' },
]

const TONES = {
    good: { text: 'text-emerald-600', icon: 'bg-amber-50 text-amber-700', line: '#eaaa08' },
    bad: { text: 'text-amber-600', icon: 'bg-orange-50 text-orange-600', line: '#f79009' },
    neutral: { text: 'text-slate-400', icon: 'bg-amber-50 text-amber-700', line: '#eaaa08' },
}

function Sparkline({ values, color }) {
    if (!values?.length) return null
    const W = 90
    const H = 32
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const points = values
        .map((v, i) => {
            const x = (i / (values.length - 1 || 1)) * W
            const y = H - 3 - ((v - min) / range) * (H - 6)
            return `${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(' ')
    return (
        <svg aria-hidden="true" className="h-7 w-16 shrink-0 overflow-visible" viewBox={`0 0 ${W} ${H}`}>
            <polyline fill="none" points={points} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
    )
}

function KpiCard({ def, card }) {
    const change = def.change(card)
    const direction = card.trendDirection ?? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral')
    const tone =
        direction === 'neutral' ? 'neutral' : (direction === 'up') !== !!def.lowerIsBetter ? 'good' : 'bad'
    const style = TONES[tone]
    const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : ''
    const changeText =
        direction === 'neutral' || change == null ? 'No change' : `${arrow} ${Math.abs(change)}${def.unit}`

    return (
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold text-slate-600">{card.title}</span>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${style.icon}`}>
                    <Icon name={def.icon} size={16} />
                </span>
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{def.value(card)}</div>
            <div className="mt-3 flex items-end justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className={`text-xs font-semibold ${style.text}`}>{changeText}</span>
                    <span className="truncate text-[11px] text-slate-400" title={card.subtext}>{card.subtext}</span>
                </div>
                <Sparkline color={style.line} values={(card.sparkline ?? []).map((p) => p.value)} />
            </div>
        </div>
    )
}

function KpiSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div className="h-[132px] animate-pulse rounded-xl border border-slate-200 bg-white p-4" key={i}>
                    <div className="h-3 w-24 rounded bg-slate-100" />
                    <div className="mt-5 h-6 w-28 rounded bg-slate-100" />
                    <div className="mt-6 h-3 w-36 rounded bg-slate-100" />
                </div>
            ))}
        </div>
    )
}

function ErrorBox({ message, onRetry }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{message}</span>
            <button
                className="shrink-0 rounded-md border border-red-200 bg-white px-3 py-1 text-xs font-semibold hover:bg-red-100"
                onClick={onRetry}
                type="button"
            >
                Try again
            </button>
        </div>
    )
}

/* ---------- charts & tables (GET /api/superadmin/report/charts) ---------- */

const COLORS = {
    amber: '#eaaa08',
    teal: '#12b76a',
    orange: '#f79009',
    slate: '#98a2b3',
    track: '#f2f4f7',
}

const shortMonth = (label = '') => label.split(' ')[0]
const fmtDateOrDash = (iso) => (iso ? fmtDate(iso) : '—')

/* ---------- shared building blocks ---------- */

function Card({ title, subtitle, right, children, className = '' }) {
    return (
        <section className={`min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
                    {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
                </div>
                {right}
            </div>
            {children}
        </section>
    )
}

function Pill({ children, tone = 'slate' }) {
    const tones = {
        slate: 'border-slate-200 bg-slate-50 text-slate-600',
        green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
        amber: 'border-amber-100 bg-amber-50 text-amber-700',
    }
    return (
        <span className={`whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-medium ${tones[tone]}`}>
            {children}
        </span>
    )
}

function Legend({ items }) {
    return (
        <div className="mt-4 flex flex-wrap justify-end gap-x-4 gap-y-1 text-xs text-slate-500">
            {items.map((item) => (
                <span className="flex items-center gap-1.5" key={item.label}>
                    <i className="inline-block h-2 w-2 rounded-full" style={{ background: item.color }} />
                    {item.label}
                </span>
            ))}
        </div>
    )
}

function Growth({ value, direction }) {
    if (value == null) return null
    const up = (direction ?? (value >= 0 ? 'up' : 'down')) === 'up'
    return (
        <span className={`text-xs font-semibold ${up ? 'text-emerald-600' : 'text-amber-600'}`}>
            {up ? '↗' : '↘'} {Math.abs(value)}% vs previous period
        </span>
    )
}

function niceMax(value) {
    const m = Math.max(1, value)
    const pow = 10 ** Math.floor(Math.log10(m))
    const n = m / pow
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
    return step * pow
}

/* ---------- line chart (SVG) ---------- */

const defaultTick = (t) => (t >= 1000 ? `${+(t / 1000).toFixed(1)}k` : Math.round(t))

function LineChart({ labels, series, area = true, threshold, formatValue = fmt, formatTick = defaultTick }) {
    const W = 680
    const H = 240
    const pad = { l: 48, r: 18, t: 14, b: 28 }
    const max = niceMax(Math.max(1, threshold?.value ?? 0, ...series.flatMap((s) => s.values)))
    const x = (i) => pad.l + (labels.length <= 1 ? 0 : (i * (W - pad.l - pad.r)) / (labels.length - 1))
    const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)

    const path = (values) =>
        values
            .map((v, i) => {
                if (i === 0) return `M${x(i)} ${y(v)}`
                const mid = (x(i - 1) + x(i)) / 2
                return `C${mid} ${y(values[i - 1])} ${mid} ${y(v)} ${x(i)} ${y(v)}`
            })
            .join(' ')

    return (
        <svg className="mt-2 h-auto w-full overflow-visible" role="img" viewBox={`0 0 ${W} ${H}`}>
            {ticks.map((t) => (
                <g key={t}>
                    <line stroke="#eaecf0" strokeDasharray="3 3" x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} />
                    <text fill="#98a2b3" fontSize="11" textAnchor="end" x={pad.l - 8} y={y(t) + 4}>
                        {formatTick(t)}
                    </text>
                </g>
            ))}

            {threshold && (
                <g>
                    <line stroke={threshold.color} strokeDasharray="6 4" strokeWidth="1.5" x1={pad.l} x2={W - pad.r} y1={y(threshold.value)} y2={y(threshold.value)} />
                    <text fill={threshold.color} fontSize="10" fontWeight="600" textAnchor="end" x={W - pad.r} y={y(threshold.value) - 5}>
                        {threshold.label}
                    </text>
                </g>
            )}

            {series.map((s, idx) => (
                <g key={s.name}>
                    {area && idx === 0 && s.values.length > 0 && (
                        <path
                            d={`${path(s.values)} L${x(s.values.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`}
                            fill={s.color}
                            opacity="0.08"
                        />
                    )}
                    <path d={path(s.values)} fill="none" stroke={s.color} strokeDasharray={s.dashed ? '5 5' : undefined} strokeLinecap="round" strokeWidth="2.5" />
                    {s.values.map((v, i) => (
                        <circle cx={x(i)} cy={y(v)} fill="#fff" key={i} r="4" stroke={s.color} strokeWidth="2">
                            <title>{`${labels[i]} · ${s.name}: ${formatValue(v)}`}</title>
                        </circle>
                    ))}
                </g>
            ))}

            {labels.map((label, i) => (
                <text fill="#98a2b3" fontSize="11" key={`${label}-${i}`} textAnchor="middle" x={x(i)} y={H - 6}>
                    {label}
                </text>
            ))}
        </svg>
    )
}

/* ---------- donut ---------- */

function Donut({ segments, centerValue, centerLabel }) {
    const total = segments.reduce((sum, s) => sum + s.count, 0)
    let acc = 0
    const stops = total
        ? segments
            .map((s) => {
                const from = (acc / total) * 100
                acc += s.count
                return `${s.color} ${from}% ${(acc / total) * 100}%`
            })
            .join(', ')
        : `${COLORS.track} 0 100%`

    return (
        <div
            className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
            style={{ background: `conic-gradient(${stops})` }}
        >
            <div className="absolute inset-[15px] rounded-full bg-white" />
            <div className="relative flex flex-col items-center">
                <strong className="text-xl tracking-tight">{centerValue}</strong>
                <span className="mt-0.5 text-[11px] text-slate-500">{centerLabel}</span>
            </div>
        </div>
    )
}

function DonutLegend({ rows }) {
    return (
        <div className="flex flex-col gap-4">
            {rows.map((row) => (
                <div className="flex items-start gap-2 text-xs text-slate-600" key={row.label}>
                    <i className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: row.color }} />
                    <span className="flex flex-col gap-0.5">
                        {row.label}
                        <b className="text-[13px] font-bold text-slate-900">
                            {fmt(row.count)} · {row.percentage}%
                        </b>
                    </span>
                </div>
            ))}
        </div>
    )
}

/* ---------- sections ---------- */

function GrowthCard({ data }) {
    const timeline = data?.timeline ?? []
    return (
        <Card
            right={<Pill>Monthly</Pill>}
            subtitle="Monthly acquisition compared with restaurants receiving their first order"
            title={data?.title ?? 'Restaurant Acquisition & Order Activation Growth'}
        >
            <Legend
                items={[
                    { label: 'Newly acquired', color: COLORS.amber },
                    { label: 'First order received', color: COLORS.teal },
                ]}
            />
            <LineChart
                labels={timeline.map((t) => shortMonth(t.label))}
                series={[
                    { name: 'Newly acquired', color: COLORS.amber, values: timeline.map((t) => t.newlyAcquired) },
                    { name: 'First order received', color: COLORS.teal, values: timeline.map((t) => t.firstOrderReceived) },
                ]}
            />
            {data?.conversionRate != null && (
                <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    <span>Acquisition → first order conversion</span>
                    <strong className="text-base">{data.conversionRate}%</strong>
                </div>
            )}
        </Card>
    )
}

function OrdersCard({ afterGoLive, postDelivery }) {
    const timeline = afterGoLive?.timeline ?? []
    const post = postDelivery?.timeline ?? []
    return (
        <Card
            right={<Pill>All cohorts</Pill>}
            subtitle="Order volume by month since restaurant activation"
            title={afterGoLive?.title ?? 'Monthly Orders After Go-Live'}
        >
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <strong className="text-xl tracking-tight">{fmt(afterGoLive?.totalOrders)}</strong>
                <Growth direction={afterGoLive?.trendDirection} value={afterGoLive?.growthPercentage} />
            </div>
            <Legend
                items={[
                    { label: 'Orders after go-live', color: COLORS.amber },
                    { label: postDelivery?.title ?? 'After delivery, excluding test orders', color: COLORS.teal },
                ]}
            />
            <LineChart
                labels={timeline.map((t) => shortMonth(t.label))}
                series={[
                    { name: 'Orders after go-live', color: COLORS.amber, values: timeline.map((t) => t.orders) },
                    { name: 'After delivery', color: COLORS.teal, values: post.map((t) => t.orders), dashed: true },
                ]}
            />
            {postDelivery && (
                <p className="mt-2 text-xs text-slate-500">
                    After delivery (excluding the first {postDelivery.testOrdersThreshold} test orders):{' '}
                    <b className="text-slate-700">{fmt(postDelivery.totalOrders)}</b> orders
                </p>
            )}
        </Card>
    )
}

function RestaurantsOverTimeCard({ data }) {
    // The API has no cumulative series, so it is built from newlyAcquired per month.
    const timeline = data?.timeline ?? []
    const total = []
    timeline.reduce((sum, t) => {
        const next = sum + (t.newlyAcquired ?? 0)
        total.push(next)
        return next
    }, 0)

    const latest = total[total.length - 1] ?? 0
    const previous = total.length > 1 ? total[total.length - 2] : 0
    const added = latest - previous
    const periodGrowth = previous > 0 ? +(((latest - previous) / previous) * 100).toFixed(1) : null
    const previousSeries = total.map((_, i) => (i === 0 ? 0 : total[i - 1]))

    return (
        <Card
            right={<Pill>Monthly</Pill>}
            subtitle="Cumulative restaurant base at the end of each month"
            title="Total Restaurants Over Time"
        >
            {timeline.length === 0 ? (
                <EmptyChart message="No acquisition data returned for this period." />
            ) : (
                <>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                        <Metric label="Latest total" value={fmt(latest)} />
                        <Metric label="Added this month" value={`+${fmt(added)}`} />
                        <Metric
                            label="Month-over-month"
                            tone={periodGrowth == null ? undefined : periodGrowth >= 0 ? 'good' : 'bad'}
                            value={periodGrowth == null ? '—' : `${periodGrowth >= 0 ? '↑' : '↓'} ${Math.abs(periodGrowth)}%`}
                        />
                    </div>
                    <Legend
                        items={[
                            { label: 'Cumulative total', color: COLORS.amber },
                            { label: 'Previous month', color: COLORS.slate },
                        ]}
                    />
                    <LineChart
                        labels={timeline.map((t) => shortMonth(t.label))}
                        series={[
                            { name: 'Cumulative total', color: COLORS.amber, values: total },
                            { name: 'Previous month', color: COLORS.slate, values: previousSeries, dashed: true },
                        ]}
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Cumulative total, not newly added restaurants. Counted from the start of the timeline.
                    </p>
                </>
            )}
        </Card>
    )
}

function InactivityCard({ data }) {
    // Expects data.restaurantInactivity from the charts endpoint (see response shape in the notes).
    const timeline = data?.timeline ?? []
    const target = data?.targetRate ?? 5
    const latest = timeline[timeline.length - 1]
    const overTarget = latest && latest.rate > target
    const pct = (v) => `${+Number(v).toFixed(1)}%`

    return (
        <Card
            right={<Pill>Monthly</Pill>}
            subtitle="Delivered restaurants newly inactive during each interval"
            title={data?.title ?? 'Restaurant Inactivity Rate After Delivery'}
        >
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {data?.definition ?? 'Inactive = zero valid orders for 7 consecutive days after delivery'}
            </div>
            {timeline.length === 0 ? (
                <EmptyChart message="Inactivity data isn't returned by the charts endpoint yet." />
            ) : (
                <>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <strong className="text-xl tracking-tight">{pct(latest.rate)}</strong>
                        <span className={`text-xs font-semibold ${overTarget ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {overTarget ? 'Above' : 'Within'} {target}% target
                        </span>
                        {latest.eligible != null && (
                            <span className="text-xs text-slate-500">
                                {fmt(latest.newlyInactive)} / {fmt(latest.eligible)} eligible
                            </span>
                        )}
                    </div>
                    <Legend
                        items={[
                            { label: 'Inactivity rate', color: COLORS.orange },
                            { label: `${target}% target`, color: COLORS.slate },
                        ]}
                    />
                    <LineChart
                        area={false}
                        formatTick={(t) => `${+t.toFixed(1)}%`}
                        formatValue={pct}
                        labels={timeline.map((t) => shortMonth(t.label))}
                        series={[{ name: 'Inactivity rate', color: COLORS.orange, values: timeline.map((t) => t.rate) }]}
                        threshold={{ value: target, label: `${target}% target`, color: COLORS.slate }}
                    />
                    <p className="mt-2 text-xs text-slate-500">Already-inactive restaurants are excluded from each interval.</p>
                </>
            )}
        </Card>
    )
}

function Metric({ label, value, tone }) {
    const color = tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-amber-600' : 'text-slate-900'
    return (
        <div className="rounded-lg border border-slate-200 px-3 py-2">
            <span className="block text-[11px] text-slate-500">{label}</span>
            <strong className={`text-base tracking-tight ${color}`}>{value}</strong>
        </div>
    )
}

function EmptyChart({ message }) {
    return (
        <div className="mt-4 grid h-40 place-items-center rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
            {message}
        </div>
    )
}

function DeliveryOverviewCard({ data }) {
    if (!data) return null
    const rows = [
        { label: 'Successfully delivered', ...data.delivered, color: COLORS.teal },
        { label: 'Not yet delivered', ...data.notDelivered, color: COLORS.orange },
    ]
    return (
        <Card subtitle={`Status of ${fmt(data.totalEligible)} eligible restaurants`} title={data.title ?? 'Restaurant Delivery Overview'}>
            <div className="flex items-center gap-6 px-1 pb-2 pt-6">
                <Donut centerLabel="eligible" centerValue={fmt(data.totalEligible)} segments={rows} />
                <DonutLegend rows={rows} />
            </div>
        </Card>
    )
}

function ActivationCard({ data }) {
    if (!data) return null
    const rows = [
        { label: 'Active after delivery', ...data.activeAfterDelivery, color: COLORS.teal },
        { label: 'Awaiting activation', ...data.awaitingActivation, color: COLORS.orange },
    ]
    return (
        <Card subtitle="Activation progress among delivered restaurants" title={data.title ?? 'Delivered vs Order Activation'}>
            <div className="flex items-center gap-6 px-1 pb-4 pt-6">
                <Donut centerLabel="delivered" centerValue={fmt(data.totalDelivered)} segments={rows} />
                <DonutLegend rows={rows} />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>Received a first order</span>
                <strong className="text-slate-800">
                    {fmt(data.firstOrderReceived?.count)} · {data.firstOrderReceived?.percentage}%
                </strong>
                <span>Activation rate (past {data.testOrdersThreshold} test orders)</span>
                <strong className="text-emerald-600">{data.activationRate}%</strong>
                <div className="col-span-2 h-1 overflow-hidden rounded bg-slate-100">
                    <i className="block h-full rounded bg-emerald-500" style={{ width: `${Math.min(100, data.activationRate ?? 0)}%` }} />
                </div>
            </div>
        </Card>
    )
}

function DeliveredRestaurantsCard({ data }) {
    const restaurants = data?.restaurants ?? []
    return (
        <Card
            className="lg:col-span-2"
            right={
                <Pill tone="green">
                    {fmt(data?.restaurantsWithFirstOrder)} of {fmt(data?.totalDelivered)} received a first order
                </Pill>
            }
            subtitle="Every delivered restaurant, with its order count and first order date"
            title="Delivered Restaurants"
        >
            <div className="mt-4 max-h-[420px] overflow-auto rounded-lg border border-slate-200">
                <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold text-slate-500">
                        <tr>
                            <th className="px-3 py-2.5">Restaurant</th>
                            <th className="px-3 py-2.5 text-right">Total orders</th>
                            <th className="px-3 py-2.5">First order</th>
                            <th className="px-3 py-2.5">Test orders</th>
                        </tr>
                    </thead>
                    <tbody>
                        {restaurants.map((r) => (
                            <tr className="border-t border-slate-100 hover:bg-slate-50" key={r.restaurantId}>
                                <td className="px-3 py-2.5">
                                    <div className="font-semibold text-slate-800">{r.name?.trim()}</div>
                                    {r.nameAr && (
                                        <div className="mt-0.5 text-slate-400" dir="rtl">
                                            {r.nameAr}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-slate-800">{fmt(r.totalOrders)}</td>
                                <td className="whitespace-nowrap px-3 py-2.5 text-slate-600">{fmtDateOrDash(r.firstOrderDate)}</td>
                                <td className="px-3 py-2.5">
                                    {r.hasPassedtestOrders ? <Pill tone="green">Passed</Pill> : <Pill tone="amber">Not passed</Pill>}
                                </td>
                            </tr>
                        ))}
                        {!restaurants.length && (
                            <tr>
                                <td className="px-3 py-10 text-center text-slate-400" colSpan={4}>
                                    No delivered restaurants in this period.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

function LowOrdersCard({ data }) {
    if (!data) return null
    const threshold = data.orderThreshold || 50
    const restaurants = data.restaurants ?? []
    const stats = [
        { label: 'Below target', value: fmt(data.belowTargetCount), hint: `of ${fmt(data.totalAnalyzedCount)} analyzed` },
        { label: 'Average orders', value: fmt(data.averageOrders), hint: 'Across restaurants shown' },
        { label: 'Target', value: `${threshold}`, hint: 'Orders in selected period' },
    ]
    return (
        <Card
            className="lg:col-span-2"
            subtitle="Eligible live restaurants with the lowest order volume in the selected period"
            title={data.title ?? `Restaurants With Fewer Than ${threshold} Orders`}
        >
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
                {stats.map((s) => (
                    <div className="flex flex-col gap-0.5" key={s.label}>
                        <span className="text-[11px] text-slate-500">{s.label}</span>
                        <strong className="text-lg text-slate-900">{s.value}</strong>
                        <small className="text-[11px] text-slate-400">{s.hint}</small>
                    </div>
                ))}
            </div>

            {restaurants.length ? (
                <ul className="mt-4 space-y-3">
                    {restaurants.map((r) => (
                        <li key={r.restaurantId}>
                            <div className="flex items-baseline justify-between gap-3 text-xs">
                                <span className="min-w-0 truncate font-semibold text-slate-700">
                                    {r.name?.trim()}
                                    {r.nameAr && (
                                        <span className="ms-2 font-normal text-slate-400" dir="rtl">
                                            {r.nameAr}
                                        </span>
                                    )}
                                </span>
                                <span className="shrink-0 text-slate-500">
                                    <b className="text-slate-800">{fmt(r.orderCount)}</b> / {threshold} orders · {r.averageDailyOrders} per day
                                </span>
                            </div>
                            <div className="mt-1.5 h-3 overflow-hidden rounded bg-slate-100">
                                <i
                                    className="block h-full rounded bg-amber-500"
                                    style={{ width: `${Math.min(100, (r.orderCount / threshold) * 100)}%` }}
                                />
                            </div>
                            <div className="mt-1.5 flex gap-1.5">
                                <Pill tone="green">{r.deliveryStatus}</Pill>
                                <Pill>{r.operationStatus}</Pill>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="py-10 text-center text-xs text-slate-400">
                    <strong className="block text-sm text-slate-600">All restaurants are on target</strong>
                    None are below {threshold} orders in this period.
                </div>
            )}
        </Card>
    )
}

/* ---------- main export ---------- */

function PerformanceCharts({ data, loading = false }) {
    if (!data) {
        return (
            <div className="grid animate-pulse grid-cols-1 gap-3 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div className="h-72 rounded-xl border border-slate-200 bg-white" key={i} />
                ))}
            </div>
        )
    }

    return (
        <div className={`grid grid-cols-1 gap-3 transition-opacity lg:grid-cols-2 ${loading ? 'opacity-60' : ''}`}>
            <GrowthCard data={data.acquisitionAndActivationGrowth} />
            <OrdersCard afterGoLive={data.monthlyOrdersAfterGoLive} postDelivery={data.postDeliveryOrdersGrowth} />
            <RestaurantsOverTimeCard data={data.acquisitionAndActivationGrowth} />
            <InactivityCard data={data.restaurantInactivity} />
            <DeliveryOverviewCard data={data.deliveryOverview} />
            <ActivationCard data={data.deliveredActivationOverview} />
            <DeliveredRestaurantsCard data={data.deliveredRestaurantsSummary} />
            <LowOrdersCard data={data.lowOrderRestaurants} />
        </div>
    )
}

/* ---------- page ---------- */

export default function PerformanceReport() {
    const [range, setRange] = useState({ start: '', end: '' })

    const params = {}
    if (range.start) params.startDate = range.start
    if (range.end) params.endDate = range.end

    // useGet returns the response body: { success, data }
    const performanceQuery = useGet('performance-report', PERFORMANCE_URL, params)
    const chartsQuery = useGet('performance-report-charts', CHARTS_URL, params)

    const performance = performanceQuery.data?.data
    const charts = chartsQuery.data?.data
    const loading = performanceQuery.isFetching || chartsQuery.isFetching
    const period = performance?.period ?? charts?.period

    const refresh = () => {
        performanceQuery.refetch()
        chartsQuery.refetch()
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="mx-auto max-w-[1540px] space-y-6 p-4 sm:p-7">
                {/* Heading */}
                <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Performance Report</h1>
                        <p className="mt-1.5 text-sm text-slate-500">
                            Monitor restaurant acquisition, onboarding, activation, and order growth.
                        </p>
                        {period && (
                            <p className="mt-1 text-xs text-slate-400">
                                Showing {fmtDate(period.startDate)} – {fmtDate(period.endDate)}, compared with the previous period
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-end gap-2">
                        <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                            From
                            <input
                                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                max={range.end || undefined}
                                onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
                                type="date"
                                value={range.start}
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                            To
                            <input
                                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                min={range.start || undefined}
                                onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
                                type="date"
                                value={range.end}
                            />
                        </label>
                        {(range.start || range.end) && (
                            <button
                                className="h-9 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                                onClick={() => setRange({ start: '', end: '' })}
                                type="button"
                            >
                                Reset
                            </button>
                        )}
                        <button
                            className="flex h-9 items-center gap-2 rounded-lg border border-amber-500 bg-amber-500 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
                            disabled={loading}
                            onClick={refresh}
                            type="button"
                        >
                            <Icon className={loading ? 'animate-spin' : ''} name="refresh" size={15} />
                            Refresh
                        </button>
                    </div>
                </header>

                {/* KPI cards  ->  GET /api/superadmin/report/performance */}
                <section aria-label="Key metrics">
                    {performanceQuery.isLoading ? (
                        <KpiSkeleton />
                    ) : performanceQuery.isError ? (
                        <ErrorBox message={errorMessage(performanceQuery.error)} onRetry={() => performanceQuery.refetch()} />
                    ) : (
                        <div className={`grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 xl:grid-cols-4 ${performanceQuery.isFetching ? 'opacity-60' : ''}`}>
                            {KPI_DEFS.map((def) => {
                                const card = performance?.cards?.[def.key]
                                return card ? <KpiCard card={card} def={def} key={def.key} /> : null
                            })}
                        </div>
                    )}
                </section>

                {/* Charts and tables  ->  GET /api/superadmin/report/charts */}
                {chartsQuery.isError ? (
                    <ErrorBox message={errorMessage(chartsQuery.error)} onRetry={() => chartsQuery.refetch()} />
                ) : (
                    <PerformanceCharts data={charts} loading={chartsQuery.isFetching} />
                )}
            </div>
        </div>
    )
}