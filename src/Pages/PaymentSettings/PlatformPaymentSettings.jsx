import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgePercent, Banknote, Clock3, LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const QUERY_KEY = "platform-payment-settings";
const API_URL = "/api/superadmin/platform-payment-settings";

const fields = [
  {
    name: "percentageValue",
    label: "Platform percentage",
    description: "Percentage commission applied to each payment.",
    icon: BadgePercent,
    suffix: "%",
  },
  {
    name: "fixedValue",
    label: "Fixed fee",
    description: "Flat fee applied to each payment.",
    icon: Banknote,
  },
  {
    name: "tax",
    label: "Tax",
    description: "Tax percentage applied to payments.",
    icon: BadgePercent,
    suffix: "%",
  },
];

function getSettings(response) {
  const settings = response?.data?.data;
  if (!settings || typeof settings !== "object") {
    throw new Error("The payment settings response was invalid.");
  }
  return settings;
}

export default function PlatformPaymentSettings() {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState(null);
  const {
    data: settings,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const response = await api.get(API_URL);
      return getSettings(response.data);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.put(API_URL, payload);
      return response.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      setFormValues(null);
      toast.success("Payment settings updated successfully.");
    },
    onError: (updateError) => {
      toast.error(
        updateError?.response?.data?.error?.message ||
          updateError?.response?.data?.data?.message ||
          updateError.message ||
          "Unable to update payment settings.",
      );
    },
  });

  const values = formValues || {
    percentageValue: settings?.percentageValue ?? "",
    fixedValue: settings?.fixedValue ?? "",
    tax: settings?.tax ?? "",
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(
      fields.map(({ name }) => [name, Number(values[name])]),
    );

    if (
      Object.values(payload).some(
        (value) => !Number.isFinite(value) || value < 0,
      )
    ) {
      toast.error("Enter a valid non-negative number for each setting.");
      return;
    }

    updateMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-80 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>Unable to load payment settings</CardTitle>
            <CardDescription>
              {error?.message || "Please try again in a moment."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Platform
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Payment settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Configure the percentage commission, fixed fee, and tax used for
          platform payments.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card>
          <CardHeader>
            <CardTitle>Fees and tax</CardTitle>
            <CardDescription>
              Changes apply to platform payments after you save.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              {fields.map(({ name, label, description, icon: Icon, suffix }) => (
                <div
                  key={name}
                  className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,240px)] sm:items-center"
                >
                  <div className="space-y-1">
                    <Label htmlFor={name} className="gap-2 text-sm font-semibold">
                      <Icon className="size-4 text-muted-foreground" />
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                  <div className="relative">
                    <Input
                      id={name}
                      name={name}
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={values[name]}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...(current || values),
                          [name]: event.target.value,
                        }))
                      }
                      className={suffix ? "pr-10" : ""}
                      aria-label={label}
                    />
                    {suffix && (
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                        {suffix}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormValues(null)}
                  disabled={!formValues || updateMutation.isPending}
                >
                  Discard changes
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    <LoaderCircle className="animate-spin" />
                  ) : (
                    <Save />
                  )}
                  {updateMutation.isPending ? "Saving..." : "Save settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit bg-muted/30">
          <CardHeader>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
              <Clock3 className="size-5" />
            </div>
            <CardTitle className="text-base">Last updated</CardTitle>
            <CardDescription>
              {settings?.updatedAt
                ? new Date(settings.updatedAt).toLocaleString()
                : "No update timestamp available"}
            </CardDescription>
          </CardHeader>
         
        </Card>
      </div>
    </main>
  );
}
