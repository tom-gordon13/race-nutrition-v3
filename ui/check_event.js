const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEvent() {
  const eventId = 'db0d1c4a-fe82-4bae-9cea-8159330efffc';
  
  console.log('Checking for event:', eventId);
  
  const event = await prisma.event.findUnique({
    where: { id: eventId }
  });
  
  if (event) {
    console.log('Event found!');
    console.log('Event details:', JSON.stringify(event, null, 2));
  } else {
    console.log('Event NOT found in database');
    
    // Show all events
    const allEvents = await prisma.event.findMany({
      take: 5,
      orderBy: { created_at: 'desc' }
    });
    
    console.log('\nRecent events in database:');
    allEvents.forEach(e => {
      console.log(`  ID: ${e.id}, Type: ${e.type}, Private: ${e.private}`);
    });
  }
  
  await prisma.$disconnect();
}

checkEvent().catch(console.error);
