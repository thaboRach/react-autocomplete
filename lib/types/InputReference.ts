import React from 'react';

export type InputReference = {
  input?: React.RefObject<HTMLInputElement>;
} & {
  [key: string]: React.RefObject<HTMLElement>;
};
