import { ButtonHTMLAttributes } from 'react'

interface BubbleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'citizen' | 'liar'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variantClasses = {
  primary: 'bg-ui-text text-white hover:bg-[#2a2470] active:scale-95',
  secondary: 'bg-white text-ui-text border-2 border-ui-text hover:bg-ui-bg active:scale-95',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95',
  citizen: 'bg-citizen-text text-white hover:bg-[#064535] active:scale-95',
  liar: 'bg-liar-text text-white hover:bg-[#5a1c30] active:scale-95',
}

const sizeClasses = {
  sm: 'py-2 px-4 text-sm',
  md: 'py-3 px-6 text-base',
  lg: 'py-4 px-8 text-lg',
}

export function BubbleButton({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: BubbleButtonProps) {
  return (
    <button
      className={[
        'btn-bubble font-bold rounded-full transition-all',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
