import type { CodeFile } from '@/features/assignments/types'

// Placeholder project contents for the sample submissions, until real files can be stored and read.

const cleanTodoProject: CodeFile[] = [
  {
    path: 'README.md',
    code: `# To-do App

A small to-do list built with React and TypeScript.

## Features

- Add a task
- Mark a task as done
- Delete a task
- Tasks are saved in the browser

## Run

    npm install
    npm run dev
`,
  },
  {
    path: 'package.json',
    code: `{
  "name": "todo-app",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.0",
    "vite": "^7.0.0"
  }
}
`,
  },
  {
    path: 'index.html',
    code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>To-do App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  },
  {
    path: 'src/main.tsx',
    code: `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`,
  },
  {
    path: 'src/types.ts',
    code: `export interface Todo {
  id: number
  title: string
  done: boolean
}
`,
  },
  {
    path: 'src/App.tsx',
    code: `import { useEffect, useState } from 'react'
import TodoForm from './components/TodoForm'
import TodoItem from './components/TodoItem'
import type { Todo } from './types'

const STORAGE_KEY = 'todos'

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  }, [todos])

  const add = (title: string) =>
    setTodos([...todos, { id: Date.now(), title, done: false }])

  const toggle = (id: number) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const remove = (id: number) => setTodos(todos.filter((t) => t.id !== id))

  return (
    <main>
      <h1>To-do</h1>
      <TodoForm onAdd={add} />
      <ul>
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggle} onDelete={remove} />
        ))}
      </ul>
    </main>
  )
}
`,
  },
  {
    path: 'src/components/TodoForm.tsx',
    code: `import { useState } from 'react'
import type { FormEvent } from 'react'

interface Props {
  onAdd: (title: string) => void
}

export default function TodoForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim())
    setTitle('')
  }

  return (
    <form onSubmit={submit}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
      />
      <button type="submit">Add</button>
    </form>
  )
}
`,
  },
  {
    path: 'src/components/TodoItem.tsx',
    code: `import type { Todo } from '../types'

interface Props {
  todo: Todo
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export default function TodoItem({ todo, onToggle, onDelete }: Props) {
  return (
    <li className={todo.done ? 'done' : ''}>
      <input
        type="checkbox"
        checked={todo.done}
        onChange={() => onToggle(todo.id)}
      />
      <span>{todo.title}</span>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </li>
  )
}
`,
  },
  {
    path: 'src/index.css',
    code: `body {
  font-family: system-ui, sans-serif;
  max-width: 32rem;
  margin: 2rem auto;
}

li.done span {
  text-decoration: line-through;
  color: #888;
}
`,
  },
]

export const smallTodoProjectFiles: CodeFile[] = [
  {
    path: 'package.json',
    code: `{
  "name": "my-todo",
  "version": "1.0.0",
  "scripts": { "dev": "vite" },
  "dependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" }
}
`,
  },
  {
    path: 'src/App.tsx',
    code: `import { useState } from 'react'

export default function App() {
  const [items, setItems] = useState<string[]>([])
  const [text, setText] = useState('')

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => { setItems([...items, text]); setText('') }}>Add</button>
      <ul>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  )
}
`,
  },
]

const patch = (files: CodeFile[], path: string, change: (code: string) => string): CodeFile[] =>
  files.map((f) => (f.path === path ? { ...f, code: change(f.code) } : f))

/** The student's fixed version: everything clean, with a test script added. */
export const todoProjectFixedFiles: CodeFile[] = cleanTodoProject

/** What the student first handed in: the same project with a few common slips. */
export const todoProjectFiles: CodeFile[] = [
  (files: CodeFile[]) =>
    patch(files, 'package.json', (code) => code.replace(',\n    "test": "vitest"', '')),
  (files: CodeFile[]) =>
    patch(files, 'src/App.tsx', (code) =>
      code
        .replace("const STORAGE_KEY = 'todos'", "var STORAGE_KEY = 'todos'")
        .replace('JSON.parse(saved) : []', 'JSON.parse(saved) as any : []')
        .replace('  const add = (title: string) =>', '  // TODO: block duplicate titles\n  const add = (title: string) =>'),
    ),
  (files: CodeFile[]) =>
    patch(files, 'src/components/TodoItem.tsx', (code) =>
      code.replace('onChange={() => onToggle(todo.id)}', "onChange={() => { console.log('toggle', todo.id); onToggle(todo.id) }}"),
    ),
].reduce((files, apply) => apply(files), cleanTodoProject)
