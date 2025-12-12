'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="加载中"
      className={cn('flex items-center justify-center', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
      <span className="sr-only">加载中...</span>
    </div>
  );
}

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

function Loading({ text = '加载中...', size = 'md', className, ...props }: LoadingProps) {
  return (
    <div
      role="status"
      aria-label={text}
      className={cn('flex flex-col items-center justify-center gap-2 p-8', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

function LoadingOverlay({ text = '加载中...', className, ...props }: LoadingOverlayProps) {
  return (
    <div
      role="status"
      aria-label={text}
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm',
        className
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

// Skeleton variants for common use cases
function SkeletonText({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-4 w-full', className)} {...props} />;
}

function SkeletonTitle({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-6 w-3/4', className)} {...props} />;
}

function SkeletonAvatar({ className, ...props }: SkeletonProps) {
  return <Skeleton className={cn('h-10 w-10 rounded-full', className)} {...props} />;
}

function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn('space-y-3 p-4', className)} {...props}>
      <SkeletonTitle />
      <SkeletonText />
      <SkeletonText className="w-2/3" />
    </div>
  );
}

export {
  Spinner,
  Loading,
  LoadingOverlay,
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonCard,
};
