# Data Model: Enhanced Design Features

**Feature ID**: 002-enhanced-design-features  
**Last Updated**: 2025-10-21

## Overview

This feature is **frontend-only** and does **not** introduce any database schema changes or new API endpoints. All enhancements are UI/UX improvements.

---

## No Backend Changes Required

This feature focuses on:
- Design system (tokens, components)
- Responsive layouts
- Accessibility improvements
- Animations and transitions
- Error handling UX

**Data model from 001-content-platform-dashboard remains unchanged.**

---

## Frontend Data Structures (TypeScript Interfaces)

While no database changes are needed, we define TypeScript types for UI state and component props.

### Design Tokens (tokens.ts)

```typescript
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface DesignTokens {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    neutral: ColorScale;
    success: ColorScale;
    error: ColorScale;
    warning: ColorScale;
    info: ColorScale;
  };
  fontSize: {
    xs: [string, { lineHeight: string }];
    sm: [string, { lineHeight: string }];
    base: [string, { lineHeight: string }];
    lg: [string, { lineHeight: string }];
    xl: [string, { lineHeight: string }];
    '2xl': [string, { lineHeight: string }];
    '3xl': [string, { lineHeight: string }];
    '4xl': [string, { lineHeight: string }];
  };
  spacing: Record<string, string>;
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    full: string;
  };
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}
```

### Animation Presets (animations.ts)

```typescript
export interface AnimationPreset {
  duration: string;
  timingFunction: string;
  delay?: string;
}

export interface AnimationPresets {
  fadeIn: AnimationPreset;
  fadeOut: AnimationPreset;
  slideInUp: AnimationPreset;
  slideInDown: AnimationPreset;
  slideInLeft: AnimationPreset;
  slideInRight: AnimationPreset;
  scaleIn: AnimationPreset;
  scaleOut: AnimationPreset;
  spin: AnimationPreset;
}

export type AnimationName = keyof AnimationPresets;
```

### Component Props Types

#### Button Component

```typescript
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}
```

#### Input Component

```typescript
export type InputState = 'default' | 'focus' | 'error' | 'success' | 'disabled';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

#### Card Component

```typescript
export type CardVariant = 'default' | 'outlined' | 'elevated';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
}
```

#### Skeleton Component

```typescript
export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  animation?: boolean;
}
```

#### Toast/Notification

```typescript
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number; // milliseconds
  dismissible?: boolean;
}

export interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}
```

---

## UI State Management

### Loading States

```typescript
export interface LoadingState {
  isLoading: boolean;
  loadingText?: string;
  progress?: number; // 0-100 for progress bars
}
```

### Error States

```typescript
export interface ErrorState {
  hasError: boolean;
  errorMessage?: string;
  errorType?: 'validation' | 'network' | 'server' | 'unknown';
  canRetry?: boolean;
  retryAction?: () => void;
}
```

### Empty States

```typescript
export interface EmptyState {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

## Breakpoint System

```typescript
export const breakpoints = {
  mobile: '(max-width: 639px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
} as const;

export type Breakpoint = keyof typeof breakpoints;
```

---

## Accessibility Attributes (ARIA)

### Common ARIA Props

```typescript
export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  role?: string;
}
```

---

## Theme Context (Enhanced)

```typescript
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  prefersReducedMotion: boolean;
  // Future: colorScheme, customColors, etc.
}
```

---

## Summary

This data model document primarily defines **TypeScript interfaces and types** for UI components and states. There are:

- ❌ No database schema changes
- ❌ No new API endpoints
- ❌ No backend data models
- ✅ Frontend type definitions for better DX
- ✅ Design token structures
- ✅ Component prop interfaces
- ✅ UI state types

**All data persistence remains as defined in `001-content-platform-dashboard`.**

---

**References**:
- See `001-content-platform-dashboard/data-model.md` for backend schema
- See `spec.md` for component requirements
- See `tokens.ts` (to be created) for actual token values
