import { useEffect, useState } from 'react'
import {
  loginUser,
  registerUser,
  fetchProfile,
  fetchCategories,
  fetchEvents,
  createEvent,
  setTokens,
  clearTokens,
  getAccessToken,
} from './api'

const initialRegister = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  password: '',
}

const initialLogin = {
  username: '',
  password: '',
}

const initialEvent = {
  title: '',
  description: '',
  category_id: '',
  start_date: '',
  end_date: '',
  location: '',
  capacity: 50,
  is_public: true,
}

export default function App() {
  const [registerForm, setRegisterForm] = useState(initialRegister)
  const [loginForm, setLoginForm] = useState(initialLogin)
  const [eventForm, setEventForm] = useState(initialEvent)
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [profile, setProfile] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadEvents()
    loadCategories()
    loadProfile()
  }, [])

  async function loadEvents() {
    const data = await fetchEvents()
    setEvents(Array.isArray(data) ? data : [])
  }

  async function loadCategories() {
    const data = await fetchCategories()
    if (Array.isArray(data) && data.length > 0) {
      setCategories(data)
      return
    }

    const defaults = [
      { name: 'Conference', description: 'Talks and presentations' },
      { name: 'Workshop', description: 'Hands-on session' },
      { name: 'Meetup', description: 'Community event' },
    ]

    for (const category of defaults) {
      await fetch('/events/categories/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      })
    }

    const refreshed = await fetchCategories()
    setCategories(Array.isArray(refreshed) ? refreshed : [])
  }

  async function loadProfile() {
    if (!getAccessToken()) return
    const data = await fetchProfile()
    setProfile(data)
  }

  async function handleRegister(event) {
    event.preventDefault()
    const result = await registerUser(registerForm)
    if (result.id) {
      setMessage('Registration succeeded. You can now log in.')
      setRegisterForm(initialRegister)
    } else {
      setMessage(JSON.stringify(result))
    }
  }

  async function handleLogin(event) {
    event.preventDefault()
    const result = await loginUser(loginForm)
    if (result.access) {
      setTokens(result.access, result.refresh)
      setProfile(result.user)
      setMessage(`Connected as ${result.user.username}`)
      setLoginForm(initialLogin)
    } else {
      setMessage(JSON.stringify(result))
    }
  }

  function handleLogout() {
    clearTokens()
    setProfile(null)
    setMessage('Logged out')
  }

  async function handleCreateEvent(event) {
    event.preventDefault()
    const payload = {
      ...eventForm,
      category_id: eventForm.category_id ? Number(eventForm.category_id) : null,
      capacity: Number(eventForm.capacity),
      is_public: Boolean(eventForm.is_public),
    }
    const result = await createEvent(payload)
    if (result.id) {
      setMessage('Event created')
      setEventForm(initialEvent)
      await loadEvents()
    } else {
      setMessage(JSON.stringify(result))
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <h1>EventHub</h1>
          <p>Mini distributed system with Django microservices, React, Docker, and Kubernetes.</p>
        </div>
        <div className="status-card">
          <h3>Authentication</h3>
          {profile ? (
            <>
              <p>Connected as <strong>{profile.username}</strong></p>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <p>No active session</p>
          )}
        </div>
      </header>

      {message && <div className="message">{message}</div>}

      <section className="grid two-columns">
        <form className="card" onSubmit={handleRegister}>
          <h2>Register</h2>
          <input placeholder="Username" value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} />
          <input placeholder="Email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} />
          <input placeholder="First name" value={registerForm.first_name} onChange={(e) => setRegisterForm({ ...registerForm, first_name: e.target.value })} />
          <input placeholder="Last name" value={registerForm.last_name} onChange={(e) => setRegisterForm({ ...registerForm, last_name: e.target.value })} />
          <input type="password" placeholder="Password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} />
          <button type="submit">Create account</button>
        </form>

        <form className="card" onSubmit={handleLogin}>
          <h2>Login</h2>
          <input placeholder="Username" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} />
          <input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
          <button type="submit">Get JWT</button>
        </form>
      </section>

      <section className="grid two-columns">
        <form className="card" onSubmit={handleCreateEvent}>
          <h2>Create event</h2>
          <input placeholder="Title" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
          <textarea placeholder="Description" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
          <select value={eventForm.category_id} onChange={(e) => setEventForm({ ...eventForm, category_id: e.target.value })}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input type="datetime-local" value={eventForm.start_date} onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })} />
          <input type="datetime-local" value={eventForm.end_date} onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })} />
          <input placeholder="Location" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
          <input type="number" placeholder="Capacity" value={eventForm.capacity} onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })} />
          <label className="checkbox-row">
            <input type="checkbox" checked={eventForm.is_public} onChange={(e) => setEventForm({ ...eventForm, is_public: e.target.checked })} />
            Public event
          </label>
          <button type="submit">Save event</button>
        </form>

        <div className="card">
          <h2>Events</h2>
          <div className="list">
            {events.length === 0 && <p>No events yet.</p>}
            {events.map((item) => (
              <article key={item.id} className="event-item">
                <div className="event-head">
                  <strong>{item.title}</strong>
                  <span>{item.category?.name || 'Uncategorized'}</span>
                </div>
                <p>{item.description || 'No description provided.'}</p>
                <ul>
                  <li><strong>Location:</strong> {item.location}</li>
                  <li><strong>Start:</strong> {item.start_date}</li>
                  <li><strong>End:</strong> {item.end_date || '—'}</li>
                  <li><strong>Capacity:</strong> {item.capacity}</li>
                  <li><strong>Public:</strong> {item.is_public ? 'Yes' : 'No'}</li>
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
