"use client";

import React, { useEffect, useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
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
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type Assessment = {
  job_title: string;
  type: string;
  cat: string;
  difficulty: string;
  totalScore: string;
  status: string;
  createdAt: string;
  action: string;
  _id: string;
};

export const columns: ColumnDef<Assessment>[] = [
  {
    accessorKey: "job_title",
    header: "Interview",
  },
  {
    accessorKey: "totalScore",
    header: "Interview Score",
  },
  {
    accessorKey: "cat",
    header: "Type",
  },
  {
    accessorKey: "difficulty",
    header: "Difficulty Level",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const rawDate = row.original.createdAt;
      const date = new Date(rawDate);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const interviewid = row.original._id;
      return (
        <Link
          href={`/dashboard/my-interviews/${interviewid}`}
          className="text-[#f2825c] font-medium underline underline-offset-2"
        >
          {row.getValue("action")}
        </Link>
      );
    },
  },
];

const ITEMS_PER_PAGE = 10;

const Page = () => {
  const router = useRouter();

  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({
    totalItems: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    const fetchInterviews = async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/interview/history?page=${currentPage}&limit=${ITEMS_PER_PAGE}`
        );

        const checkdata = res.data.sessions.map((e: any) => {
          let displayTitle = e.job_title;
          if (!displayTitle && e.skills && e.skills.length > 0) {
            displayTitle = Array.isArray(e.skills)
              ? e.skills.join(", ")
              : e.skills;
          }
          return {
            ...e,
            job_title: displayTitle || "Unknown Interview",
            action: "View",
          };
        });

        setInterviews(checkdata);

        if (res.data.pagination) {
          setPaginationMeta({
            totalItems: res.data.pagination.totalItems,
            totalPages: res.data.pagination.totalPages,
            hasNext: res.data.pagination.hasNext,
            hasPrev: res.data.pagination.hasPrev,
          });
        }
      } catch {
        console.log("Err: while fetching the mock interviews");
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, [currentPage]);

  const getVisiblePages = () => {
    const total = paginationMeta.totalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, total - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  };

  return (
    <main className="w-full space-y-4">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <h1 className="text-lg text-[#1E1E1E] font-semibold">
          Your attempted Mock Interviews
        </h1>
        <button
          onClick={() => router.push("/dashboard/my-interviews/result-&-analysis")}
          className="w-fit text-white flex items-center px-2 py-2 bg-[#184852] rounded-md gap-1 cursor-pointer"
        >
          <h1>View Detailed Progress</h1>
        </button>
      </div>

      {/* DataTable */}
      <DataTable data={interviews} loading={loading} />

      {/* Server-side Pagination */}
      {!loading && paginationMeta.totalItems > 0 && (
        <div className="w-full flex items-center justify-between py-3">
          <span className="text-sm text-gray-500">
            Showing{" "}
            <strong>
              {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, paginationMeta.totalItems)}
            </strong>{" "}
            of <strong>{paginationMeta.totalItems}</strong> interviews
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!paginationMeta.hasPrev}
              className="border-2 border-[#f2825c] text-[#f2825c] px-6 py-1 rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            {getVisiblePages().map((pageNo) => (
              <button
                key={pageNo}
                onClick={() => setCurrentPage(pageNo)}
                className={`px-3 py-1 rounded-md border-2 cursor-pointer text-sm ${
                  currentPage === pageNo
                    ? "bg-[#f2825c] border-[#f2825c] text-white font-semibold"
                    : "border-[#f2825c] text-[#f2825c]"
                }`}
              >
                {pageNo}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(paginationMeta.totalPages, p + 1))
              }
              disabled={!paginationMeta.hasNext}
              className="bg-[#f2825c] border-2 border-[#f2825c] text-white px-6 py-1 rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;

export function DataTable({
  data,
  loading,
}: {
  data: any[];
  loading: boolean;
}) {
  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (loading) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-gray-400 text-sm">
        Loading interviews...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-40 flex items-center justify-center text-gray-400 text-sm">
        No interviews found.
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-[#F8F8F8]">
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
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="bg-[#fff0ea] hover:bg-[#fff0ea]">
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="text-[#1E1E1E] text-sm capitalize"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
