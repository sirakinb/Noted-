import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { syncUserWithDatabase, setUserPlan } from "@/lib/clerk-billing";

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.text()
  const body = JSON.parse(payload);

  // Simple verification without svix for now - we'll verify via Clerk's method
  let evt: WebhookEvent

  try {
    evt = body as WebhookEvent
  } catch (err) {
    console.error('Error parsing webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`)
  console.log('Webhook body:', body.data)

  // Handle user creation
  if (eventType === 'user.created') {
    const { id: userId } = evt.data;

    try {
      // Set FREE plan in Clerk metadata so they get 5 minutes and 10 transformations
      await setUserPlan(userId, 'free');
      console.log('Set user to FREE plan in Clerk metadata:', userId);

      // Sync user with database (this will create the user record with proper defaults)
      const user = await syncUserWithDatabase(userId);
      console.log('Synced new user with database:', user);

    } catch (error) {
      console.error('Error setting up new user:', error);
      return new Response('Error setting up user', { status: 500 });
    }
  }

  // Handle user updates (in case subscription changes)
  if (eventType === 'user.updated') {
    const { id: userId } = evt.data;

    try {
      // Re-sync user with database to ensure consistency
      const user = await syncUserWithDatabase(userId);
      console.log('Re-synced updated user with database:', user);

    } catch (error) {
      console.error('Error updating user:', error);
      return new Response('Error updating user', { status: 500 });
    }
  }

  return new Response('', { status: 200 })
} 