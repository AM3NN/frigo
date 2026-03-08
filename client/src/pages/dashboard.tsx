import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Minus,
  UserPlus,
  History,
  Download,
  LogOut,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Trash2,
} from "lucide-react";
import type { User, Movement } from "@shared/schema";

type SafeUser = Omit<User, "password">;

export default function DashboardPage() {
  const { user: authUser, logout } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [actionType, setActionType] = useState<"add" | "return" | null>(null);
  const [quantity, setQuantity] = useState("");
  const [historyUser, setHistoryUser] = useState<SafeUser | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [deleteUser, setDeleteUser] = useState<SafeUser | null>(null);

  const { data: users = [], isLoading: usersLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
  });

  const { data: history = [], isLoading: historyLoading } = useQuery<Movement[]>({
    queryKey: ["/api/history", historyUser?.id],
    enabled: !!historyUser,
  });

  const crateAction = useMutation({
    mutationFn: async ({ type, userId, qty }: { type: "add" | "return"; userId: string; qty: number }) => {
      const endpoint = type === "add" ? "/api/crates/add" : "/api/crates/return";
      await apiRequest("POST", endpoint, { userId, quantity: qty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      const wasAdd = actionType === "add";
      setActionType(null);
      setSelectedUser(null);
      setQuantity("");
      toast({ title: wasAdd ? "تم إعطاء الصناديق" : "تم إرجاع الصناديق", description: "تم بنجاح!" });
    },
    onError: (error: any) => {
      toast({ title: "مشكلة", description: error.message || "حصل خطأ، حاول مرة ثانية", variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/users", {
        name: newUserName,
        phone: newUserPhone,
        password: newUserPassword,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreateUser(false);
      setNewUserName("");
      setNewUserPhone("");
      setNewUserPassword("");
      toast({ title: "تم!", description: "تمت إضافة الشخص الجديد" });
    },
    onError: (error: any) => {
      toast({ title: "مشكلة", description: error.message || "ما قدرنا نضيف الشخص", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setDeleteUser(null);
      toast({ title: "تم!", description: "تم حذف الشخص" });
    },
    onError: (error: any) => {
      toast({ title: "مشكلة", description: error.message || "ما قدرنا نحذف الشخص", variant: "destructive" });
    },
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm)
  );

  const totalCrates = users.reduce((sum, u) => sum + u.currentCrates, 0);

  const handleCrateAction = () => {
    if (!selectedUser || !actionType || !quantity) return;
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "رقم غلط", description: "أدخل رقم أكبر من صفر", variant: "destructive" });
      return;
    }
    crateAction.mutate({ type: actionType, userId: selectedUser.id, qty });
  };

  const openAction = (user: SafeUser, type: "add" | "return") => {
    setSelectedUser(user);
    setActionType(type);
    setQuantity("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-md bg-primary">
              <Package className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none" data-testid="text-dashboard-title">Frigo</h1>
              <p className="text-sm text-muted-foreground mt-0.5">أهلاً، {authUser?.name}</p>
            </div>
          </div>
          <Button variant="destructive" size="lg" onClick={logout} data-testid="button-logout">
            <LogOut className="w-5 h-5 ml-2" />
            خروج
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-base text-muted-foreground">الأشخاص</p>
                {usersLoading ? <Skeleton className="h-10 w-16 mx-auto mt-1" /> : (
                  <p className="text-4xl font-bold mt-1" data-testid="text-total-users">{users.length}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <Package className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-base text-muted-foreground">صناديق عند الناس</p>
                {usersLoading ? <Skeleton className="h-10 w-16 mx-auto mt-1" /> : (
                  <p className="text-4xl font-bold mt-1" data-testid="text-total-crates">{totalCrates}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              data-testid="input-search"
              placeholder="ابحث عن شخص..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-11 h-12 text-base"
            />
          </div>
          <Button size="lg" onClick={() => setShowCreateUser(true)} data-testid="button-add-user" className="h-12 text-base px-6">
            <UserPlus className="w-5 h-5 ml-2" />
            إضافة شخص جديد
          </Button>
        </div>

        {usersLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-14 h-14 mx-auto mb-4 opacity-40" />
            <p className="text-lg">{users.length === 0 ? "ما في أشخاص بعد." : "ما لقينا حد بهالاسم."}</p>
            {users.length === 0 && (
              <p className="text-base mt-2">اضغط "إضافة شخص جديد" للبدء.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((u) => (
              <Card key={u.id} data-testid={`card-user-${u.id}`}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <p className="text-xl font-bold truncate" data-testid={`text-user-name-${u.id}`}>{u.name}</p>
                      <p className="text-base text-muted-foreground" data-testid={`text-user-phone-${u.id}`}>{u.phone}</p>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <p className="text-3xl font-bold" data-testid={`text-crates-${u.id}`}>{u.currentCrates}</p>
                      <p className="text-sm text-muted-foreground">صندوق</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="lg"
                      variant="default"
                      onClick={() => openAction(u, "add")}
                      className="flex-1 h-12 text-base"
                      data-testid={`button-add-crates-${u.id}`}
                    >
                      <Plus className="w-5 h-5 ml-2" />
                      أعطيه صناديق
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => openAction(u, "return")}
                      disabled={u.currentCrates === 0}
                      className="flex-1 h-12 text-base"
                      data-testid={`button-return-crates-${u.id}`}
                    >
                      <Minus className="w-5 h-5 ml-2" />
                      رجّع صناديق
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setHistoryUser(u)}
                      className="h-12 text-base px-4"
                      data-testid={`button-history-${u.id}`}
                    >
                      <History className="w-5 h-5" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setDeleteUser(u)}
                      className="h-12 text-base px-4 text-destructive hover:text-destructive"
                      data-testid={`button-delete-${u.id}`}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!actionType} onOpenChange={() => { setActionType(null); setSelectedUser(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {actionType === "add" ? "إعطاء صناديق" : "إرجاع صناديق"}
            </DialogTitle>
            <DialogDescription className="text-base">
              {actionType === "add"
                ? `كم صندوق تعطي ${selectedUser?.name}؟`
                : `كم صندوق ترجّع من ${selectedUser?.name}؟ (عنده ${selectedUser?.currentCrates})`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-3">
            <div className="space-y-2">
              <Label className="text-base">كم العدد؟</Label>
              <Input
                data-testid="input-crate-quantity"
                type="number"
                min="1"
                max={actionType === "return" ? selectedUser?.currentCrates : undefined}
                placeholder="أدخل الرقم..."
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-14 text-2xl text-center font-bold"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12 text-base"
                onClick={() => { setActionType(null); setSelectedUser(null); }}
                data-testid="button-cancel-action"
              >
                إلغاء
              </Button>
              <Button
                size="lg"
                className="flex-1 h-12 text-base"
                onClick={handleCrateAction}
                disabled={crateAction.isPending || !quantity}
                data-testid="button-confirm-action"
              >
                {crateAction.isPending ? "انتظر..." : "تأكيد"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyUser} onOpenChange={() => setHistoryUser(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">
              سجل {historyUser?.name}
            </DialogTitle>
            <DialogDescription className="text-base">
              كل حركات الصناديق لهالشخص
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {historyLoading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-base">ما في سجل بعد</p>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                {history.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-3 p-4 rounded-md bg-accent/50"
                    data-testid={`movement-${m.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-md ${m.type === "ADD" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {m.type === "ADD" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-base font-semibold">
                          {m.type === "ADD" ? "أعطيناه" : "رجّع"} {m.quantity} صندوق
                        </p>
                        <p className="text-sm text-muted-foreground">بواسطة {m.addedBy}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">
                        {new Date(m.date).toLocaleDateString("ar")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(m.date).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {historyUser && history.length > 0 && (
            <div className="pt-3 border-t">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 text-base"
                onClick={() => {
                  window.open(`/api/export/${historyUser.id}`, "_blank");
                }}
                data-testid="button-export-csv"
              >
                <Download className="w-5 h-5 ml-2" />
                تحميل ملف السجل
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">إضافة شخص جديد</DialogTitle>
            <DialogDescription className="text-base">
              أدخل معلوماته هنا. يقدر يستخدمها عشان يدخل التطبيق.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createUserMutation.mutate();
            }}
            className="space-y-5 pt-2"
          >
            <div className="space-y-2">
              <Label htmlFor="newName" className="text-base">الاسم</Label>
              <Input
                id="newName"
                data-testid="input-new-user-name"
                placeholder="اسم الشخص"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPhone" className="text-base">رقم الهاتف</Label>
              <Input
                id="newPhone"
                data-testid="input-new-user-phone"
                placeholder="رقم هاتفه"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-base">كلمة المرور</Label>
              <Input
                id="newPassword"
                data-testid="input-new-user-password"
                type="password"
                placeholder="اختر كلمة مرور له"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="h-12 text-base"
                required
                minLength={4}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" type="button" onClick={() => setShowCreateUser(false)} className="flex-1 h-12 text-base" data-testid="button-cancel-create">
                إلغاء
              </Button>
              <Button size="lg" type="submit" disabled={createUserMutation.isPending} className="flex-1 h-12 text-base" data-testid="button-confirm-create">
                {createUserMutation.isPending ? "جاري الإضافة..." : "أضف الشخص"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">حذف شخص</DialogTitle>
            <DialogDescription className="text-base">
              هل أنت متأكد تبي تحذف {deleteUser?.name}؟ بيتم حذف كل سجل حركاته. هالشي ما ينعكس.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 text-base"
              onClick={() => setDeleteUser(null)}
              data-testid="button-cancel-delete"
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="flex-1 h-12 text-base"
              onClick={() => deleteUser && deleteUserMutation.mutate(deleteUser.id)}
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? "جاري الحذف..." : "احذف"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
