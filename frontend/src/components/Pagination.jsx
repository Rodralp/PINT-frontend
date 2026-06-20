import { ChevronLeft, ChevronRight } from 'lucide-react'
import '../css/Pagination.css'

export default function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null

  const prev = () => setPage((p) => Math.max(1, p - 1))
  const next = () => setPage((p) => Math.min(totalPages, p + 1))

  const range = (start, end) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const getPages = () => {
    if (totalPages <= 7) return range(1, totalPages)

    const pages = [1]
    const left = Math.max(2, page - 2)
    const right = Math.min(totalPages - 1, page + 2)

    if (left > 2) pages.push('...')

    range(left, right).forEach((p) => pages.push(p))

    if (right < totalPages - 1) pages.push('...')

    pages.push(totalPages)

    return pages
  }

  const pages = getPages()

  return (
    <div className="pagination" role="navigation">
      <button
        type="button"
        className="pagination-btn"
        onClick={prev}
        disabled={page === 1}
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis">...</span>
        ) : (
          <button
            key={p}
            type="button"
            className={`pagination-btn${p === page ? ' active' : ''}`}
            onClick={() => setPage(p)}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination-btn"
        onClick={next}
        disabled={page === totalPages}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
