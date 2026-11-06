import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, inputCls } from "@/components/Field";
import { api, apiError } from "@/lib/api";
import { toEn } from "@/lib/date";

const Shell = ({ title, testId, onClose, children }) => (
  <Dialog open onOpenChange={onClose}>
    <DialogContent dir="rtl" data-testid={testId}>
      <DialogHeader><DialogTitle className="text-right">{title}</DialogTitle></DialogHeader>
      {children}
    </DialogContent>
  </Dialog>
);

const submitCls = "w-full rounded-full bg-purple-700 py-3 text-sm font-semibold text-white hover:bg-purple-800 disabled:opacity-50";

export const ResetDialog = ({ user, onClose }) => {
  const [pw, setPw] = useState("");
  const submit = async () => {
    try {
      await api.post(`/admin/users/${user.id}/reset-password`, { new_password: pw });
      toast.success("رمز عبور جدید ثبت شد");
      onClose();
    } catch (err) {
      toast.error(apiError(err));
    }
  };
  return (
    <Shell title={`بازنشانی رمز عبور — ${user.name}`} testId="reset-password-dialog" onClose={onClose}>
      <Input type="password" dir="ltr" placeholder="حداقل ۸ کاراکتر" className={inputCls} value={pw} onChange={(e) => setPw(e.target.value)} data-testid="reset-password-input" />
      <button onClick={submit} disabled={pw.length < 8} data-testid="reset-password-submit" className={submitCls}>ثبت رمز جدید</button>
    </Shell>
  );
};

export const EditUserDialog = ({ user, onClose, onSaved }) => {
  const [f, setF] = useState({ name: user.name, phone: user.phone || "", specialty: user.specialty || "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = async () => {
    try {
      await api.patch(`/admin/users/${user.id}`, { name: f.name, phone: f.phone ? toEn(f.phone) : null, specialty: f.specialty || null });
      toast.success("اطلاعات کاربر ذخیره شد");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiError(err));
    }
  };
  return (
    <Shell title="ویرایش کاربر" testId="edit-user-dialog" onClose={onClose}>
      <div className="space-y-4">
        <Field label="نام و نام خانوادگی"><Input className={inputCls} value={f.name} onChange={set("name")} data-testid="edit-user-name-input" /></Field>
        <Field label="شماره تماس"><Input className={inputCls} dir="ltr" value={f.phone} onChange={set("phone")} placeholder="09xxxxxxxxx" data-testid="edit-user-phone-input" /></Field>
        {user.role === "physician" && (
          <Field label="تخصص"><Input className={inputCls} value={f.specialty} onChange={set("specialty")} data-testid="edit-user-specialty-input" /></Field>
        )}
        <button onClick={submit} disabled={f.name.trim().length < 2} data-testid="edit-user-submit" className={submitCls}>ذخیره</button>
      </div>
    </Shell>
  );
};
