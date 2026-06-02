import React from "react";
import { useParams } from "react-router-dom"; // لجلب الـ ID الخاص بالمطعم الحالي
import AddPage from "@/components/AddPage";
import { useMutation } from "@tanstack/react-query";
import api from "@/api/axios";

const InvoiceAdd = () => {
  // 1. جلب الـ id الخاص بالمطعم من الـ URL مباشرة
  // تأكدي أن الإسم يطابق الـ الـ Route (مثلاً :restaurantId أو :id)
  const { id, restaurantId } = useParams();
  const currentRestaurantId = restaurantId || id;

  // 2. دالة إرسال البيانات للـ API
  const { mutate: generateInvoiceReport, isLoading: isSubmitting } =
    useMutation({
      mutationFn: async (formData) => {
        // هنا ندمج الـ restaurantId تلقائياً مع التواريخ القادمة من الحقول
        const payload = {
          ...formData,
          restaurantId: currentRestaurantId,
        };

        const { data } = await api.post(
          "/api/superadmin/report/restaurant/invoice",
          payload,
        );
        return data;
      },
      onSuccess: (data) => {
        console.log("Invoice generated successfully:", data);
        window.history.back(); // الرجوع لجدول الفواتير بعد النجاح
      },
      onError: (error) => {
        console.error("Error generating invoice:", error);
      },
    });

  // 3. الحقول المطلوبة (تواريخ فقط لأن المطعم معروف مسبقاً)
  const invoiceFields = [
    {
      name: "startDate",
      label: "Start Date",
      type: "date",
      required: true,
    },
    {
      name: "endDate",
      label: "End Date",
      type: "date",
      required: true,
    },
  ];

  return (
    <AddPage
      title="Generate Restaurant Invoice"
      fields={invoiceFields}
      // عند الضغط على زر الحفظ، نمرر الداتا للـ mutation
      onSubmit={(formData) => generateInvoiceReport(formData)}
      onSuccessAction={() => {
        window.history.back();
      }}
    />
  );
};

export default InvoiceAdd;
