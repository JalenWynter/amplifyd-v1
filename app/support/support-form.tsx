"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { createTicket } from "@/app/actions/support"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"

const formSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.enum(["General", "Order Dispute", "Technical", "Web Site Issue"]),
  description: z.string().min(20, "Description must be at least 20 characters").max(1000, "Description too long"),
})

export function SupportForm() {
  const [isPending, startTransition] = useTransition()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      category: "General",
      description: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("subject", values.subject)
      formData.append("category", values.category)
      formData.append("description", values.description)

      const result = await createTicket(formData)

      if (result.error) {
        if (typeof result.error === "string") {
            toast.error(result.error)
        } else {
            toast.error("Please check the form for errors")
        }
      } else {
        toast.success("Ticket Created Successfully")
        form.reset()
      }
    })
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief summary of issue" {...field} className="bg-black/20 border-white/10 text-white placeholder:text-white/30" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/20 border-white/10 text-white">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                      <SelectItem value="General">General Inquiry</SelectItem>
                      <SelectItem value="Order Dispute">Order Dispute</SelectItem>
                      <SelectItem value="Technical">Technical Issue</SelectItem>
                      <SelectItem value="Web Site Issue">Web Site Issue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Description</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Textarea 
                        placeholder="Please provide details..." 
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/30 min-h-[120px] resize-none pr-4 pb-6" 
                        {...field} 
                      />
                      <div className="absolute bottom-2 right-2 text-xs text-white/40">
                        {field.value.length}/1000
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending} className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">
               {isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
