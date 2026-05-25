import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import AddPage from "@/components/AddPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Controller } from "react-hook-form";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Dropdown interface component matching your core style
const SearchableSelect = ({
  value,
  onValueChange,
  options = [],
  placeholder = "Select option...",
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value),
  );
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal text-left bg-white border-input hover:bg-white h-10"
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <div className="flex items-center border-b px-3 sticky top-0 bg-white z-10">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[200px] overflow-y-auto p-1 space-y-0.5">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground",
                  String(value) === String(opt.value) &&
                    "bg-accent/50 font-medium",
                )}
                onClick={() => {
                  onValueChange(String(opt.value));
                  setSearchQuery("");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4 shrink-0",
                    String(value) === String(opt.value)
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
                <span className="truncate">{opt.label}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const AddonsAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();

  const { data: selectData, isLoading: isSelectLoading } = useQuery({
    queryKey: ["addonsSelectData"],
    queryFn: async () => {
      const res = await api.get("/api/superadmin/addons/select");
      return res.data.data.data;
    },
  });

  const { data: addonData, isLoading: isFetching } = useQuery({
    queryKey: ["addon", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/superadmin/addons/${id}`);
      const raw = data.data.data;
      return {
        ...raw,
        restaurantid: raw.restaurantid ? String(raw.restaurantid) : "",
        adonescategoryid: raw.adonescategoryid
          ? String(raw.adonescategoryid)
          : "",
      };
    },
    enabled: !!id && !state?.addonData,
  });

  const initialData = state?.addonData || addonData;

  const restaurantOptions =
    selectData?.allRestaurants?.map((r) => ({
      label: r.name,
      value: String(r.id),
    })) || [];
  const categoryOptions =
    selectData?.allAddons?.map((c) => ({
      label: c.name,
      value: String(c.id),
    })) || [];

  if ((id && isFetching) || isSelectLoading) return <LoadingSpinner />;

  return (
    <AddPage
      title="Modifier"
      apiUrl="/api/superadmin/addons"
      queryKey="addons"
      fields={[]} // Empty array since custom layout is passed below
      initialData={initialData}
      onSuccessAction={() => navigate("/addons")}
      beforeSubmit={(data) => ({
        ...data,
        price: String(data.price),
        restaurantid: data.restaurantid ? String(data.restaurantid) : "",
        adonescategoryid: data.adonescategoryid
          ? String(data.adonescategoryid)
          : "",
      })}
    >
      {(methods) => {
        const { register, control } = methods;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Addon Name *</Label>
              <Input {...register("name", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Addon Name (Arabic) *</Label>
              <Input
                {...register("nameAr", { required: true })}
                className="text-right"
                dir="rtl"
              />
            </div>
            <div className="space-y-2">
              <Label>Addon Name (Franco) *</Label>
              <Input {...register("nameFr", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label>Price *</Label>
              <Input
                type="number"
                step="0.01"
                {...register("price", { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Stock Type *</Label>
              <Controller
                name="stock_type"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Searchable Restaurant Select Dropdown Container */}
            <div className="space-y-2">
              <Label>Restaurant *</Label>
              <Controller
                name="restaurantid"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={restaurantOptions}
                    placeholder="Select Restaurant"
                  />
                )}
              />
            </div>

            {/* Searchable Addon Category Select Dropdown Container */}
            <div className="space-y-2">
              <Label>Addon Category *</Label>
              <Controller
                name="adonescategoryid"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={categoryOptions}
                    placeholder="Select Addon Category"
                  />
                )}
              />
            </div>
          </div>
        );
      }}
    </AddPage>
  );
};

export default AddonsAdd;
