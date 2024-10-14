type Props = {
  htmlFor: string;
  children: string;
};

export default function Label({ htmlFor, children }: Props) {
  return (
    <label className='ra-block ra-mx-2' htmlFor={htmlFor}>
      {children}
    </label>
  );
}
