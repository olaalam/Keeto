import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";

const VIDEOS_URL = "/api/superadmin/videos";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const FIELDS = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "titleAr", label: "Title (AR)", type: "text" },
  { name: "description", label: "Description", type: "text" },
  { name: "descriptionAr", label: "Description (AR)", type: "text" },
  { name: "videoUrl", label: "Video URL", type: "text", required: true },
  { name: "thumbnailUrl", label: "Thumbnail URL", type: "text" },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: STATUS_OPTIONS,
  },
];

const VideoAdd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // GET BY ID -> GET /api/superadmin/videos/{id}
  const { data: fetchedData, isLoading: isFetching } = useQuery({
    queryKey: ["video", id],
    enabled: isEdit,
    queryFn: async () => {
      const { data } = await api.get(`${VIDEOS_URL}/${id}`);
      const raw = data.data.data ?? data.data;

      return {
        id: raw.id,
        title: raw.title || "",
        titleAr: raw.titleAr || "",
        description: raw.description || "",
        descriptionAr: raw.descriptionAr || "",
        videoUrl: raw.videoUrl || "",
        thumbnailUrl: raw.thumbnailUrl || "",
        status: raw.status || "active",
      };
    },
  });

  if (isEdit && isFetching) return <LoadingSpinner />;

  // New videos start as "active"; no id => AddPage treats it as create (POST)
  const initialData = isEdit ? fetchedData : { status: "active" };

  return (
    <AddPage
      title="Video"
      // POST -> /api/superadmin/videos
      // PUT  -> /api/superadmin/videos/{id}  (id is appended by useUpdate)
      apiUrl={VIDEOS_URL}
      queryKey="videos"
      fields={FIELDS}
      initialData={initialData}
      onSuccessAction={() => navigate(-1)}
      transformPayload={(data) => ({
        title: data.title?.trim() || "",
        titleAr: data.titleAr?.trim() || "",
        description: data.description?.trim() || "",
        descriptionAr: data.descriptionAr?.trim() || "",
        videoUrl: data.videoUrl?.trim() || "",
        thumbnailUrl: data.thumbnailUrl?.trim() || "",
        status: data.status || "active",
      })}
    />
  );
};

export default VideoAdd;
