import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6';
import styles from './Admin.module.css';

const pageItems = (currentPage, totalPages) => {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);

  return sorted.flatMap((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) return [`ellipsis-${page}`, page];
    return [page];
  });
};

export default function AdminPagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.adminPagination} aria-label="Paginação dos registros">
      <span>{totalItems} registros</span>
      <div>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Página anterior"
        >
          <FaChevronLeft />
        </button>

        {pageItems(currentPage, totalPages).map((item) => (
          typeof item === 'string' ? (
            <span key={item} className={styles.paginationEllipsis}>…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={item === currentPage ? styles.paginationActive : ''}
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? 'page' : undefined}
            >
              {item}
            </button>
          )
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Próxima página"
        >
          <FaChevronRight />
        </button>
      </div>
    </nav>
  );
}
