import React, { ButtonHTMLAttributes } from 'react'

type Variant = 'default' | 'primary' | 'secondary' | 'outline'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
}

export function Button({ variant = 'default', className, ...rest }: ButtonProps) {
  const base = 'btn'
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : variant === 'outline' ? 'btn-outline' : ''
  const classes = [base, variantClass, className].filter(Boolean).join(' ')
  return <button className={classes} {...rest} />
}


