import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import api from "@/api/axios";
import GenericDataTable from "@/components/GenericDataTable";
import { useUpdate } from "@/hooks/useUpdate";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const VIDEOS_URL = "/api/superadmin/videos";

export default function Video() {
  const navigate = useNavigate();

  // GET ALL  -> GET /api/superadmin/videos
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const res = await api.get(VIDEOS_URL);
      return res.data.data.data;
    },
  });

  // UPDATE STATUS -> PUT /api/superadmin/videos/{id}/status
  const statusMutation = useUpdate(VIDEOS_URL, "videos");

  const columns = [
    {
      accessorKey: "thumbnailUrl",
      header: "Thumbnail",
      cell: ({ row }) => {
        const src = row.getValue("thumbnailUrl");
        return (
          <div className="w-20 h-12 border rounded-md overflow-hidden bg-slate-50 flex items-center justify-center">
            {src ? (
              <img
                src={src}
                alt={row.original.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs text-slate-400">-</span>
            )}
          </div>
        );
      },
    },
    { accessorKey: "title", header: "Title" },
    {
      accessorKey: "titleAr",
      header: "Title (AR)",
      cell: ({ row }) => row.getValue("titleAr") || "-",
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const text = row.getValue("description");
        if (!text) return "-";
        return (
          <span title={text} className="block max-w-[260px] truncate">
            {text}
          </span>
        );
      },
    },
    {
      accessorKey: "videoUrl",
      header: "Video",
      cell: ({ row }) => {
        const url = row.getValue("videoUrl");
        if (!url) return "-";
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
          >
            <ExternalLink size={14} />
            Open
          </a>
        );
      },
    },
    {
      // Custom id (not "status") so GenericDataTable doesn't auto-generate its
      // own switch — this one calls the dedicated /status endpoint.
      id: "videoStatus",
      accessorFn: (row) => row.status,
      header: "Status",
      cell: ({ row }) => {
        const video = row.original;
        const isActive = video.status === "active";

        return (
          <div className="flex items-center justify-center gap-2">
            <Switch
              checked={isActive}
              disabled={statusMutation.isPending}
              onCheckedChange={(checked) => {
                statusMutation.mutate({
                  customUrl: `${VIDEOS_URL}/${video.id}/status`,
                  payload: { status: checked ? "active" : "inactive" },
                });
              }}
            />
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                isActive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500",
              )}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <GenericDataTable
        title="videos"
        columns={columns}
        data={videos}
        isLoading={isLoading}
        queryKey="videos"
        // DELETE -> DELETE /api/superadmin/videos/{id}
        deleteApiUrl={VIDEOS_URL}
        editApiUrl={VIDEOS_URL}
        onAdd={() => navigate("/videos/add")}
        onEdit={(video) => navigate(`/videos/edit/${video.id}`)}
      />
    </div>
  );
}
