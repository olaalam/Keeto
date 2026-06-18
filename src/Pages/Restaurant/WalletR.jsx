import React from "react";
import { useParams } from "react-router-dom";
import { useGet } from "@/hooks/useGet";
import { useUpdate } from "@/hooks/useUpdate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  DollarSign,
  Wallet,
  ArrowDownCircle,
  BadgeCheck,
  HandCoins,
  CheckCircle2,
} from "lucide-react";

const WalletR = () => {
  // الـ ID القادم من الـ URL هو الخاص بالمطعم
  const { id: restaurantId } = useParams();

  // 1. جلب بيانات المحفظة باستخدام ID المطعم
  const { data: walletData, isLoading } = useGet(
    ["wallet", restaurantId],
    `/api/superadmin/wallets/restaurant/${restaurantId}`,
  );

  const wallet = walletData?.data?.data || {};

  // تنظيف وتحويل القيمة المعلقة للتأكد من جاهزيتها للاستخدام في التصميم والـ API
  const rawValue = wallet.pendingWithdraw;
  const cleanValue =
    typeof rawValue === "string" ? rawValue.replace(/[^\d.]/g, "") : rawValue;
  const pendingAmount = Number(cleanValue) || 0;

  // 2. إعداد الـ Update Mutation للتحصيل
  const collectMutation = useUpdate(`/api/superadmin/wallets/collect`, [
    "wallet",
    restaurantId,
  ]);

  // 3. إعداد الـ Update Mutation للموافقة
  const approveMutation = useUpdate(`/api/superadmin/wallets/approve`, [
    "wallet",
    restaurantId,
  ]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // تنفيذ عملية التحصيل باستخدام Wallet ID المباشر
  const onCollect = (data) => {
    if (!wallet.id) return;

    collectMutation.mutate(
      {
        id: wallet.id,
        payload: {
          amount: Number(data.amount),
        },
      },
      {
        onSuccess: () => reset(),
      },
    );
  };

  // تنفيذ عملية الموافقة باستخدام Restaurant ID وإرسال القيمة الدقيقة
  const handleApprove = () => {
    if (!restaurantId || pendingAmount <= 0) return;

    approveMutation.mutate({
      id: restaurantId,
      payload: {
        amount: pendingAmount,
      },
    });
  };

  if (isLoading) return <LoadingSpinner />;

  const formatCurrency = (val) => {
    const num = Number(val);
    return isNaN(num) ? "0.00 E£" : `${num.toFixed(2)} E£`;
  };

  // التحقق من صلاحية الضغط على زر الموافقة
  const isApproveDisabled = approveMutation.isPending || pendingAmount <= 0;

  return (
    <div className="p-6 space-y-8">
      {/* الهيدر مع زر الموافقة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Restaurant Wallet</h1>

        <Button
          onClick={handleApprove}
          disabled={isApproveDisabled}
          className={`flex items-center gap-2 shadow-sm text-white transition-all ${
            isApproveDisabled
              ? "bg-slate-300 cursor-not-allowed text-slate-500"
              : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {approveMutation.isPending
            ? "Approving..."
            : pendingAmount <= 0
              ? "No Pending Amount"
              : "Approve Wallet Status"}
        </Button>
      </div>

      {/* كروت الإحصائيات */}
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
        {/* فورم التحصيل */}
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
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, bgColor }) => (
  <Card className={`${bgColor} border-none shadow-sm`}>
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-1 whitespace-nowrap">{value}</h3>
      </div>
      <div className="p-3 bg-white rounded-full shadow-sm flex-shrink-0">
        {icon}
      </div>
    </CardContent>
  </Card>
);

export default WalletR;
