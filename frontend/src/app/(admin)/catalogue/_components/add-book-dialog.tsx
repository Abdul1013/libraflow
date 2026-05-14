"use client";

import { useState } from "react";
import { useCreateBook } from "@/lib/hooks/use-books";
import { Dialog, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  "Computer Science", "Engineering",  "Mathematics", "Physics",
  "Literature",       "History",      "Economics",   "Law",
  "Medicine",         "Other",
];

interface AddBookDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY = {
  title: "", author: "", isbn: "", category: "Computer Science",
  total_copies: 1, shelf_location: "", description: "",
};

export function AddBookDialog({ open, onClose }: AddBookDialogProps) {
  const [form,  setForm]  = useState(EMPTY);
  const [error, setError] = useState("");
  const create = useCreateBook();

  function update(field: keyof typeof EMPTY) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await create.mutateAsync({
        ...form,
        total_copies: Number(form.total_copies),
        description:  form.description || null,
      });
      setForm(EMPTY);
      onClose();
    } catch (err) {
      setError((err as Error).message ?? "Failed to add book.");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add New Book" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Title"  value={form.title}  onChange={update("title")}  placeholder="Introduction to Algorithms" required />
          <Input label="Author" value={form.author} onChange={update("author")} placeholder="Cormen, Leiserson, Rivest"    required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="ISBN (10 or 13 digits)" value={form.isbn} onChange={update("isbn")} placeholder="978-0262033848" required />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Category</label>
            <select
              value={form.category}
              onChange={update("category")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              required
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Total Copies" type="number" min={1} value={form.total_copies} onChange={update("total_copies")} required />
          <Input label="Shelf Location" value={form.shelf_location} onChange={update("shelf_location")} placeholder="CS-A01" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={update("description")}
            rows={2}
            placeholder="Brief description…"
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground placeholder:text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {error && (
          <p className="text-sm text-error bg-error-subtle px-3 py-2 rounded-xl">{error}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" type="submit" loading={create.isPending}>Add Book</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
