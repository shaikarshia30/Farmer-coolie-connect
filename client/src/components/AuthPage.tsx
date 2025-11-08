import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Tractor, Users, Wrench, MapPin, Shield, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "register";
type UserRole = "farmer" | "coolie" | "rental";

interface AuthPageProps {
  mode: AuthMode;
  defaultRole?: UserRole;
}

export default function AuthPage({ mode, defaultRole = "farmer" }: AuthPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    farmSize: "",
    vehicleType: "",
  });

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sending OTP to:", formData.phone);
    
    // Simulate OTP sending
    toast({
      title: "OTP Sent!",
      description: `Verification code sent to ${formData.phone}`,
    });
    
    setOtpSent(true);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Verifying OTP:", otp, { mode, role, formData });
    
    // Simulate OTP verification
    if (otp.length === 6) {
      toast({
        title: mode === "login" ? "Login successful!" : "Registration successful!",
        description: `Welcome to Former Code Connect as a ${role}`,
      });

      // Navigate to appropriate dashboard
      setTimeout(() => {
        navigate(`/dashboard/${role}`);
      }, 1000);
    } else {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
    }
  };

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData({ ...formData, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
          toast({
            title: "Location captured",
            description: "Your location has been added to your profile",
          });
        },
        (error) => {
          toast({
            title: "Location error",
            description: "Unable to get your location. Please enter it manually.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleResendOTP = () => {
    console.log("Resending OTP to:", formData.phone);
    toast({
      title: "OTP Resent!",
      description: `New verification code sent to ${formData.phone}`,
    });
  };

  const handleChangePhone = () => {
    setOtpSent(false);
    setOtp("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <Tractor className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Former Code Connect</span>
          </div>
          <CardTitle className="text-2xl text-center">
            {mode === "login" ? "Welcome Back" : "Create Your Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {otpSent
              ? `Enter the verification code sent to ${formData.phone}`
              : mode === "login"
              ? "Sign in using your phone number"
              : "Join our agricultural community today"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <>
              <Tabs value={role} onValueChange={(v) => setRole(v as UserRole)} className="mb-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="farmer" className="gap-1" data-testid="tab-farmer">
                    <Tractor className="h-4 w-4" />
                    <span className="hidden sm:inline">Farmer</span>
                  </TabsTrigger>
                  <TabsTrigger value="coolie" className="gap-1" data-testid="tab-coolie">
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">Worker</span>
                  </TabsTrigger>
                  <TabsTrigger value="rental" className="gap-1" data-testid="tab-rental">
                    <Wrench className="h-4 w-4" />
                    <span className="hidden sm:inline">Provider</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <form onSubmit={handleSendOTP} className="space-y-4">
                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="input-name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    data-testid="input-phone"
                  />
                </div>

                {mode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="flex gap-2">
                      <Input
                        id="location"
                        placeholder="Enter your location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                        data-testid="input-location"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleGetLocation}
                        data-testid="button-get-location"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {mode === "register" && role === "farmer" && (
                  <div className="space-y-2">
                    <Label htmlFor="farmSize">Farm Size (acres)</Label>
                    <Input
                      id="farmSize"
                      type="number"
                      placeholder="e.g., 50"
                      value={formData.farmSize}
                      onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                      data-testid="input-farm-size"
                    />
                  </div>
                )}

                {mode === "register" && role === "rental" && (
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">Primary Vehicle/Equipment Type</Label>
                    <Input
                      id="vehicleType"
                      placeholder="e.g., Tractor, Harvester"
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      data-testid="input-vehicle-type"
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" data-testid="button-send-otp">
                  <Smartphone className="mr-2 h-4 w-4" />
                  Send OTP
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-center block">Enter 6-Digit OTP</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    data-testid="input-otp"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={otp.length !== 6}
                data-testid="button-verify-otp"
              >
                Verify & Continue
              </Button>

              <div className="flex flex-col gap-2 text-center text-sm">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendOTP}
                  data-testid="button-resend-otp"
                >
                  Resend OTP
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleChangePhone}
                  data-testid="button-change-phone"
                >
                  Change Phone Number
                </Button>
              </div>
            </form>
          )}

          {!otpSent && (
            <div className="mt-6 text-center text-sm">
              {mode === "login" ? (
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <a href="/register" className="text-primary hover:underline">
                    Sign up
                  </a>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <a href="/login" className="text-primary hover:underline">
                    Sign in
                  </a>
                </p>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure OTP authentication</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
