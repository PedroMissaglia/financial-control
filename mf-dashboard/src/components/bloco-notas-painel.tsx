import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { notifyBlocoNotasChanged } from '../../../shared/dashboard-contract';

export interface BlocoNotaItem {
  usuarioId: string;
  nome: string;
  html: string;
  editavel: boolean;
}

interface BlocoNotasPainelProps {
  notas: BlocoNotaItem[];
}

function isHtmlEmpty(html: string): boolean {
  const text = html
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
  return text.length === 0;
}

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: Readonly<{
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}>) {
  return (
    <Button
      type="button"
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className={cn('h-8 w-8 shrink-0 px-0', active && 'bg-accent')}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function BlocoNotasSecao({
  html,
  usuarioId,
  editavel,
  titulo,
  heading,
}: Readonly<{
  html: string;
  usuarioId: string;
  editavel: boolean;
  titulo: string;
  heading?: string;
}>) {
  const [editing, setEditing] = useState(false);
  const usuarioIdRef = useRef(usuarioId);
  usuarioIdRef.current = usuarioId;
  const canEdit = editavel && editing;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
        },
      }),
      Placeholder.configure({
        placeholder: 'Escreva um lembrete…',
      }),
    ],
    content: html || '',
    editable: false,
    editorProps: {
      attributes: {
        class:
          'fc-bloco-notas-editor min-h-[160px] max-h-[320px] overflow-y-auto px-3 py-2 text-sm leading-relaxed outline-none focus-visible:outline-none',
      },
    },
    onUpdate: ({ editor: current }) => {
      notifyBlocoNotasChanged({ html: current.getHTML(), usuarioId: usuarioIdRef.current });
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(canEdit);
  }, [editor, canEdit]);

  useEffect(() => {
    if (!editor || canEdit) return;
    const next = html || '';
    if (editor.getHTML() === next) return;
    editor.commands.setContent(next, { emitUpdate: false });
  }, [editor, html, canEdit]);

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL do link', previous ?? 'https://');
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  };

  const startEdit = () => {
    if (!editavel) return;
    setEditing(true);
    queueMicrotask(() => editor?.commands.focus('end'));
  };

  const applyEdit = () => {
    if (!editor) {
      setEditing(false);
      return;
    }
    notifyBlocoNotasChanged({ html: editor.getHTML(), usuarioId: usuarioIdRef.current });
    setEditing(false);
  };

  const cancelEdit = () => {
    if (editor) {
      editor.commands.setContent(html || '', { emitUpdate: false });
    }
    setEditing(false);
  };

  const empty = isHtmlEmpty(html);

  return (
    <div className="space-y-2">
      {(heading || editavel) && (
        <div
          className={cn(
            'flex flex-col gap-2 sm:flex-row sm:items-center',
            heading ? 'sm:justify-between' : 'sm:justify-end',
          )}
        >
          {heading ? <h3 className="text-foreground text-sm font-medium">{heading}</h3> : null}
          {editavel && !editing && (
            <Button type="button" variant="outline" size="sm" className="w-full shrink-0 sm:w-auto" onClick={startEdit}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Editar
            </Button>
          )}
          {editavel && editing && (
            <div className="flex w-full shrink-0 gap-2 sm:w-auto">
              <Button type="button" variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={cancelEdit}>
                Cancelar
              </Button>
              <Button type="button" size="sm" className="flex-1 sm:flex-none" onClick={applyEdit}>
                Aplicar
              </Button>
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <div
          className="border-border bg-muted/30 flex flex-wrap items-center gap-0.5 rounded-lg border p-1"
          role="toolbar"
          aria-label={`Formatação · ${titulo}`}
        >
          <ToolbarButton
            label="Negrito"
            active={editor?.isActive('bold')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Itálico"
            active={editor?.isActive('italic')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Sublinhado"
            active={editor?.isActive('underline')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Tachado"
            active={editor?.isActive('strike')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />
          <ToolbarButton
            label="Título"
            active={editor?.isActive('heading', { level: 2 })}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Subtítulo"
            active={editor?.isActive('heading', { level: 3 })}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>
          <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />
          <ToolbarButton
            label="Lista"
            active={editor?.isActive('bulletList')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Lista numerada"
            active={editor?.isActive('orderedList')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Citação"
            active={editor?.isActive('blockquote')}
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Link" active={editor?.isActive('link')} disabled={!editor} onClick={setLink}>
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <span className="bg-border mx-1 h-5 w-px" aria-hidden="true" />
          <ToolbarButton
            label="Desfazer"
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label="Refazer"
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      {!canEdit && empty ? (
        <p className="text-muted-foreground text-sm">Nenhum lembrete ainda.</p>
      ) : !canEdit ? (
        <div
          className="border-input bg-background fc-bloco-notas-editor min-h-[120px] rounded-lg border px-3 py-2 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html || '' }}
        />
      ) : (
        <div className="border-input bg-background rounded-lg border">
          <EditorContent editor={editor} />
        </div>
      )}
    </div>
  );
}

function tituloPainel(notas: BlocoNotaItem[]): { titulo: string; descricao: string } {
  if (notas.length > 1) {
    return {
      titulo: 'Bloco de notas',
      descricao: 'Rascunhos de cada perfil. Você edita o seu; o do cônjuge é só consulta.',
    };
  }

  const nota = notas[0];
  if (!nota) {
    return { titulo: 'Bloco de notas', descricao: 'Rascunho contínuo salvo no seu perfil.' };
  }
  if (!nota.editavel) {
    return {
      titulo: `Bloco de notas · ${nota.nome}`,
      descricao: `Consulta do rascunho de ${nota.nome} (somente leitura).`,
    };
  }
  if (nota.nome && nota.nome !== 'Você') {
    return {
      titulo: `Bloco de notas · ${nota.nome}`,
      descricao: `Rascunho de ${nota.nome}, salvo no respectivo perfil.`,
    };
  }
  return { titulo: 'Bloco de notas', descricao: 'Rascunho contínuo salvo no seu perfil.' };
}

export function BlocoNotasPainel({ notas }: Readonly<BlocoNotasPainelProps>) {
  const conjunto = notas.length > 1;
  const { titulo, descricao } = tituloPainel(notas);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        <CardDescription>{descricao}</CardDescription>
      </CardHeader>
      <CardContent className={cn(conjunto && 'space-y-6')}>
        {notas.map((nota, index) => (
          <div key={nota.usuarioId} className={index > 0 ? 'border-border border-t pt-6' : undefined}>
            <BlocoNotasSecao
              html={nota.html}
              usuarioId={nota.usuarioId}
              editavel={nota.editavel}
              titulo={conjunto ? `${titulo} · ${nota.nome}` : titulo}
              heading={conjunto ? nota.nome : undefined}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
