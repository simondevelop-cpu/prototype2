interface Props {
  title: string;
  value: string;
  caption?: string;
}

export const StatCard: React.FC<Props> = ({ title, value, caption }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500 mb-2">{title}</p>
    <p className="text-2xl font-semibold text-slate-900">{value}</p>
    {caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}
  </div>
);
