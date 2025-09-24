import { CheckSquare } from 'lucide-react'

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                <CheckSquare className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">TaskMate</span>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
