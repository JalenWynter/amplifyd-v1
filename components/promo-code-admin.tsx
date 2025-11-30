"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, getPromoCodeUsage, type PromoCode } from "@/app/actions/promo-codes"
import { Plus, Trash2, Edit, Eye, Calendar, Users, Tag as TagIcon, ToggleLeft, ToggleRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"

export function PromoCodeAdmin() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null)
  const [usage, setUsage] = useState<any[]>([])

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    max_uses: "",
    valid_until: "",
  })

  useEffect(() => {
    loadPromoCodes()
  }, [])

  const loadPromoCodes = async () => {
    setLoading(true)
    try {
      const codes = await getPromoCodes()
      setPromoCodes(codes)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load promo codes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.code || !formData.discount_value || !formData.valid_until) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await createPromoCode({
        code: formData.code,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.valid_until,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Promo code created successfully",
        })
        setIsCreateOpen(false)
        setFormData({
          code: "",
          discount_type: "percentage",
          discount_value: "",
          max_uses: "",
          valid_until: "",
        })
        loadPromoCodes()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create promo code",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create promo code",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (code: PromoCode) => {
    try {
      const result = await updatePromoCode(code.id, {
        is_active: !code.is_active,
      })
      if (result.success) {
        loadPromoCodes()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update promo code",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return

    try {
      const result = await deletePromoCode(id)
      if (result.success) {
        toast({
          title: "Success",
          description: "Promo code deleted successfully",
        })
        loadPromoCodes()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete promo code",
        variant: "destructive",
      })
    }
  }

  const handleViewUsage = async (code: PromoCode) => {
    setSelectedCode(code)
    try {
      const usageData = await getPromoCodeUsage(code.id)
      setUsage(usageData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load usage data",
        variant: "destructive",
      })
    }
  }

  const isExpired = (code: PromoCode) => {
    return new Date(code.expires_at) < new Date()
  }

  const isMaxUsesReached = (code: PromoCode) => {
    return code.max_uses !== null && code.current_uses >= code.max_uses
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              Promo Code Management
            </CardTitle>
            <CardDescription className="text-white/60">
              Create and manage discount codes
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Promo Code
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Promo Code</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Create a discount code for your customers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-white">Code</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER2024"
                    className="bg-slate-800 border-slate-700 text-white uppercase"
                  />
                </div>
                <div>
                  <Label className="text-white">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">
                    Discount Value {formData.discount_type === "percentage" ? "(%)" : "($)"}
                  </Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === "percentage" ? "10" : "5.00"}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Max Uses (leave empty for unlimited)</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="100"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Expiration Date</Label>
                  <Input
                    type="datetime-local"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <Button onClick={handleCreate} className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED]">
                  Create Promo Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-white/50 text-center py-8">Loading promo codes...</p>
        ) : promoCodes.length === 0 ? (
          <p className="text-white/50 text-center py-8">No promo codes found</p>
        ) : (
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="text-white">Code</TableHead>
                  <TableHead className="text-white">Discount</TableHead>
                  <TableHead className="text-white">Usage</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Expires</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((code) => {
                  const expired = isExpired(code)
                  const maxReached = isMaxUsesReached(code)
                  const isActive = code.is_active && !expired && !maxReached
                  
                  return (
                    <TableRow key={code.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium text-white">
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className={
                            isActive
                              ? "bg-[#8B5CF6] text-white"
                              : "bg-gray-500/20 text-gray-400"
                          }
                        >
                          {code.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/80">
                        {code.discount_type === "percentage"
                          ? `${code.discount_value}%`
                          : `$${code.discount_value}`}
                        <span className="text-white/50 text-xs ml-1">
                          ({code.discount_type === "percentage" ? "%" : "fixed"})
                        </span>
                      </TableCell>
                      <TableCell className="text-white/80">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-white/50" />
                          <span>{code.current_uses} / {code.max_uses || "∞"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50">
                            Expired
                          </Badge>
                        ) : maxReached ? (
                          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                            Max Uses
                          </Badge>
                        ) : code.is_active ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-500/20 text-gray-400">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-white/80">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-white/50" />
                          <span>{new Date(code.expires_at).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(code)}
                            className="text-white/70 hover:text-white"
                            title={code.is_active ? "Deactivate" : "Activate"}
                          >
                            {code.is_active ? (
                              <ToggleRight className="h-4 w-4 text-green-400" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(code.id)}
                            className="text-red-400/70 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Usage Dialog */}
        {selectedCode && (
          <Dialog open={!!selectedCode} onOpenChange={() => setSelectedCode(null)}>
            <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Usage for {selectedCode.code}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Track all uses of this promo code
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 max-h-96 overflow-y-auto">
                {usage.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No usage recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {usage.map((use) => (
                      <div
                        key={use.id}
                        className="flex items-center justify-between p-3 rounded border border-white/10 bg-white/5"
                      >
                        <div>
                          <p className="text-white text-sm">
                            Used on {new Date(use.used_at).toLocaleString()}
                          </p>
                          {use.order_id && (
                            <p className="text-white/50 text-xs">Order: {use.order_id}</p>
                          )}
                        </div>
                        <Badge className="bg-green-500/20 text-green-400">
                          ${use.discount_amount.toFixed(2)} discount
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

