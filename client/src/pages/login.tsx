import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package, Phone, Lock } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(phone, password);
    } catch (error: any) {
      toast({
        title: "خطأ في الدخول",
        description: error.message?.includes("401") ? "رقم الهاتف أو كلمة المرور غلط" : "حصل مشكلة، حاول مرة ثانية",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-md bg-primary">
            <Package className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight" data-testid="text-app-title">Frigo</h1>
          <p className="text-lg text-muted-foreground">نظام إدارة الصناديق</p>
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 px-6 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-base">رقم الهاتف</Label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    data-testid="input-phone"
                    type="text"
                    placeholder="أدخل رقم هاتفك"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pr-12 h-14 text-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    data-testid="input-password"
                    type="password"
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-12 h-14 text-lg"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                data-testid="button-login"
                className="w-full h-14 text-lg"
                disabled={isLoading}
              >
                {isLoading ? "جاري الدخول..." : "دخول"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
