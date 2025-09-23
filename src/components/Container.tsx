import React from 'react';

type Props = {
  children: React.ReactNode;
};

export function Container({ children }: Props) {
  return (
    <article className='ra-flex ra-flex-col ra-w-full ra-items-center ra-gap-2 ra-px-4'>
      {children}
    </article>
  );
}
