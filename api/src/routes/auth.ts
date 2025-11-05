import { Router } from 'express';
// import { PrismaClient } from '../../../generated/prisma/index.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/sync-user', async (req, res) => {
  try {
    const { auth0Sub, email, firstName, lastName } = req.body;

    console.log('User login - Auth0 Username:', auth0Sub);
    console.log('User details:', { email, firstName, lastName });

    if (!auth0Sub || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields: auth0Sub, firstName, and lastName are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { auth0_sub: auth0Sub }
    });

    if (existingUser) {
      return res.status(200).json({
        user: existingUser,
        message: 'User already exists'
      });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        auth0_sub: auth0Sub,
        email: email || null,
        first_name: firstName,
        last_name: lastName
      }
    });

    return res.status(201).json({
      user: newUser,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error syncing user:', error);
    return res.status(500).json({
      error: 'Failed to sync user'
    });
  }
});

export default router;
