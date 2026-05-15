"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useBooks, useDeleteBook } from "@/lib/hooks/use-books";
import { ScreenWrapper } from "@/components/ui/screen-wrapper";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Badge, TransactionBadge } from "@/components/ui/badge";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { AddBookDialog } from "./_components/add-book-dialog";
import { BookOpen } from "lucide-react";

export default function CataloguePage() {
  const [query,       setQuery]       = useState("");
  const [addOpen,     setAddOpen]     = useState(false);
  const deleteBook = useDeleteBook();

  const { data: books, isLoading, isError, error } = useBooks({ query });

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteBook.mutateAsync(id);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <ScreenWrapper
      title="Catalogue"
      subtitle="Manage the library book collection"
      actions={
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Add Book
        </Button>
      }
    >
      <AddBookDialog open={addOpen} onClose={() => setAddOpen(false)} />

      <div className="mb-5 max-w-md">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by title, author, or ISBN…"
          loading={isLoading}
        />
      </div>

      {isError && (
        <EmptyState icon={AlertCircle} title="Could not load books" description={(error as Error).message} />
      )}

      {!isError && (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-180">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="text-left text-xs text-muted font-medium px-6 py-3">Title</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Author</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Category</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">ISBN</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Stock</th>
                <th className="text-left text-xs text-muted font-medium px-4 py-3">Shelf</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(6)].map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : (books ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={BookOpen}
                      title={query ? `No results for "${query}"` : "No books yet"}
                      description={query ? "Try a different search term." : "Add your first book using the button above."}
                      action={!query && (
                        <Button size="sm" onClick={() => setAddOpen(true)}>
                          <Plus size={14} /> Add Book
                        </Button>
                      )}
                    />
                  </td>
                </tr>
              ) : (
                (books ?? []).map((book) => (
                  <tr key={book.id} className="border-b border-border last:border-0 hover:bg-background/60 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-foreground max-w-50 truncate">{book.title}</td>
                    <td className="px-4 py-3.5 text-muted max-w-35 truncate">{book.author}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant="neutral">{book.category}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-muted font-mono text-xs">{book.isbn}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold ${book.available_copies > 0 ? "text-primary" : "text-accent"}`}>
                        {book.available_copies}/{book.total_copies}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted text-xs font-mono">{book.shelf_location}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-primary-subtle transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
                          className="p-1.5 rounded-lg text-muted hover:text-error hover:bg-error-subtle transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </ScreenWrapper>
  );
}
