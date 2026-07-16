import React from 'react';
import { TrendingUp } from 'lucide-react';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ variant = 'dark', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const iconSizes = {
    sm: 18,
    md: 22,
    lg: 28,
  };

  const colorClass = variant === 'light' ? 'text-primary-foreground' : 'text-primary';
  const bgClass = variant === 'light' ? 'bg-primary-foreground/20' : 'bg-primary/10';

  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-lg ${bgClass}`}>
        <TrendingUp size={iconSizes[size]} className={colorClass} strokeWidth={2.5} />
      </div>
      <span className={`font-display font-bold ${sizeClasses[size]} ${colorClass}`}>
        FinSight
      </span>
    </div>
  );
};

export default Logo;
