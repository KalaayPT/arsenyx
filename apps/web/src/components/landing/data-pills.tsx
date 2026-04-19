import { useEffect, useState } from "react"

interface Meta {
  generatedAt: string
  wfcdPackageVersion: string
  gameUpdate: string | null
  itemCount: number
  modCount: number
  arcaneCount: number
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function DataPills() {
  const [meta, setMeta] = useState<Meta | null>(null)

  useEffect(() => {
    fetch("/data/meta.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((m: Meta | null) => setMeta(m))
      .catch(() => setMeta(null))
  }, [])

  if (!meta) return null

  const totalIndexed = meta.itemCount + meta.modCount + meta.arcaneCount

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
      <Pill>
        <span
          className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]"
          aria-hidden
        />
        <span className="text-muted-foreground">
          WFCD synced · {formatRelative(meta.generatedAt)}
        </span>
      </Pill>
      <Pill>
        <span className="text-muted-foreground">
          {totalIndexed.toLocaleString()} items indexed
        </span>
      </Pill>
      {meta.gameUpdate && (
        <Pill>
          <span className="text-muted-foreground">
            Update {meta.gameUpdate}
          </span>
        </Pill>
      )}
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background/60 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 backdrop-blur">
      {children}
    </div>
  )
}
