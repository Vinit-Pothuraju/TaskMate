import cron from 'node-cron';
import User from '../models/User.js';
import { generateSuggestions } from '../controllers/aiController.js';

class DailyAISuggestionsJob {
  start() {
    // Run every day at 6:00 AM
    cron.schedule('0 6 * * *', async () => {
      console.log('Starting daily AI suggestions generation...');
      await this.generateDailySuggestions();
    }, {
      timezone: 'UTC'
    });

    console.log('Daily AI suggestions job scheduled');
  }

  async generateDailySuggestions() {
    try {
      // Get all active users (those who logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const activeUsers = await User.find({
        lastActive: { $gte: thirtyDaysAgo }
      }).select('_id');

      console.log(`Generating suggestions for ${activeUsers.length} active users`);

      // Generate suggestions for each user
      const promises = activeUsers.map(async (user) => {
        try {
          await generateSuggestions(user._id);
          console.log(`Generated suggestions for user: ${user._id}`);
        } catch (error) {
          console.error(`Error generating suggestions for user ${user._id}:`, error);
        }
      });

      await Promise.all(promises);
      console.log('Daily AI suggestions generation completed');
    } catch (error) {
      console.error('Error in daily AI suggestions job:', error);
    }
  }
}

export default new DailyAISuggestionsJob();