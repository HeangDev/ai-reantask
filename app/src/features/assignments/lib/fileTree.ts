import type { CodeFile } from '@/features/assignments/types'

export interface TreeNode {
  name: string
  path: string
  isFile: boolean
  children: TreeNode[]
}

/** Turns flat paths like src/components/A.tsx into a folder tree, folders first. */
export function buildTree(files: CodeFile[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', isFile: false, children: [] }
  for (const file of files) {
    let node = root
    const parts = file.path.split('/')
    parts.forEach((name, i) => {
      const path = parts.slice(0, i + 1).join('/')
      const isFile = i === parts.length - 1
      let child = node.children.find((c) => c.name === name && c.isFile === isFile)
      if (!child) {
        child = { name, path, isFile, children: [] }
        node.children.push(child)
      }
      node = child
    })
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => Number(a.isFile) - Number(b.isFile) || a.name.localeCompare(b.name))
    nodes.forEach((n) => sort(n.children))
  }
  sort(root.children)
  return root.children
}

export const extensionOf = (path: string) => path.split('.').pop()?.toLowerCase() ?? ''
