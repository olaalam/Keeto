import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  CheckCheck,
  XCircle,
  Undo2,
  MapPin,
  CreditCard,
  Store,
  Receipt,
  HomeIcon,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Calendar,
  Hash,
  Info,
  ShoppingBag,
  Loader2,
  Copy,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { toast } from "sonner";
//import ReasonDialog from "./ReasonDialog";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "border-amber-500 bg-amber-50 text-amber-700",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    color: "border-blue-500 bg-blue-50 text-blue-700",
    icon: CheckCircle,
  },
  preparing: {
    label: "Preparing",
    color: "border-purple-500 bg-purple-50 text-purple-700",
    icon: Package,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "border-indigo-500 bg-indigo-50 text-indigo-700",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "border-green-500 bg-green-50 text-green-700",
    icon: CheckCheck,
  },
  cancelled: {
    label: "Cancelled",
    color: "border-red-500 bg-red-50 text-red-700",
    icon: XCircle,
  },
  refund: {
    label: "Refund",
    color: "border-gray-500 bg-gray-50 text-gray-700",
    icon: Undo2,
  },
};
export default function OrderDetails() {
  const { restaurantId, orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogConfig, setDialogConfig] = useState({ open: false, type: null });
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);

  // Dialog state and assign-delivery-man button
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState("");

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const orderStatuses = [
    "pending",
    "accepted",
    "preparing",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refund",
  ];

  // Fetch order details
  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["order", restaurantId, orderId],
    queryFn: async () => {
      const res = await api.get(
        `/api/superadmin/order/${restaurantId}/${orderId}`,
      );
      return res.data?.data?.data || res.data?.data;
    },
    enabled: !!restaurantId && !!orderId,
  });

  // Fetch delivery men list for assignment options
  const { data: deliveryMen = [], isLoading: isDeliveryLoading } = useQuery({
    queryKey: ["deliveryMenSelect", restaurantId],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/order/${restaurantId}/select`);
      return res.data?.data?.data || res.data?.data || [];
    },
    enabled: isAssignDialogOpen || order?.status === "preparing",
  });

  // Fetch orders list to determine previous/next order
  const { data: ordersList = [] } = useQuery({
    queryKey: ["orders", restaurantId],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/order/${restaurantId}`);
      return res.data?.data?.data || res.data?.data || [];
    },
    enabled: !!restaurantId,
  });

  const currentOrderIndex = ordersList.findIndex((o) => o.id === orderId);
  const previousOrder =
    currentOrderIndex !== -1 && currentOrderIndex < ordersList.length - 1
      ? ordersList[currentOrderIndex + 1]
      : null;
  const nextOrder =
    currentOrderIndex > 0 ? ordersList[currentOrderIndex - 1] : null;

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, cancelReasonId }) => {
      const payload = { status };
      if (cancelReasonId) payload.cancelReasonId = cancelReasonId;
      const res = await api.put(
        `/api/superadmin/order/${restaurantId}/${orderId}/status`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["order", restaurantId, orderId]);
      queryClient.invalidateQueries(["orders", restaurantId]);
      toast.success("Order status updated successfully");
      setDialogConfig({ open: false, type: null });
    },
    onError: (error) => {
      const serverErrorMessage =
        error?.response?.data?.error?.message || "Failed to update status";
      toast.error(serverErrorMessage);
      console.error("Update Error:", error);
    },
  });

  // Assign delivery man mutation
  const assignDeliveryMutation = useMutation({
    mutationFn: async (deliveryManId) => {
      const res = await api.put(
        `/api/superadmin/order/${restaurantId}/${orderId}/assign-delivery`,
        {
          deliveryManId,
        },
      );
      await api.put(`/api/superadmin/order/${restaurantId}/${orderId}/status`, {
        status: "out_for_delivery",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["order", restaurantId, orderId]);
      queryClient.invalidateQueries(["orders", restaurantId]);
      toast.success("Delivery man assigned and order updated successfully");
      setIsAssignDialogOpen(false);
      setSelectedDeliveryMan("");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to assign delivery man",
      );
    },
  });

  const handleStatusChange = (newStatus) => {
    if (newStatus === "cancelled" || newStatus === "refund") {
      setDialogConfig({ open: true, type: newStatus });
    } else {
      // Directly update the status without opening the duration dialog
      updateStatusMutation.mutate({ status: newStatus });
    }
  };

  const handleAssignDelivery = () => {
    if (!selectedDeliveryMan) {
      toast.error("Please select a delivery man first");
      return;
    }
    assignDeliveryMutation.mutate(selectedDeliveryMan);
  };

  const handleOpenInvoice = async () => {
    if (!orderId) return;
    try {
      setIsInvoiceLoading(true);
      setIsInvoiceOpen(true);
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
      }
      const response = await api.get(
        `/api/superadmin/order/${restaurantId}/${orderId}/invoice`,
        {
          responseType: "blob",
        },
      );
      const blob = new Blob([response.data], {
        type: response.headers?.["content-type"] || "application/pdf",
      });
      const nextPdfUrl = URL.createObjectURL(blob);
      setPdfUrl(nextPdfUrl);
    } catch (error) {
      console.error("Failed to fetch order invoice PDF:", error);
      toast.error("Failed to load invoice");
      setIsInvoiceOpen(false);
    } finally {
      setIsInvoiceLoading(false);
    }
  };

  const closeInvoiceDialog = () => {
    setIsInvoiceOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
    }
  };

  if (isLoading)
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (error || !order)
    return (
      <div className="text-center p-8 text-red-500">{"Order not found"}</div>
    );

  const StatusIcon = statusConfig[order.status]?.icon || Info;
  const currentStatusStyle = statusConfig[order.status] || {
    color: "border-gray-200 bg-gray-100 text-gray-800",
    label: order.status,
  };

  return (
    <div className="w-full mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* ... header and details code unchanged ... */}

      <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border shadow-sm">
        {/* Left section: back button, order number, badges */}
        <div className="flex flex-1 items-center gap-3 flex-wrap w-full">
          <Button
            size="icon"
            className="w-12 h-12 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-none shadow-sm shrink-0 transition-all"
            onClick={() => navigate("/ordersreport")}
          >
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" />
          </Button>

          <div className="flex items-center justify-center gap-1.5 min-w-[3rem] bg-gray-100/80 px-3 py-1.5 rounded-xl border border-gray-200/80 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Order #
            </span>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              {order.dailyOrderNumber}
            </span>
          </div>

          <Separator
            orientation="vertical"
            className="h-8 hidden sm:block bg-gray-200"
          />

          {/* Badges array */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1. Order status */}
            <Badge
              className={`${currentStatusStyle.color} h-11 font-bold rounded-xl border px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none`}
            >
              <StatusIcon className="w-4 h-4" />
              {currentStatusStyle.label}
            </Badge>

            {/* 2. Order type */}
            {order.orderType && (
              <Badge
                variant="outline"
                className="bg-amber-50/70 border-amber-200 text-amber-800 h-11 font-semibold rounded-xl px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none"
              >
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                <span className="capitalize">{order.orderType}</span>
              </Badge>
            )}

            {/* 3. Payment method */}
            {(order.paymentMethodName || order.paymentMethodNameAr) && (
              <Badge
                variant="outline"
                className="bg-emerald-50/70 border-emerald-200 text-emerald-800 h-11 font-semibold rounded-xl px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none"
              >
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="capitalize">
                  {order.paymentMethodName?.replace(/_/g, " ")}
                </span>
              </Badge>
            )}

            {/* 4. Order source */}
            {order.orderSource && (
              <Badge
                variant="outline"
                className="bg-blue-50/70 border-blue-200 text-blue-800 h-11 font-semibold rounded-xl px-3.5 text-sm flex items-center gap-2 shadow-sm leading-none"
              >
                <Store className="w-4 h-4 text-blue-600" />
                <span className="capitalize">
                  {order.orderSource?.replace(/_/g, " ")}
                </span>
              </Badge>
            )}
          </div>
        </div>

        {/* Right section: navigation buttons + invoice button */}
{/*         <div className="flex items-center gap-3 w-full lg:w-auto lg:justify-end shrink-0 pt-2 lg:pt-0">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 h-11 px-4 font-semibold text-sm"
              disabled={!previousOrder}
              onClick={() =>
                previousOrder &&
                navigate(`/ordersreport/${restaurantId}/${previousOrder.id}`)
              }
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              {"Previous"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 h-11 px-4 font-semibold text-sm"
              disabled={!nextOrder}
              onClick={() =>
                nextOrder &&
                navigate(`/ordersreport/${restaurantId}/${nextOrder.id}`)
              }
            >
              {"Next"}
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Button>
          </div>

          <Button
            onClick={handleOpenInvoice}
            className="rounded-xl gap-2 h-11 px-5 font-semibold text-sm bg-primary text-white shadow-sm hover:bg-primary/90"
          >
            <Receipt className="w-4 h-4" />
            {"View Invoice"}
          </Button>
        </div> */}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="space-y-6 xl:col-span-2">
          {/* Order details */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {"Order Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-center gap-2.5 text-sm">
                  <Store className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-medium">{"Branch"}:</span>
                  <span className="font-semibold text-gray-900">
                    {order.branch?.name || "Delivery"}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Store className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-medium">{"Zone"}:</span>
                  <span className="font-semibold text-gray-900">
                    {order.zone?.name || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-medium">
                    {"Order Date"}:
                  </span>
                  <span className="font-semibold text-gray-900 dir-ltr">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("en-GB")
                      : "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-500 font-medium">
                    {"Order Time"}:
                  </span>
                  <span className="font-semibold text-gray-900 dir-ltr">
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "N/A"}
                  </span>
                </div>

                <div className="flex items-start gap-2.5 text-sm sm:col-span-2">
                  <Receipt className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-gray-500 font-medium shrink-0">
                    {"Order Note"}:
                  </span>
                  <span className="font-semibold text-gray-900">
                    {order.note && order.note.trim() !== ""
                      ? order.note
                      : "No notes"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order items */}
          <Card className="rounded-2xl border shadow-sm overflow-hidden bg-white">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                {"Order Items"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b text-gray-500 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 text-left rtl:text-right font-semibold w-12 border-e border-gray-200/70">
                        #
                      </th>
                      <th className="px-4 py-3 text-left rtl:text-right font-semibold border-e border-gray-200/70">
                        {"Product"}
                      </th>
                      <th className="px-4 py-3 text-left rtl:text-right font-semibold border-e border-gray-200/70">
                        {"Variations"}
                      </th>
                      <th className="px-4 py-3 text-left rtl:text-right font-semibold border-e border-gray-200/70">
                        {"Add-ons"}
                      </th>
                      <th className="px-6 py-3 text-left rtl:text-right font-semibold">
                        {"Notes"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items?.map((item, index) => {
                      const itemAddons = item.addOns || item.addons || [];

                      return (
                        <tr
                          key={item.id || index}
                          className="hover:bg-gray-50/50 transition-colors align-top"
                        >
                          <td className="px-4 py-4 text-gray-400 font-semibold border-e border-gray-100">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 border-e border-gray-100">
                            <div className="flex flex-col items-start gap-1 min-w-[120px]">
                              <img
                                src={item.foodImage}
                                alt={item.foodName}
                                className="w-12 h-12 rounded-lg object-cover border bg-gray-50 shadow-sm flex-shrink-0 mb-1"
                              />
                              <p className="font-bold text-gray-900 text-sm">
                                {item.foodName}
                              </p>
                              <p className="text-xs font-bold text-red-700">
                                Price:{" "}
                                {parseFloat(
                                  item.basePrice || item.unitPrice || 0,
                                ).toFixed(2)}
                              </p>
                              <p className="text-xs font-medium text-gray-600">
                                Qty: {item.quantity || item.qty || 1}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 border-e border-gray-100">
                            {item.variations && item.variations.length > 0 ? (
                              <div className="space-y-1.5">
                                {item.variations.map((v, idx) => (
                                  <div
                                    key={v.variationId || idx}
                                    className="flex flex-col text-xs bg-gray-50 border border-gray-200/60 rounded-lg px-2.5 py-1.5 w-fit shadow-2xs"
                                  >
                                    <span className="text-gray-400 font-medium">
                                      {v.variationName}
                                    </span>
                                    <span className="font-semibold text-gray-800">
                                      {v.optionName}
                                      {parseFloat(v.additionalPrice) > 0 && (
                                        <span className="text-primary font-bold">
                                          {" "}
                                          +
                                          {parseFloat(
                                            v.additionalPrice,
                                          ).toFixed(2)}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4 border-e border-gray-100">
                            {itemAddons.length > 0 ? (
                              <div className="space-y-1.5">
                                {itemAddons.map((addon, idx) => (
                                  <div
                                    key={addon.id || idx}
                                    className="flex flex-col text-xs bg-amber-50/60 border border-amber-200/50 rounded-lg px-2.5 py-1.5 w-fit"
                                  >
                                    <span className="font-semibold text-gray-800">
                                      {addon.addonName || addon.name}
                                      {parseFloat(
                                        addon.price ||
                                          addon.additionalPrice ||
                                          0,
                                      ) > 0 && (
                                        <span className="text-primary font-bold">
                                          {" "}
                                          +
                                          {parseFloat(
                                            addon.price ||
                                              addon.additionalPrice,
                                          ).toFixed(2)}
                                        </span>
                                      )}
                                    </span>
                                    {addon.quantity && addon.quantity > 1 && (
                                      <span className="text-gray-400 text-[10px]">
                                        الكمية: {addon.quantity}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs max-w-[140px]">
                            {item.note || (
                              <span className="text-gray-300">
                                {"No notes"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment summary */}
          <Card className="rounded-2xl border shadow-sm bg-white">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-md font-bold text-gray-800 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                {"Payment Summary"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{"Subtotal"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.subtotal).toFixed(2)} {"EGP"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{"Service Fee"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.serviceFee).toFixed(2)} {"EGP"}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{"Delivery Fee"}</span>
                <span className="font-medium text-gray-900">
                  {parseFloat(order.deliveryFee).toFixed(2)} {"EGP"}
                </span>
              </div>
              {order.appCommission && parseFloat(order.appCommission) > 0 && (
                <div className="flex justify-between text-sm text-gray-500 italic">
                  <span>{"App Commission"}</span>
                  <span>
                    {parseFloat(order.appCommission).toFixed(2)} {"EGP"}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-bold text-gray-900">
                  {"Total Amount"}
                </span>
                <span className="text-xl font-black text-primary">
                  {parseFloat(order.totalAmount).toFixed(2)} {"EGP"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: customer info and status controls */}
        <div className="space-y-6 xl:col-span-1">
          <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-red-900 fill-red-900" />
              <h3 className="text-lg font-bold text-gray-900">
                {"Customer Information"}
              </h3>
            </div>

            <div className="space-y-2 text-sm text-gray-800">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-900">{"Name"}:</span>
                <span>{order.customer?.name || "Unknown"}</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-gray-900">
                  {"Contact"}:
                </span>
                {order.customer?.phone ? (
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 transition-colors"
                      title="WhatsApp"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                    <span className="font-normal">{order.customer.phone}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.customer.phone);
                        toast.success("Phone number copied successfully");
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy Phone Number"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span>{"N/A"}</span>
                )}
              </div>

              {order.customer?.email && (
                <div className="flex items-center gap-1.5 break-all">
                  <span className="font-semibold text-gray-900">
                    {"Email"}:
                  </span>
                  <span>{order.customer.email}</span>
                </div>
              )}

              {order?.address && typeof order.address === "object" ? (
                <>
                  {order.address.title && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">
                        {"Address"}:
                      </span>
                      <span>{order.address.title || "Unknown"}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">
                      {"Road"}:
                    </span>
                    <span>{order.address.street || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">
                      {"Build Num"}:
                    </span>
                    <span>{order.address.number || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">
                      {"Floor"}:
                    </span>
                    <span>{order.address.floor || "-"}</span>
                  </div>
                  {order.address.apartment && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">
                        {"Apartment"}:
                      </span>
                      <span>{order.address.apartment || "-"}</span>
                    </div>
                  )}
                  {order.address.landmark && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">
                        {"Landmark"}:
                      </span>
                      <span className="text-gray-700">
                        {order.address.landmark}
                      </span>
                    </div>
                  )}
                  {order.address.lat && order.address.lng && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-gray-900">
                        {"Location Map"}:
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${order.address.lat},${order.address.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {"View on Map"}
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-900">
                    {"Address"}:
                  </span>
                  <span>{order?.address || "Not specified"}</span>
                </div>
              )}
            </div>
          </Card>
          {/* Status change card */}
          <Card className="rounded-2xl border shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b bg-gray-50/50 px-6 py-4">
              <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                {"Change Order Status"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {orderStatuses.map((status) => {
                  const config = statusConfig[status] || {
                    icon: Info,
                    label: status,
                  };
                  const IconComponent = config.icon;
                  const isActive = order.status === status;

                  return (
                    <Button
                      key={status}
                      variant="outline"
                      disabled={updateStatusMutation.isPending}
                      onClick={() => handleStatusChange(status)}
                      className={`h-11 justify-start gap-2 rounded-xl border text-xs font-semibold relative px-3 transition-all duration-200
                        ${
                          isActive
                            ? "border-blue-600 bg-blue-50 text-blue-700 font-bold shadow-sm hover:bg-blue-50"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border border-white animate-pulse" />
                      )}
                      <IconComponent
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400"}`}
                      />
                      <span className="truncate">{config.label}</span>
                    </Button>
                  );
                })}
              </div>

              {/* Assign delivery man button */}
              {order.status === "preparing" && (
                <div className="pt-2">
                  <Button
                    onClick={() => setIsAssignDialogOpen(true)}
                    className="w-full rounded-xl gap-2 h-11 px-5 font-semibold text-sm bg-primary hover:bg-primary/90 text-white shadow-sm transition-all"
                  >
                    <Truck className="w-4 h-4" />
                    {"Assign Delivery Man"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assign delivery man dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              {"Assign Delivery Man"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-sm font-semibold text-gray-700 block">
              {"Select Delivery Man"}
            </label>

            {isDeliveryLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : (
              <select
                value={selectedDeliveryMan}
                onChange={(e) => setSelectedDeliveryMan(e.target.value)}
                className="w-full h-11 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 font-medium"
              >
                <option value="">{"-- Choose from list --"}</option>
                {deliveryMen.map((man) => (
                  <option
                    key={man.id || man._id || man.value}
                    value={man.id || man._id || man.value}
                  >
                    {man.name || man.fullName || man.label}{" "}
                    {man.phone ? `(${man.phone})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="rounded-xl px-4"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setSelectedDeliveryMan("");
              }}
            >
              {"Cancel"}
            </Button>
            <Button
              className="rounded-xl bg-primary hover:bg-primary/90 text-white px-5 font-semibold"
              disabled={
                assignDeliveryMutation.isPending || !selectedDeliveryMan
              }
              onClick={handleAssignDelivery}
            >
              {assignDeliveryMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              )}
              {"Confirm Assignment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View invoice dialog */}
      <Dialog
        open={isInvoiceOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsInvoiceOpen(true);
            return;
          }
          closeInvoiceDialog();
        }}
      >
        <DialogContent className="max-w-4xl rounded-2xl p-3 bg-white shadow-xl overflow-hidden">
          <div className="py-3 min-h-[70vh] flex items-center justify-center bg-slate-50 rounded-xl border overflow-hidden">
            {isInvoiceLoading ? (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>{"Loading..."}</span>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="Order Invoice PDF"
                className="w-full h-[75vh] border-0 rounded-lg"
              />
            ) : (
              <div className="text-sm text-slate-500">
                {"Failed to load invoice"}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel/reject reason dialog */}
     {/*  <ReasonDialog
        isOpen={dialogConfig.open}
        onClose={() => setDialogConfig({ open: false, type: null })}
        onConfirm={(cancelReasonId) =>
          updateStatusMutation.mutate({
            status: dialogConfig.type,
            cancelReasonId,
          })
        }
        title={
          dialogConfig.type === "cancelled" ? "Cancel Order" : "Reject Order"
        }
      /> */}
    </div>
  );
}
