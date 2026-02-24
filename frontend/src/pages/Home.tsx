import { useAuth } from '../contexts/AuthContext'

export const Home = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Embla</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-gray-700">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex h-96 items-center justify-center rounded-lg border-4 border-dashed border-gray-200">
            <div className="text-center">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">Welcome to Embla</h2>
              <p className="text-gray-600">You are logged in as {user?.name ?? user?.email}</p>
              <p className="mt-2 text-gray-500">
                This is your dashboard. More features coming soon.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
