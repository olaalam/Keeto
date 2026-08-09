import React, { useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Clock, CheckCircle, Package, Truck, CheckCheck,
    XCircle, Undo2, MapPin, CreditCard, Receipt, HomeIcon,
    ArrowLeft, User, Phone, Info, Copy, Printer, Navigation
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from '@/api/axios';
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from 'sonner';

const statusConfig = {
    pending: { label: "Pending", color: "border-amber-500 bg-amber-50 text-amber-700", icon: Clock },
    accepted: { label: "Accepted", color: "border-blue-500 bg-blue-50 text-blue-700", icon: CheckCircle },
    preparing: { label: "Preparing", color: "border-purple-500 bg-purple-50 text-purple-700", icon: Package },
    out_for_delivery: { label: "Out for Delivery", color: "border-indigo-500 bg-indigo-50 text-indigo-700", icon: Truck },
    delivered: { label: "Delivered", color: "border-green-500 bg-green-50 text-green-700", icon: CheckCheck },
    cancelled: { label: "Cancelled", color: "border-red-500 bg-red-50 text-red-700", icon: XCircle },
    refund: { label: "Refund", color: "border-gray-500 bg-gray-50 text-gray-700", icon: Undo2 },
    rejected: { label: "Rejected", color: "border-rose-500 bg-rose-50 text-rose-700", icon: XCircle },
};

export default function OrderDetails() {
    const { restaurantId, orderId } = useParams();
    const navigate = useNavigate();

    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

    // Fetch order details
    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order', restaurantId, orderId],
        queryFn: async () => {
            const res = await api.get(`/api/superadmin/order/${restaurantId}/${orderId}`);
            return res.data?.data?.data;
        },
        enabled: !!restaurantId && !!orderId
    });

    const handlePrintInvoice = () => {
        const printContent = document.getElementById("invoice-print-area")?.innerHTML;
        if (printContent) {
            document.body.innerHTML = printContent;
            window.print();
            window.location.reload();
        }
    };

    if (isLoading) return <div className="min-h-[400px] flex items-center justify-center"><LoadingSpinner /></div>;
    if (error || !order) return <div className="text-center p-8 text-red-500">Order not found</div>;

    const StatusIcon = statusConfig[order.orderStatus]?.icon || Info;
    const currentStatusStyle = statusConfig[order.orderStatus] || { color: "border-gray-200 bg-gray-100 text-gray-800", label: order.orderStatus };

    const mapsUrl = order.lat && order.lng ? `https://www.google.com/maps?q=${order.lat},${order.lng}` : null;

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl space-y-6">

            {/* Top header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border shadow-sm">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                        onClick={() => navigate('/ordersreport')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-lg font-bold text-gray-900">Order Details</h1>
                            <Badge className={`${currentStatusStyle.color} font-semibold rounded-lg border px-2.5 py-0.5 text-xs flex items-center gap-1`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {currentStatusStyle.label}
                            </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">{order.orderNumber}</p>
                    </div>
                </div>

                <Button
                    onClick={() => setIsInvoiceOpen(true)}
                    className="rounded-xl gap-2 h-11 px-5 font-semibold bg-primary text-white shadow-sm hover:bg-primary/90"
                >
                    <Receipt className="w-4 h-4" />
                    View Invoice
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left column: payment summary + order info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl border shadow-sm bg-white">
                        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-primary" />
                                Payment Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3.5">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-gray-900">{parseFloat(order.subtotal || 0).toFixed(2)} EGP</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Service Fee</span>
                                <span className="font-medium text-gray-900">{parseFloat(order.serviceFee || 0).toFixed(2)} EGP</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Delivery Fee</span>
                                <span className="font-medium text-gray-900">{parseFloat(order.deliveryFee || 0).toFixed(2)} EGP</span>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-base font-bold text-gray-900">Total Amount</span>
                                <span className="text-xl font-black text-primary">{parseFloat(order.totalAmount || 0).toFixed(2)} EGP</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border shadow-sm bg-white">
                        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Order Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-3 rounded-xl border">
                                <span className="text-xs text-gray-400 block mb-0.5">Order Number</span>
                                <span className="text-sm font-bold text-gray-800">{order.orderNumber}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border">
                                <span className="text-xs text-gray-400 block mb-0.5">Order Date</span>
                                <span className="text-sm font-bold text-gray-800">{new Date(order.orderDate).toLocaleString()}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border">
                                <span className="text-xs text-gray-400 block mb-0.5">Payment Method</span>
                                <span className="text-sm font-bold text-gray-800 break-all">{order.paymentMethod || 'N/A'}</span>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl border">
                                <span className="text-xs text-gray-400 block mb-0.5">Restaurant ID</span>
                                <span className="text-sm font-bold text-gray-800 break-all">{order.restaurantId}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column: customer + delivery address */}
                <div className="space-y-6">
                    <Card className="rounded-2xl border shadow-sm bg-white">
                        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Customer Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                    {order.customerName?.charAt(0).toUpperCase() || 'C'}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{order.customerName || 'Unknown'}</p>
                                    <p className="text-xs text-gray-400">Customer</p>
                                </div>
                            </div>
                            <Separator className="bg-gray-100" />
                            <div className="flex items-center justify-between w-full text-sm text-gray-600">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-500 font-medium">Contact:</span>

                                    {order.customerPhone && (
                                        <a
                                            href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-green-600 hover:text-green-700 transition-colors mx-0.5"
                                            title="WhatsApp"
                                        >
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                        </a>
                                    )}

                                    <span className="font-semibold text-gray-900">{order.customerPhone || 'Not available'}</span>

                                    {order.customerPhone && (
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(order.customerPhone);
                                                toast.success('Phone number copied');
                                            }}
                                            className="inline-flex items-center text-gray-400 hover:text-gray-700 transition-colors ml-1.5"
                                            title="Copy Phone Number"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border shadow-sm bg-white">
                        <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
                            <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                Delivery Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-3">
                            <div className="flex items-start gap-2.5 text-sm text-gray-600">
                                <HomeIcon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-900">{order.addressTitle || 'Address'}</p>
                                    <p className="text-gray-600">{order.street || 'Not specified'}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Building: {order.buildingNumber || '-'} &middot; Floor: {order.floor || '-'}
                                    </p>
                                </div>
                            </div>
                            {mapsUrl && (
                                <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1"
                                >
                                    <Navigation className="w-3.5 h-3.5" />
                                    View on map
                                </a>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Invoice dialog */}
            <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
                <DialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-xl overflow-hidden sm:max-w-lg">
                    <DialogHeader className="flex flex-row justify-between items-center border-b pb-4">
                        <DialogTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary" />
                            Order Invoice
                        </DialogTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrintInvoice}
                            className="rounded-xl gap-1.5 text-xs font-semibold"
                        >
                            <Printer className="w-4 h-4" />
                            Print
                        </Button>
                    </DialogHeader>

                    <div id="invoice-print-area" className="py-4 space-y-4 max-h-[70vh] overflow-y-auto px-1">
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-black text-gray-900">Order Invoice</h2>
                            <p className="text-xs text-gray-500">{new Date(order.orderDate).toLocaleString()}</p>
                        </div>

                        <Separator className="border-dashed" />

                        <div className="text-xs space-y-2 text-gray-600 bg-gray-50 p-3 rounded-xl border">
                            <div className="flex justify-between">
                                <span className="font-medium">Invoice No:</span>
                                <span className="font-bold text-gray-900">{order.orderNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Customer Name:</span>
                                <span className="font-semibold text-gray-900">{order.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium">Payment Method:</span>
                                <span className="font-semibold text-gray-900 break-all">{order.paymentMethod}</span>
                            </div>
                        </div>

                        <Separator className="border-dashed" />

                        <div className="space-y-2 text-sm bg-gray-50/50 p-3 rounded-xl border">
                            <div className="flex justify-between text-gray-600 text-xs">
                                <span>Subtotal</span>
                                <span className="font-medium text-gray-900">{parseFloat(order.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-xs">
                                <span>Service Fee</span>
                                <span className="font-medium text-gray-900">{parseFloat(order.serviceFee || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-xs">
                                <span>Delivery Fee</span>
                                <span className="font-medium text-gray-900">{parseFloat(order.deliveryFee || 0).toFixed(2)}</span>
                            </div>
                            <Separator className="my-1 border-gray-200" />
                            <div className="flex justify-between items-center pt-0.5">
                                <span className="font-bold text-gray-900">Total Amount</span>
                                <span className="text-lg font-black text-primary">{parseFloat(order.totalAmount || 0).toFixed(2)} EGP</span>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}