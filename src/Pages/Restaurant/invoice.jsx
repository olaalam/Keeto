import React from "react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
// Added all missing icons to the import line to fix the ReferenceErrors
import { Eye, FileText, X, Download } from "lucide-react";

export default function Invoice() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  // ✅ Helper function to normalize and clean up the date display format
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toISOString().split("T")[0];
    } catch (error) {
      return dateString;
    }
  };

  // 1. جلب البيانات والتأكد من مسار الـ Array الراجع من الـ API
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const res = await api.get(
        `/api/superadmin/report/restaurant/${id}/invoices`,
      );
      console.log("Invoice API Response:", res.data);
      return res.data?.data?.data || res.data?.data || [];
    },
    enabled: !!id,
  });

  // 2. تغيير حالة الفاتورة إلى مدفوعة
  const { mutate: markAsPaid } = useMutation({
    mutationFn: async (invoiceId) => {
      return await api.put(
        `/api/superadmin/report/invoice/${invoiceId}/mark-paid`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["invoices", id]);
    },
  });

  // Download PDF handler with preview overlay mapping
  const handleViewPDFInDialog = async (invoiceId) => {
    if (!invoiceId) {
      alert("Invalid Invoice ID. Cannot process preview.");
      return;
    }

    try {
      setIsPdfLoading(true);
      setIsPreviewOpen(true);

      const response = await api.get(
        `/api/superadmin/report/invoice/${invoiceId}/pdf`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob(
        [
          response.data?.data instanceof Blob
            ? response.data.data
            : response.data,
        ],
        {
          type: "application/pdf",
        },
      );

      const url = window.URL.createObjectURL(blob);

      setPdfUrl(url);
      setIsPdfLoading(false);
    } catch (error) {
      console.error("Failed to fetch invoice PDF preview:", error);
      alert("Could not load preview. Please verify backend configurations.");
      setIsPreviewOpen(false);
      setIsPdfLoading(false);
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
    }
  };

  // 3. تعريف الأعمدة
  const columns = [
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ getValue }) => formatDate(getValue()),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ getValue }) => formatDate(getValue()),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isPaid =
          row.original.status === "paid" || row.original.status === "Paid";

        const currentInvoiceId = row.original.id || row.original._id;

        return (
          <div className="flex items-center gap-2">
            <button
              disabled={isPaid}
              onClick={() => markAsPaid(currentInvoiceId)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                isPaid
                  ? "bg-green-100 text-green-700 cursor-not-allowed"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer"
              }`}
              title={isPaid ? "Paid" : "Click to mark as paid"}
            >
              {isPaid ? "Paid" : "Unpaid (Mark Paid)"}
            </button>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoiceId =
          row.original.id || row.original._id || row.original.invoiceId;

        return (
          <button
            onClick={() => handleViewPDFInDialog(invoiceId)}
            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-primary hover:text-white transition-colors duration-200 shadow-sm cursor-pointer"
            title="View & Download PDF"
          >
            <Eye className="w-4 h-4" />
          </button>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="Restaurant Invoices"
        columns={columns}
        data={invoices}
        isLoading={isLoading}
        queryKey={["invoices", id]}
        actions={false}
        onAdd={() => navigate("/restaurants/invoice/add")}
      />

      {/* ==================== الـ Premium Invoice PDF Preview Dialog ==================== */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300">
          {/* Backdrop الخلفية الداكنة المضببة */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-all"
            onClick={closePreview}
          />

          {/* جسم الـ Dialog مع أنيميشن التكبير الهادئ */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-100 relative z-10 scale-in-center transform transition-transform duration-300">
            {/* الهيدر المحسن */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Invoice Preview
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Review statement and options below
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* زر تحميل إضافي واضح في الهيدر لسهولة الوصول في الشاشات المختلفة */}
                {pdfUrl && !isPdfLoading && (
                  <a
                    href={pdfUrl}
                    download={`Invoice.pdf`}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold border border-slate-200 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
                <button
                  onClick={closePreview}
                  className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* منطقة عرض الفاتورة */}
            <div className="flex-1 bg-slate-50 relative p-4">
              {isPdfLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-600 font-bold tracking-wide animate-pulse">
                    Generating Live Preview...
                  </p>
                </div>
              ) : (
                pdfUrl && (
                  <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200/80 bg-white shadow-inner">
                    <iframe
                      src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
                      className="w-full h-full border-0"
                      title="Invoice PDF"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
