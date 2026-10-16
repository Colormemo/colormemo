/**
 * Три состояния страницы: загрузка, пусто, ошибка.
 *
 * Задача 25 по лабе 4 поручает дизайнерам оформление этих состояний,
 * но каркас нужен раньше: страницы профиля и статистики без него
 * придётся переписывать, когда макеты появятся. Сейчас это нейтральные
 * блоки, в них меняется только оформление, а не места вызова.
 */

interface LoadingProps {
  text?: string;
}

export function PageLoading({ text = 'Загрузка…' }: LoadingProps) {
  return (
    <div className="state" role="status" aria-live="polite">
      {text}
    </div>
  );
}

interface EmptyProps {
  title: string;
  /** Что пользователь может сделать, чтобы данные появились */
  hint?: string;
  action?: React.ReactNode;
}

export function PageEmpty({ title, hint, action }: EmptyProps) {
  return (
    <div className="state">
      <p className="state__title">{title}</p>
      {hint && <p className="state__hint">{hint}</p>}
      {action}
    </div>
  );
}

interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

export function PageError({ message, onRetry }: ErrorProps) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title">Не удалось загрузить данные</p>
      <p className="state__hint">{message}</p>
      {onRetry && (
        <button type="button" className="primary" onClick={onRetry}>
          Попробовать снова
        </button>
      )}
    </div>
  );
}
