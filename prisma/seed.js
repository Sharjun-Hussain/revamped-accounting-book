// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'mrjoon005@gmail.com'; // <--- PUT YOUR EMAIL HERE
    const adminPassword = '12345678'; // <--- PUT YOUR PASSWORD HERE

    // 1. Hash the password (security requirement)
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 2. Create or Update the Super Admin User
    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {}, // If user exists, do nothing
        create: {
            email: adminEmail,
            name: 'Super Admin',
            password: hashedPassword, // Store the encrypted version
            role: 'superadmin',       // Override the default 'user'
            status: 'approved',       // Override the default 'pending'
            image: '',
            emailVerified: new Date(),
        },
    });

    console.log('✅ Super Admin created:', user);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });