import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen dev-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* iOS-style gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  )
}
