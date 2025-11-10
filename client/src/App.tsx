import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LandingPage from "@/components/LandingPage";
import AuthPage from "@/components/AuthPage";
import DashboardLayout from "@/components/DashboardLayout";
import FarmerDashboard from "@/components/FarmerDashboard";
import CoolieDashboard from "@/components/CoolieDashboard";
import RentalDashboard from "@/components/RentalDashboard";
import ChatWidget from "./components/ChatWidget"; 



function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login">
        {() => <AuthPage mode="login" />}
      </Route>
      <Route path="/register">
        {(params) => {
          const urlParams = new URLSearchParams(window.location.search);
          const role = (urlParams.get("role") || "farmer") as "farmer" | "coolie" | "rental";
          return <AuthPage mode="register" defaultRole={role} />;
        }}
      </Route>
       <Route path="/dashboard/farmer">
        {() => (
          <DashboardLayout userRole="farmer" userName="John Farmer">
            <FarmerDashboard />
          </DashboardLayout>
        )}
      </Route> 
      
      <Route path="/dashboard/coolie">
        {() => (
          <DashboardLayout userRole="coolie" userName="Mike Worker">
            <CoolieDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/rental">
        {() => (
          <DashboardLayout userRole="rental" userName="Sarah Provider">
            <RentalDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />

        <ChatWidget />  {/* <-- ADD THIS LINE HERE */}

      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
