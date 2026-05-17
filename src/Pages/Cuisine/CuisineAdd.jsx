import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
//import { Textarea } from "@/components/ui/textarea"; // تأكد من استيراده لو متاح، أو استخدم input عادي
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";

const CuisineAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { data: cuisineData, isLoading: isFetching } = useQuery({
    queryKey: ["cuisine", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/cuisines/${id}`);
      return data.data.data;
    },
    enabled: !!id && !state?.cuisineData,
  });

  const rawData = state?.cuisineData || cuisineData;

  const initialData = React.useMemo(() => {
    if (!rawData) return null;
    return {
      ...rawData,
      status:
        rawData.status === true || rawData.status === "active"
          ? "active"
          : "inactive",
    };
  }, [rawData]);

  if (id && isFetching) return <LoadingSpinner />;

  return (
    <AddPage
      title="Cuisine"
      apiUrl="/api/superadmin/cuisines"
      queryKey="cuisines"
      fields={[]} // نتركها فارغة لنستخدم نظام الـ Tabs المخصص بالداخل
      initialData={initialData}
      onSuccessAction={() => navigate(-1)}
    >
      {(methods) => {
        const {
          register,
          control,
          setValue,
          formState: { errors },
        } = methods;

        return (
          <Tabs defaultValue="basic" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="basic">General Info</TabsTrigger>
              <TabsTrigger value="seo">SEO & Meta Data</TabsTrigger>
              <TabsTrigger value="media">Media & Status</TabsTrigger>
            </TabsList>

            {/* 1. الأسماء والأوصاف (General Info) */}
            <TabsContent value="basic" className="space-y-6">
              {/* حقول الأسماء */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Name (EN) *</Label>
                  <Input
                    {...register("name", { required: true })}
                    placeholder="Cuisine Name"
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

              {/* حقول الوصف */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Description (EN) *</Label>
                  <Input
                    {...register("description", { required: true })}
                    placeholder="Description in English"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (AR) *</Label>
                  <Input
                    {...register("descriptionAr", { required: true })}
                    placeholder="الوصف بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (FR) *</Label>
                  <Input
                    {...register("descriptionFr", { required: true })}
                    placeholder="Description en français"
                  />
                </div>
              </div>
            </TabsContent>

            {/* 2. بيانات السيو والـ Meta */}
            <TabsContent value="seo" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Meta Description (EN) *</Label>
                  <Input
                    {...register("meta_description", { required: true })}
                    placeholder="SEO description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description (AR) *</Label>
                  <Input
                    {...register("meta_descriptionAr", { required: true })}
                    placeholder="وصف السيو بالعربي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description (FR) *</Label>
                  <Input
                    {...register("meta_descriptionFr", { required: true })}
                    placeholder="Description SEO"
                  />
                </div>
              </div>
            </TabsContent>

            {/* 3. الصور والـ Status */}
            <TabsContent value="media" className="space-y-6">
              <div className="p-4 border rounded-lg space-y-2">
                <Label className="text-blue-600 font-bold">
                  Cuisine Image *
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onload = () => setValue("Image", reader.result);
                    }
                  }}
                />
              </div>

              <div className="space-y-2 max-w-xs">
                <Label>Status *</Label>
                <Controller
                  name="status"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
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

export default CuisineAdd;
