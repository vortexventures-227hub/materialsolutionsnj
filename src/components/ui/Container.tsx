import { cn } from '@/lib/utils/cn';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  sm: 'max-w-4xl',
  md: 'max-w-6xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[1400px]',
};

export function Container({ children, className, size = 'lg' }: ContainerProps) {
  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeStyles[size], className)}>
      {children}
    </div>
  );
}

interface SectionProps extends ContainerProps {
  id?: string;
  background?: 'white' | 'muted' | 'dark' | 'gradient';
}

const backgroundStyles = {
  white: 'bg-white',
  muted: 'bg-secondary-50/50',
  dark: 'bg-secondary-900 text-white',
  gradient: 'gradient-hero text-white',
};

export function Section({ children, className, size = 'lg', id, background = 'white' }: SectionProps) {
  return (
    <section id={id} className={cn('py-16 sm:py-20 lg:py-24', backgroundStyles[background])}>
      <Container size={size} className={className}>
        {children}
      </Container>
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  badge,
  align = 'center',
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn(
      'mb-12 lg:mb-16',
      align === 'center' && 'text-center max-w-3xl mx-auto',
      className
    )}>
      {badge && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-200 mb-4">
          {badge}
        </span>
      )}
      <h2 className="text-display-md text-secondary-900">{title}</h2>
      {subtitle && (
        <p className="mt-4 text-body-lg text-secondary-500">{subtitle}</p>
      )}
    </div>
  );
}
