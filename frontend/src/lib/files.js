import { toast } from "sonner";
import { api } from "@/lib/api";
import { toFa } from "@/lib/date";

export const fileSize = (n) => (n >= 1048576 ? `${toFa((n / 1048576).toFixed(1))} MB` : `${toFa(Math.max(1, Math.round(n / 1024)))} KB`);

export async function openFile(url) {
  const w = window.open("", "_blank");
  try {
    const r = await api.get(url, { responseType: "blob" });
    const blobUrl = URL.createObjectURL(r.data);
    if (w) w.location.href = blobUrl;
    else window.location.href = blobUrl;
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
  } catch (e) {
    if (w) w.close();
    toast.error(e?.response?.status === 404 ? "فایل یافت نشد" : "باز کردن فایل ناموفق بود");
  }
}

export async function uploadDocument({ file, category, title, date, notes }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("category", category);
  if (title) fd.append("title", title);
  if (date) fd.append("document_date", date);
  if (notes) fd.append("notes", notes);
  return api.post("/patient/documents", fd).then((r) => r.data);
}
