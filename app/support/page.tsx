import { createClient } from "@/utils/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { SupportForm } from "./support-form"
import { NavbarAuth } from "@/components/navbar-auth"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function SupportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  let tickets: any[] = []
  
  const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  tickets = data || []
  
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
       <header className="border-b border-white/10 bg-[#0A0A0A]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="text-xl font-bold text-white">Amplifyd Support</Link>
          <div className="flex items-center gap-4">
            <NavbarAuth isAuthenticated={!!user} />
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
            {/* Left Column */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Submit a Ticket</h1>
                    <p className="text-white/60">
                        Having issues? Fill out the form below.
                    </p>
                </div>
                <SupportForm />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Ticket History</h2>
                    <p className="text-white/60">View the status of your recent requests.</p>
                </div>
                
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl h-[600px]">
                    <CardContent className="p-0 h-full">
                        <ScrollArea className="h-full p-6">
                            {tickets.length > 0 ? (
                                <div className="space-y-4">
                                    {tickets.map((ticket) => (
                                        <div key={ticket.id} className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                                            <div className="flex items-center justify-between mb-3">
                                                <Badge variant="outline" className={`
                                                    ${ticket.status === 'Resolved' 
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}
                                                `}>
                                                    {ticket.status}
                                                </Badge>
                                                <span className="text-xs text-white/40">
                                                    {new Date(ticket.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-white mb-1">{ticket.subject}</h3>
                                            <p className="text-sm text-white/60 line-clamp-2 mb-3">{ticket.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-white/40">
                                                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/5">
                                                    {ticket.category}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center text-center text-white/40 space-y-4">
                                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p>No tickets found.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
    </div>
  )
}
