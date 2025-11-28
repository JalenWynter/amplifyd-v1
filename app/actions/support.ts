"use server"

import { createClient } from "@/utils/supabase/server"
import { z } from "zod"
import { revalidatePath } from "next/cache"

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.enum(["General", "Order Dispute", "Technical", "Web Site Issue"]),
  description: z.string().min(20, "Description must be at least 20 characters"),
})

export async function createTicket(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a ticket" }
  }

  const rawData = {
    subject: formData.get("subject"),
    category: formData.get("category"),
    description: formData.get("description"),
  }

  const validatedFields = ticketSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from("tickets")
    .insert({
      user_id: user.id,
      subject: validatedFields.data.subject,
      category: validatedFields.data.category,
      description: validatedFields.data.description,
      status: "Open",
    })

  if (error) {
    console.error("Error creating ticket:", error)
    return { error: "Failed to create ticket" }
  }

  revalidatePath("/support")
  return { success: true }
}
