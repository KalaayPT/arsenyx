import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { SettingsForm } from "@/components/settings"
import { getServerSession } from "@/lib/auth"
import { getUserForSettings } from "@/lib/db/index"

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/settings")
  }

  const user = await getUserForSettings(session.user.id)
  if (!user) {
    redirect("/auth/signin")
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <SettingsForm user={user} />
    </div>
  )
}
