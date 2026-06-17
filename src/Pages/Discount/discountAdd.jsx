import React from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

const DiscountAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();

  const { data: Discounts, isLoading: isFetching } = useQuery({
    queryKey: ["discount", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/discounts/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.Discounts,
  });

  // 👈 الحل هنا: نضمن إن الـ initialData تكون Flat ومفيهاش أوبجكتس متداخلة
  const rawData = state?.Discounts || Discounts;

  const initialData = rawData
    ? {
        id: rawData.id,
        name:
          typeof rawData.name === "object" ? rawData.name.name : rawData.name,
        nameAr: rawData.nameAr || "",
        nameFr: rawData.nameFr || "",
        // تعديل المسمى ليطابق الـ API وتأمين القيمة
        discountType:
          typeof rawData.discountType === "object"
            ? rawData.discountType.discountType
            : rawData.discountType,
        discountValue: rawData.discountValue || "",
        minOrderAmount: rawData.minOrderAmount || "",
      }
    : undefined;

  const discountFields = [
    { name: "name", label: "Name", required: true },
    { name: "nameAr", label: "Name (Arabic)", required: false },
    { name: "nameFr", label: "Name (Franko)", required: false },
    {
      name: "discountType", // تعديل الاسم هنا ليتطابق مع الـ state والـ API
      label: "Discount Type",
      type: "select",
      required: true,
      options: [
        { label: "Percentage", value: "percentage" },
        { label: "Fixed Amount", value: "fixed" }, // أو القيمة الأخرى المستعملة في السيرفر لديك
      ],
    },
    {
      name: "discountValue",
      label: "Discount Value",
      type: "number",
      required: true,
    },
    {
      name: "minOrderAmount",
      label: "Min Order Amount",
      type: "number",
      required: false,
    },
  ];
  if (id && isFetching) return <LoadingSpinner />;

  return (
    <AddPage
      title="Discount"
      apiUrl="/api/superadmin/discounts"
      queryKey="discount"
      fields={discountFields}
      initialData={initialData} // الـ داتا هنا هتروح نظيفة وجاهزة للملء
      onSuccessAction={() => {
        window.history.back();
      }}
    />
  );
};

export default DiscountAdd;
