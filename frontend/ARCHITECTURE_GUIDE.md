# 🎓 ResolveIQ Frontend — Beginner-Friendly Architecture & Code Guide

Welcome to the frontend architecture guide for **ResolveIQ AI**!
This guide explains **how every piece of the React application works** in simple, beginner-friendly terms.

---

## 🏗️ 1. Project Folder Structure

Everything in the `frontend/` folder follows standard, clean React conventions:

```text
frontend/
├── src/
│   ├── api/
│   │   └── client.js         ← Axios setup: connects React to FastAPI backend
│   │
│   ├── context/
│   │   └── AuthContext.jsx   ← Global user state (logged-in user, login, logout)
│   │
│   ├── components/           ← Reusable UI pieces (Lego blocks)
│   │   ├── Badge.jsx            - Status pills (open, resolved, closed)
│   │   ├── CitationsView.jsx    - Renders referenced PDF sources & pages
│   │   ├── MarkdownRenderer.jsx - Formats AI bullet points, bolding & tags
│   │   ├── Modal.jsx            - Base scrollable dialog box
│   │   ├── NewTicketModal.jsx   - Ticket creation + live AI suggestion
│   │   ├── Sidebar.jsx          - Left navigation menu
│   │   └── StatCard.jsx         - Metric cards on the dashboard
│   │
│   ├── pages/                ← Full screen views
│   │   ├── Dashboard.jsx        - Overview metrics & recent tickets
│   │   ├── Tickets.jsx          - Search, filter & list all tickets
│   │   ├── TicketDetail.jsx     - Ticket view + "Resolve with AI"
│   │   ├── Documents.jsx        - PDF Drag-and-drop Knowledge Base
│   │   ├── AskAI.jsx            - Interactive AI assistant playground
│   │   ├── Settings.jsx         - Update personal details & password
│   │   ├── Login.jsx            - Login screen
│   │   └── Register.jsx         - Account creation screen
│   │
│   ├── App.jsx               ← Routes setup & Protected route wrapper
│   ├── main.jsx              ← React root mount
│   └── index.css             ← Tailwind CSS directives & dark theme
```

---

## 🔐 2. How Authentication Works (Simple Explanation)

### The Cookie Strategy
1. When you log in (`POST /auth/login`), FastAPI sends two cookies to the browser:
   * `access_token` (Short life: 15 minutes)
   * `refresh_token` (Long life: 30 days)
2. These cookies are **`httpOnly`** (JavaScript cannot read them directly, protecting against hackers/XSS).
3. In `src/api/client.js`, we set:
   ```javascript
   withCredentials: true
   ```
   This tells the browser: *"Whenever you make an API request to `localhost:8000`, attach these cookies automatically."*

### What happens after 15 minutes? (Silent Token Refresh)
Inside `src/api/client.js`:
* If an API request returns `401 Unauthorized` (access token expired), our **Axios Interceptor** automatically calls `POST /auth/refresh` in the background.
* The backend rotates the refresh token and gives a fresh access token.
* Then Axios automatically retries the user's original request!
* **Result for the user:** The user never gets kicked out or forced to re-login while actively working.

---

## 🧩 3. Key Components Explained Simply

### 1. `AuthContext.jsx` (Global State)
* Instead of passing `user` props down 10 levels of components, `AuthContext` makes the logged-in user accessible anywhere using:
  ```javascript
  const { user, isAgent, logout } = useAuth();
  ```
* When the app starts up, `useEffect` calls `GET /auth/me` to check if a valid session exists.

### 2. `MarkdownRenderer.jsx` (Making AI text look pretty)
* When Groq LLM returns text, it contains markdown like `**Predictive AI**`, `- bullet points`, and citations like `【03】`.
* Instead of showing raw markdown symbols, `MarkdownRenderer` splits the text by line:
  * Lines starting with `- ` become `<li>` bullet points.
  * Words wrapped in `**text**` become bold `<strong>`.
  * `【03】` becomes an interactive citation badge `[Ref 03]`.

### 3. `CitationsView.jsx` (Grounded Sources)
* Located directly below the AI answer on the ticket page.
* Parses context chunks returned by the backend:
  * Displays source document name (e.g. `Rag_book.pdf`).
  * Displays page badge (e.g. `Page 4`).
  * Shows a clean snippet quote with an "Inspect Excerpt" button to inspect the full context chunk.

### 4. `NewTicketModal.jsx` (Auto-Deflection & Auto-Pilot)
* **Live Suggestion (Deflection):** When user types > 15 characters into the description, it waits 700ms (`setTimeout` debounce) and calls `/ask/`. If a match is found in the docs, it shows an instant solution. If the user clicks *"This Solved My Issue!"*, ticket creation is avoided!
* **Auto-Pilot Checkbox:** If checked, creating a ticket calls `/tickets/` and immediately calls `/resolve`, redirecting user directly to the solved ticket.

---

## 🛠️ 4. Common React Hooks Used In This Project

| Hook | Where Used | Why We Use It |
|---|---|---|
| `useState` | All components | Stores component data (e.g., input values, loading spinners, ticket lists) |
| `useEffect` | Pages & Modals | Runs code when component mounts (e.g., fetch tickets from backend on page load) |
| `useContext` | `useAuth()` | Accesses logged-in user profile from anywhere in the app |
| `useNavigate` | `react-router-dom` | Changes page programmatically (e.g., `navigate('/tickets')` after submit) |
| `useParams` | `TicketDetail.jsx` | Grabs the ticket ID from URL (`/tickets/:id`) |

---

## 💡 How to Explain this Project in an Interview / Showcase

1. **Architecture:** *"ResolveIQ is an autonomous AI support platform with a FastAPI backend and a React/Tailwind frontend. Data is stored in PostgreSQL with pgvector for semantic search, using Groq for fast LLM inference."*
2. **Security:** *"We implemented cookie-based authentication with Refresh Token Rotation, meaning tokens are single-use and rotated on every refresh, completely handled seamlessly via Axios interceptors."*
3. **Productivity:** *"We built Ticket Deflection at creation time to suggest instant answers from indexed PDFs before submission, and Support Agent response templating for 1-click email replies."*

