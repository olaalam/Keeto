import { useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import useSidebarStore from "@/store/useSidebarStore";
import useAuthStore from "@/store/useAuthStore";
import { LogOut, ChevronLeft } from "lucide-react";

export default function Layout() {
  const activeModule = useSidebarStore((state) => state.activeModule);
  const setActiveModule = useSidebarStore((state) => state.setActiveModule);
  const { setLogout } = useAuthStore((state) => state);
  const location = useLocation();
  const navigate = useNavigate();

  // وظيفة الرجوع للخلف (تستخدم سجل المتصفح)
  const handleBack = () => {
    if (window.history.state && window.history.state.idx === 0) {
      navigate("/");
      setActiveModule(null);
    } else {
      navigate(-1);
    }
  };

  // تصفير الموديول النشط تلقائياً عند العودة لصفحة الهوم
  useEffect(() => {
    if (location.pathname === "/") {
      setActiveModule(null);
    }
  }, [location.pathname, setActiveModule]);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        {/* السايد بار يظهر فقط عند وجود موديول نشط */}
        {activeModule && <AppSidebar />}

        {/* الحاوية الرئيسية: نستخدم max-h-screen لمنع الصفحة من التمدد الطولي */}
        <main className="relative flex flex-col flex-1 min-w-0 max-h-screen overflow-hidden bg-background">
          {/* الهيدر الثابت: flex-none يمنعه من التمدد، و z-50 ليبقى فوق المحتوى */}
          <header className="flex-none sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between p-4 h-16">
              {/* الجزء الأيسر: زر السايد بار + سهم العودة + العنوان */}
              <div className="flex items-center gap-4 overflow-hidden">
                {activeModule && <SidebarTrigger className="shrink-0" />}

                <div className="flex items-center gap-3 truncate">
                  {!activeModule && (
                    <div className="w-1 h-5 bg-primary rounded-full shrink-0" />
                  )}

                  {activeModule ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <button
                        onClick={handleBack}
                        className="p-1.5 rounded-md hover:bg-accent shrink-0 transition-colors group/back"
                        title="Go back"
                      >
                        <ChevronLeft
                          size={18}
                          className="text-muted-foreground group-hover/back:text-primary transition-transform group-hover/back:-translate-x-0.5"
                        />
                      </button>

                      {/* فاصل بصري بسيط */}
                      <div className="h-4 w-[1px] bg-border shrink-0" />

                      <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100 truncate">
                        {activeModule.name}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-100">
                      Home
                    </span>
                  )}
                </div>
              </div>

              {/* الجزء الأيمن: زر تسجيل الخروج */}
              <button
                onClick={setLogout}
                className="shrink-0 group flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-all duration-200"
              >
                <LogOut
                  size={18}
                  className="text-slate-400 group-hover:text-red-600 transition-colors"
                />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </header>

          {/* منطقة المحتوى: overflow-auto تجعل السكرول داخل هذه المنطقة فقط */}
          <div className="flex-1 overflow-auto bg-slate-50/30 dark:bg-transparent">
            <div className="p-6 h-full">
              <Outlet />
            </div>
          </div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
