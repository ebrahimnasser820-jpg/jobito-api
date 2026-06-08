const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: 'Ahmedhabashy898@gmail.com',
          mode: 'insensitive'
        }
      }
    });
    
    if (user) {
      console.log('✅ User exists in DB:', user.email, 'Role:', user.role);
    } else {
      console.log('❌ User does NOT exist in DB.');
    }
  } catch (error) {
    console.error('Error querying DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
