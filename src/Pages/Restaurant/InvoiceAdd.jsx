import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";

const InvoiceAdd = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
      apiUrl="/api/superadmin/report/restaurant/invoice"
      queryKey="invoices"
      fields={invoiceFields}
      transformPayload={(data) => ({ ...data, restaurantId: id })}
      onSuccessAction={() => navigate(-1)}
    />
  );
};

export default InvoiceAdd;
