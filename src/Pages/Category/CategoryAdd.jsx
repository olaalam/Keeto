import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";

const CategoryAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { data: categoryData, isLoading: isFetching } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/categories/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.categoryData,
  });

  const initialData = state?.categoryData || categoryData;

  if (id && isFetching) return <LoadingSpinner />;

  return (
    <AddPage
      title="Category"
      apiUrl="/api/superadmin/categories"
      queryKey="categories"
      fields={[]}
      initialData={initialData}
      onSuccessAction={() => navigate(-1)}
    >
      {(methods) => {
        const {
          register,
          control,
          setValue,
          formState: { errors, submitCount },
        } = methods;

        const [activeTab, setActiveTab] = useState("basic");

        // خريطة تربط كل حقل بالتاب الخاص به لمعرفة أين يوجد الخطأ
        const fieldsByTab = {
          basic: [
            "name",
            "nameAr",
            "nameFr",
            "title",
            "titleAr",
            "titleFr",
            "priority",
          ],
          seo: ["meta_title", "meta_titleAr", "meta_titleFr"],
          media: [],
        };

        const tabHasError = (tabKey) =>
          fieldsByTab[tabKey]?.some((fieldName) => errors[fieldName]);

        // عند فشل الحفظ بسبب حقل مطلوب فاضي في تاب آخر، ننتقل تلقائياً لأول تاب فيه خطأ
        useEffect(() => {
          if (submitCount > 0) {
            const erroredTab = Object.keys(fieldsByTab).find((key) =>
              tabHasError(key),
            );
            if (erroredTab) setActiveTab(erroredTab);
          }
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [submitCount, errors]);

        // ✅ Same as RestaurantAdd — stores base64 string
        const handleFileToBase64 = (e, fieldName) => {
          const file = e.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onloadend = () => {
            setValue(fieldName, reader.result, { shouldDirty: true });
          };
          reader.readAsDataURL(file);
        };

        return (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="basic" className="relative">
                General Information
                {tabHasError("basic") && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="seo" className="relative">
                SEO & Meta
                {tabHasError("seo") && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
              <TabsTrigger value="media" className="relative">
                Media & Status
                {tabHasError("media") && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* 1. المعلومات الأساسية */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name (EN) *</Label>
                  <Input
                    {...register("name", { required: true })}
                    placeholder="Category Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (AR) *</Label>
                  <Input
                    {...register("nameAr", { required: true })}
                    placeholder="الاسم بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name (FR) *</Label>
                  <Input
                    {...register("nameFr", { required: true })}
                    placeholder="Nom en français"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Title (EN) *</Label>
                  <Input {...register("title", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Title (AR) *</Label>
                  <Input {...register("titleAr", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Title (FR) *</Label>
                  <Input {...register("titleFr", { required: true })} />
                </div>
              </div>

              <div className="w-full md:w-1/3 space-y-2">
                <Label>Priority *</Label>
                <Controller
                  name="priority"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </TabsContent>

            {/* 2. بيانات الـ SEO */}
            <TabsContent value="seo" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Meta Title (EN) *</Label>
                  <Input {...register("meta_title", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Meta Title (AR) *</Label>
                  <Input {...register("meta_titleAr", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Meta Title (FR) *</Label>
                  <Input {...register("meta_titleFr", { required: true })} />
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-slate-50/50 space-y-2">
                <Label className="text-blue-600 font-bold">Meta Image *</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileToBase64(e, "meta_image")}
                />
                {(() => {
                  const val = methods.watch("meta_image");
                  return val ? (
                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={val}
                        alt="Meta Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.target.style.display = "none")}
                      />
                      <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1">
                        Current
                      </div>
                    </div>
                  ) : null;
                })()}
                <p className="text-xs text-muted-foreground">
                  This image is used for social media sharing preview.
                </p>
              </div>
            </TabsContent>

            {/* 3. الميديا والحالة */}
            <TabsContent value="media" className="space-y-6">
              <div className="p-6 border-2 border-dashed rounded-xl space-y-4">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold">
                    Category Main Image *
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={(e) => handleFileToBase64(e, "Image")}
                  />
                  {(() => {
                    const val = methods.watch("Image");
                    return val ? (
                      <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-gray-50">
                        <img
                          src={val}
                          alt="Category Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1">
                          Current
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              <div className="flex items-center space-x-4 space-x-reverse p-4 border rounded-lg">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={field.value === "active"}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "active" : "inactive")
                        }
                      />
                      <Label className="cursor-pointer">
                        Category Status:{" "}
                        <span
                          className={
                            field.value === "active"
                              ? "text-green-600 font-bold"
                              : "text-red-600 font-bold"
                          }
                        >
                          {field.value === "active" ? "Active" : "Inactive"}
                        </span>
                      </Label>
                    </div>
                  )}
                />
              </div>
            </TabsContent>
          </Tabs>
        );
      }}
    </AddPage>
  );
};

export default CategoryAdd;