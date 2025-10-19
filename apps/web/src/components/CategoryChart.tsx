import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import type { CategorySpendItem } from '../types';

interface Props {
  data: CategorySpendItem[];
}

export const CategoryChart: React.FC<Props> = ({ data }) => (
  <div className="w-full h-64">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" stroke="#475569" tickFormatter={(value) => `$${value.toLocaleString()}`} />
        <YAxis type="category" dataKey="categoryName" stroke="#475569" width={160} />
        <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
        <Bar dataKey="total" fill="#1c64f2" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
