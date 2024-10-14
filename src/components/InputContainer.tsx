import React from 'react';

type Props = {
  children: React.ReactNode;
};

export default function InputContainer({ children }: Props) {
  return <div className='ra-flex ra-gap-2 ra-items-center'>{children}</div>;
}
