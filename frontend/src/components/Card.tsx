import React, { PropsWithChildren, HTMLAttributes } from 'react'

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>

export function Card({ children, className, ...rest }: CardProps) {
  const classes = ['card', className].filter(Boolean).join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}


