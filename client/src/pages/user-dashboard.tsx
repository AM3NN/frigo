import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  LogOut,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  History,
} from "lucide-react";
import type { User, Movement } from "@shared/schema";

type SafeUser = Omit<User, "password">;

export default function UserDashboardPage() {
  const { user: authUser, logout } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery<SafeUser>({
    queryKey: ["/api/my-profile"],
  });

  const { data: history = [], isLoading: historyLoading } = useQuery<Movement[]>({
    queryKey: ["/api/my-history"],
  });

  const totalAdded = history.filter((m) => m.type === "ADD").reduce((s, m) => s + m.quantity, 0);
  const totalReturned = history.filter((m) => m.type === "RETURN").reduce((s, m) => s + m.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-md bg-primary">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none" data-testid="text-user-dashboard-title">Frigo</h1>
              <p className="text-sm text-muted-foreground mt-0.5">أهلاً، {authUser?.name}</p>
            </div>
          </div>
          <Button variant="destructive" size="lg" onClick={logout} data-testid="button-user-logout">
            <LogOut className="w-5 h-5 ml-2" />
            خروج
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-primary" />
              <p className="text-lg text-muted-foreground">عندك حالياً</p>
              {profileLoading ? <Skeleton className="h-16 w-24 mx-auto mt-2 mb-2" /> : (
                <p className="text-6xl font-bold mt-2 mb-2" data-testid="text-my-crates">{profile?.currentCrates ?? 0}</p>
              )}
              <p className="text-xl text-muted-foreground">صندوق</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <ArrowDownLeft className="w-7 h-7 mx-auto mb-2 text-primary" />
                <p className="text-base text-muted-foreground">استلمت</p>
                <p className="text-3xl font-bold mt-1" data-testid="text-total-received">
                  {historyLoading ? <Skeleton className="h-9 w-14 mx-auto" /> : totalAdded}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <ArrowUpRight className="w-7 h-7 mx-auto mb-2 text-muted-foreground" />
                <p className="text-base text-muted-foreground">رجّعت</p>
                <p className="text-3xl font-bold mt-1" data-testid="text-total-returned">
                  {historyLoading ? <Skeleton className="h-9 w-14 mx-auto" /> : totalReturned}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="w-6 h-6" />
            سجل الحركات
          </h2>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open("/api/my-export", "_blank")}
              className="h-12 text-base"
              data-testid="button-user-export-csv"
            >
              <Download className="w-5 h-5 ml-2" />
              تحميل
            </Button>
          )}
        </div>

        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <History className="w-14 h-14 mx-auto mb-4 opacity-40" />
            <p className="text-lg">ما في سجل بعد</p>
            <p className="text-base mt-2">لما تستلم أو ترجّع صناديق، بتظهر هنا</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((m) => (
              <Card key={m.id} data-testid={`user-movement-${m.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-md ${m.type === "ADD" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {m.type === "ADD" ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-lg font-semibold">
                          {m.type === "ADD" ? "استلمت" : "رجّعت"} {m.quantity} صندوق
                        </p>
                        <p className="text-sm text-muted-foreground">بواسطة {m.addedBy}</p>
                      </div>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-sm text-muted-foreground">
                        {new Date(m.date).toLocaleDateString("ar")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(m.date).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
