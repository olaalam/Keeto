import { modules } from "@/config/modules";
import useSidebarStore from "@/store/useSidebarStore";
import useAuthStore from "@/store/useAuthStore";
import { hasModulePermission } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, Search } from "lucide-react"; // استيراد Search
import { Input } from "@/components/ui/input"; // استيراد Input
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const setActiveModule = useSidebarStore((s) => s.setActiveModule);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState("");

  // فتح الموديول + الانتقال المباشر لأول عنصر مسموح بيه جواه
  const openModule = (module) => {
    setActiveModule(module);
    const firstItem = module.items[0];
    if (firstItem?.url) {
      navigate(firstItem.url);
    }
  };

  // 1. فلترة الـ items بناءً على الـ permissions أولاً
  const permittedModules = modules
    .map((module) => ({
      ...module,
      items: module.items.filter((item) =>
        hasModulePermission(user, item.module),
      ),
    }))
    .filter((module) => module.items.length > 0); // إخفاء الكارت لو مفيش items مسموح بيها

  // 2. فلترة بالبحث النصي على النتيجة المفلترة بالـ permissions
  const filteredModules = permittedModules.filter((module) => {
    const searchTerm = globalFilter.toLowerCase();
    const matchesModuleName = module.name.toLowerCase().includes(searchTerm);
    const matchesItems = module.items.some((item) =>
      item.title.toLowerCase().includes(searchTerm),
    );
    return matchesModuleName || matchesItems;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* الترويسة + السيرش */}
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Modules
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Everything you can manage, in one place
          </p>
        </div>

        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 h-11 rounded-xl border-border/60 bg-card shadow-sm focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* شبكة الكروت */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {filteredModules.map((module) => {
          const Icon = module.icon || LayoutGrid;
          const visibleItems = module.items.filter((item) =>
            globalFilter
              ? item.title.toLowerCase().includes(globalFilter.toLowerCase())
              : true,
          );
          // وصف الكارت = أسماء كل الأقسام اللي جواه، كاملة من غير قص
          const description =
            module.description || visibleItems.map((i) => i.title).join(", ");

          return (
            <Card
              key={module.key}
              onClick={() => openModule(module)}
              className="group relative cursor-pointer border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              {/* شريط علوي دقيق يظهر عند الـ hover كتوقيع بصري للكارت */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <Icon size={22} />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold text-foreground">
                    {module.name}
                  </h2>
                  {description && (
                    <p className="text-sm text-foreground/70 font-medium leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* حالة عدم وجود نتائج */}
      {filteredModules.length === 0 && (
        <div className="text-center py-24">
          <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Search size={16} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No results found
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Try a different keyword
          </p>
        </div>
      )}
    </div>
  );
}
