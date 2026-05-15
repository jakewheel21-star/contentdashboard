import ContentLibraryClient from '@/components/content-library/ContentLibraryClient'
import PageWrapper from '@/components/ui/PageWrapper'
import { getContentItems } from '@/lib/db/queries/content'

export default async function ContentLibraryPage(props: PageProps<'/content-library'>) {
  const searchParams = await props.searchParams
  const platform = searchParams?.platform as string | undefined
  const content_type = searchParams?.content_type as string | undefined
  const sort = (searchParams?.sort ?? 'newest') as 'newest' | 'views' | 'engagement'

  const items = getContentItems({ platform, content_type, sort, limit: 100 })

  return (
    <PageWrapper>
      <div className="mb-7">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ letterSpacing: '-0.03em', color: 'var(--text)' }}
        >
          Content Library
        </h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
          All your posts and videos across platforms
        </p>
      </div>
      <ContentLibraryClient initialItems={items} initialPlatform={platform} initialSort={sort} />
    </PageWrapper>
  )
}
