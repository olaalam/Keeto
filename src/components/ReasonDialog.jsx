import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useGet } from "@/hooks/useGet"; // استخدام الـ hook الموجود عندك

export default function ReasonDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  // Which endpoint to pull cancel/reject reasons from — defaults to the
  // restaurant-side endpoint so existing usages (e.g. Order.jsx) keep
  // working exactly as before without passing anything new.
  reasonsUrl = "/api/restaurant/order/reasons",
  reasonsQueryKey = "order-reasons",
  // Optional filter — e.g. "restaurant" or "user" — applied to the
  // reasons returned by the API. Leave unset to show every reason.
  reasonType,
}) {
  const [selectedReasonId, setSelectedReasonId] = useState("");

  // جلب الأسباب
  const { data: reasonsResponse, isLoading } = useGet(
    reasonsQueryKey,
    reasonsUrl,
  );
  const allReasons = reasonsResponse?.data?.data || [];
  const reasons = reasonType
    ? allReasons.filter((r) => r.type === reasonType)
    : allReasons;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setSelectedReasonId("");
        onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            Select Reason
          </label>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : (
            <Select
              onValueChange={setSelectedReasonId}
              value={selectedReasonId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id}>
                    {reason.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(selectedReasonId)}
            disabled={!selectedReasonId}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
