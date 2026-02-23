import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Name:</strong> {user?.name || 'Not set'}</p>
          <p><strong>ID:</strong> {user?.id}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-500">No recent activity.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Edit Profile
          </button>
          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Change Password
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
