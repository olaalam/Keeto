import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "./AppSidebar"
import { Outlet } from "react-router-dom"; // استيراد الـ Outlet

export default function Layout() { // أزلنا children لأن الـ Outlet سيحل محلها
    return (
        <TooltipProvider delayDuration={0}>
            <SidebarProvider>
                <AppSidebar />
                <main className="w-full">
                    <div className="flex items-center p-4 border-b">
                        <SidebarTrigger />
                    </div>
                    <div className="p-6">
                        {/* هنا سيتم عرض الصفحات مثل Admin و AdminAdd */}
                        <Outlet />
                    </div>
                </main>
            </SidebarProvider>
        </TooltipProvider>
    )
}