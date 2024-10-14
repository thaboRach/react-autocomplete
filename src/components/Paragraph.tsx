import React from 'react';

type Props = {
  children: React.ReactNode;
};

export default function Paragraph({ children }: Props) {
  return <p className='ra-text-center'>{children}</p>;
}
