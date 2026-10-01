import { ChevronDownIcon, FolderIcon } from '@/components/ui/icons'
import FileBadge from '@/features/assignments/components/editor/FileBadge'
import type { TreeNode } from '@/features/assignments/lib/fileTree'

const focusRing = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'

interface Props {
  nodes: TreeNode[]
  depth?: number
  /** The file shown in the editor. */
  active: string
  collapsed: ReadonlySet<string>
  onOpen: (path: string) => void
  onToggle: (path: string) => void
}

/** The editor's file explorer: folders expand and collapse, files open in a tab. */
export default function FileExplorer({ nodes, depth = 0, active, collapsed, onOpen, onToggle }: Props) {
  return (
    <ul role={depth === 0 ? 'tree' : 'group'}>
      {nodes.map((node) => {
        const open = !collapsed.has(node.path)
        const indent = { paddingLeft: `${0.5 + depth * 0.85}rem` }
        return (
          <li
            key={node.path}
            role="treeitem"
            aria-expanded={node.isFile ? undefined : open}
            aria-selected={node.isFile ? node.path === active : undefined}
          >
            {node.isFile ? (
              <button
                type="button"
                onClick={() => onOpen(node.path)}
                style={indent}
                className={`flex w-full items-center gap-1.5 py-[3px] pr-3 text-left text-[13px] transition-colors ${focusRing} ${
                  node.path === active ? 'bg-accent-soft text-fg' : 'text-muted hover:bg-hover hover:text-fg'
                }`}
              >
                <span className="w-4 shrink-0" aria-hidden="true" />
                <FileBadge path={node.path} />
                <span className="truncate">{node.name}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onToggle(node.path)}
                  style={indent}
                  className={`flex w-full items-center gap-1.5 py-[3px] pr-3 text-left text-[13px] text-fg transition-colors hover:bg-hover ${focusRing} [&>span>svg]:h-3.5 [&>span>svg]:w-3.5`}
                >
                  <span className={`w-4 shrink-0 text-muted transition-transform ${open ? '' : '-rotate-90'}`} aria-hidden="true">
                    <ChevronDownIcon />
                  </span>
                  <span className="shrink-0 text-amber-500" aria-hidden="true">
                    <FolderIcon />
                  </span>
                  <span className="truncate">{node.name}</span>
                </button>
                {open && (
                  <FileExplorer nodes={node.children} depth={depth + 1} active={active} collapsed={collapsed} onOpen={onOpen} onToggle={onToggle} />
                )}
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
