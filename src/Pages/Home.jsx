import { modules } from "@/config/modules";
import useSidebarStore from "@/store/useSidebarStore";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, LayoutGrid, Circle, Search } from "lucide-react"; // استيراد Search
import { Input } from "@/components/ui/input"; // استيراد Input
import { useState } from "react";

export default function Home() {
  const setActiveModule = useSidebarStore((s) => s.setActiveModule);
  const [globalFilter, setGlobalFilter] = useState("");

  // منطق الفلترة: نبحث في اسم الموديول أو أسماء العناصر الداخلية
  const filteredModules = modules.filter((module) => {
    const searchTerm = globalFilter.toLowerCase();
    const matchesModuleName = module.name.toLowerCase().includes(searchTerm);
    const matchesItems = module.items.some((item) =>
      item.title.toLowerCase().includes(searchTerm),
    );
    return matchesModuleName || matchesItems;
  });

  return (
    <div className="p-6 space-y-6">
      {/* 1. مكان السيرش المثالي: في الأعلى خارج الشبكة */}
      <div className="flex items-center justify-center pb-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 h-11 rounded-xl border-border/60 bg-card shadow-sm focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* 2. شبكة الكروت المفلترة */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredModules.map((module) => {
          const Icon = module.icon || LayoutGrid;

          return (
            <Card
              key={module.key}
              onClick={() => setActiveModule(module)}
              className="group cursor-pointer border border-border/50 hover:border-primary/40 transition-all duration-300 bg-card hover:shadow-md overflow-hidden"
            >
              <CardContent className="p-3">
                {/* الرأس - Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon size={16} />
                    </div>
                    <h2 className="text-sm font-bold tracking-tight text-foreground/80">
                      {module.name}
                    </h2>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-muted-foreground group-hover:translate-x-1 transition-transform"
                  />
                </div>

                {/* شبكة العناصر */}
                <div className="flex flex-wrap gap-1.2 mt-2">
                  {module.items.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-1.5 py-1 px-2 w-fit rounded-md bg-muted/40 border border-transparent hover:border-border hover:bg-background transition-all group/item"
                    >
                      <Circle
                        size={4}
                        className="fill-primary/40 text-primary/40 group-hover/item:fill-primary"
                      />
                      <span className="text-[10px] font-medium text-muted-foreground group-hover/item:text-foreground whitespace-nowrap">
                        {item.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* حالة عدم وجود نتائج */}
      {filteredModules.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p>No results found</p>
        </div>
      )}
    </div>
  );
}
