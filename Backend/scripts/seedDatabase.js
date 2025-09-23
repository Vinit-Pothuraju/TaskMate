import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Task from '../src/models/Task.js';
import FocusSession from '../src/models/FocusSession.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Task.deleteMany({}),
      FocusSession.deleteMany({})
    ]);

    // Create sample user
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      passwordHash: 'password123' // Will be hashed by pre-save middleware
    });
    await user.save();

    // Create sample tasks
    const tasks = await Task.insertMany([
      {
        userId: user._id,
        title: 'Complete project proposal',
        description: 'Write and review the Q4 project proposal',
        category: 'Work',
        priority: 5,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tags: ['important', 'deadline']
      },
      {
        userId: user._id,
        title: 'Review code changes',
        category: 'Development',
        priority: 3,
        completed: true
      },
      {
        userId: user._id,
        title: 'Plan weekend trip',
        category: 'Personal',
        priority: 2,
        tags: ['travel', 'personal']
      }
    ]);

    // Create sample focus sessions
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    await FocusSession.insertMany([
      {
        userId: user._id,
        taskId: tasks[0]._id,
        sessionType: 'work',
        startAt: yesterday,
        endAt: new Date(yesterday.getTime() + 25 * 60 * 1000),
        durationSec: 1500
      },
      {
        userId: user._id,
        taskId: tasks[1]._id,
        sessionType: 'work',
        startAt: new Date(yesterday.getTime() + 30 * 60 * 1000),
        endAt: new Date(yesterday.getTime() + 55 * 60 * 1000),
        durationSec: 1500
      }
    ]);

    console.log('Database seeded successfully!');
    console.log(`Sample user: ${user.email} / password123`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
  }
};

seedData();