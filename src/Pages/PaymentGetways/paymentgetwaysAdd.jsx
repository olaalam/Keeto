import React from "react";
import { useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
    { key: "callbackUrl", label: "Callback URL", required: false },
  ],
  GEIDEA: [
    { key: "publicKey", label: "Public Key" },
    { key: "apiPassword", label: "API Password", secret: true },
    { key: "name", label: "Name" },
    { key: "environment", label: "Region" },
    { key: "callbackUrl", label: "Callback URL", required: false },
    { key: "returnUrl", label: "Return URL" },
  ],
};

const providerOptions = Object.keys(GATEWAY_PROVIDERS).map((provider) => ({
  value: provider,
  label: provider,
}));

// يستخرج مصفوفة الـ gateways من أي شكل response (array / { data } / { data: { data } } ...)
const extractList = (res) =>
  [
    res,
    res?.data,
    res?.data?.data,
    res?.data?.items,
    res?.data?.rows,
    res?.items,
  ].find(Array.isArray) || [];

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

  // لمعرفة هل في gateway تانية هي الـ default حالياً
  const { data: gatewaysList } = useQuery({
    queryKey: ["paymentGetways", "default-check"],
    queryFn: async () => {
      const { data } = await api.get("/api/superadmin/platform-gateways");
      return data;
    },
  });
  const otherDefault = extractList(gatewaysList).find(
    (g) => g?.isDefault === "active" && String(g.id ?? g._id) !== String(id),
  );

  const initialData = state?.paymentGetwayData || paymentGetwayData;
  const formInitialData = initialData
    ? {
        ...initialData,
        isDefault: initialData.isDefault === "active" ? "active" : "inactive",
      }
    : !id
      ? { environment: "LIVE", isActive: false, isDefault: "inactive" }
      : undefined;

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
          isDefault: data.isDefault === "active" ? "active" : "inactive",
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
      {({ register, watch, setValue, formState: { errors } }) => {
        const selectedProvider = watch("provider");
        const credentialFields = GATEWAY_PROVIDERS[selectedProvider] || [];

        // gateway واحدة فقط تكون default: لو في واحدة تانية default، السويتش مقفول
        // لحد ما تقفلها هي الأول
        const isDefault = watch("isDefault") === "active";
        const defaultBlocked = !!otherDefault && !isDefault;

        return (
          <div className="space-y-6">
            <input type="hidden" {...register("isDefault")} />
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-1">
                <Label htmlFor="isDefault">Default gateway</Label>
                <p className="text-xs text-muted-foreground">
                  {defaultBlocked
                    ? `"${otherDefault.title}" is already the default. Turn it off first to make this one the default.`
                    : "Only one gateway can be the default at a time."}
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={isDefault}
                disabled={defaultBlocked}
                onCheckedChange={(v) =>
                  setValue("isDefault", v ? "active" : "inactive", {
                    shouldDirty: true,
                  })
                }
              />
            </div>

            {credentialFields.length > 0 && (
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
            )}
          </div>
        );
      }}
    </AddPage>
  );
};

export default PaymentGetwayAdd;
