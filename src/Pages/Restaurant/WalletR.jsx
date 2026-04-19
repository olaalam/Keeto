import React from 'react';
import { useParams } from 'react-router-dom';
import { useGet } from '@/hooks/useGet';
import { useUpdate } from '@/hooks/useUpdate';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import GenericDataTable from '@/components/GenericDataTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { DollarSign, Wallet, ArrowDownCircle, BadgeCheck } from "lucide-react";

const WalletR = () => {
    const { id } = useParams();

    // 1. جلب بيانات المحفظة (استخدام useGet)
    const { data: walletData, isLoading } = useGet(
        ['wallet', id],
        `/api/superadmin/wallets/restaurant/${id}`
    );

    // 2. إعداد الـ Update Mutation للتحصيل (استخدام useUpdate)
    const collectMutation = useUpdate(`/api/superadmin/wallets/collect`, ['wallet', id]);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const onCollect = (data) => {
        // إرسال الـ id في الـ URL والـ amount في الـ body حسب الـ Hook بتاعك
        collectMutation.mutate({
            id: id,
            payload: { amount: Number(data.amount) }
        }, {
            onSuccess: () => reset() // تصفير الحقل بعد النجاح
        });
    };

    if (isLoading) return <LoadingSpinner />;

    // استخراج البيانات من الـ API (بناءً على الـ JSON المتوقع)
    const wallet = walletData?.data || {};

    // تعريف أعمدة جدول المعاملات
    const transactionColumns = [
        { accessorKey: 'id', header: 'Transaction ID' },
        { accessorKey: 'amount', header: 'Amount' },
        { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
        { accessorKey: 'method', header: 'Method' },
    ];

    return (
        <div className="p-6 space-y-8">
            <h1 className="text-2xl font-bold">Restaurant Wallet</h1>

            {/* أولاً: كروت الإحصائيات (مثل الصور) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Balance"
                    value={`${wallet.balance || 0} E£`}
                    icon={<Wallet className="h-6 w-6 text-orange-600" />}
                    bgColor="bg-orange-50"
                />
                <StatCard
                    title="Pending Withdraw"
                    value={`${wallet.pending_withdraw || 0} E£`}
                    icon={<ArrowDownCircle className="h-6 w-6 text-emerald-600" />}
                    bgColor="bg-emerald-50"
                />
                <StatCard
                    title="Total Withdrawn"
                    value={`${wallet.total_withdrawn || 0} E£`}
                    icon={<DollarSign className="h-6 w-6 text-red-600" />}
                    bgColor="bg-red-50"
                />
                <StatCard
                    title="Total Earning"
                    value={`${wallet.total_earning || 0} E£`}
                    icon={<BadgeCheck className="h-6 w-6 text-blue-600" />}
                    bgColor="bg-blue-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ثانياً: فورم التحصيل (Collect Cash) */}
                <Card className="lg:col-span-1 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-lg">Collect Cash From Restaurant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onCollect)} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Amount (E£)</Label>
                                <Input
                                    type="number"
                                    placeholder="Ex: 50"
                                    {...register('amount', { required: true, min: 1 })}
                                    className={errors.amount ? "border-red-500" : ""}
                                />
                                {errors.amount && <span className="text-xs text-red-500">Please enter a valid amount</span>}
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

                {/* ثالثاً: جدول المعاملات (GenericDataTable) */}
                <div className="lg:col-span-2">
                    <GenericDataTable
                        title="Transactions History"
                        data={wallet.transactions || []}
                        columns={transactionColumns}
                        isLoading={isLoading}
                    // لم نضع onEdit أو delete ليكون للعرض فقط
                    />
                </div>
            </div>
        </div>
    );
};

// مكون فرعي للكروت
const StatCard = ({ title, value, icon, bgColor }) => (
    <Card className={`${bgColor} border-none shadow-sm`}>
        <CardContent className="p-6 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <h3 className="text-2xl font-bold mt-1">{value}</h3>
            </div>
            <div className="p-3 bg-white rounded-full shadow-sm">
                {icon}
            </div>
        </CardContent>
    </Card>
);

export default WalletR;