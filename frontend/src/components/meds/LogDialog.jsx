import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field, inputCls, OptionSelect } from "@/components/Field";
import { JalaliDateTimeInput } from "@/components/JalaliDateTimeInput";
import { SaveButton } from "@/components/profile/PersonalForm";
import { api, apiError } from "@/lib/api";
import { joinLocal, splitLocal } from "@/lib/date";
import { MED_LOG_STATUS } from "@/lib/labels";

export default function LogDialog({ med, onClose, onSaved }) {
  const [when, setWhen] = useState(splitLocal());
  const [status, setStatus] = useState("taken");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!when.date || !when.time) return toast.error("تاریخ و ساعت مصرف را وارد کنید");
    const takenAt = joinLocal(when.date, when.time);
    if (new Date(takenAt) > new Date()) return toast.error("زمان مصرف نمی‌تواند در آینده باشد");
    setLoading(true);
    try {
      await api.post(`/patient/medications/${med.id}/logs`, { status, taken_at: takenAt, note: note || null });
      toast.success("ثبت شد");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl" className="sm:max-w-md" data-testid="medication-log-dialog">
        <DialogHeader><DialogTitle className="text-right">ثبت مصرف — {med.name}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="تاریخ و ساعت">
            <JalaliDateTimeInput date={when.date} time={when.time} onChange={setWhen} testId="medication-log-when" />
          </Field>
          <Field label="وضعیت">
            <OptionSelect value={status} onChange={setStatus} options={MED_LOG_STATUS} testId="medication-log-status-select" />
          </Field>
          <Field label="یادداشت (اختیاری)">
            <Input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} data-testid="medication-log-note-input" />
          </Field>
          <SaveButton loading={loading} testId="medication-log-save-button" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
