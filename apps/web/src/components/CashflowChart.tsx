import { ResponsiveContainer, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, Bar } from 'recharts';

import type { CashflowPoint } from '../types';

interface Props {
  data: CashflowPoint[];
}

export const CashflowChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} stackOffset="sign">
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="period" stroke="#475569" />
          <YAxis stroke="#475569" tickFormatter={(value) => `$${value.toLocaleString()}`} />
          <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
          <Bar dataKey="income" name="Income" fill="#0f766e" />
          <Bar dataKey="expense" name="Expenses" fill="#ef4444" />
          <Bar dataKey="other" name="Other" fill="#94a3b8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
