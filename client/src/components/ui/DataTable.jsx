
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender } from
'@tanstack/react-table';
import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';









export function DataTable({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'بحث...',
  pageSize = 10
}) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      globalFilter,
      columnVisibility
    },
    initialState: {
      pagination: {
        pageSize
      }
    }
  });

  return (
    <div className="space-y-3">
        {searchKey &&
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex h-9 w-full sm:max-w-sm rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        
            <span className="text-xs text-muted-foreground whitespace-nowrap self-end sm:self-center">
              {table.getFilteredRowModel().rows.length} من {data.length} سجل
            </span>
          </div>
      }
        <div className="rounded-md border border-border">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary text-muted-foreground">
                  {table.getHeaderGroups().map((headerGroup) =>
                <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) =>
                  <th
                    key={header.id}
                    className="px-2 sm:px-3 py-2 text-right font-medium whitespace-nowrap">
                    
                          {header.isPlaceholder ?
                    null :
                    header.column.getCanSort() ?
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}>
                      
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {{
                        asc: <ChevronUp className="size-3.5" />,
                        desc: <ChevronDown className="size-3.5" />
                      }[header.column.getIsSorted()] ??
                      <ChevronsUpDown className="size-3.5 opacity-50" />
                      }
                                </button> :

                    flexRender(header.column.columnDef.header, header.getContext())
                    }
                        </th>
                  )}
                    </tr>
                )}
                </thead>
                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows?.length ?
                table.getRowModel().rows.map((row) =>
                <tr key={row.id} className="hover:bg-secondary/50">
                        {row.getVisibleCells().map((cell) =>
                  <td key={cell.id} className="px-2 sm:px-3 py-2 whitespace-nowrap">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                  )}
                      </tr>
                ) :

                <tr>
                      <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                        لا توجد بيانات
                      </td>
                    </tr>
                }
                </tbody>
              </table>
            </div>
          </div>
          {table.getPageCount() > 1 &&
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border px-3 py-2">
              <div className="text-xs text-muted-foreground">
                صفحة {table.getState().pagination.pageIndex + 1} من {table.getPageCount()}
              </div>
              <div className="flex items-center gap-1">
                <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-md border border-input bg-card px-2.5 py-1.5 text-xs hover:bg-secondary disabled:opacity-50 min-h-[32px]">
              
                  السابق
                </button>
                <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-md border border-input bg-card px-2.5 py-1.5 text-xs hover:bg-secondary disabled:opacity-50 min-h-[32px]">
              
                  التالي
                </button>
              </div>
            </div>
        }
        </div>
      </div>);

}