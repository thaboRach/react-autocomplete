type Props = {
  children: string;
};

export default function Code({ children }: Props) {
  return <code className='ra-bg-slate-100 ra-rounded ra-text-sm ra-py-1 ra-px-1'>{children}</code>;
}
