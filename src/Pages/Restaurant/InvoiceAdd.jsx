import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";

const InvoiceAdd = () => {
  const { id, restaurantId } = useParams();
  const navigate = useNavigate();

  // سيبنا الـ ID كـ String من غير تحويل لـ Number لأن نوعه UUID
  const currentRestaurantId = restaurantId || id;

  const invoiceFields = [
    {
      name: "restaurantId",
      type: "hidden",
      value: currentRestaurantId,
    },
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
      apiUrl="/api/superadmin/report/restaurant/invoice"
      queryKey="invoices"
      fields={invoiceFields}
      onSuccessAction={() => navigate(-1)}
      beforeSubmit={(formData) => ({
        ...formData,
        // نمرره هنا برضه كـ String للتأكيد الإضافي
        restaurantId: formData.restaurantId || currentRestaurantId,
      })}
    />
  );
};

export default InvoiceAdd;
