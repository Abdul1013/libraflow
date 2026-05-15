"use client";

import { useState } from "react";
import { CalendarDays, BookOpen } from "lucide-react";
import { useBorrowBook } from "@/lib/hooks/use-transactions";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Book } from "@/types";

interface BorrowDialogProps {
  book: Book | null;
  onClose: () => void;
  onSuccess?: () => void;
}

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function BorrowDialog({ book, onClose, onSuccess }: BorrowDialogProps) {
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [error,   setError]   = useState("");
  const borrow = useBorrowBook();

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  async function handleConfirm() {
    if (!book) return;
    setError("");
    try {
      await borrow.mutateAsync({
        book_id:  book.id,
        due_date: new Date(dueDate).toISOString(),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError((err as Error).message ?? "Could not borrow book. Please try again.");
    }
  }

  return (
    <Dialog
      open={Boolean(book)}
      onClose={onClose}
      title="Borrow Book"
      description="Confirm the loan details below"
    >
      {book && (
        <>
          {/* Book summary */}
          <div className="flex gap-3 bg-background rounded-xl p-4 border border-border">
            <div className="size-10 bg-primary-subtle rounded-lg flex items-center justify-center shrink-0">
              <BookOpen size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{book.title}</p>
              <p className="text-xs text-muted">{book.author}</p>
              <p className="text-xs text-muted mt-0.5">
                Shelf: <span className="font-medium">{book.shelf_location}</span>
                {" · "}
                <span className="text-primary font-medium">{book.available_copies} copies left</span>
              </p>
            </div>
          </div>

          {/* Due date picker */}
          <Input
            label="Return by"
            type="date"
            value={dueDate}
            min={minDateStr}
            onChange={(e) => setDueDate(e.target.value)}
            leadingIcon={<CalendarDays size={15} />}
          />

          {error && (
            <p className="text-sm text-error bg-error-subtle px-3 py-2 rounded-xl">{error}</p>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={borrow.isPending}
              onClick={handleConfirm}
            >
              Confirm Borrow
            </Button>
          </DialogFooter>
        </>
      )}
    </Dialog>
  );
}
