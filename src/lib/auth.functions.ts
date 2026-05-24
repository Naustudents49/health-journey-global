import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const signUpUser = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().min(2),
        role: z.enum(["doctor", "patient"]),
        phone: z.string().optional(),
        city: z.string().optional(),
      })
      .parse(data)
  )
  .handler(async ({ data }) => {
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Sign up failed");
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      full_name: data.fullName,
      phone: data.phone ?? null,
      city: data.city ?? null,
    });

    if (profileError) {
      throw new Error(profileError.message);
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: data.role,
    });

    if (roleError) {
      throw new Error(roleError.message);
    }

    // Create role-specific details
    if (data.role === "doctor") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (profile) {
        await supabaseAdmin.from("doctor_details").insert({
          profile_id: profile.id,
          specialty: "General",
          is_verified: false,
          verification_status: "pending",
        });
      }
    } else {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (profile) {
        await supabaseAdmin.from("patient_details").insert({
          profile_id: profile.id,
        });
      }
    }

    return { success: true, userId };
  });

export const getUserProfile = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ userId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", data.userId)
      .single();

    if (error) throw new Error(error.message);
    return { profile };
  });
