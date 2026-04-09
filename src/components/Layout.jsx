import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip" // استيراد التول تيب بروفايدر
import { AppSidebar } from "./AppSidebar"

export default function DashboardLayout({ children }) {
    return (
        <TooltipProvider delayDuration={0}> {/* غلف الكل هنا */}
            <SidebarProvider>
                <AppSidebar />
                <main className="w-full">
                    <div className="flex items-center p-4 border-b">
                        <SidebarTrigger />
                    </div>
                    <div className="p-6">
                        {children}
                    </div>
                </main>
            </SidebarProvider>
        </TooltipProvider>
    )
}