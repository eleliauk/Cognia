'use client';

import * as React from 'react';
import { AlertCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from './button';

type ErrorVariant = 'error' | 'warning' | 'info';

const variantStyles: Record<ErrorVariant, { icon: React.ElementType; className: string }> = {
  error: {
    icon: XCircle,
    className: 'border-destructive/50 bg-destructive/10 text-destructive',
  },
  warning: {
    icon: AlertTriangle,
    className: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500',
  },
  info: {
    icon: AlertCircle,
    className: 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-500',
  },
};

interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  variant?: ErrorVariant;
  onRetry?: () => void;
  retryText?: string;
}

function ErrorMessage({
  title,
  message,
  variant = 'error',
  onRetry,
  retryText = '重试',
  className,
  ...props
}: ErrorMessageProps) {
  const { icon: Icon, className: variantClassName } = variantStyles[variant];

  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 rounded-lg border p-4', variantClassName, className)}
      {...props}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        <p className="text-sm opacity-90">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-1" />
            {retryText}
          </Button>
        )}
      </div>
    </div>
  );
}

interface ErrorPageProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

function ErrorPage({
  title = '出错了',
  message = '抱歉，发生了一些错误。请稍后重试。',
  onRetry,
  onGoBack,
  className,
  ...props
}: ErrorPageProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center',
        className
      )}
      {...props}
    >
      <div className="rounded-full bg-destructive/10 p-4">
        <XCircle className="h-12 w-12 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-muted-foreground max-w-md">{message}</p>
      </div>
      <div className="flex gap-2">
        {onGoBack && (
          <Button variant="outline" onClick={onGoBack}>
            返回
          </Button>
        )}
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-1" />
            重试
          </Button>
        )}
      </div>
    </div>
  );
}

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ElementType;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

function EmptyState({
  icon: Icon = AlertCircle,
  title = '暂无数据',
  message = '当前没有可显示的内容',
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center',
        className
      )}
      {...props}
    >
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { ErrorMessage, ErrorPage, EmptyState };
