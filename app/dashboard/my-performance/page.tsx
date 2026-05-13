"use client";

import { Download } from "lucide-react";
import React, { useState, useEffect } from "react";
import axios from "axios";

import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Link from "next/link";
import api from "@/lib/api";

type Assessment = {
  assessName: string;
  attemptNo: number;
  type: string;
  overall: string;
  score: string;
  date: string;
  action: string;
};

// ---------------------- MAIN PAGE ----------------------
const Page = () => {
  return (
    <main className="w-full space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <h1 className="text-lg text-[#1E1E1E] font-semibold">
          Your attempted assessments
        </h1>

        {/* <div className="w-fit text-white flex items-center px-2 py-2 bg-[#f2825c] rounded-md gap-1 cursor-pointer">
          <Download size={15} />
          <h1>Export List</h1>
        </div> */}
      </div>

      {/* DataTable */}
      <DataTable />
    </main>
  );
};

export default Page;

// ---------------------- DATA TABLE COMPONENT ----------------------
export function DataTable() {
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await api.get("/assessments/results");

        const formatted = res.data.results.map((item: any) => ({
          _id: item._id, // keep _id
          assessName: item.test_name,
          attemptNo: item.attempt,
          type: "Assignment",
          overall: item.obtained_percentage + " %",
          score: `${item.test_score}/${item.total_test_score}`,
          date: new Date(item.createdAt).toLocaleDateString("en-IN"),
          action: "View",
        }));

        setTableData(formatted);
      } catch (error: any) {
        console.log("API ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  // ---------------------- MOVE COLUMNS INSIDE ----------------------
  const columns: ColumnDef<any>[] = [
    { accessorKey: "assessName", header: "Assess. Name" },
    { accessorKey: "attemptNo", header: "Attempt no." },
    { accessorKey: "type", header: "Type" },
    { accessorKey: "overall", header: "Overall %" },
    { accessorKey: "score", header: "Score" },
    { accessorKey: "date", header: "Date" },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Link
          href={`/dashboard/my-performance/result-&-analysis?id=${
            tableData[row.index]._id
          }`}
          className="text-[#f2825c] font-medium underline underline-offset-2"
        >
          {row.getValue("action")}
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
  });

  return (
    <>
      <div className="w-full rounded-md border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-[#F2F2F2]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-[#1E1E1E] font-semibold text-sm"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-6"
                >
                  Loading results...
                </TableCell>
              </TableRow>
            )}

            {!loading && table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-6"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="bg-[#fff0ea] border-b border-[#cfe3e0]/10 hover:bg-[#fff0ea]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-[#1E1E1E] text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div className="w-full flex items-center justify-between">
        <span>
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>
        </span>

        <div>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-2 border-[#f2825c] text-[#f2825c] px-6 py-1 rounded-md"
          >
            Prev
          </button>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="bg-[#f2825c] border-2 border-[#f2825c] text-white px-6 py-1 ml-2 rounded-md"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
