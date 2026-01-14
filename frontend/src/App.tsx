import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'

type Todo = {
  id: number
  title: string
  description?: string
  completed: boolean
}

const API_BASE = (
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'
).replace(/\/$/, '')

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filter, setFilter] = useState('')

  const loadTodos = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/todos`)
      if (!response.ok) {
        throw new Error(`Backend antwortete mit Status ${response.status}.`)
      }
      const payload = (await response.json()) as Todo[]
      const normalized = payload.map((item) => {
        const completed =
          (item as Todo).completed ??
          (item as never as { isCompleted?: boolean }).isCompleted ??
          false
        return {
          id: item.id,
          title: item.title,
          description: item.description ?? '',
          completed,
        }
      })
      setTodos(normalized)
      setError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Konnte Todos nicht laden.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  const openTodos = useMemo(
    () => todos.filter((todo) => !todo.completed),
    [todos]
  )
  const doneTodos = useMemo(
    () => todos.filter((todo) => todo.completed),
    [todos]
  )

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) {
      setError('Bitte einen Titel eintragen.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        completed: false,
      }
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Konnte Todo nicht speichern.')
      }
      const created = (await response.json()) as Todo

      setTodos((prev) => [
        ...prev,
        {
          id: created.id,
          title: created.title ?? payload.title,
          description: created.description ?? payload.description,
          completed: (created as Todo).completed ?? payload.completed,
        },
      ])
      setTitle('')
      setDescription('')
      setError(null)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Speichern fehlgeschlagen.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateTodo = async (todo: Todo, updates: Partial<Todo>) => {
    const original = todo
    const merged = { ...todo, ...updates }

    setTodos((prev) =>
      prev.map((item) => (item.id === todo.id ? merged : item))
    )

    try {
      // Backend PUT handler cannot consume JSON correctly; reuse POST save to update existing items.
      const response = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: merged.id,
          title: merged.title,
          description: merged.description,
          completed: merged.completed,
        }),
      })

      if (!response.ok) {
        throw new Error(`Update fehlgeschlagen (${response.status}).`)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Update fehlgeschlagen.'
      setError(message)
      setTodos((prev) =>
        prev.map((item) => (item.id === todo.id ? original : item))
      )
    }
  }

  const deleteTodo = async (id: number) => {
    const snapshot = todos
    setTodos((prev) => prev.filter((item) => item.id !== id))
    try {
      const response = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok && response.status !== 404) {
        throw new Error('Löschen fehlgeschlagen.')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Löschen fehlgeschlagen.'
      setError(message)
      setTodos(snapshot)
    }
  }

  const visibleTodos = useMemo(() => {
    const term = filter.trim().toLowerCase()
    if (!term) return todos
    return todos.filter((todo) =>
      [todo.title, todo.description].some((value) =>
        value?.toLowerCase().includes(term)
      )
    )
  }, [todos, filter])

  return (
    <div className='page'>
      <header className='hero'>
        <div className='pill'>TODO APP</div>
        <h1>Aufgaben planen und abhaken</h1>
        <div className='status-row'>
          <div className='stat'>
            <span className='stat-label'>Offen</span>
            <span className='stat-value'>{openTodos.length}</span>
          </div>
          <div className='stat'>
            <span className='stat-label'>Erledigt</span>
            <span className='stat-value'>{doneTodos.length}</span>
          </div>
          <button
            className='ghost-button'
            onClick={loadTodos}
            disabled={loading}
          >
            {loading ? 'Aktualisiere...' : 'Neu laden'}
          </button>
        </div>
        {error ? <div className='alert'>{error}</div> : null}
      </header>

      <section className='grid'>
        <div className='panel form-panel'>
          <div className='panel-header'>
            <div>
              <p className='eyebrow'>Neues Todo</p>
              <h2>Schnell erfassen</h2>
            </div>
            <span className='hint'>Titel ist Pflicht</span>
          </div>
          <form className='form' onSubmit={handleSubmit}>
            <label className='field'>
              <span>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder='z. B. Bericht abschicken'
                required
              />
            </label>
            <label className='field'>
              <span>Beschreibung</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder='Optional: Kontext oder Links'
                rows={3}
              />
            </label>
            <button className='primary' type='submit' disabled={isSubmitting}>
              {isSubmitting ? 'Speichere...' : 'Todo anlegen'}
            </button>
          </form>
        </div>

        <div className='panel list-panel'>
          <div className='panel-header'>
            <div>
              <p className='eyebrow'>Aktuelle Todos</p>
              <h2>Board</h2>
            </div>
            <input
              className='search'
              placeholder='Suche in Titel oder Beschreibung'
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          {loading ? (
            <div className='empty'>Lade Todos...</div>
          ) : visibleTodos.length === 0 ? (
            <div className='empty'>Keine Todos gefunden.</div>
          ) : (
            <ul className='todo-list'>
              {visibleTodos.map((todo) => (
                <li
                  key={todo.id}
                  className={`todo ${todo.completed ? 'done' : ''}`}
                >
                  <div className='todo-main'>
                    <label className='checkbox'>
                      <input
                        type='checkbox'
                        checked={todo.completed}
                        onChange={() =>
                          updateTodo(todo, { completed: !todo.completed })
                        }
                        aria-label={`Todo ${todo.title} abhaken`}
                      />
                      <span className='checkmark' />
                    </label>
                    <div className='todo-copy'>
                      <div className='todo-title'>
                        {todo.title}
                        {todo.completed ? (
                          <span className='badge success'>Done</span>
                        ) : (
                          <span className='badge muted'>Open</span>
                        )}
                      </div>
                      {todo.description ? (
                        <p className='todo-description'>{todo.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className='todo-actions'>
                    <button
                      className='ghost'
                      onClick={() =>
                        updateTodo(todo, { completed: !todo.completed })
                      }
                    >
                      {todo.completed ? 'Als offen markieren' : 'Abhaken'}
                    </button>
                    <button
                      className='ghost danger'
                      onClick={() => deleteTodo(todo.id)}
                    >
                      Löschen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

export default App
