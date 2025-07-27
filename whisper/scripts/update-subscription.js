const { PrismaClient } = require('../lib/generated/prisma');

const prisma = new PrismaClient();

async function updateSubscription() {
  try {
    // You'll need to replace this with your actual Clerk user ID
    // You can find this in your browser's developer tools or from the app
    const userId = 'user_2YOUR_USER_ID_HERE'; // Replace with your actual user ID
    
    console.log('Updating subscription for user:', userId);
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'starter',
        subscriptionStatus: 'active',
        subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });
    
    console.log('Subscription updated successfully:', updatedUser);
  } catch (error) {
    console.error('Error updating subscription:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSubscription(); 