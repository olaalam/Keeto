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
    onSuccess: (_data, variables) => {
      if (onSuccessKey) {
        // Invalidate the list query (e.g. ["restaurants"]).
        queryClient.invalidateQueries({ queryKey: [onSuccessKey] });
      }
      // Also invalidate ANY cached query tied to this specific record's id
      // (e.g. ["restaurant", id]) — the detail query used by edit pages
      // usually has a different key than the list query, and if it isn't
      // invalidated too, the edit page keeps showing stale data after a
      // successful save even though the backend was updated correctly.
      if (variables?.id) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) &&
            query.queryKey.includes(variables.id),
        });
      }
      toast.success("success");
    },
    onError: (error) => {
      console.log(error);
      toast.error(error?.response?.data?.error?.message || "error");
    },
  });
};
