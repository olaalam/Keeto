import { useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "./AppSidebar";
import useSidebarStore from "@/store/useSidebarStore";
import useAuthStore from "@/store/useAuthStore";
import {
  LogOut,
  ChevronLeft,
  UserCircle2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout() {
  const activeModule = useSidebarStore(
    (state) => state.activeModule
  );

  const setActiveModule = useSidebarStore(
    (state) => state.setActiveModule
  );

  const { setLogout } = useAuthStore(
    (state) => state
  );

  const location = useLocation();
  const navigate = useNavigate();

  // وظيفة الرجوع للخلف
  const handleBack = () => {
    if (
      window.history.state &&
      window.history.state.idx === 0
    ) {
      navigate("/");
      setActiveModule(null);
    } else {
      navigate(-1);
    }
  };

  // تصفير الموديول عند الرجوع للهوم
  useEffect(() => {
    if (location.pathname === "/") {
      setActiveModule(null);
    }
  }, [location.pathname, setActiveModule]);

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        {/* Sidebar */}
        {activeModule && <AppSidebar />}

        <main className="relative flex flex-col flex-1 min-w-0 max-h-screen overflow-hidden bg-background">
          {/* Header */}
          <header className="flex-none sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between p-4 h-16">
              {/* Left Section */}
              <div className="flex items-center gap-4 overflow-hidden">
                {activeModule && (
                  <SidebarTrigger className="shrink-0" />
                )}

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

              {/* Logo */}
              <div>
                <button
                  onClick={() => navigate("/")}
                >
                  <img
                    className="w-30 h-15"
                    src="/src/assets/logo.webp"
                    alt="Logo"
                  />
                </button>
              </div>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full p-1 hover:bg-accent transition-colors">
                    <UserCircle2
                      size={36}
                      className="text-slate-600 hover:text-primary transition-colors"
                    />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-52 rounded-xl"
                >
                  <DropdownMenuItem
                    onClick={() =>
                      navigate("/profile")
                    }
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <UserCircle2 size={16} />
                    <span>Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={setLogout}
                    className="cursor-pointer flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut size={16} />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Content */}
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