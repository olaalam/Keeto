import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/axios";
import { toast } from "sonner";

export const useUpdate = (url, onSuccessKey) => {
  const queryClient = useQueryClient();

  return useMutation({
    // 💡 قمنا بإضافة customUrl هنا داخل الـ arguments
    mutationFn: async ({ id, payload, customUrl }) => {
      // إذا قمنا بتمرير customUrl نستخدمه مباشرة، وإلا نطبق المنطق القديم
      const targetUrl = customUrl ? customUrl : id ? `${url}/${id}` : url;

      const { data } = await api.put(targetUrl, payload);
      return data;
    },
    onSuccess: () => {
      if (onSuccessKey) {
        queryClient.invalidateQueries({ queryKey: [onSuccessKey] });
      }
      toast.success("success");
    },
    onError: (error) => {
      console.log(error);
      toast.error(error?.response?.data?.error?.message || "error");
    },
  });
};
