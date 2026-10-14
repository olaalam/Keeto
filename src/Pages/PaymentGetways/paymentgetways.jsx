import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useUpdate } from "@/hooks/useUpdate";

const getLogoSource = (logoUrl) => {
  if (typeof logoUrl !== "string" || !logoUrl.trim()) return "";

  let source = logoUrl.trim().replace(/^["']|["']$/g, "");
  if (/^data%3aimage%2f/i.test(source)) {
    try {
      source = decodeURIComponent(source);
    } catch {
      return "";
    }
  }

  if (/^https?:\/\//i.test(source)) return source;

  const dataUriMatch = source.match(/^data:(image\/[^;,]+);base64,(.*)$/is);
  const mimeType = dataUriMatch?.[1] || "image/jpeg";
  let base64 = dataUriMatch ? dataUriMatch[2] : source;

  base64 = base64
    .replace(/\\[rnt]/g, "")
    .replace(/\s/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  if (!base64 || /[^A-Za-z0-9+/=]/.test(base64)) return "";
  base64 = base64.replace(/=+$/, "");
  base64 += "=".repeat((4 - (base64.length % 4)) % 4);

  return `data:${mimeType};base64,${base64}`;
};

const GatewayLogo = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <span className="text-xs text-muted-foreground">Invalid logo</span>;
  }

  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border bg-white p-1">
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export default function PaymentGetways() {
  const navigate = useNavigate();
  const activateGateway = useUpdate(
    "/api/superadmin/platform-gateways",
    "payment-getways",
  );

  const { data: paymentGetways = [], isLoading } = useQuery({
    queryKey: ["payment-getways"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/platform-gateways");
      return res.data.data.data;
    },
  });
  
  const columns = [
    {
      accessorKey: "logoUrl",
      header: "Logo",
      cell: ({ row }) => {
        const rawLogo = row.getValue("logoUrl");
        const logoSource = getLogoSource(rawLogo);
        const hasLogo = typeof rawLogo === "string" && !!rawLogo.trim();
  
        return logoSource ? (
          <GatewayLogo
            key={logoSource}
            src={logoSource}
            alt={`${row.original.title} logo`}
          />
        ) : (
          <span className="text-sm text-muted-foreground">
            {hasLogo ? "Invalid logo" : "No logo"}
          </span>
        );
      },
    },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "provider", header: "Provider" },
    { accessorKey: "environment", header: "Environment" },
    {
      accessorKey: "isActive",
      header: "Active",
      cell: ({ row }) => {
        const gateway = row.original;
        const isActive = Boolean(gateway.isActive);

        return (
          <Switch
            checked={isActive}
            disabled={activateGateway.isPending}
            aria-label={`${isActive ? "Deactivate" : "Activate"} ${gateway.title}`}
            onCheckedChange={(checked) => {
              activateGateway.mutate({
                id: gateway.id,
                payload: checked ? {} : { isActive: false },
                customUrl: checked
                  ? `/api/superadmin/platform-gateways/${gateway.id}/activate`
                  : undefined,
              });
            }}
          />
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="paymentGetways"
        columns={columns}
        data={paymentGetways}
        isLoading={isLoading}
        actions
        queryKey="payment-getways"
        onAdd={() => navigate("/platform-payment/add")}
        onEdit={(paymentGetway) =>
          navigate(`/platform-payment/edit/${paymentGetway.id}`)
        }
      />
    </div>
  );
}
