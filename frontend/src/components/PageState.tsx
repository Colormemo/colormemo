/**
 * Три состояния страницы: загрузка, пусто, ошибка. Задача 25 по лабе 4.
 *
 * Вынесены в один файл, чтобы профиль и статистика вели себя одинаково:
 * одни и те же отступы, одна и та же кнопка повтора, одна и та же
 * интонация текста.
 */

import type { ReactNode } from 'react';

interface LoadingProps {
  text?: string;
}

export function PageLoading({ text = 'Загрузка…' }: LoadingProps) {
  return (
    <div className="notice" role="status" aria-live="polite">
      {text}
    </div>
  );
}

interface EmptyProps {
  title: string;
  /** Что человек может сделать, чтобы данные появились */
  hint?: string;
  action?: ReactNode;
}

export function PageEmpty({ title, hint, action }: EmptyProps) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {hint && <p className="empty__hint">{hint}</p>}
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
    <div className="empty empty--error" role="alert">
      <p className="empty__title">Не удалось загрузить данные</p>
      <p className="empty__hint">{message}</p>
      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          Попробовать снова
        </button>
      )}
    </div>
  );
}
