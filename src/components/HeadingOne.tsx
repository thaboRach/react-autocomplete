type Props = {
  children: string;
};

export function HeadingOne({ children }: Props) {
  return <h1 className='ra-text-3xl'>{children}</h1>;
}
