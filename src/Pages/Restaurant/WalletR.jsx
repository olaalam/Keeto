import React from "react";
import { useParams } from "react-router-dom";
import { useGet } from "@/hooks/useGet";
import { useUpdate } from "@/hooks/useUpdate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import GenericDataTable from "@/components/GenericDataTable";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  DollarSign,
  Wallet,
  ArrowDownCircle,
  BadgeCheck,
  HandCoins,
} from "lucide-react";

const WalletR = () => {
  const { id } = useParams();

  // 1. جلب بيانات المحفظة
  const { data: walletData, isLoading } = useGet(
    ["wallet", id],
    `/api/superadmin/wallets/restaurant/${id}`,
  );

  // 2. إعداد الـ Update Mutation للتحصيل
  const collectMutation = useUpdate(`/api/superadmin/wallets/collect`, [
    "wallet",
    id,
  ]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const onCollect = (data) => {
    collectMutation.mutate(
      {
        id: id,
        payload: { amount: Number(data.amount) },
      },
      {
        onSuccess: () => reset(),
      },
    );
  };

  if (isLoading) return <LoadingSpinner />;

  // استخراج البيانات بناءً على الـ JSON الفعلي (walletData.data.data)
  const wallet = walletData?.data?.data || {};

  // تعريف أعمدة جدول المعاملات
  const transactionColumns = [
    { accessorKey: "id", header: "Transaction ID" },
    { accessorKey: "amount", header: "Amount" },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    { accessorKey: "method", header: "Method" },
  ];

  // دالة مساعدة لتنسيق الأرقام بشكل نظيف
  const formatCurrency = (val) => {
    const num = Number(val);
    return isNaN(num) ? "0.00 E£" : `${num.toFixed(2)} E£`;
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Restaurant Wallet</h1>

      {/* أولاً: كروت الإحصائيات بعد تعديل الكيهات لتطابق الـ API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Balance"
          value={formatCurrency(wallet.balance)}
          icon={<Wallet className="h-6 w-6 text-orange-600" />}
          bgColor="bg-orange-50"
        />
        <StatCard
          title="Pending Withdraw"
          value={formatCurrency(wallet.pendingWithdraw)}
          icon={<ArrowDownCircle className="h-6 w-6 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <StatCard
          title="Total Withdrawn"
          value={formatCurrency(wallet.totalWithdrawn)}
          icon={<DollarSign className="h-6 w-6 text-red-600" />}
          bgColor="bg-red-50"
        />
        <StatCard
          title="Collected Cash"
          value={formatCurrency(wallet.collectedCash)}
          icon={<HandCoins className="h-6 w-6 text-amber-600" />}
          bgColor="bg-amber-50"
        />
        <StatCard
          title="Total Earning"
          value={formatCurrency(wallet.totalEarning)}
          icon={<BadgeCheck className="h-6 w-6 text-blue-600" />}
          bgColor="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ثانياً: فورم التحصيل */}
        <Card className="lg:col-span-1 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">
              Collect Cash From Restaurant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCollect)} className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (E£)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 50"
                  {...register("amount", { required: true, min: 1 })}
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && (
                  <span className="text-xs text-red-500">
                    Please enter a valid amount
                  </span>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-slate-900"
                disabled={collectMutation.isPending}
              >
                {collectMutation.isPending ? "Processing..." : "Collect Cash"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ثالثاً: جدول المعاملات */}
        <div className="lg:col-span-2">
          <GenericDataTable
            title="Transactions History"
            data={wallet.transactions || []}
            columns={transactionColumns}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor }) => (
  <Card className={`${bgColor} border-none shadow-sm`}>
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-1 white-space-nowrap">{value}</h3>
      </div>
      <div className="p-3 bg-white rounded-full shadow-sm flex-shrink-0">
        {icon}
      </div>
    </CardContent>
  </Card>
);

export default WalletR;
