import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Briefcase,
  Wrench,
  Settings,
  LogOut,
  Tractor,
  Moon,
  Sun,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: "farmer" | "coolie" | "rental";
  userName?: string;
}

export default function DashboardLayout({ children, userRole, userName = "User" }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
    console.log("Theme toggled:", !isDark ? "dark" : "light");
  };

  const menuItems = {
    farmer: [
      { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard/farmer" },
      { title: "My Jobs", icon: Briefcase, url: "/dashboard/farmer" },
      { title: "Equipment Rentals", icon: Wrench, url: "/dashboard/farmer" },
      { title: "Settings", icon: Settings, url: "/dashboard/farmer" },
    ],
    coolie: [
      { title: "Find Jobs", icon: LayoutDashboard, url: "/dashboard/coolie" },
      { title: "Applications", icon: Briefcase, url: "/dashboard/coolie/applications" },
      { title: "Settings", icon: Settings, url: "/dashboard/coolie/settings" },
    ],
    rental: [
      { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard/rental" },
      { title: "My Equipment", icon: Wrench, url: "/dashboard/rental/equipment" },
      { title: "Rentals", icon: Briefcase, url: "/dashboard/rental/rentals" },
      { title: "Settings", icon: Settings, url: "/dashboard/rental/settings" },
    ],
  };

  const items = menuItems[userRole];

  const handleLogout = () => {
    console.log("Logout clicked");
    window.location.href = "/";
  };

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <div className="mb-4 flex items-center gap-2 px-4 pt-4">
                <Tractor className="h-5 w-5 text-primary" />
                <span className="font-semibold">Farmer-Coolie</span>
              </div>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="space-y-2 p-4">
              <div className="flex items-center gap-3 rounded-md p-2 hover-elevate">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground capitalize">{userRole}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b p-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
