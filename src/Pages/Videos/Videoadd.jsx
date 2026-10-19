import React, { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const VIDEOS_URL = "/api/superadmin/videos";

// The API takes the files as multipart/form-data:
//   new file  -> sent as a real file under these keys
//   unchanged -> the existing link is sent under videoUrl / thumbnailUrl
const FILE_KEYS = {
  video: "video",
  thumbnail: "thumbnail",
  videoAr: "videoAr",
  thumbnailAr: "thumbnailAr",
};

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Plain text fields rendered by AddPage. thumbnailUrl / videoUrl are rendered
// below as upload fields (children) because they need file inputs + previews.
const FIELDS = [
  { name: "title", label: "Title", type: "text", required: true },
  { name: "titleAr", label: "Title (AR)", type: "text" },
  { name: "description", label: "Description", type: "text" },
  { name: "descriptionAr", label: "Description (AR)", type: "text" },
  {
    name: "status",
    label: "Status",
    type: "select",
    required: true,
    options: STATUS_OPTIONS,
  },
];

const isFile = (value) => typeof File !== "undefined" && value instanceof File;

/**
 * Upload field bound to react-hook-form.
 * value is either:
 *  - a File (the user just picked it), or
 *  - a link string (the API returns links on GET), or
 *  - "" (nothing yet)
 * Both work as <img>/<video> sources (File via a temporary object URL).
 */
function MediaUploadField({
  control,
  name,
  label,
  kind, // "image" | "video"
  required,
  errors,
}) {
  const isImage = kind === "image";

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      <Controller
        name={name}
        control={control}
        defaultValue=""
        rules={{ required: required ? `${label} is required` : false }}
        render={({ field: { value, onChange } }) => (
          <MediaInput
            id={name}
            value={value}
            onChange={onChange}
            isImage={isImage}
            kind={kind}
            error={errors?.[name]}
          />
        )}
      />
    </div>
  );
}

function MediaInput({ id, value, onChange, isImage, kind, error }) {
  // Temporary preview URL for a freshly picked File; released on change/unmount
  const previewUrl = useMemo(
    () => (isFile(value) ? URL.createObjectURL(value) : null),
    [value],
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const src = previewUrl || (typeof value === "string" ? value : "");

  return (
    <div className="space-y-3">
      <Input
        id={id}
        type="file"
        accept={isImage ? "image/*" : "video/*"}
        className={cn(error ? "border-destructive" : "")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // allow re-picking the same file
          if (file) onChange(file);
        }}
      />

      {src ? (
        <div className="relative w-full max-w-sm border rounded-lg overflow-hidden bg-slate-50">
          {isImage ? (
            <img
              src={src}
              alt="Thumbnail preview"
              className="w-full max-h-56 object-cover"
            />
          ) : (
            <video src={src} controls className="w-full max-h-56 bg-black" />
          )}
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onChange("")}
            title="Remove"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Upload className="h-4 w-4" />
          No {kind} selected
        </div>
      )}

      {error && (
        <p className="text-destructive text-xs">
          {error.message || "required"}
        </p>
      )}
    </div>
  );
}

const VideoAdd = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  // GET BY ID -> GET /api/superadmin/videos/{id}
  // videoUrl / thumbnailUrl come back as links; they are used directly for the
  // <video>/<img> previews.
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
        videoUrlAr: raw.videoUrlAr || "",
        thumbnailUrl: raw.thumbnailUrl || "",
        thumbnailUrlAr: raw.thumbnailUrlAr || "",
        status: raw.status || "active",
      };
    },
  });

  if (isEdit && isFetching) return <LoadingSpinner />;

  // New videos start as "active"; no id => create (POST)
  const initialData = isEdit ? fetchedData : { status: "active" };

  // POST /api/superadmin/videos        (create)
  // PUT  /api/superadmin/videos/{id}   (edit)
  // Sent as multipart/form-data so the video / thumbnail go up as real files.
  // (axios sets the multipart boundary itself when the body is FormData.)
  const customSubmit = async (payload) => {
    const formData = new FormData();

    ["title", "titleAr", "description", "descriptionAr", "status"].forEach(
      (key) => formData.append(key, payload[key] ?? ""),
    );

    // [form/link key, file key]
    [
      ["videoUrl", FILE_KEYS.video],
      ["videoUrlAr", FILE_KEYS.videoAr],
      ["thumbnailUrl", FILE_KEYS.thumbnail],
      ["thumbnailUrlAr", FILE_KEYS.thumbnailAr],
    ].forEach(([linkKey, fileKey]) => {
      if (isFile(payload[linkKey])) {
        formData.append(fileKey, payload[linkKey]); // new file
      } else {
        formData.append(linkKey, payload[linkKey] || ""); // existing link
      }
    });

    try {
      const res = isEdit
        ? await api.put(`${VIDEOS_URL}/${id}`, formData)
        : await api.post(VIDEOS_URL, formData);

      toast.success(isEdit ? "Video updated" : "Video created");
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["video", id] });
      return res;
    } catch (err) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Failed to save video",
      );
      throw err; // AddPage logs it and skips onSuccessAction
    }
  };

  return (
    <AddPage
      title="Video"
      apiUrl={VIDEOS_URL}
      queryKey="videos"
      fields={FIELDS}
      initialData={initialData}
      customSubmit={customSubmit}
      onSuccessAction={() => navigate(-1)}
      transformPayload={(data) => ({
        title: data.title?.trim() || "",
        titleAr: data.titleAr?.trim() || "",
        description: data.description?.trim() || "",
        descriptionAr: data.descriptionAr?.trim() || "",
        status: data.status || "active",
        // Each is a File (new) or a link (unchanged)
        videoUrl: data.videoUrl || "",
        videoUrlAr: data.videoUrlAr || "",
        thumbnailUrl: data.thumbnailUrl || "",
        thumbnailUrlAr: data.thumbnailUrlAr || "",
      })}
    >
      {({ control, formState: { errors } }) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MediaUploadField
            control={control}
            errors={errors}
            name="thumbnailUrl"
            label="Thumbnail"
            kind="image"
          />
          <MediaUploadField
            control={control}
            errors={errors}
            name="thumbnailUrlAr"
            label="Thumbnail (AR)"
            kind="image"
          />
          <MediaUploadField
            control={control}
            errors={errors}
            name="videoUrl"
            label="Video"
            kind="video"
            required
          />
          <MediaUploadField
            control={control}
            errors={errors}
            name="videoUrlAr"
            label="Video (AR)"
            kind="video"
          />
        </div>
      )}
    </AddPage>
  );
};

export default VideoAdd;
