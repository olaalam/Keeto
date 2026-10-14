import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GATEWAY_PROVIDERS = {
  KASHIER: [
    { key: "mid", label: "Merchant ID (MID)" },
    { key: "apiKey", label: "API Key", secret: true },
    { key: "secretKey", label: "Secret Key", secret: true },
  ],
  PAYMOB: [
    { key: "secretKey", label: "Secret Key", secret: true },
    { key: "publicKey", label: "Public Key" },
    { key: "integrationId", label: "Integration ID" },
    { key: "hmac", label: "HMAC", secret: true },
    { key: "callbackUrl", label: "Callback URL" },
  ],
  GEIDEA: [
    { key: "publicKey", label: "Public Key" },
    { key: "apiPassword", label: "API Password", secret: true },
    { key: "name", label: "Name" },
    { key: "environment", label: "Region" },
    { key: "callbackUrl", label: "Callback URL" },
    { key: "returnUrl", label: "Return URL" },
  ],
};

const providerOptions = Object.keys(GATEWAY_PROVIDERS).map((provider) => ({
  value: provider,
  label: provider,
}));

const PaymentGetwayAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();

  const { data: paymentGetwayData, isLoading: isFetching } = useQuery({
    queryKey: ["paymentGetway", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/platform-gateways/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.paymentGetwayData,
  });

  const initialData = state?.paymentGetwayData || paymentGetwayData;
  const formInitialData =
    initialData || (!id ? { environment: "LIVE", isActive: false } : undefined);

  const paymentGetwayFields = [
    { name: "title", label: "Title", required: true },
    {
      name: "provider",
      label: "Provider",
      required: true,
      type: "select",
      options: providerOptions,
    },
    {
      name: "environment",
      label: "Environment",
      required: true,
      type: "select",
      options: [
        { value: "LIVE", label: "LIVE" },
        { value: "TEST", label: "TEST" },
      ],
    },
    { name: "logoUrl", label: "Logo", type: "file" },
    { name: "isActive", label: "Active", type: "switch" },
  ];

  if (id && isFetching) return <LoadingSpinner />;

  return (
    <AddPage
      title="paymentGetway"
      apiUrl="/api/superadmin/platform-gateways"
      queryKey="paymentGetways"
      fields={paymentGetwayFields}
      initialData={formInitialData}
      onSuccessAction={() => window.history.back()}
      transformPayload={(data) => {
        const provider = data.provider;
        const credentialFields = GATEWAY_PROVIDERS[provider] || [];
        const payload = {
          title: data.title,
          provider,
          environment: data.environment,
          isActive: !!data.isActive,
          logoUrl: data.logoUrl ?? "",
          credentials: Object.fromEntries(
            credentialFields.map(({ key }) => [
              key,
              data.credentials?.[key] ?? "",
            ]),
          ),
        };

        return payload;
      }}
    >
      {({ register, watch, formState: { errors } }) => {
        const selectedProvider = watch("provider");
        const credentialFields = GATEWAY_PROVIDERS[selectedProvider] || [];

        if (!credentialFields.length) return null;

        return (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {credentialFields.map(({ key, label, secret }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`credentials.${key}`}>{label}</Label>
                <Input
                  id={`credentials.${key}`}
                  type={secret ? "password" : "text"}
                  autoComplete="off"
                  {...register(`credentials.${key}`, {
                    validate: (value) =>
                      watch("provider") !== selectedProvider || !!value,
                  })}
                  className={
                    errors.credentials?.[key] ? "border-destructive" : ""
                  }
                />
                {errors.credentials?.[key] && (
                  <p className="text-xs text-destructive">{"required"}</p>
                )}
              </div>
            ))}
          </div>
        );
      }}
    </AddPage>
  );
};

export default PaymentGetwayAdd;
