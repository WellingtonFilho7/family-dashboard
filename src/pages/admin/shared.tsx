import { useEffect, useRef, useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Input,
} from '@/components';
import { supabase } from '@/lib/supabase';

export interface AdminSectionProps {
  loading: boolean;
  refresh: () => Promise<void>;
  disabled: boolean;
  hasSession: boolean;
}

export function requireAuth(hasSession: boolean): boolean {
  if (!supabase || !hasSession) {
    toast.error('Faça login para editar');
    return false;
  }
  return true;
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{message}</p>
  );
}

export function EditableText({
  value,
  onSave,
  disabled = false,
  placeholder = '',
}: {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      toast.error('Campo não pode ficar vazio');
      return;
    }
    if (trimmed === value) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          placeholder={placeholder}
          className="h-8 text-sm"
        />
        <Button size="sm" variant="ghost" onClick={handleSave} disabled={saving}>
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && setEditing(true)}
      disabled={disabled}
      className="group flex items-center gap-1.5 text-left"
    >
      <span className="text-sm font-semibold">{value}</span>
      <Pencil className="h-3 w-3 text-muted-foreground/50" />
    </button>
  );
}

export function DeleteConfirmButton({
  itemName,
  onConfirm,
  disabled = false,
  warning,
}: {
  itemName: string;
  onConfirm: () => Promise<void>;
  disabled?: boolean;
  warning?: string;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={disabled}>
          Remover
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription>
            {warning ?? `Ao remover "${itemName}", esta ação não pode ser desfeita.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleting}
          >
            {deleting ? 'Removendo...' : 'Remover permanentemente'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
