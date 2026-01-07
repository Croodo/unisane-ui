import React from "react";

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
}

export const Table: React.FC<TableProps> = ({ children, className = "", ...props }) => (
  <table className={`min-w-full border-separate border-spacing-0 table-fixed ${className}`} {...props}>
    {children}
  </table>
);

interface TableContainerProps {
  children: React.ReactNode;
}

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  ({ children }, ref) => (
    <div
      ref={ref}
      className="flex-1 overflow-auto relative scroll-auto bg-background no-scrollbar border-b"
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE/Edge
      }}
    >
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {children}
    </div>
  )
);
TableContainer.displayName = "TableContainer";
