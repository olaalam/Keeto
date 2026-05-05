import { useParams, useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  CheckCheck,
  XCircle,
  Ban,
  Undo2,
  MapPin,
  CreditCard,
  Store,
  Receipt,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import api from "@/api/axios";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "@/components/LoadingSpinner";

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  preparing: {
    label: "Preparing",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: Package,
  },
  out_for_delivery: {
    label: "Out for Delivery",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCheck,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: Ban,
  },
  refund: {
    label: "Refunded",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Undo2,
  },
};

export default function Details() {
  const { internalId: orderId } = useParams();
  const navigate = useNavigate();

  // 1. استدعاء البيانات باستخدام useQuery
  const {
    data: response,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["orderDetails", orderId],
    queryFn: async () => {
      const res = await api.get(`/api/superadmin/order/${orderId}`);
      console.log(res);
      
      return res.data;
    },
    enabled: !!orderId,
  });

  // 2. معالجة حالة التحميل
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 3. معالجة حالة الخطأ أو عدم وجود بيانات
  if (isError || !response?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <XCircle className="w-10 h-10 text-red-500" />
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <p className="text-muted-foreground">
          We couldn't load the details for this order.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  // 4. استخراج البيانات (تصحيح اسم المتغير من orderdetails إلى response)
  const order = response?.data?.data;
  console.log(order);
  

  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header: رقم الطلب والحالة */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Order #{order.orderNumber}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`px-3 py-1.5 text-sm flex items-center gap-2 ${currentStatus.color}`}
          >
            <StatusIcon size={16} />
            {currentStatus.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* العمود الأيسر: معلومات العميل والمتجر */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Customer Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">
                  {order.customer?.name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{order.customer?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{order.customer?.email || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" /> Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Restaurant</span>
                <span className="font-medium">{order.restaurant?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Branch</span>
                <span className="font-medium">{order.branch?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-medium flex items-center gap-1">
                  <CreditCard size={14} /> {order.paymentMethod?.name}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* العمود الأيمن: المنتجات وملخص الحساب */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" /> Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={item.foodImage}
                          alt={item.foodName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{item.foodName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x EGP {item.basePrice}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold">EGP {item.totalPrice}</p>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>EGP {order.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>EGP {order.deliveryFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span>EGP {order.serviceFee}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary">EGP {order.totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أزرار التحكم */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
