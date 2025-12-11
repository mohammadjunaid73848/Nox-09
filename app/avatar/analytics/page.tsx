"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { ArrowLeft, TrendingUp, Users, Download } from "lucide-react"

interface AvatarAnalytics {
  id: string
  name: string
  description: string
  logo_url: string
  download_count: number
  created_at: string
  updated_at: string
  unique_users: number
  daily_downloads: Array<{ date: string; count: number }>
}

export default function AvatarAnalyticsPage() {
  const [avatars, setAvatars] = useState<AvatarAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        setUser(currentUser)

        if (!currentUser) {
          setLoading(false)
          return
        }

        // Fetch user's created avatars
        const { data: createdAvatars } = await supabase
          .from("avatars")
          .select("*")
          .eq("creator_id", currentUser.id)
          .order("created_at", { ascending: false })

        if (createdAvatars && createdAvatars.length > 0) {
          // Fetch analytics for each avatar
          const analyticsData = await Promise.all(
            createdAvatars.map(async (avatar) => {
              // Get unique users who downloaded
              const { data: downloads } = await supabase
                .from("avatar_downloads")
                .select("user_id, downloaded_at")
                .eq("avatar_id", avatar.id)

              const uniqueUsers = new Set(downloads?.map((d) => d.user_id) || []).size

              // Calculate daily downloads for the last 30 days
              const dailyDownloads: { [key: string]: number } = {}
              const now = new Date()
              for (let i = 0; i < 30; i++) {
                const date = new Date(now)
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split("T")[0]
                dailyDownloads[dateStr] = 0
              }

              downloads?.forEach((d) => {
                const dateStr = new Date(d.downloaded_at).toISOString().split("T")[0]
                if (dateStr in dailyDownloads) {
                  dailyDownloads[dateStr]++
                }
              })

              const dailyData = Object.entries(dailyDownloads)
                .map(([date, count]) => ({ date, count }))
                .reverse()

              return {
                ...avatar,
                unique_users: uniqueUsers,
                daily_downloads: dailyData,
              }
            }),
          )

          setAvatars(analyticsData)
          if (analyticsData.length > 0) {
            setSelectedAvatarId(analyticsData[0].id)
          }
        }
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [supabase])

  const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId)

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading analytics...</div>
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>Please sign in to view analytics</p>
        <Link href="/auth/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  if (avatars.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/avatar">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Avatars
            </Button>
          </Link>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't created any avatars yet</p>
            <Link href="/publish/avatars">
              <Button>Create Your First Avatar</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <Link href="/avatar">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Avatars
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Avatar Analytics</h1>
          <p className="text-muted-foreground">Track the performance of your avatars</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatarId(avatar.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedAvatarId === avatar.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <img
                src={avatar.logo_url || "/placeholder.svg"}
                alt={avatar.name}
                className="w-12 h-12 rounded-full mb-2 object-cover"
              />
              <h3 className="font-semibold text-sm truncate">{avatar.name}</h3>
              <p className="text-xs text-muted-foreground">{avatar.download_count} downloads</p>
            </button>
          ))}
        </div>

        {selectedAvatar && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedAvatar.download_count}</div>
                  <p className="text-xs text-muted-foreground">Total times downloaded</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedAvatar.unique_users}</div>
                  <p className="text-xs text-muted-foreground">Users who installed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Created</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{new Date(selectedAvatar.created_at).toLocaleDateString()}</div>
                  <p className="text-xs text-muted-foreground">Creation date</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Downloads Over Time</CardTitle>
                <CardDescription>Last 30 days of download activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedAvatar.daily_downloads}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }
                    />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [value, "Downloads"]}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{selectedAvatar.name}</CardTitle>
                <CardDescription>{selectedAvatar.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Avatar Details</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Created:</span>{" "}
                      {new Date(selectedAvatar.created_at).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Last Updated:</span>{" "}
                      {new Date(selectedAvatar.updated_at).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <span className="text-green-600">Public</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/publish/avatars?edit=${selectedAvatar.id}`}>
                    <Button variant="outline">Edit Avatar</Button>
                  </Link>
                  <Button variant="outline">Share</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
