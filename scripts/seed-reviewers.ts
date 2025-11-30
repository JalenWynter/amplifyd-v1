/**
 * Seed Script: Create Test Reviewers in Supabase
 * 
 * Usage: npx tsx scripts/seed-reviewers.ts
 * 
 * Requirements:
 * - SUPABASE_URL in .env.local
 * - SUPABASE_SERVICE_ROLE_KEY in .env.local (for bypassing RLS)
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  console.error('\n💡 Add SUPABASE_SERVICE_ROLE_KEY to .env.local (get it from Supabase Dashboard → Settings → API)')
  process.exit(1)
}

// Create admin client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Mock reviewer data
const reviewers = [
  {
    email: 'nova.quinn@amplifyd.test',
    password: 'TestPassword123!',
    full_name: 'Nova Quinn',
    bio: 'Nova is a Grammy-nominated mix engineer specializing in vocal clarity and low-end punch for modern trap records. With over 10 years of experience working with billboard charting artists, she brings major label quality to independent releases.',
    tags: ['Trap', 'Mixing', 'Vocals'],
    verified: true,
    rating: 4.9,
    review_count: 312,
    pricing_packages: [
      {
        id: 'pkg-1',
        title: 'Quick Feedback',
        price: 95,
        description: '48-hour turnaround with actionable notes on your mix balance and vocal processing.',
        deliveryTime: '2 days',
        revisions: 0,
        features: ['Written PDF Report', 'Mix Balance Check', 'Vocal Chain Advice', 'Actionable Next Steps'],
      },
      {
        id: 'pkg-2',
        title: 'Full Mix Review',
        price: 195,
        description: 'Detailed mix critique with timestamps, reference track comparisons, and specific plugin recommendations.',
        deliveryTime: '3 days',
        revisions: 1,
        features: ['Detailed Timestamped Notes', 'Reference Comparison', 'Plugin Preset Recommendations', '1 Follow-up Email'],
      },
      {
        id: 'pkg-3',
        title: 'Premium Session',
        price: 395,
        description: 'Live 60-minute Zoom session where we open your project (or stems) and fix issues in real-time.',
        deliveryTime: '5 days',
        revisions: 2,
        features: ['60-min Live Video Call', 'Live Project/Stem Review', 'Custom Revision Plan', 'Recording of Session'],
      },
    ],
  },
  {
    email: 'atlas.reed@amplifyd.test',
    password: 'TestPassword123!',
    full_name: 'Atlas Reed',
    bio: 'Atlas brings festival-ready polish to melodic house and techno, focusing on energy flow and low-end translation. His masters have been played on the world\'s biggest stages.',
    tags: ['House', 'Sound Design', 'Mastering'],
    verified: true,
    rating: 4.8,
    review_count: 204,
    pricing_packages: [
      {
        id: 'pkg-4',
        title: 'Dancefloor Check',
        price: 110,
        description: 'Club reference check with tonal balance report to ensure your track hits hard on big systems.',
        deliveryTime: '2 days',
        revisions: 0,
        features: ['Low-End Analysis', 'Stereo Image Check', 'Loudness Report', 'Club Readiness Score'],
      },
      {
        id: 'pkg-5',
        title: 'Mastering Notes',
        price: 220,
        description: 'Comprehensive mastering critique with LUFS targets, dynamic range analysis, and EQ suggestions.',
        deliveryTime: '4 days',
        revisions: 1,
        features: ['Full Mastering Critique', 'Dynamic Range Analysis', 'EQ & Compression Tips', 'Streaming Platform Prep'],
      },
      {
        id: 'pkg-6',
        title: 'VIP Residency',
        price: 450,
        description: 'Monthly mentorship with shared project board to guide your EP or album to completion.',
        deliveryTime: '30 days',
        revisions: 4,
        features: ['4 Weekly Check-ins', 'Shared Trello/Notion Board', 'Unlimited Quick Questions', 'Final Master Polish'],
      },
    ],
  },
  {
    email: 'mara.sol@amplifyd.test',
    password: 'TestPassword123!',
    full_name: 'Mara Sol',
    bio: 'Mara mentors indie artists on storytelling, arrangement dynamics, and vocal production for sync placements. Her own songs have been featured in top Netflix series.',
    tags: ['Indie', 'Songwriting', 'Production'],
    verified: false,
    rating: 4.95,
    review_count: 158,
    pricing_packages: [
      {
        id: 'pkg-7',
        title: 'Lyric Audit',
        price: 80,
        description: 'Narrative-focused review checking for prosody, rhyme schemes, and emotional impact.',
        deliveryTime: '3 days',
        revisions: 0,
        features: ['Line-by-Line Lyric Analysis', 'Rhyme Scheme Suggestions', 'Emotional Arc Check', 'Title Alternatives'],
      },
      {
        id: 'pkg-8',
        title: 'Production Deep Dive',
        price: 165,
        description: 'Arrangement critique with instrument balance tips to make your indie track sound expensive.',
        deliveryTime: '5 days',
        revisions: 1,
        features: ['Arrangement Structure Edit', 'Instrumentation Review', 'Vocal Production Tips', 'Sync Potential Rating'],
      },
      {
        id: 'pkg-9',
        title: 'Complete Blueprint',
        price: 320,
        description: 'Full roadmap covering songwriting, production, and release strategy for your single.',
        deliveryTime: '7 days',
        revisions: 2,
        features: ['Song & Production Review', 'Release Timeline Creation', 'Pitching Strategy', 'Asset Checklist'],
      },
    ],
  },
  {
    email: 'kairo.vega@amplifyd.test',
    password: 'TestPassword123!',
    full_name: 'Kairo Vega',
    bio: 'Kairo crafts high-impact EDM drops, ensuring low-end translation across arenas and streaming. He specializes in Dubstep, Future Bass, and Drum & Bass.',
    tags: ['EDM', 'Mastering', 'Sound Design'],
    verified: true,
    rating: 4.87,
    review_count: 189,
    pricing_packages: [
      {
        id: 'pkg-10',
        title: 'Drop Surgery',
        price: 120,
        description: 'Detailed low-end & transient report specifically for your drop to make it hit harder.',
        deliveryTime: '2 days',
        revisions: 0,
        features: ['Kick & Bass Phase Check', 'Transient Shaping Tips', 'Sidechain Analysis', 'Impact Assessment'],
      },
      {
        id: 'pkg-11',
        title: 'Headliner Master',
        price: 260,
        description: 'Mastering critique with limiter settings and LUFS targets for competitive loudness.',
        deliveryTime: '4 days',
        revisions: 1,
        features: ['Competitive Loudness targets', 'Limiter Settings Guide', 'Frequency Balance Report', 'Stem Mastering Tips'],
      },
      {
        id: 'pkg-12',
        title: 'Signature Session',
        price: 420,
        description: 'Live design session focusing on synth & FX balance to define your unique sound.',
        deliveryTime: '6 days',
        revisions: 2,
        features: ['90-min Live Sound Design', 'Serum/Vital Patch Reviews', 'FX Chain Breakdown', 'Custom Sample Pack'],
      },
    ],
  },
  {
    email: 'ivy.monroe@amplifyd.test',
    password: 'TestPassword123!',
    full_name: 'Ivy Monroe',
    bio: 'Ivy helps pop vocalists craft radio-ready stacks with pristine tuning and emotive delivery. She has vocal produced for top 40 artists.',
    tags: ['Pop', 'Songwriting', 'Vocal Production'],
    verified: false,
    rating: 4.93,
    review_count: 276,
    pricing_packages: [
      {
        id: 'pkg-13',
        title: 'Hook Audit',
        price: 105,
        description: 'Melodic & lyric feedback with harmony suggestions to make your chorus stuck in heads.',
        deliveryTime: '2 days',
        revisions: 0,
        features: ['Melody & Hook Analysis', 'Harmony Layering Ideas', 'Catchiness Score', 'Lyric Tweaks'],
      },
      {
        id: 'pkg-14',
        title: 'Vocal Stack Review',
        price: 215,
        description: 'Critique focusing on tuning, compression, and FX for a professional vocal sound.',
        deliveryTime: '4 days',
        revisions: 1,
        features: ['Tuning Accuracy Check', 'Compression Settings', 'Reverb/Delay Throw Ideas', 'De-essing Advice'],
      },
      {
        id: 'pkg-15',
        title: 'Full Release Plan',
        price: 360,
        description: 'Arrangement critique + marketing plan to launch your pop single effectively.',
        deliveryTime: '7 days',
        revisions: 2,
        features: ['Production Polish Notes', 'Social Media Content Plan', 'Spotify Pitching Guide', 'Image Consulting'],
      },
    ],
  },
  {
    email: 'sage.oconnor@amplifyd.test',
    password: 'TestPassword123!',
    full_name: 'Sage O\'Connor',
    bio: 'Sage brings cinematic depth to ambient and neo-classical projects with focus on width and spatial FX. Perfect for composers and experimental artists.',
    tags: ['Ambient', 'Mixing', 'Mastering'],
    verified: true,
    rating: 4.85,
    review_count: 142,
    pricing_packages: [
      {
        id: 'pkg-16',
        title: 'Texture Review',
        price: 85,
        description: 'Feedback on pads, drones, and spatial texture to add depth to your composition.',
        deliveryTime: '3 days',
        revisions: 0,
        features: ['Texture Layering Tips', 'Frequency Masking Check', 'Atmosphere Enhancement', 'Sample Selection'],
      },
      {
        id: 'pkg-17',
        title: 'Spatial Mix Audit',
        price: 175,
        description: '3D audio critique with reverb & delay insights for an immersive listening experience.',
        deliveryTime: '5 days',
        revisions: 1,
        features: ['Stereo Field Analysis', 'Reverb Depth Check', 'Binaural Processing Tips', 'Panning Strategy'],
      },
      {
        id: 'pkg-18',
        title: 'Complete Atmos Pass',
        price: 330,
        description: 'Full review with Dolby Atmos prep checklist and object placement suggestions.',
        deliveryTime: '8 days',
        revisions: 2,
        features: ['Dolby Atmos Readiness', 'Object Placement Ideas', 'Bed Track Balance', 'Immersive Master Check'],
      },
    ],
  },
]

async function seedReviewers() {
  console.log('🌱 Starting reviewer seed...\n')

  let created = 0
  let updated = 0
  let errors = 0

  for (const reviewer of reviewers) {
    try {
      // Step 1: Create or get auth user
      let userId: string

      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users.find((u) => u.email === reviewer.email)

      if (existingUser) {
        userId = existingUser.id
        console.log(`✓ User exists: ${reviewer.email}`)
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: reviewer.email,
          password: reviewer.password,
          email_confirm: true, // Auto-confirm for testing
        })

        if (createError) {
          console.error(`❌ Failed to create user ${reviewer.email}:`, createError.message)
          errors++
          continue
        }

        userId = newUser.user.id
        console.log(`✓ Created user: ${reviewer.email}`)
        created++
      }

      // Step 2: Update profile with reviewer data
      // Use UPDATE instead of UPSERT to avoid trigger conflicts on new records
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()

      const profileData: any = {
        id: userId,
        email: reviewer.email,
        role: 'reviewer',
        full_name: reviewer.full_name,
        bio: reviewer.bio,
        tags: reviewer.tags,
        verified: reviewer.verified,
        rating: reviewer.rating,
        review_count: reviewer.review_count,
        pricing_packages: reviewer.pricing_packages,
        avatar_url: `/placeholder-user.jpg`,
      }

      let profileError
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId)
        profileError = error
      } else {
        // Insert new profile (trigger will create basic one, so this should rarely happen)
        const { error } = await supabase
          .from('profiles')
          .insert(profileData)
        profileError = error
      }

      if (profileError) {
        console.error(`❌ Failed to update profile for ${reviewer.email}:`, profileError.message)
        errors++
        continue
      }

      console.log(`✓ Updated profile: ${reviewer.full_name}`)
      updated++
    } catch (error: any) {
      console.error(`❌ Error processing ${reviewer.email}:`, error.message)
      errors++
    }
  }

  console.log('\n📊 Summary:')
  console.log(`   Created: ${created} users`)
  console.log(`   Updated: ${updated} profiles`)
  console.log(`   Errors: ${errors}`)
  console.log('\n✅ Seed complete!')
}

// Run the seed
seedReviewers().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

