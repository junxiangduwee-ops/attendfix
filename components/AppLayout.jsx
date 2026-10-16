import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main-content">
        <div className="page-body">{children}</div>
      </div>
    </div>
  )
}
