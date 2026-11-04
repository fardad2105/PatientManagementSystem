import { Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const ConfirmDelete = ({ title, onConfirm, testId }) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <button data-testid={testId} aria-label="حذف" className="rounded-full p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600">
        <Trash2 className="h-4 w-4" />
      </button>
    </AlertDialogTrigger>
    <AlertDialogContent dir="rtl">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-right">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-right">این عمل قابل بازگشت نیست.</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="gap-2 sm:justify-start">
        <AlertDialogAction onClick={onConfirm} data-testid={`${testId}-confirm`} className="rounded-full bg-rose-600 hover:bg-rose-700">حذف</AlertDialogAction>
        <AlertDialogCancel className="rounded-full">انصراف</AlertDialogCancel>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
