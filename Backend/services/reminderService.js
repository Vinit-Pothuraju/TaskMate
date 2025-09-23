import Reminder from '../models/Reminder.js';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

class ReminderService {
  constructor() {
    this.emailTransporter = null;
    this.scheduledJobs = new Map();
    this.init();
  }

  async init() {
    // Initialize email transporter if configured
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }

    // Start reminder processing job
    this.startReminderProcessor();
  }

  startReminderProcessor() {
    // Check for due reminders every minute
    cron.schedule('* * * * *', async () => {
      await this.processDueReminders();
    });

    console.log('Reminder processor started');
  }

  async processDueReminders() {
    try {
      const now = new Date();
      
      // Find reminders that are due and not yet delivered
      const dueReminders = await Reminder.find({
        when: { $lte: now },
        delivered: false,
        active: true
      }).populate('userId', 'name email');

      for (const reminder of dueReminders) {
        await this.deliverReminder(reminder);
        
        // Handle recurring reminders
        if (reminder.recurring && reminder.recurring.enabled) {
          await this.scheduleNextRecurrence(reminder);
        }
      }
    } catch (error) {
      console.error('Error processing due reminders:', error);
    }
  }

  async deliverReminder(reminder) {
    try {
      console.log(`Delivering reminder: ${reminder.title} to user ${reminder.userId.name}`);

      // Send email if configured
      if (this.emailTransporter && reminder.userId.email) {
        await this.emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: reminder.userId.email,
          subject: `Reminder: ${reminder.title}`,
          html: `
            <h2>TaskMate Reminder</h2>
            <h3>${reminder.title}</h3>
            ${reminder.message ? `<p>${reminder.message}</p>` : ''}
            <p><em>Scheduled for: ${reminder.when.toLocaleString()}</em></p>
          `
        });
      }

      // Mark as delivered
      await Reminder.findByIdAndUpdate(reminder._id, {
        delivered: true,
        deliveredAt: new Date()
      });

      console.log(`Reminder delivered successfully: ${reminder._id}`);
    } catch (error) {
      console.error(`Error delivering reminder ${reminder._id}:`, error);
    }
  }

  async scheduleNextRecurrence(reminder) {
    try {
      let nextDate = new Date(reminder.when);

      switch (reminder.recurring.pattern) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + 1);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        default:
          // Handle custom cron patterns if needed
          return;
      }

      // Check if we should continue recurring
      if (reminder.recurring.endDate && nextDate > reminder.recurring.endDate) {
        return;
      }

      // Create new reminder instance
      const newReminder = new Reminder({
        userId: reminder.userId,
        title: reminder.title,
        message: reminder.message,
        when: nextDate,
        recurring: reminder.recurring,
        delivered: false,
        active: true
      });

      await newReminder.save();
    } catch (error) {
      console.error(`Error scheduling recurring reminder ${reminder._id}:`, error);
    }
  }

  // Cleanup old delivered reminders (call this periodically)
  async cleanupOldReminders(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Reminder.deleteMany({
        delivered: true,
        deliveredAt: { $lt: cutoffDate },
        'recurring.enabled': { $ne: true }
      });

      console.log(`Cleaned up ${result.deletedCount} old reminders`);
    } catch (error) {
      console.error('Error cleaning up old reminders:', error);
    }
  }
}

export default new ReminderService();
