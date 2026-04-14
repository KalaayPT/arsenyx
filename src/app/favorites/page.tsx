import { Heart } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { FavoriteBuildsList } from "@/components/builds/favorite-builds-list"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getServerSession } from "@/lib/auth"
import { getUserFavoriteBuilds } from "@/lib/db/index"

export const metadata: Metadata = {
  title: "Favorites | ARSENYX",
  description: "Your favorited Warframe builds",
}

interface FavoritesPageProps {
  searchParams: Promise<{ page?: string }>
}

function FavoritesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  )
}

async function FavoritesList({
  userId,
  page,
}: {
  userId: string
  page: number
}) {
  const { builds, total } = await getUserFavoriteBuilds(userId, {
    page,
    limit: 24,
  })

  const totalPages = Math.ceil(total / 24)

  return (
    <>
      <p className="text-muted-foreground">
        {total} saved build{total !== 1 ? "s" : ""}
      </p>

      {builds.length === 0 ? (
        <div className="py-16 text-center">
          <Heart className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground mb-4">
            You haven&apos;t favorited any builds yet.
          </p>
          <Button render={<Link href="/builds" />} nativeButton={false}>
            Browse community builds
          </Button>
        </div>
      ) : (
        <>
          <FavoriteBuildsList builds={builds} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={`/favorites?page=${page - 1}`}>
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                </Link>
              )}
              <span className="text-muted-foreground text-sm">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/favorites?page=${page + 1}`}>
                  <Button variant="outline" size="sm">
                    Next
                  </Button>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}

export default async function FavoritesPage({
  searchParams,
}: FavoritesPageProps) {
  const [session, params] = await Promise.all([
    getServerSession(),
    searchParams,
  ])

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/favorites")
  }

  const page = parseInt(params.page || "1", 10)

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container flex flex-col gap-6 py-6">
          <div>
            <h1 className="text-2xl font-bold">Favorites</h1>
          </div>

          <Suspense fallback={<FavoritesSkeleton />}>
            <FavoritesList userId={session.user.id} page={page} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
