import React from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";

const CupponAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();

  const { data: Cuppons, isLoading: isFetching } = useQuery({
    queryKey: ["cuppon", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/coupons/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.Cuppons,
  });

  // 👈 الحل هنا: نضمن إن الـ initialData تكون Flat ومفيهاش أوبجكتس متداخلة
  const rawData = state?.Cuppons || Cuppons;
  const initialData = rawData
    ? {
        id: rawData.id,
        code: rawData.code || "", // إضافة الكود
        name:
          typeof rawData.name === "object" ? rawData.name.name : rawData.name,
        nameAr: rawData.nameAr || "",
        nameFr: rawData.nameFr || "",
        discountType: rawData.discountType || "percentage",
        discountValue: rawData.discountValue || "",
        minOrderAmount: rawData.minOrderAmount || "",
      }
    : undefined;

  const couponFields = [
    { name: "code", label: "Coupon Code", required: true }, // حقل الكود
    { name: "name", label: "Name", required: true },
    { name: "nameAr", label: "Name (Arabic)", required: false },
    {
      name: "discountType",
      label: "Discount Type",
      type: "select",
      required: true,
      options: [
        { label: "Percentage", value: "percentage" },
        { label: "Fixed Amount", value: "fixed_amount" }, // مطابقة تماماً لقيمة الـ API
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
      title="Coupons"
      apiUrl="/api/superadmin/coupons"
      queryKey="cuppon"
      fields={couponFields}
      initialData={initialData} // الـ داتا هنا هتروح نظيفة وجاهزة للملء
      onSuccessAction={() => {
        window.history.back();
      }}
    />
  );
};

export default CupponAdd;
