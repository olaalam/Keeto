import React from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Label } from "radix-ui";

const SalesAdd = () => {
  const { id } = useParams(); // الحصول على الـ id من الـ URL في حالة التعديل
  const { state } = useLocation();

  // 1. إذا كانت البيانات موجودة في الـ state (مثلاً ضغطنا تعديل من جدول) نستخدمها فوراً
  // 2. إذا لم تكن موجودة، يمكننا عمل Query لجلب بيانات هذا المشرف تحديداً
  const { data: salesData, isLoading: isFetching } = useQuery({
    queryKey: ["sales", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/sales/${id}`);
      console.log(data.data.data);
      return data.data.data;
    },
    enabled: !!id && !state?.salesData, // لا يتم التفعيل إلا لو فيه id ومافيش بيانات جاهزة
  });

  const rawData = state?.salesData || salesData;

  const initialData = React.useMemo(() => {
    if (!rawData) return null;
    return {
      ...rawData,
      status:
        rawData.status === true || rawData.status === "active"
          ? "active"
          : "inactive",
    };
  }, [rawData]);

  // التعديل هنا:
  // 1. أضفنا type: "number" للـ points عشان تتبعت كـ Number (لو الـ AddPage بياخد التايب ده في الاعتبار ويحول القيمة)
  // 2. عملنا فلتر للمصفوفة بحيث لو فيه id (حالة تعديل) يشيل الفيلد الخاص بالـ password
  const salesFields = [
    { name: "name", label: "Name", required: true },
    { name: "phone", label: "Phone", required: true },
   // { name: "email", label: "Email", required: false },
    //{ name: "points", label: "Points", required:false, type: "number" }, // تحويل لنوع رقم
    //{ name: "password", label: "Password", required: false, type: "password" }, // إخفاء الباسورد في الإيديت
  ]//.filter((field) => !(id && field.name === "password")); // إخفاء الباسورد في الإيديت

  if (id && isFetching) return <LoadingSpinner />;

  return (
    <AddPage
      title="Sales"
      apiUrl="/api/superadmin/sales" // هذا هو الـ Base URL
      queryKey="sales"
      fields={salesFields}
      initialData={initialData} // المكون سيفهم أن هناك id وسينادي useUpdate
      onSuccessAction={() => {
        // مثلاً الرجوع للخلف أو لجدول المديرين
        window.history.back();
      }}
    />
  );
};

export default SalesAdd;
