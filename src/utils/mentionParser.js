import { getUserByName } from '../models/userModel.js';
import { NotificationService } from '../services/notificationService.js';

/**
 * Parse @mentions from text and find mentioned users
 */
export const parseMentions = (text) => {
  if (!text) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Process mentions and send notifications
 */
export const processMentions = async (text, mentioner, referenceId, contentType) => {
  const mentions = parseMentions(text);
  const notifications = [];

  for (const username of mentions) {
    const user = await getUserByName(username);
    if (user && user.id !== mentioner.id) {
      const notification = await NotificationService.notifyMention(
        user.id,
        mentioner,
        text,
        referenceId,
        contentType
      );
      notifications.push(notification);
    }
  }
  return notifications;
};