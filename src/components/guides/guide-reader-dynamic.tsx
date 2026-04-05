"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

const GuideReader = dynamic(
  () =>
    import("@/components/guides/guide-reader").then((mod) => mod.GuideReader),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[200px] rounded-md" />,
  },
)

interface GuideReaderDynamicProps {
  content: string
}

export function GuideReaderDynamic({ content }: GuideReaderDynamicProps) {
  return <GuideReader content={content} />
}
