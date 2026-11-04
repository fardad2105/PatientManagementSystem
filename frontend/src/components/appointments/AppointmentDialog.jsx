import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, inputCls, OptionSelect } from "@/components/Field";
import { JalaliDateTimeInput } from "@/components/JalaliDateTimeInput";
import { SaveButton } from "@/components/profile/PersonalForm";
import { api, apiError } from "@/lib/api";
import { joinLocal, splitLocal } from "@/lib/date";
import { APPT_TYPE, REMIND_OPTIONS } from "@/lib/labels";

const init = (a) => ({
  title: a?.title || "", appointment_type: a?.appointment_type || "visit", location: a?.location || "",
  physician_name: a?.physician_name || "", notes: a?.notes || "",
  remind: a ? String(a.remind_before_minutes ?? "none") : "1440",
  ...(a ? splitLocal(a.scheduled_at) : { date: null, time: "09:00" }),
});

export default function AppointmentDialog({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(init(initial));
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time) return toast.error("تاریخ و ساعت نوبت را وارد کنید");
    const body = {
      title: form.title, appointment_type: form.appointment_type, scheduled_at: joinLocal(form.date, form.time),
      location: form.location || null, physician_name: form.physician_name || null, notes: form.notes || null,
      remind_before_minutes: form.remind === "none" ? null : Number(form.remind),
    };
    setLoading(true);
    try {
      if (initial?.id) await api.put(`/patient/appointments/${initial.id}`, body);
      else await api.post("/patient/appointments", body);
      toast.success("نوبت ذخیره شد");
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
      <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto sm:max-w-xl" data-testid="appointment-dialog">
        <DialogHeader><DialogTitle className="text-right">{initial?.id ? "ویرایش نوبت" : "افزودن نوبت پیگیری"}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" data-testid="appointment-form">
          <Field label="عنوان">
            <Input required className={inputCls} placeholder="مثلاً ویزیت فوق‌تخصص غدد" value={form.title} onChange={set("title")} data-testid="appointment-title-input" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نوع نوبت">
              <OptionSelect value={form.appointment_type} onChange={(v) => setForm({ ...form, appointment_type: v })} options={APPT_TYPE} testId="appointment-type-select" />
            </Field>
            <Field label="یادآور">
              <OptionSelect value={form.remind} onChange={(v) => setForm({ ...form, remind: v })} options={REMIND_OPTIONS} testId="appointment-remind-select" />
            </Field>
          </div>
          <Field label="تاریخ و ساعت">
            <JalaliDateTimeInput date={form.date} time={form.time} allowFuture testId="appointment-when"
              onChange={({ date, time }) => setForm({ ...form, date, time })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="مکان">
              <Input className={inputCls} value={form.location} onChange={set("location")} data-testid="appointment-location-input" />
            </Field>
            <Field label="پزشک / مرکز">
              <Input className={inputCls} value={form.physician_name} onChange={set("physician_name")} data-testid="appointment-physician-input" />
            </Field>
          </div>
          <Field label="یادداشت (مثلاً مدارک یا آزمایش‌هایی که باید همراه ببرید)">
            <Textarea className="rounded-xl border-slate-200" value={form.notes} onChange={set("notes")} data-testid="appointment-notes-input" />
          </Field>
          <SaveButton loading={loading} testId="appointment-save-button" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
