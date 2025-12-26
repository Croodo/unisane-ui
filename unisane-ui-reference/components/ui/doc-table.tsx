import React from 'react';

export interface DocTableColumn {
  header: string;
  key: string;
  width?: string;
  render?: (item: any) => React.ReactNode;
}

interface DocTableProps {
  columns: DocTableColumn[];
  data: any[];
  className?: string;
}

export const DocTable: React.FC<DocTableProps> = ({ columns, data, className = '' }) => {
  return (
    <div className={`overflow-hidden rounded-[1.5rem] border border-stone-200 my-8 ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#F3F3F1]">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={col.key || idx} 
                className={`p-6 text-sm font-semibold text-stone-900 ${col.width || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 bg-white">
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-stone-50 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={`${rowIdx}-${colIdx}`} className="p-6 text-stone-600 text-sm align-top leading-relaxed">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};